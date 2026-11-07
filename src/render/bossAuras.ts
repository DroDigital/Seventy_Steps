/**
 * Lore-specific presences drawn behind and around selected bosses. A procedural, camera-facing
 * veil sits behind the painted body; a separate cloud of points travels in three dimensions, so
 * some pass in front of it. The effects follow the interpolated body and never affect gameplay.
 */
import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { BOSS_AURAS, type BossAuraProfile, type BossAuraStyle } from '../data/bossAuras';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import type { BossPresence } from './bossPresence';
import { worldUniforms } from './worldMaterial';

const STYLE: Record<BossAuraStyle, number> = { tide: 0, veil: 1, geometry: 2, bloom: 3, prism: 4, chaos: 5, ash: 6 };
const REACH = 34;
const MAX_BOSSES = 8;
const MOTE_COUNT = 64;

const SHEET_VERT = /* glsl */ `
uniform float uFogNear; uniform float uFogFar;
varying vec2 vUv; varying float vFog;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFog = clamp((-mv.z - uFogNear) / max(0.001, uFogFar - uFogNear), 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
}`;

const SHEET_FRAG = /* glsl */ `
uniform float uTime; uniform float uStyle; uniform float uAlpha; uniform float uFogAmount;
uniform vec3 uColor; uniform vec3 uAccent; uniform vec3 uFogColor;
varying vec2 vUv; varying float vFog;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), f.x), f.y);
}
float stroke(vec2 p, vec2 a, vec2 b, float w) {
  vec2 v = b - a; float h = clamp(dot(p-a, v) / max(dot(v,v), 0.0001), 0.0, 1.0);
  return 1.0 - smoothstep(w, w * 3.0, length(p - a - v*h));
}
vec2 turn(vec2 p, float a) { float c = cos(a), s = sin(a); return mat2(c,-s,s,c) * p; }
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float y = vUv.y, t = uTime;
  float edge = (1.0 - smoothstep(0.80, 1.0, abs(p.x))) * smoothstep(0.0, 0.1, y) * (1.0 - smoothstep(0.9, 1.0, y));
  float a = 0.0, highlight = 0.0;
  if (uStyle < 0.5) { // surf and mist, curling across the lower body (round 109: no wave lines, the mist only; the bubbles are motes)
    float mist = noise2(vec2(p.x * 4.0 + t * 0.09, y * 6.0 - t * 0.13));
    float low = 1.0 - smoothstep(0.18, 0.7, y);
    a = low * smoothstep(0.32, 0.78, mist) * 0.28;
  } else if (uStyle < 1.5) { // tattered veils drawn out in the wind
    float sway = sin(y * 6.5 - t * 0.36) * 0.12 + sin(y * 15.0 + t * 0.2) * 0.035;
    float l = 1.0 - smoothstep(0.025, 0.15, abs(p.x + 0.55 + sway));
    float r = 1.0 - smoothstep(0.02, 0.13, abs(p.x - 0.55 + sway * 1.4));
    float fray = 0.4 + 0.6 * noise2(vec2(y * 14.0 - t * 0.3, p.x * 5.0 + t * 0.12));
    highlight = (l + r) * fray;
    a = highlight * 0.38 + (l + r) * 0.08;
  } else if (uStyle < 2.5) { // broken angles sliding through an impossible gate
    vec2 q = turn(p, 0.17 * sin(t * 0.22));
    q.x += 0.1 * sin(q.y * 6.0 + t * 0.32);
    float frame = stroke(q, vec2(-0.75,-0.52), vec2(-0.47,0.7), 0.009)
      + stroke(q, vec2(-0.47,0.7), vec2(0.38,0.82), 0.009)
      + stroke(q, vec2(0.38,0.82), vec2(0.78,0.22), 0.009)
      + stroke(q, vec2(0.78,0.22), vec2(0.6,-0.65), 0.009)
      + stroke(q, vec2(0.6,-0.65), vec2(-0.75,-0.52), 0.009);
    vec2 s = turn(p, -0.24 + 0.11 * sin(t * 0.31));
    float shards = stroke(s, vec2(-0.79,0.03), vec2(-0.35,0.65), 0.006)
      + stroke(s, vec2(0.77,-0.15), vec2(0.29,-0.72), 0.006)
      + stroke(s, vec2(-0.7,-0.5), vec2(-0.3,-0.2), 0.006);
    float broken = 0.4 + 0.6 * smoothstep(0.25, 0.7, noise2(q * 10.0 + vec2(t * 0.06, 0.0)));
    highlight = (frame + shards * 0.8) * broken;
    a = highlight * 0.58;
  } else if (uStyle < 3.5) { // fertile, rolling clouds and threads of growth
    float n = noise2(vec2(p.x * 3.6 + sin(y * 7.0 + t * 0.18) * 0.4, y * 5.2 - t * 0.12));
    float wisps = noise2(vec2(p.x * 8.0 - t * 0.13, y * 9.0 - t * 0.18));
    float vine = 1.0 - smoothstep(0.015, 0.065, abs(abs(p.x) - 0.60 - 0.12 * sin(y * 9.0 + t * 0.26)));
    highlight = vine * smoothstep(0.25, 0.8, wisps);
    a = smoothstep(0.4, 0.76, n * 0.72 + wisps * 0.28) * 0.32 + highlight * 0.24;
  } else if (uStyle < 4.5) { // colour shifting through fractured planes
    vec2 q = turn(p, 0.12 * sin(t * 0.4));
    float fissure = stroke(q, vec2(-0.82,-0.55), vec2(-0.48,0.08), 0.01)
      + stroke(q, vec2(-0.48,0.08), vec2(-0.73,0.65), 0.01)
      + stroke(q, vec2(0.75,-0.64), vec2(0.44,0.12), 0.009)
      + stroke(q, vec2(0.44,0.12), vec2(0.77,0.68), 0.009);
    float shimmer = 0.5 + 0.5 * sin(q.y * 20.0 + q.x * 12.0 - t * 0.9);
    highlight = fissure * (0.45 + shimmer * 0.55);
    a = highlight * 0.58 + smoothstep(0.58, 0.86, noise2(q * 7.0 + t * 0.1)) * 0.12;
  } else if (uStyle < 5.5) { // a slow, asymmetric inward spiral
    vec2 q = p + vec2(0.08 * sin(t * 0.2), 0.08 * cos(t * 0.17));
    float angle = atan(q.y, q.x), r = length(q);
    float spiral = abs(sin(angle * 2.0 + r * 9.0 - t * 0.6));
    highlight = (1.0 - smoothstep(0.03, 0.22, spiral)) * smoothstep(0.2, 0.6, r);
    float n = noise2(q * 5.0 + vec2(t * 0.1, -t * 0.13));
    a = highlight * 0.22 + smoothstep(0.48, 0.8, n) * 0.22;
  } else { // falling grit and fine cracks like weathered stone
    float crack = stroke(p, vec2(-0.75,0.67), vec2(-0.54,0.15), 0.008)
      + stroke(p, vec2(-0.54,0.15), vec2(-0.74,-0.5), 0.008)
      + stroke(p, vec2(0.72,0.6), vec2(0.48,0.0), 0.008)
      + stroke(p, vec2(0.48,0.0), vec2(0.7,-0.65), 0.008);
    float dust = noise2(vec2(p.x * 5.0 + t * 0.08, y * 7.0 + t * 0.12));
    highlight = crack * (0.45 + 0.2 * sin(t * 0.5));
    a = highlight * 0.38 + smoothstep(0.52, 0.82, dust) * 0.19;
  }
  vec3 col = mix(uColor, uAccent, clamp(highlight * 0.55, 0.0, 1.0));
  col = mix(col, uFogColor, vFog * uFogAmount * 0.8);
  gl_FragColor = vec4(col, clamp(a * edge * uAlpha * 2.4, 0.0, 0.65));
}`;

const MOTE_VERT = /* glsl */ `
attribute float aSeed; uniform float uTime; uniform float uStyle; uniform float uHeight; uniform float uRadius;
uniform vec2 uRes; uniform float uFogNear; uniform float uFogFar;
varying float vFade; varying float vSeed; varying float vFog;
void main() {
  float s = aSeed, t = uTime, cycle = fract(s * 7.13 + t * (0.035 + 0.015 * fract(s * 17.0)));
  float angle = s * 43.9823 + t * (0.18 + 0.13 * fract(s * 19.0));
  float radius = uRadius * (0.72 + 0.4 * fract(s * 31.0));
  vec3 p;
  if (uStyle > 1.5 && uStyle < 2.5) { // orbs cross behind and in front of the gate
    p = vec3(cos(angle) * radius, uHeight * (0.5 + 0.40 * sin(angle * (0.68 + 0.25 * s) + s * 20.0)), sin(angle) * radius);
    vFade = 0.55 + 0.45 * sin(s * 21.0 + t * 0.55) * sin(s * 21.0 + t * 0.55);
  } else if (uStyle > 4.5 && uStyle < 5.5) { // embers spiral inward and rise
    radius *= 0.35 + 0.9 * cycle;
    p = vec3(cos(angle * 1.4) * radius, uHeight * cycle, sin(angle * 1.4) * radius);
    vFade = sin(3.14159 * cycle);
  } else if (uStyle > 0.5 && uStyle < 1.5) { // scraps drift with the veils
    p = vec3(cos(angle * 0.45) * radius + sin(cycle * 9.0 + t * 0.3) * uRadius * 0.2, uHeight * cycle, sin(angle * 0.45) * radius * 0.6);
    vFade = sin(3.14159 * cycle);
  } else {
    float y = uStyle > 5.5 ? 1.0 - cycle : cycle;
    float wobble = sin(cycle * 8.0 + s * 40.0 + t * 0.3) * 0.2;
    p = vec3((cos(angle) + wobble) * radius, uHeight * y, sin(angle) * radius);
    if (uStyle < 0.5) p.y *= 0.7; // bubbles stay close to the low sea mist
    vFade = sin(3.14159 * cycle);
  }
  p.y += uHeight * 0.05;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float size = uHeight * (0.016 + 0.025 * fract(s * 29.0));
  gl_PointSize = clamp(size * uRes.y * projectionMatrix[1][1] * 0.5 / max(0.1, -mv.z), 1.5, 25.0);
  gl_Position = projectionMatrix * mv;
  vSeed = s;
  vFog = clamp((-mv.z - uFogNear) / max(0.001, uFogFar - uFogNear), 0.0, 1.0);
}`;

const MOTE_FRAG = /* glsl */ `
uniform float uStyle; uniform float uAlpha; uniform float uFogAmount;
uniform vec3 uColor; uniform vec3 uAccent;
varying float vFade; varying float vSeed; varying float vFog;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d = length(q), shape;
  if (uStyle < 0.5) { // tiny bubbles with lit edges
    shape = (1.0 - smoothstep(0.09, 0.28, abs(d - 0.66))) * 0.8;
  } else if (uStyle < 1.5) { // scraps of cloth
    shape = (1.0 - smoothstep(0.12, 0.45, abs(q.x + q.y * 0.35))) * (1.0 - smoothstep(0.45, 1.0, abs(q.y)));
  } else if (uStyle < 2.5 || (uStyle > 3.5 && uStyle < 4.5)) { // stars and prismatic splinters
    float diamond = abs(q.x) + abs(q.y);
    shape = (1.0 - smoothstep(0.25, 0.95, diamond));
    shape += (1.0 - smoothstep(0.05, 0.18, min(abs(q.x), abs(q.y)))) * (1.0 - smoothstep(0.35, 1.0, d)) * 0.35;
  } else {
    shape = 1.0 - smoothstep(0.08, 0.95, d);
  }
  vec3 col = mix(uColor, uAccent, 0.35 + 0.65 * fract(vSeed * 23.0));
  float alpha = uAlpha * vFade * shape * (1.0 - vFog * uFogAmount);
  gl_FragColor = vec4(col, alpha);
}`;

interface AuraView {
  group: THREE.Group;
  sheet: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  motes: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  uniforms: Record<string, THREE.IUniform>;
  profile: BossAuraProfile;
}

/** The two shared geometries are disposed only with the scene; per-boss materials are released when a boss leaves view. */
export function createBossAuras(scene: THREE.Scene, g: Game, figure: (id: Entity) => { bottom: number; top: number } | undefined,
  painted: ReadonlyMap<Entity, number>, presence: BossPresence) {
  const plane = new THREE.PlaneGeometry(1, 1);
  const particles = new THREE.BufferGeometry();
  const seeds = new Float32Array(MOTE_COUNT);
  const positions = new Float32Array(MOTE_COUNT * 3);
  for (let i = 0; i < MOTE_COUNT; i++) seeds[i] = (i + 0.5) / MOTE_COUNT;
  particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particles.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  const views = new Map<Entity, AuraView>();

  const make = (id: Entity, profile: BossAuraProfile): AuraView => {
    const uniforms: Record<string, THREE.IUniform> = {
      uTime: { value: 0 }, uStyle: { value: STYLE[profile.style] }, uAlpha: { value: 0 },
      uHeight: { value: 1 }, uRadius: { value: 1 },
      uColor: { value: new THREE.Vector3(...profile.color) }, uAccent: { value: new THREE.Vector3(...profile.accent) },
      uRes: worldUniforms.uRes, uFogNear: worldUniforms.uFogNear, uFogFar: worldUniforms.uFogFar,
      uFogAmount: worldUniforms.uFogAmount, uFogColor: worldUniforms.uFogColor,
    };
    const sheet = new THREE.Mesh(plane, new THREE.ShaderMaterial({ uniforms, vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    const motes = new THREE.Points(particles, new THREE.ShaderMaterial({ uniforms, vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sheet.frustumCulled = motes.frustumCulled = false;
    const group = new THREE.Group();
    group.name = `boss-aura:${id}`;
    group.userData.style = profile.style;
    group.add(sheet, motes);
    scene.add(group);
    return { group, sheet, motes, uniforms, profile };
  };
  const drop = (id: Entity, view: AuraView): void => {
    scene.remove(view.group);
    view.sheet.material.dispose();
    view.motes.material.dispose();
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
        const { group, sheet, uniforms, profile } = view;
        group.position.set(v.x, v.y + v.bottom, v.z);
        group.rotation.y = Math.atan2(camera.position.x - v.x, camera.position.z - v.z);
        sheet.position.set(0, v.height * 0.5, -Math.min(v.radius * 0.18, v.height * 0.12));
        sheet.scale.set(v.radius * 3.15 * profile.width, v.height * 1.32, 1);
        uniforms.uHeight.value = v.height;
        uniforms.uRadius.value = v.radius * 1.25 * profile.width;
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
