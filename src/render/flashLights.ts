/**
 * Lights that last a moment (round 83; data/fxTuning.ts FLASH_LIGHTS): the flash at the heart of a foe's
 * blow, a foe's bolt in flight (round 87: the investigator's shot and blow lay none; the creature they
 * strike lights up of itself). The world, the creatures and the mist all read the same twelve lamps
 * (shaders/common.ts LAMPS_GLSL, shaders/fog.ts), so a flash takes the slot of one of the farthest of the
 * lamps for its moment: no shader loop gets longer, and the mist lights up with the rest. Whatever the
 * source does is its own: `flashLight` is called by the particle kit and the views, and worldLights.ts
 * lays the lights each frame. Render only; the module holds the few that are alive.
 */

import type * as THREE from 'three';
import type { V3 } from '../core/geom';
import { FLASH_LIGHTS } from '../data/fxTuning';
import { FEEL } from './feel';
import type { Caster } from './lampShadows';
import type { Rgb } from './palette';

interface Flash {
  x: number;
  y: number;
  z: number;
  rgb: Rgb;
  strength: number;
  range: number;
  seconds: number;
  born: number; // the render second it was first laid (NaN until then: the sources do not know the clock)
  key?: number; // a light kept up by its source each frame (a bolt) is one light, moved, not one more
}

const live: Flash[] = [];
const MAX = 24;

/** A light at `at` that comes to `strength` at once and dies away within `seconds`; with a `key`, a light the same source calls again each frame is the one light, moved. */
export function flashLight(at: V3, rgb: Rgb, strength: number, range: number, seconds: number, key?: number): void {
  const kept = key === undefined ? undefined : live.find((f) => f.key === key);
  if (kept) {
    Object.assign(kept, { x: at.x, y: at.y, z: at.z, rgb, strength, range, seconds, born: NaN }); // (called again: it is at its height now, and dies only if the calls stop)
    return;
  }
  if (live.length >= MAX) live.shift();
  live.push({ x: at.x, y: at.y, z: at.z, rgb, strength, range, seconds, born: NaN, key });
}

/** How much of its strength a flash has `age` seconds after it was laid: up to it in `attack`, then down in a curve. */
export function level(age: number, seconds: number, attack = FLASH_LIGHTS.attack): number {
  if (age < 0 || age >= seconds) return 0;
  if (age < attack) return age / attack;
  const k = 1 - (age - attack) / Math.max(1e-3, seconds - attack);
  return k * k;
}

const picked: { f: Flash; v: number }[] = [];

/**
 * Lays the flashes alive at `time` over the farthest slots of the lamps (`lamps`, `colors`, the shader's), choosing the strongest
 * about `at` (the investigator), and takes from `casters` any lamp whose slot it has taken (its shadow map is the lamp's, not the flash's).
 * The Flashes setting (round 47, `FEEL.flashes`) governs them as it does the sky's own flash: all of them dimmed by it, none at nought.
 */
export function layFlashes(lamps: readonly THREE.Vector4[], colors: readonly THREE.Vector3[], casters: Caster[], time: number, at: V3): number {
  picked.length = 0;
  const kind = Math.min(1, FEEL.flashes);
  for (let i = live.length - 1; i >= 0; i--) {
    const f = live[i];
    if (Number.isNaN(f.born)) f.born = f.key === undefined ? time : time - FLASH_LIGHTS.attack;
    const v = level(time - f.born, f.seconds);
    if (time - f.born >= f.seconds) {
      live.splice(i, 1);
      continue;
    }
    const d = Math.hypot(f.x - at.x, f.y - at.y, f.z - at.z);
    if (d > FLASH_LIGHTS.reach || kind <= 0) continue;
    picked.push({ f, v: (v * f.strength) / (1 + (d * d) / (f.range * f.range + 1)) });
  }
  if (!picked.length) return 0;
  picked.sort((a, b) => b.v - a.v);
  const n = Math.min(FLASH_LIGHTS.slots, picked.length, lamps.length);
  for (let k = 0; k < n; k++) {
    const { f } = picked[k];
    const slot = lamps.length - 1 - k;
    lamps[slot].set(f.x, f.y, f.z, f.range);
    const s = level(time - f.born, f.seconds) * f.strength * kind;
    colors[slot].set(f.rgb[0] * s, f.rgb[1] * s, f.rgb[2] * s);
    for (let c = casters.length - 1; c >= 0; c--) if (casters[c].slot === slot) casters.splice(c, 1);
  }
  return n;
}

/** Puts them all out (a new world, the tests). */
export function putOutFlashes(): void {
  live.length = 0;
}
