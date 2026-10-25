/**
 * Round 78, atmosphere: what each speck of a realm's air is (data/airFields.ts names them): its shape, its size, how it falls, rises
 * or streams, and how long it lives. A recipe is pure over a stream of random numbers and the wind where it is born, so it can be
 * tested without a GPU. Render only. Nothing here is read by the simulation.
 *
 * The particle pool has drag but no wind, so the rule for a drifting speck is its first velocity (the wind at its birth, rolled by
 * the same gust as the grass bends in: shaders/world.ts SWAY) and a drag small enough to let it carry; a falling one meets its
 * terminal speed at gravity over drag.
 */

import type { AirKind, AirLayer, AirTone } from '../data/airFields';
import { lookOf } from '../data/looks';
import type { Rgb } from './palette';
import type { ParticleSpec } from './particles';

/** The wind where a speck is born: metres a second along x and z, and the gust (0..1) that rolls it. */
export interface Wind {
  x: number;
  z: number;
  gust: number;
}

export interface Born {
  /** Metres above the ground (or the water) it is born at. */
  lift: number;
  /** It falls to the ground and lies there: it is given a floor, and a mind far gone sees it rise instead. */
  falls: boolean;
  /** Metres about the lens within which it is not born: a wisp a metre from it would cloud the picture. */
  clear: number;
  spec: Omit<ParticleSpec, 'x' | 'y' | 'z' | 'color'>;
}

type Rnd = () => number;
type Recipe = (r: Rnd, w: Wind, size: number | undefined) => Born;

const span = (r: Rnd, lo: number, hi: number): number => lo + (hi - lo) * r();
const spread = (r: Rnd): number => r() - 0.5;

/** How near a speck of this size may be born to the lens. */
const clearOf = (size: number): number => Math.max(2.4, size * 5);

export const KINDS: Readonly<Record<AirKind, Recipe>> = {
  // Grey flakes settling, a long way down
  ash: (r, w, s) => {
    const size = (s ?? 0.1) * span(r, 0.7, 1.5);
    return { lift: span(r, 0.6, 6), falls: true, clear: clearOf(size), spec: { vx: w.x * 1.2 + spread(r) * 0.3, vy: -span(r, 0.05, 0.15), vz: w.z * 1.2 + spread(r) * 0.3, life: span(r, 9, 14), size, alpha: 0.75, gravity: 0.09, drag: 0.3, shape: 'shard', spin: spread(r) * 2.4 } };
  },
  // A spark going up, cooling from its colour to a dull red
  ember: (r, w, s) => {
    const size = (s ?? 0.07) * span(r, 0.6, 1.4);
    return { lift: span(r, 0, 1.6), falls: false, clear: clearOf(size), spec: { vx: w.x + spread(r) * 0.5, vy: span(r, 0.3, 0.8), vz: w.z + spread(r) * 0.5, life: span(r, 3.5, 6.5), size, alpha: 0.95, glow: true, gravity: -0.12, drag: 0.3, colorEnd: [0.3, 0.05, 0.03], shape: 'spark' } };
  },
  // A soft light rising slowly, as of a thing that is not quite alive
  spore: (r, w, s) => {
    const size = (s ?? 0.17) * span(r, 0.6, 1.4);
    return { lift: span(r, 0.3, 3.5), falls: false, clear: clearOf(size), spec: { vx: w.x * 0.5 + spread(r) * 0.3, vy: span(r, 0.06, 0.28), vz: w.z * 0.5 + spread(r) * 0.3, life: span(r, 6, 11), size, alpha: 0.7, glow: true, drag: 0.5, hold: 0.4, shape: 'wisp' } };
  },
  // A point of light hung in the air
  mote: (r, w, s) => {
    const size = (s ?? 0.07) * span(r, 0.6, 1.4);
    return { lift: span(r, 0.2, 4), falls: false, clear: clearOf(size), spec: { vx: w.x * 0.4 + spread(r) * 0.4, vy: span(r, 0.05, 0.3), vz: w.z * 0.4 + spread(r) * 0.4, life: span(r, 4, 8), size, alpha: 0.9, glow: true, drag: 0.4, hold: 0.5, shape: 'spark' } };
  },
  // A bank of mist crawling at the ankle: the near field the volumetric fog has not
  drift: (r, w, s) => {
    const size = (s ?? 1.7) * span(r, 0.7, 1.5);
    return { lift: span(r, 0.15, 1.3), falls: false, clear: 6, spec: { vx: w.x * 1.2 + 0.15, vy: 0.02, vz: w.z * 1.2 + spread(r) * 0.2, life: span(r, 9, 14), size, grow: 1.5, alpha: 0.2, drag: 0.1, shape: 'wisp' } };
  },
  // Salt spray streaming along the wind
  brine: (r, w, s) => {
    const size = (s ?? 0.09) * span(r, 0.6, 1.4);
    return { lift: span(r, 0.2, 2.4), falls: false, clear: clearOf(size), spec: { vx: w.x * 3 + 0.6, vy: spread(r) * 0.6, vz: w.z * 3 + spread(r) * 0.5, life: span(r, 1.4, 2.4), size, alpha: 0.6, gravity: 0.5, drag: 0.15, shape: 'streak', stretch: 0.1 } };
  },
  // Sand blown across the flat, low
  dust: (r, w, s) => {
    const size = (s ?? 0.1) * span(r, 0.7, 1.5);
    return { lift: span(r, 0.05, 0.9), falls: false, clear: clearOf(size), spec: { vx: w.x * 3 + 0.8 + r() * 0.8, vy: 0.04, vz: w.z * 3 + spread(r) * 0.6, life: span(r, 2, 4), size, alpha: 0.5, drag: 0.15, shape: 'streak', stretch: 0.14 } };
  },
  // Snow, driven aslant
  flake: (r, w, s) => {
    const size = (s ?? 0.08) * span(r, 0.7, 1.4);
    return { lift: span(r, 0.8, 6), falls: true, clear: clearOf(size), spec: { vx: w.x * 1.4 + spread(r) * 0.4, vy: -span(r, 0.1, 0.25), vz: w.z * 1.4 + spread(r) * 0.4, life: span(r, 8, 12), size, alpha: 0.9, gravity: 0.1, drag: 0.35, shape: 'disc' } };
  },
  // A leaf let go: it comes down turning, lies where it lands, and a gust lifts it with the grass
  leaf: (r, w, s) => {
    const size = (s ?? 0.13) * span(r, 0.7, 1.3);
    const lifted = w.gust > 0.65 ? span(r, 0.2, 1.2) * (w.gust - 0.5) * 2 : 0;
    return { lift: span(r, 0.8, 5), falls: true, clear: clearOf(size), spec: { vx: w.x * 1.8 + 0.3, vy: lifted - 0.1, vz: w.z * 1.8 + spread(r) * 0.4, life: span(r, 11, 16), size, alpha: 0.95, gravity: 0.12, drag: 0.2, shape: 'shard', spin: spread(r) * 6 } };
  },
  // A petal, slower and softer than a leaf
  petal: (r, w, s) => {
    const size = (s ?? 0.13) * span(r, 0.7, 1.3);
    return { lift: span(r, 0.8, 5), falls: true, clear: clearOf(size), spec: { vx: w.x * 1.2 + spread(r) * 0.3, vy: -0.05, vz: w.z * 1.2 + spread(r) * 0.3, life: span(r, 12, 18), size, alpha: 0.9, gravity: 0.07, drag: 0.25, shape: 'petal', spin: spread(r) * 3.5 } };
  },
  // Diamond dust: a bright fleck that turns and is gone
  glint: (r, w, s) => {
    const size = (s ?? 0.06) * span(r, 0.7, 1.4);
    return { lift: span(r, 0.3, 5), falls: false, clear: clearOf(size), spec: { vx: w.x * 0.3 + spread(r) * 0.2, vy: spread(r) * 0.2, vz: w.z * 0.3 + spread(r) * 0.2, life: span(r, 2, 3.5), size, alpha: 1, glow: true, drag: 0.5, hold: 0.45, shape: 'spark', spin: spread(r) * 6 } };
  },
  // Spindrift: snow torn off the drifts, racing low
  streamer: (r, w, s) => {
    const size = (s ?? 0.09) * span(r, 0.7, 1.4);
    return { lift: span(r, 0.15, 1), falls: false, clear: clearOf(size), spec: { vx: w.x * 3.5 + 1, vy: 0.05, vz: w.z * 3.5 + spread(r) * 0.8, life: span(r, 1.3, 2.4), size, alpha: 0.65, drag: 0.1, shape: 'streak', stretch: 0.3 } };
  },
  // Fluff on the breeze
  seed: (r, w, s) => {
    const size = (s ?? 0.11) * span(r, 0.7, 1.3);
    return { lift: span(r, 0.5, 3), falls: true, clear: clearOf(size), spec: { vx: w.x * 1.2 + spread(r) * 0.3, vy: spread(r) * 0.1, vz: w.z * 1.2 + spread(r) * 0.3, life: span(r, 9, 14), size, alpha: 0.85, gravity: 0.03, drag: 0.2, shape: 'feather', spin: spread(r) * 1.6 } };
  },
  // Hung in stilled time: it does not move
  frozen: (r, _w, s) => {
    const size = (s ?? 0.075) * span(r, 0.7, 1.4);
    return { lift: span(r, 0.3, 5), falls: false, clear: clearOf(size), spec: { vx: spread(r) * 0.02, vy: spread(r) * 0.02, vz: spread(r) * 0.02, life: span(r, 11, 15), size, alpha: 0.85, glow: true, hold: 0.6, shape: 'shard', spin: 0.15 } };
  },
  // A note of the pipes, going up
  note: (r, w, s) => {
    const size = (s ?? 0.17) * span(r, 0.8, 1.2);
    return { lift: span(r, 0.5, 2.2), falls: false, clear: clearOf(size), spec: { vx: w.x * 0.4 + spread(r) * 0.3, vy: span(r, 0.18, 0.4), vz: w.z * 0.4 + spread(r) * 0.3, life: span(r, 6, 9), size, alpha: 0.85, glow: true, drag: 0.3, hold: 0.4, shape: 'note', spin: spread(r) * 1.4 } };
  },
  // A bubble rising, swelling as it goes
  bubble: (r, w, s) => {
    const size = (s ?? 0.14) * span(r, 0.7, 1.5);
    return { lift: span(r, 0.1, 1.6), falls: false, clear: clearOf(size), spec: { vx: w.x * 0.3 + spread(r) * 0.2, vy: span(r, 0.25, 0.55), vz: w.z * 0.3 + spread(r) * 0.2, life: span(r, 5, 8), size, grow: 1.3, alpha: 0.8, drag: 0.25, hold: 0.3, shape: 'bubble' } };
  },
};

/** The colour of a layer in `region`: its realm's own (the accents and the mist keep their place in the grade's 64 colours), turned toward white by `pale`. */
export function toneOf(region: string, layer: Pick<AirLayer, 'tone' | 'pale'>): Rgb {
  const look = lookOf(region);
  const t: AirTone = layer.tone;
  const base = t === 'mist' ? look.mist : t === 'accent0' ? look.accents[0] : t === 'accent1' ? look.accents[1] : t === 'moon' ? look.moonColor : t;
  const p = layer.pale ?? 0;
  return [base[0] + (1 - base[0]) * p, base[1] + (1 - base[1]) * p, base[2] + (1 - base[2]) * p];
}

/** The gusts that roll across the land: the very function shaders/world.ts bends the grass by, so a leaf lifts as the blades bow. */
export const gustAt = (time: number, x: number, z: number): number => 0.5 + 0.5 * Math.sin(time * 0.31 + x * 0.045 - z * 0.03);
