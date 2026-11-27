/**
 * The fog before a horror (round 27; data/fogThemes.ts, world/gatePlan.ts; 2026-11-24 volumetric 3-layer curtain & breach):
 * a dense, multi-layered wall of mist anchored cleanly into the doorway of a boss's room or the piers of an open arena's
 * gate, in the weather of that place. Walking through tears a ragged body-sized hole right where the investigator crosses,
 * billowing the mist around them; the surrounding wall stays solid while the hole lingers and then visibly swirls inward
 * with creeping wisps to close shut again. Dissolves over a few seconds once every horror it keeps is slain. Render only.
 */

import * as THREE from 'three';
import { FOG_THEMES, type FogTheme } from '../data/fogThemes';
import { CLASS_GAIN, MIST_CLOSE, mistPass } from '../data/foleySounds';
import type { Game } from '../systems/components';
import { gatePlan, type FogWall } from '../world/gatePlan';
import { worldLayout } from '../world/placements';
import type { GameAudio } from './audio/gameAudio';
import { courtStands } from './courtsBuilt';
import { bossFogMaterials, FOG_VERT, fogFrag, fogMaterial, type FogFragOptions } from './bossFogShader';
import { createFogBreach, type BreachState, type FogBreach } from './fogBreach';
import { createFogSight, type FogSight } from './fogSight';
import type { Particles } from './particles';

export { FOG_VERT, fogFrag, fogMaterial, type FogFragOptions };

const SEE = 138; // metres from its nearest point past which a wall is not made
const FADE = [112, 134] as const; // and over which it thins to nothing
const DISSOLVE = 3.5; // seconds a slain horror's fog takes to go
const SINK = 0.15; // metres the foot sinks into the floor so no seam shows

/** How much of a wall shows `distance` metres off. */
export const fogSeen = (distance: number): number => Math.min(1, Math.max(0, (FADE[1] - distance) / (FADE[1] - FADE[0])));

/** The distance from `p` to a wall (the doorway's middle). */
export const wallGap = (w: Pick<FogWall, 'x' | 'z'>, p: { x: number; z: number }): number => Math.hypot(p.x - w.x, p.z - w.z);

type LayerSpec = readonly [layer: number, z: number, sx: number, sy: number];

/** Builds a tessellated fog mesh from one or more z-offset sheets with per-vertex `aLayer` (-1, 0, +1). */
export function buildFogLayers(width: number, height: number, layers: readonly LayerSpec[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const layerAttr: number[] = [];
  const idx: number[] = [];
  let base = 0;
  const totalH = height + SINK;
  for (const [layer, z, sx, sy] of layers) {
    for (let iy = 0; iy <= sy; iy++) {
      const v = iy / sy;
      const y = -SINK + v * totalH;
      for (let ix = 0; ix <= sx; ix++) {
        const u = ix / sx;
        pos.push((u - 0.5) * width, y, z);
        uv.push(u, v);
        layerAttr.push(layer);
      }
    }
    const stride = sx + 1;
    for (let iy = 0; iy < sy; iy++) {
      for (let ix = 0; ix < sx; ix++) {
        const a = base + iy * stride + ix;
        idx.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride);
      }
    }
    base += (sx + 1) * (sy + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('aLayer', new THREE.Float32BufferAttribute(layerAttr, 1));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

interface Wall {
  w: FogWall;
  theme: FogTheme;
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> | null;
  vis: number; // 0..1 shown now
  held: number; // 0..1 while a fight holds the investigator
  gone: boolean;
  owed: number; // motes owed
  engaged: boolean; // its horror was awake at the last look
  sight: FogSight; // tracks whether the follow camera is still behind the crossed wall
  breach: FogBreach; // localized body-sized tear & closing state machine
}

export interface BossFog {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
}

export function createBossFog(scene: THREE.Scene, g: Game, particles: Particles, audio: GameAudio): BossFog {
  const walls: Wall[] = gatePlan(worldLayout()).fogs.map((w) => ({
    w, theme: FOG_THEMES[w.theme], mesh: null, vis: 0, held: 0, gone: false, owed: 0, engaged: false,
    sight: createFogSight(w), breach: createFogBreach(w),
  }));
  g.events.on('FogPassing', (e) => void audio.recipe('mist:pass', mistPass(e.frames / 60), { gain: CLASS_GAIN.mist, vary: 0.6 }));
  g.events.on('FogPassed', (e) => {
    const b = walls.find((w) => w.w.id === e.wall);
    if (b) {
      b.sight.crossed({ x: e.x, y: b.w.y, z: e.z });
      b.breach.passed({ x: e.x, z: e.z });
      wakeBurst(b, e.x, e.z);
    }
  });
  let last = -1;
  const seed = { v: 11 };
  const rand = (): number => (seed.v = (seed.v * 16807) % 2147483647) / 2147483647;
  const make = (b: Wall): THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> => {
    const { w } = b;
    const depth = w.depth ?? 0.24;
    const mats = bossFogMaterials(b.theme, w, w.width, w.height, w.capped ?? !w.gate);
    // Core curtain writes depth while active (renderOrder 1); wispy parallax veils draw over it without depth write (renderOrder 2).
    const core = new THREE.Mesh(buildFogLayers(w.width, w.height, [[0, 0, 14, 12]]), mats.core);
    const veils = new THREE.Mesh(buildFogLayers(w.width, w.height, [[-1, -depth, 9, 9], [1, depth, 9, 9]]), mats.veil);
    core.position.set(w.x, w.y, w.z);
    core.rotation.y = w.yaw;
    core.frustumCulled = false;
    core.renderOrder = 1;
    veils.frustumCulled = false;
    veils.renderOrder = 2;
    core.add(veils);
    scene.add(core);
    return core;
  };
  return {
    update(camera, time, hidden) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const ow = g.overworld;
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      const fights = [...g.ecs.c.fight.values()];
      for (const b of walls) {
        const slain = !ow || b.w.spawns.every((s) => ow.slain.has(s));
        const near = wallGap(b.w, camera.position);
        const held = fights.some((f) => f.veiled && b.w.bosses.includes(f.id));
        const engaged = fights.some((f) => f.engaged && b.w.bosses.includes(f.id));
        const alone = !!b.w.gate && !courtStands(b.w.bosses[0]!); // (an open gate's mist waits for its court's walls, as the gate does: courtsBuilt.ts)
        const want = hidden || slain || alone || near > SEE ? 0 : fogSeen(near);
        b.vis += Math.sign(want - b.vis) * Math.min(Math.abs(want - b.vis), dt / (slain ? DISSOLVE : 1.2));
        b.held += ((held ? 1 : 0) - b.held) * Math.min(1, dt * 2);
        if (slain && b.vis <= 0.001) b.gone = true;
        if (!b.mesh && b.vis > 0.001 && !b.gone) b.mesh = make(b);
        if (!b.mesh) continue;
        b.mesh.visible = b.vis > 0.001;
        b.mesh.material.depthWrite = b.vis > 0.72;
        const u = b.mesh.material.uniforms;
        u.uTime.value = time;
        const pass = g.player.fogPass?.wall === b.w.id ? g.player.fogPass : null;
        const sight = b.sight.update(camera.position, me, !!pass, dt);
        const breach = b.breach.update(me, pass, sight, dt);
        // The wall itself stays visible throughout traversal; only the localized breach opens & closes!
        u.uVis.value = b.vis;
        u.uHeld.value = b.held;
        u.uBreach.value.set(breach.u, breach.y, breach.rx, breach.ry);
        u.uBreachFx.value.set(breach.swirl, breach.push, breach.rim, breach.closeProg);
        if (breach.phase === 'tearing') rimEddy(b, breach, dt, 1);
        else if (breach.phase === 'closing') rimEddy(b, breach, dt, -1);
        if (breach.sealedNow) sealBurst(b, breach);
        if (engaged && !b.engaged && near < 12) audio.sample('rumble', { gain: 0.3, pitch: 0.62 });
        b.engaged = engaged;
        if (b.mesh.visible && me && near < 32 && !slain && breach.phase === 'idle') seep(b, dt);
      }
    },
  };

  /** Wall-local (u, y, v) to world coordinates. */
  function toWorld(w: FogWall, lu: number, ly: number, lv: number): [number, number, number] {
    const [cs, sn] = [Math.cos(w.yaw), Math.sin(w.yaw)];
    return [w.x + cs * lu + sn * lv, w.y + ly, w.z - sn * lu + cs * lv];
  }

  /** Soft wisp or glint mote near the wall. */
  function mote(b: Wall, x: number, y: number, z: number, spark: boolean, vx: number, vy: number, vz: number, size: number, alpha: number, life: number): void {
    const c = spark ? b.theme.sparks!.colour : (rand() < 0.45 ? b.theme.top : b.theme.base);
    particles.spawn({
      x, y, z, vx, vy, vz, life, size, grow: spark ? 0.9 : 1.9,
      color: [c[0], c[1], c[2]], alpha, drag: spark ? 0.5 : 1.1,
      shape: spark ? 'spark' : 'wisp', glow: spark, spin: (rand() - 0.5) * 1.4,
    });
  }

  /** Ambient mist curling along the wall's threshold and jambs while idle. */
  function seep(b: Wall, dt: number): void {
    const { w, theme } = b;
    b.owed += dt * (theme.sparks ? 15 : 10);
    for (; b.owed >= 1; b.owed--) {
      const s = (rand() - 0.5) * w.width * 0.94;
      const spark = !!theme.sparks && rand() < theme.sparks.share;
      const ly = spark ? 0.4 + rand() * w.height * 0.72 : 0.1 + rand() * 0.55;
      const [x, y, z] = toWorld(w, s, ly, (rand() - 0.5) * 0.5);
      mote(b, x, y, z, spark, (rand() - 0.5) * 0.25, 0.25 + rand() * 0.4, (rand() - 0.5) * 0.25, spark ? 0.18 : 1.15, spark ? 0.8 : 0.2, spark ? 2.4 : 2.3);
    }
  }

  /** Torn mist curling off the breach rim as the player pushes through (+1), or curling inward as the hole knits shut (-1). */
  function rimEddy(b: Wall, br: BreachState, dt: number, mode: 1 | -1): void {
    const { w, theme } = b;
    b.owed += dt * (mode > 0 ? 58 : 34);
    const [cs, sn] = [Math.cos(w.yaw), Math.sin(w.yaw)];
    const pushDir = Math.sign(br.push) || 1;
    for (; b.owed >= 1; b.owed--) {
      const a = rand() * Math.PI * 2;
      const [cu, cy] = [Math.cos(a), Math.sin(a)];
      const lu = Math.max(-w.width * 0.5, Math.min(w.width * 0.5, br.u + cu * Math.max(0.25, br.rx * (0.9 + rand() * 0.25))));
      const ly = Math.max(0.15, Math.min(w.height, br.y + cy * Math.max(0.3, br.ry * (0.85 + rand() * 0.2))));
      const lv = (rand() - 0.5) * (w.depth ?? 0.24) * 2;
      const [x, y, z] = toWorld(w, lu, ly, lv);
      const radial = mode > 0 ? 0.7 + rand() * 0.8 : -(0.55 + rand() * 0.6); // outward on tear, inward while closing
      const along = mode > 0 ? pushDir * (1.1 + rand() * 1.0) : (rand() - 0.5) * 0.35;
      const vx = cs * (cu * radial) + sn * along;
      const vz = -sn * (cu * radial) + cs * along;
      const vy = cy * radial * 0.65 + (mode > 0 ? 0.25 : 0.12);
      const spark = !!theme.sparks && rand() < theme.sparks.share * (mode > 0 ? 1.2 : 0.8);
      mote(b, x, y, z, spark, vx, vy, vz, spark ? 0.2 : 0.75 + rand() * 0.55, spark ? 0.88 : 0.28, spark ? 1.8 : 1.5);
    }
  }

  /** Mist trailed behind the investigator right as they step out the far side. */
  function wakeBurst(b: Wall, px: number, pz: number): void {
    const { w, theme } = b;
    for (let i = 0; i < 18; i++) {
      const a = rand() * Math.PI * 2;
      const r = 0.25 + rand() * 0.9;
      const spark = !!theme.sparks && rand() < theme.sparks.share * 1.2;
      mote(b, px + Math.cos(a) * r, w.y + 0.3 + rand() * 1.8, pz + Math.sin(a) * r, spark, Math.cos(a) * 0.6, 0.3 + rand() * 0.5, Math.sin(a) * 0.6, spark ? 0.2 : 0.95, spark ? 0.85 : 0.24, 1.8);
    }
  }

  /** The torn hole finishes knitting shut: a settling billow right at the sealed spot and the exhale sound. */
  function sealBurst(b: Wall, br: BreachState): void {
    const { w, theme } = b;
    for (let i = 0; i < 24; i++) {
      const a = rand() * Math.PI * 2;
      const r = rand() * 0.85;
      const lu = Math.max(-w.width * 0.5, Math.min(w.width * 0.5, br.u + Math.cos(a) * r));
      const ly = Math.max(0.2, Math.min(w.height, br.y + Math.sin(a) * r * 1.2));
      const [x, y, z] = toWorld(w, lu, ly, (rand() - 0.5) * 0.45);
      const spark = !!theme.sparks && rand() < theme.sparks.share * 1.3;
      mote(b, x, y, z, spark, Math.cos(a) * 0.45, 0.25 + rand() * 0.55, Math.sin(a) * 0.45, spark ? 0.22 : 1.05, spark ? 0.85 : 0.26, 2.0);
    }
    audio.recipe('mist:close', MIST_CLOSE, { gain: CLASS_GAIN.mist, vary: 0.6 });
  }
}
