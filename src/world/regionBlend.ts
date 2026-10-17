/**
 * Where two regions meet, their grounds meet in a band, not along a line (round 55: a chunk is textured and tinted by its region, so the
 * ground changed from one texture to another along a straight edge a hundred metres long). A chunk beside another region blends toward
 * that region's ground over `BLEND.band` metres either side of the border; `edgeShare` is the share of the other's ground at a point, by
 * a rule both sides of a border agree on (the region whose id comes first gives the share by `1 - smooth(t + n)`, the other by
 * `smooth(n - t)`, `t` the metres from the border and `n` a swell of noise in the world's own place), so the two shares are
 * one function of where a point is, and no step is left at the border itself. Pure.
 */

import type { RegionDef } from '../data/regions';
import { WORLD } from '../data/tuning';
import { regionOfChunk } from './worldMap';

export const BLEND = { band: 20, swell: 6 } as const; // metres each side of a border; and how far the noise moves it

export interface Rect { x0: number; z0: number; x1: number; z1: number }
export interface Neighbour { region: RegionDef; rects: Rect[] }

/** The region beside this chunk whose ground it blends toward (the one with the most chunks about it), with where its chunks lie; null where it has none. */
export function neighbourOf(cx: number, cz: number): Neighbour | null {
  const own = regionOfChunk(cx, cz);
  if (!own) return null;
  const found = new Map<string, Neighbour>();
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const other = regionOfChunk(cx + dx, cz + dz);
      if (!other || other.id === own.id) continue;
      const at = found.get(other.id) ?? { region: other, rects: [] };
      at.rects.push({ x0: (cx + dx) * WORLD.chunk, z0: (cz + dz) * WORLD.chunk, x1: (cx + dx + 1) * WORLD.chunk, z1: (cz + dz + 1) * WORLD.chunk });
      found.set(other.id, at);
    }
  }
  let best: Neighbour | null = null;
  for (const n of found.values()) if (!best || n.rects.length > best.rects.length) best = n;
  return best;
}

const smooth = (x: number): number => {
  const t = Math.min(1, Math.max(0, (x + BLEND.band) / (2 * BLEND.band)));
  return t * t * (3 - 2 * t);
};

/** Metres from a point to the nearest of the rectangles (0 inside). */
export function distanceTo(rects: readonly Rect[], x: number, z: number): number {
  let best = Infinity;
  for (const r of rects) best = Math.min(best, Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.z0 - z, 0, z - r.z1)));
  return best;
}

/** The share, 0 to 1, of the neighbour's ground at a point of the chunk's own region, given the swell `n` (-1 to 1) of the noise there. */
export function edgeShare(own: RegionDef, other: Neighbour, x: number, z: number, n: number): number {
  const t = distanceTo(other.rects, x, z);
  if (t >= BLEND.band + BLEND.swell) return 0;
  const swell = n * BLEND.swell;
  return own.id < other.region.id ? 1 - smooth(t + swell) : smooth(swell - t);
}
