/**
 * What the far outlines are drawn with (round 117; render/skylineShapes.ts, skylineBuilt.ts): smooth noise along a line (the old crests' only
 * roughness was 64 random steps, a staircase along every ridge), fractal and ridged octaves of it, and the forms the built outlines share,
 * each a height at x: a spire, a crag that leans, a slab cut aslant, a dome, a gable. An outline is a height, as a share of the silhouette's,
 * along its width from -0.5 to 0.5; `aspect` is its width over its height in metres, so a dome is round and a tower as slender as it is meant.
 * Pure.
 */

import type { Rng } from '../core/rng';

/** An outline's height at x; it may carry where its lamp stands (the reef's: render/horizonGlow.ts) and how high its walls are, which have windows. */
export type Profile = ((x: number) => number) & { lamp?: { x: number; y: number }; wall?: (x: number) => number };

export interface ProfileOptions {
  aspect?: number; // the silhouette's width over its height, in metres
  trees?: number; // 0..1: how thickly its crests and streets are grown with trees
}

/** A smooth value noise along a line, 0..1, of `cells` random values (it repeats after so many units). */
export function lineNoise(rng: Rng, cells = 512): (x: number) => number {
  const v = Float32Array.from({ length: cells }, () => rng());
  return (x) => {
    const i = Math.floor(x);
    const t = x - i;
    const a = v[((i % cells) + cells) % cells];
    const b = v[(((i + 1) % cells) + cells) % cells];
    return a + (b - a) * t * t * (3 - 2 * t);
  };
}

/** Octaves of a noise, about 0..1. */
export function fbm(n: (x: number) => number, x: number, octaves = 4, gain = 0.5): number {
  let [s, a, w, f] = [0, 1, 0, 1];
  for (let i = 0; i < octaves; i++) {
    s += a * n(x * f + i * 37.1);
    w += a;
    a *= gain;
    f *= 2.07;
  }
  return s / w;
}

/** Ridged octaves: sharp crests where the noise crosses its middle, about 0..1. */
export function ridged(n: (x: number) => number, x: number, octaves = 4): number {
  let [s, a, w, f] = [0, 1, 0, 1];
  for (let i = 0; i < octaves; i++) {
    s += a * (1 - Math.abs(2 * n(x * f + i * 53.3) - 1)) ** 2;
    w += a;
    a *= 0.5;
    f *= 2.13;
  }
  return s / w;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const smooth = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** A pointed spire of half-width `w` and height `h` at `c`. */
export const spire = (x: number, c: number, w: number, h: number): number => (Math.abs(x - c) < w ? h * (1 - Math.abs(x - c) / w) ** 0.8 : 0);

/** A crag or spire whose apex leans `k` (-1..1) of its half-width off its middle; `bow` > 1 hollows its flanks. */
export function lean(x: number, c: number, w: number, h: number, k: number, bow = 1): number {
  const apex = c + k * w * 0.8;
  const d = x < apex ? (apex - x) / (apex - (c - w)) : (x - apex) / (c + w - apex);
  return d < 1 ? h * (1 - d) ** bow : 0;
}

/** A slab of half-width `w` at `c`, its top at `h` cut aslant by `tilt` (height per unit across). */
export const slab = (x: number, c: number, w: number, h: number, tilt = 0): number => (Math.abs(x - c) < w ? h + tilt * (x - c) : 0);

/** A pointed roof or cap of half-width `w` and height `h` standing on `base` at `c`. */
export const cap = (x: number, c: number, w: number, base: number, h: number): number => (Math.abs(x - c) < w ? base + h * (1 - Math.abs(x - c) / w) ** 0.9 : 0);

/** A dome of radius `r` (in width units) on a drum of height `base`, round for an outline `aspect` wide to its height. */
export const dome = (x: number, c: number, r: number, base: number, aspect: number): number => (Math.abs(x - c) < r ? base + r * aspect * Math.sqrt(1 - ((x - c) / r) ** 2) : 0);

/** A tree's crown of half-width `w` and height `h` standing at `c` on ground `g`. */
export const crown = (x: number, c: number, w: number, h: number, g: number): number => (Math.abs(x - c) < w ? g + h * (0.35 + 0.65 * Math.sqrt(1 - ((x - c) / w) ** 2)) : 0);

/** The highest of several heights where any stands, and the highest wall (which has windows) among those that stand there: a cap or a spire on a tower leaves the tower's walls their windows. */
export function tallest(parts: readonly (readonly [h: number, wall: number])[]): readonly [number, number] {
  let [h, wall] = [0, 0];
  for (const p of parts) {
    if (p[0] > h) h = p[0];
    if (p[0] > 0 && p[1] > wall) wall = p[1];
  }
  return [h, Math.min(wall, h)];
}
