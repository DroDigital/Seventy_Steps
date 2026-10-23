/**
 * The level ground under a site (round 66): a pad is a circle, a rectangle or a shape of any outline (an enclosure's footprint), and every
 * reader of a pad (the terrain that flattens to it, the fill that keeps off it, the posts and the ground cover) asks it the same two
 * questions here: how far a point is from its edge, and what box it can reach. A new kind of pad is added in this one place. Pure.
 */

import type { XZ } from '../core/geom';
import { rectDistance, type Rect } from './worldMap';

/** A keep-clear / level-ground shape of any outline: the box that holds it, and the signed distance to its edge (< 0 within, 0 on it, > 0 outside). */
export interface Footprint {
  bounds: Rect;
  dist(x: number, z: number): number;
}

export type Pad =
  | { kind: 'circle'; x: number; z: number; radius: number; blend: number; level: number }
  | { kind: 'rect'; rect: Rect; blend: number; level: number }
  | { kind: 'shape'; shape: Footprint; blend: number; level: number };

export const circleFootprint = (x: number, z: number, r: number): Footprint => ({
  bounds: { x0: x - r, z0: z - r, x1: x + r, z1: z + r },
  dist: (px, pz) => Math.hypot(px - x, pz - z) - r,
});

/** A closed outline (either winding), offset outward by `grow` metres. */
export function polygonFootprint(outline: readonly XZ[], grow = 0): Footprint {
  const bounds = outline.reduce<Rect>((b, p) => ({ x0: Math.min(b.x0, p.x), z0: Math.min(b.z0, p.z), x1: Math.max(b.x1, p.x), z1: Math.max(b.z1, p.z) }), { x0: Infinity, z0: Infinity, x1: -Infinity, z1: -Infinity });
  return {
    bounds: { x0: bounds.x0 - grow, z0: bounds.z0 - grow, x1: bounds.x1 + grow, z1: bounds.z1 + grow },
    dist(x, z) {
      let [near, within] = [Infinity, false];
      for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
        const [a, b] = [outline[j]!, outline[i]!];
        if (a.z > z !== b.z > z && x < a.x + ((z - a.z) / (b.z - a.z)) * (b.x - a.x)) within = !within; // an even-odd crossing of the ray toward +x
        const [dx, dz] = [b.x - a.x, b.z - a.z];
        const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
        near = Math.min(near, Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t)));
      }
      return (within ? -near : near) - grow;
    },
  };
}

/** Metres from (x, z) to the pad's edge: negative within, as the terrain flattens it. */
export function padDistance(p: Pad, x: number, z: number): number {
  switch (p.kind) {
    case 'circle':
      return Math.hypot(x - p.x, z - p.z) - p.radius;
    case 'rect':
      return rectDistance(p.rect, x, z);
    case 'shape':
      return p.shape.dist(x, z);
  }
}

/** The box a pad reaches, its blend included: the chunks it is bucketed into. */
export function padBounds(p: Pad): Rect {
  const r: Rect = p.kind === 'circle' ? { x0: p.x - p.radius, z0: p.z - p.radius, x1: p.x + p.radius, z1: p.z + p.radius } : p.kind === 'rect' ? p.rect : p.shape.bounds;
  return { x0: r.x0 - p.blend, z0: r.z0 - p.blend, x1: r.x1 + p.blend, z1: r.z1 + p.blend };
}
