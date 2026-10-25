/**
 * The world's lights (playtest round 5): every street lamp, fire, torch and lit window that the
 * chunk and dungeon builders report (propMeshes.ts, siteMeshes.ts) is a light spot. Each frame the
 * nearest become the shader's point lights (LAMPS_GLSL), easing to nothing toward the edge of the
 * chosen set so none pops as another takes its place; flames waver. Every spot within reach also
 * wears a soft additive halo (halos.ts), so lights glow through the dark as lights should. The
 * investigator's lantern wears one too. Round 22: `lightAt` tells the simulation how well lit the
 * ground is at a point (the mind mends faster in lamplight; sanity.ts), by the same spots. Round 37:
 * lights beyond a wall stay out (lightSight.ts). Lighting follows the investigator's chest while
 * halo visibility follows the camera: orbiting behind a pillar must not put out a whole room.
 */

import * as THREE from 'three';
import type { V3 } from '../core/geom';
import { LIGHTS, SANITY, type LightDef, type LightKind } from '../data/tuning';
import type { CollisionWorld } from '../world/colliders';
import { HEARTH } from '../data/lightSounds';
import { beginHeard, pushHeard } from './audio/heardLights';
import { createFlames } from './flames';
import { createHalos } from './halos';
import { createLightSight } from './lightSight';
import { paneLit } from './paneLife';
import { LAMP_SLOTS } from './shaders/world';
import { worldUniforms } from './worldMaterial';

import type { Caster } from './lampShadows';

export interface LightSpot {
  x: number;
  y: number;
  z: number;
  kind: LightKind;
  halo?: number;
  haloGain?: number;
  /** A lit window's pane (playtest round 13: its glow hung half a metre before the window, where the light is cast from): the glow sits on the glass, and fades as the window is seen edge on. */
  glass?: { x: number; y: number; z: number };
  pane?: number; // a lit window's seed: put out now and then, dimmed as someone passes (paneLife.ts; round 18)
}

/** How much of a window's glow shows from `eye`: all of it square on, nothing edge on or from behind. */
export function glassFacing(s: LightSpot, eye: { x: number; y: number; z: number }): number {
  const g = s.glass;
  if (!g) return 1;
  const [nx, nz] = [s.x - g.x, s.z - g.z];
  const [ex, ey, ez] = [eye.x - g.x, eye.y - g.y, eye.z - g.z];
  const cos = (nx * ex + nz * ez) / Math.max(1e-6, Math.hypot(nx, nz) * Math.hypot(ex, ey, ez));
  return Math.min(1, Math.max(0, (cos - 0.1) / 0.6));
}

export interface WorldLights {
  readonly halos: THREE.Mesh;
  /** The pixel flames at the fires, torches and lamps (round 79: flames.ts). */
  readonly flames: THREE.Mesh;
  add(key: number, spots: readonly LightSpot[]): void;
  remove(key: number): void;
  /** How well lit the ground at a point is by lamps, fires, torches and windows (0..1) at `time`: each counts within its share of its light's range, and the Elder Signs' glow, an Echo's and the lantern's own do not. */
  lightAt(x: number, y: number, z: number, time: number): number;
  /** Calls `fn` with each fire and torch within `reach` metres of `at` (and its distance): what a fire gives off (round 79: fireLife.ts). */
  fires(at: V3, reach: number, fn: (s: LightSpot, d: number) => void): void;
  /** Lights the world about `at` (the investigator's chest); the eye controls halos only, so orbiting the camera never puts out a room's light. Defaults to the eye for scenes without an investigator. */
  update(eye: THREE.Vector3, time: number, lantern: THREE.Vector3 | null, at?: V3, lanternCover?: number): void;
  /** The lamps among the shader's nearest that may cast a shadow (torches, fires, street lamps and oriented windows), nearest first. */
  readonly casters: readonly Caster[];
}

const MAX_HALOS = 400;
const MAX_FLAMES = 640;

/** A light spot in reach: how far from the investigator (or the eye), and how much of it shows. */
export interface Lit {
  s: LightSpot;
  d: number;
  v: number;
}

/**
 * What the last `update` chose, for the atmosphere's own passes to read (round 80: render/lampAim.ts, render/windowSpill.ts), refilled in place:
 * `seen`, the spots lighting the world about the investigator, nearest first, whose first `LAMP_SLOTS` are the shader's lamps slot for slot; `visible`, those within the halos' reach of the eye.
 */
export const LIGHT_VIEW: { seen: readonly Lit[]; visible: readonly Lit[] } = { seen: [], visible: [] };

/** How far the mind has gone (0..1; set each frame by worldLife.ts, round 26): the flames of a failing mind's world waver harder, and some gutter out for a moment. */
export const LIGHT_NERVES = { madness: 0 };

/** A flame's waver: about 1, by `amount` (and a failing mind's), its own rhythm for each spot. */
function waver(s: LightSpot, amount: number, time: number): number {
  const m = LIGHT_NERVES.madness;
  const a = amount + m * 0.3;
  if (a <= 0) return 1;
  const phase = Math.abs(Math.sin(s.x * 12.9898 + s.z * 78.233)) * 40;
  const gutter = m > 0.15 && Math.sin(time * 1.9 + phase * 3.1) > 0.93 ? 1 - 0.75 * m : 1; // a flame that all but goes out, now and again
  return (1 + a * (0.6 * Math.sin(time * 7.3 + phase) + 0.4 * Math.sin(time * 13.1 + phase * 0.37))) * gutter;
}

/** `world`: what stands between the eye and a light (none: every light shows). */
export function createWorldLights(world: () => CollisionWorld | null = () => null): WorldLights {
  const spots = new Map<number, readonly LightSpot[]>();
  const batch = createHalos(MAX_HALOS, LIGHTS.haloFog);
  const halos = batch.mesh;
  const flameBatch = createFlames(MAX_FLAMES);
  const sight = createLightSight(world);
  const haloSight = createLightSight(world);
  const near: { s: LightSpot; d: number; v: number }[] = []; // in reach of the investigator, nearest first
  const visible: typeof near = []; // halo visibility belongs to the eye; lighting belongs to the investigator
  const seen: typeof near = [];
  const casters: Caster[] = [];
  LIGHT_VIEW.seen = seen;
  LIGHT_VIEW.visible = visible;
  return {
    halos,
    flames: flameBatch.mesh,
    casters,
    add(key, list) {
      if (list.length) spots.set(key, list);
    },
    remove(key) {
      spots.delete(key);
    },
    fires(at, reach, fn) {
      for (const list of spots.values()) {
        for (const s of list) {
          if (s.kind !== 'fire' && s.kind !== 'torch') continue;
          const d = Math.hypot(s.x - at.x, s.y - at.y, s.z - at.z);
          if (d < reach) fn(s, d);
        }
      }
    },
    lightAt(x, y, z, time) {
      let sum = 0;
      for (const list of spots.values()) {
        for (const s of list) {
          const share = SANITY.mend.light[s.kind];
          if (share <= 0) continue;
          const reach = LIGHTS.kinds[s.kind].range * SANITY.mend.reach;
          const d = Math.hypot(s.x - x, s.z - z); // along the ground: a lamp's pool lies under it, whatever height it hangs at (but not a floor above or below)
          if (d < reach && Math.abs(s.y - y) < 6) sum += share * (1 - d / reach) ** SANITY.mend.curve * (s.pane === undefined ? 1 : paneLit(s.pane, time));
        }
      }
      return Math.min(1, sum);
    },
    update(eye, time, lantern, at = eye, lanternCover = 0) {
      near.length = 0;
      visible.length = 0;
      for (const list of spots.values()) {
        for (const s of list) {
          const d = Math.hypot(s.x - at.x, s.y - at.y, s.z - at.z);
          if (d < LIGHTS.haloReach) near.push({ s, d, v: 1 });
          const hd = Math.hypot(s.x - eye.x, s.y - eye.y, s.z - eye.z);
          if (hd < LIGHTS.haloReach) visible.push({ s, d: hd, v: 1 });
        }
      }
      near.sort((a, b) => a.d - b.d);
      sight.update(near, at, time);
      visible.sort((a, b) => a.d - b.d);
      haloSight.update(visible, eye, time);
      seen.length = 0;
      for (const n of near) if (n.v > 0.02) seen.push(n); // the lamps are for the lights that show: one in the next room takes none
      beginHeard(); // round 80: the nearest in earshot, for the sound of them (audio/hearth.ts); one in the next room is heard dulled, so these are `near`, not `seen`
      for (const n of near) {
        if (n.d > HEARTH.reach) break;
        if (n.s.kind !== 'window' && !pushHeard(n.s, n.d, n.v, waver(n.s, LIGHTS.kinds[n.s.kind].flicker, time))) break; // (a lit window is mute)
      }
      const reach = Math.min(LIGHTS.reach, seen[LAMP_SLOTS]?.d ?? Infinity); // the next in line is at nothing
      casters.length = 0;
      const lamps = worldUniforms.uLamps.value;
      const colors = worldUniforms.uLampColors.value;
      const planes = worldUniforms.uLampPlane.value;
      for (let i = 0; i < LAMP_SLOTS; i++) {
        worldUniforms.uLampWindows.value[i].set(0, 0, 0, 0); // the atmosphere fills window projection data after this selection
        const n = seen[i];
        const k = n ? LIGHTS.kinds[n.s.kind] : null;
        planes[i].set(0, 0, 0, 0);
        const weight = n && k ? 1 - THREE.MathUtils.smoothstep(n.d, reach * 0.7, reach) : 0;
        if (!n || !k || weight <= 0) {
          lamps[i].w = 0;
          continue;
        }
        lamps[i].set(n.s.x, n.s.y, n.s.z, k.range);
        const g = n.s.glass;
        if (g) {
          const [dx, dz] = [n.s.x - g.x, n.s.z - g.z];
          const d = Math.hypot(dx, dz);
          if (d > 1e-6) planes[i].set(dx / d, 0, dz / d, -(dx * g.x + dz * g.z) / d);
        }
        const paneGain = n.s.pane === undefined ? 1 : paneLit(n.s.pane, time);
        if (n.s.kind === 'torch' || n.s.kind === 'fire' || n.s.kind === 'lamp') casters.push({ slot: i, x: n.s.x, y: n.s.y, z: n.s.z, key: `${n.s.x.toFixed(2)},${n.s.y.toFixed(2)},${n.s.z.toFixed(2)}` });
        if (n.s.kind === 'window' && n.s.glass && paneGain > 0.03) {
          const dx = n.s.x - n.s.glass.x, dz = n.s.z - n.s.glass.z;
          const offset = Math.hypot(dx, dz);
          if (offset > 1e-4) casters.push({ slot: i, x: n.s.x, y: n.s.y, z: n.s.z, key: `${n.s.x.toFixed(2)},${n.s.y.toFixed(2)},${n.s.z.toFixed(2)}`, aim: { x: dx / offset, y: -0.6, z: dz / offset } });
        }
        colors[i].set(...k.color).multiplyScalar(k.strength * weight * n.v * waver(n.s, k.flicker, time) * paneGain);
      }
      batch.begin();
      if (lantern && lanternCover < 1) batch.put(lantern.x, lantern.y, lantern.z, LIGHTS.lantern.halo, LIGHTS.lantern.color, LIGHTS.lantern.haloGain * (1 - lanternCover) * waver({ x: 0, y: 0, z: 0, kind: 'torch' }, 0.05, time)); // (a seat back between the eye and it takes its halo: round 57)
      for (const { s, v } of visible) {
        if (v <= 0.02) continue;
        const k: LightDef = LIGHTS.kinds[s.kind];
        if (s.glass) {
          const face = glassFacing(s, eye) * v * (s.pane === undefined ? 1 : paneLit(s.pane, time));
          if (face > 0 && !batch.put(s.glass.x, s.glass.y, s.glass.z, LIGHTS.paneHalo, k.haloColor ?? k.color, k.haloGain * face)) break;
          continue;
        }
        if (!batch.put(s.x, s.y, s.z, s.halo ?? k.halo, k.haloColor ?? k.color, (s.haloGain ?? k.haloGain) * v * waver(s, k.flicker, time))) break;
      }
      batch.end();
      flameBatch.begin();
      for (const { s, d, v } of visible) {
        const f = LIGHTS.flames[s.kind];
        if (!f || v <= 0.02 || d > LIGHTS.flameReach) continue;
        const seed = (Math.abs(Math.sin(s.x * 12.9898 + s.z * 78.233 + s.y * 4.1414)) * 43758.5453) % 1; // its own beat, turn and ground
        const gain = v * (0.8 + 0.2 * Math.min(1.2, waver(s, LIGHTS.kinds[s.kind].flicker, time)));
        let full = false;
        for (let i = 0; i < f.count && !full; i++) {
          const a = (seed + i / f.count) * Math.PI * 2;
          const spread = f.count > 1 ? f.spread : 0;
          const h = f.height * (f.count > 1 ? 0.7 + 0.3 * ((seed * 7 + i * 0.37) % 1) : 1);
          full = !flameBatch.put(s.x + Math.cos(a) * spread, s.y + f.base, s.z + Math.sin(a) * spread, h, (seed * 3 + i * 0.27) % 1, (seed * 11 + i) % 2 < 1 ? 1 : -1, 'warm', gain);
        }
        if (full) break;
      }
      flameBatch.end();
    },
  };
}
