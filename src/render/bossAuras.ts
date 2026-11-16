/**
 * Lore-specific presences about some of the horrors (data/bossAuras.ts). Round 115: a faint haze behind the
 * painted body for those that have one (a low mist, or a pall of dark), and a few motes moving in three
 * dimensions by the horror's tale, so some pass in front of it. Nothing is drawn as a line. They follow the
 * interpolated body and never affect gameplay.
 */
import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { BOSS_AURAS, type BossAuraProfile } from '../data/bossAuras';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import type { BossPresence } from './bossPresence';
import { HAZE_FRAG, HAZE_KIND, HAZE_VERT, MOTE_FRAG, MOTE_VERT, MOTION_KIND, SHAPE_KIND } from './shaders/bossAura';
import { worldUniforms } from './worldMaterial';

const REACH = 34;
const MAX_BOSSES = 8;
const WIND_YAW = 0.6; // the way a drifting or peeling aura is carried, in the world

interface AuraView {
  group: THREE.Group;
  haze: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null;
  motes: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null;
  uniforms: Record<string, THREE.IUniform>;
  profile: BossAuraProfile;
}

/** The shared geometries are disposed only with the scene; per-boss materials are released when a boss leaves view. */
export function createBossAuras(scene: THREE.Scene, g: Game, figure: (id: Entity) => { bottom: number; top: number } | undefined,
  painted: ReadonlyMap<Entity, number>, presence: BossPresence) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const clouds = new Map<number, THREE.BufferGeometry>(); // one cloud of seeds for each count
  const cloud = (count: number): THREE.BufferGeometry => {
    let geo = clouds.get(count);
    if (geo) return geo;
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = (i + 0.5) / count;
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    clouds.set(count, geo);
    return geo;
  };
  const views = new Map<Entity, AuraView>();

  const make = (id: Entity, profile: BossAuraProfile): AuraView => {
    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 }, uAlpha: { value: 0 }, uHeight: { value: 1 }, uRadius: { value: 1 },
      uHaze: { value: HAZE_KIND[profile.haze] }, uMotion: { value: MOTION_KIND[profile.motion] }, uShape: { value: SHAPE_KIND[profile.shape] },
      uSize: { value: profile.size }, uTop: { value: profile.top }, uGrow: { value: profile.grow }, uIris: { value: profile.iris },
      uWind: { value: new THREE.Vector2(1, 0) },
      uColor: { value: new THREE.Vector3(...profile.color) }, uAccent: { value: new THREE.Vector3(...profile.accent) },
      uRes: worldUniforms.uRes, uFogNear: worldUniforms.uFogNear, uFogFar: worldUniforms.uFogFar,
      uFogAmount: worldUniforms.uFogAmount, uFogColor: worldUniforms.uFogColor,
    };
    const group = new THREE.Group();
    group.name = `boss-aura:${id}`;
    group.userData.motion = profile.motion;
    const haze = profile.haze === 'none' ? null
      : new THREE.Mesh(plane, new THREE.ShaderMaterial({ uniforms, vertexShader: HAZE_VERT, fragmentShader: HAZE_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    const motes = profile.count <= 0 ? null
      : new THREE.Points(cloud(profile.count), new THREE.ShaderMaterial({
        uniforms, vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false,
        blending: profile.blend === 'glow' ? THREE.AdditiveBlending : THREE.NormalBlending,
      }));
    for (const o of [haze, motes]) if (o) { o.frustumCulled = false; group.add(o); }
    scene.add(group);
    return { group, haze, motes, uniforms, profile };
  };
  const drop = (id: Entity, view: AuraView): void => {
    scene.remove(view.group);
    view.haze?.material.dispose();
    view.motes?.material.dispose();
    views.delete(id);
  };

  return {
    update(camera: THREE.Camera, time: number, alpha: number): void {
      const c = g.ecs.c;
      const candidates: { id: Entity; presenceId: Entity; profile: BossAuraProfile; distance: number; x: number; y: number; z: number; radius: number; height: number; bottom: number }[] = [];
      for (const [id, body] of c.body) {
        const decoy = c.phantom.get(id)?.decoy;
        if (!c.fight.has(id) && !decoy) continue;
        const profile = BOSS_AURAS[creatureOf(g, id)?.id ?? ''];
        const tr = c.transform.get(id);
        if (!profile || !tr || isAbsent(g, id) || isUnseen(g, id) || c.brain.get(id)?.state === 'hidden') continue;
        const x = THREE.MathUtils.lerp(tr.prev.x, tr.pos.x, alpha), y = THREE.MathUtils.lerp(tr.prev.y, tr.pos.y, alpha), z = THREE.MathUtils.lerp(tr.prev.z, tr.pos.z, alpha);
        const span = figure(id);
        const bottom = span?.bottom ?? 0, height = Math.max(0.5, (span?.top ?? body.height) - bottom);
        const distance = Math.hypot(x - camera.position.x, z - camera.position.z);
        const reach = REACH + Math.min(18, height * 0.55); // a colossal body needs room to be seen in full
        if (distance - body.radius > reach) continue;
        const radius = Math.max(body.radius, (painted.get(id) ?? 0) * 0.5, height * 0.26);
        candidates.push({ id, presenceId: decoy ? (c.minion.get(id) ?? id) : id, profile, distance, x, y, z, radius, height, bottom });
      }
      candidates.sort((a, b) => a.distance - b.distance);
      const selected = candidates.slice(0, MAX_BOSSES);
      const active = new Set(selected.map((v) => v.id));
      for (const [id, view] of views) if (!active.has(id)) drop(id, view);
      for (const v of selected) {
        let view = views.get(v.id);
        if (view && view.profile !== v.profile) { drop(v.id, view); view = undefined; }
        if (!view) { view = make(v.id, v.profile); views.set(v.id, view); }
        const { group, haze, uniforms, profile } = view;
        group.position.set(v.x, v.y + v.bottom, v.z);
        const yaw = Math.atan2(camera.position.x - v.x, camera.position.z - v.z);
        group.rotation.y = yaw;
        const wx = Math.sin(WIND_YAW), wz = Math.cos(WIND_YAW); // the wind, turned into the group's frame
        (uniforms.uWind.value as THREE.Vector2).set(wx * Math.cos(yaw) - wz * Math.sin(yaw), wx * Math.sin(yaw) + wz * Math.cos(yaw));
        if (haze) {
          const low = profile.haze === 'low';
          haze.position.set(0, v.height * (low ? 0.16 : 0.5), -Math.min(v.radius * 0.18, v.height * 0.12));
          haze.scale.set(v.radius * (low ? 4.2 : 3.0) * profile.width, v.height * (low ? 0.4 : 1.3), 1);
        }
        uniforms.uHeight.value = v.height;
        uniforms.uRadius.value = v.radius * 1.2 * profile.width;
        uniforms.uTime.value = time * profile.speed + v.id * 0.37;
        const reach = REACH + Math.min(18, v.height * 0.55);
        const distanceFade = 1 - THREE.MathUtils.smoothstep(v.distance - v.radius, reach * 0.6, reach);
        const eyeDistance = Math.hypot(v.distance, camera.position.y - (v.y + v.bottom + v.height * 0.5));
        const nearFade = THREE.MathUtils.smoothstep(eyeDistance, Math.max(0.3, v.height * 0.12), Math.max(0.8, v.height * 0.38));
        const mind = THREE.MathUtils.clamp(worldUniforms.uMind.value, 0, 1);
        uniforms.uAlpha.value = profile.opacity * distanceFade * nearFade * (0.72 + mind * 0.18 + presence.deep(v.presenceId) * 0.1);
      }
    },
  };
}
