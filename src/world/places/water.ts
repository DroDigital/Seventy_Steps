/**
 * Ground a place shapes and the water it holds (round 75): pools sunk below the court's level with a sheet at their surface, and terraces
 * raised above it, each given as an outline in the court's frame. The planner gets the layout's `living`, `under` and `dry` from one call,
 * and puts its pieces at `bed(pool)` or `top(terrace)` metres off the level where they stand in the water or on the rise. Nothing here may
 * touch the fight's ring: the planner keeps its outlines beyond it. Pure: no Three.js.
 */

import type { XZ } from '../../core/geom';
import type { Vec3 } from '../../data/tuning';
import type { Pool } from '../enclosure';
import type { Court } from '../placeKit';
import { polygonFootprint, type Pad } from '../sitePads';

type Pts = readonly (readonly [number, number])[];

/** Water sunk into the court: its outline, how far its bed lies below the level, and how it looks. */
export interface PoolSpec {
  pts: Pts;
  depth: number; // metres: the bed below the court's level (a body wades the shallows: never past 1.2)
  bank?: number; // metres the ground takes to rise to the level again (2.6)
  tint: Vec3;
  foam: Vec3;
  flow?: readonly [number, number]; // m/s in the court's frame (a along the front, c to the left)
  glow?: number;
}

/** Ground raised above the court's level, or sunk below it (a negative `rise`: a pit, dry but not a place to stand a piece): its outline, how far it stands up, and the slope that meets the level. */
export interface TerraceSpec {
  pts: Pts;
  rise: number;
  blend?: number; // (3)
}

/** The outline of a channel of half-breadth `half` along a path of points (a, c): the left side out, the right side back. */
export function strip(path: Pts, half: number): [number, number][] {
  const side = (sign: number): [number, number][] => path.map(([a, c], i) => {
    const [p, q] = [path[Math.max(0, i - 1)]!, path[Math.min(path.length - 1, i + 1)]!];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    return [a - ((q[1] - p[1]) / len) * half * sign, c + ((q[0] - p[0]) / len) * half * sign];
  });
  return [...side(1), ...side(-1).reverse()];
}

/** The surface lies this far down the pool's depth: a body wading is wet to its knee at most. */
export const SURFACE = 0.3;

/** Where a pool's bed lies, off the court's level. */
export const bed = (p: Pick<PoolSpec, 'depth'>): number => -p.depth;

export interface Ground {
  living: Pool[];
  under: (level: number) => Pad[];
  dry: (p: XZ) => number;
}

/** The pools and terraces as a layout wants them: the sheets of water, the shaped ground after the level, and how wet a point is (positive in the water). */
export function shaped(c: Court, pools: readonly PoolSpec[], terraces: readonly TerraceSpec[] = []): Ground {
  const world = (pts: Pts): XZ[] => pts.map(([a, cc]) => c.put(a, cc));
  const wet = pools.map((p) => ({ spec: p, outline: world(p.pts) })).map((p) => ({ ...p, fp: polygonFootprint(p.outline) }));
  const raised = terraces.map((t) => ({ spec: t, fp: polygonFootprint(world(t.pts)) }));
  const [fx, fz] = [c.f, c.l];
  return {
    living: wet.map(({ spec, outline }) => {
      const mid = outline.reduce((s, p) => ({ x: s.x + p.x / outline.length, z: s.z + p.z / outline.length }), { x: 0, z: 0 });
      return {
        kind: 'pool' as const, x: mid.x, z: mid.z, pts: outline, y: c.s.y - spec.depth * SURFACE, tint: spec.tint, foam: spec.foam, bank: spec.bank ?? 2.6,
        ...(spec.flow && { flow: { x: fx.x * spec.flow[0] + fz.x * spec.flow[1], z: fx.z * spec.flow[0] + fz.z * spec.flow[1] } }),
        ...(spec.glow && { glow: spec.glow }),
      };
    }),
    under: (level) => [
      ...wet.map(({ spec, fp }): Pad => ({ kind: 'shape', shape: fp, blend: spec.bank ?? 2.6, level: level - spec.depth })),
      ...raised.map(({ spec, fp }): Pad => ({ kind: 'shape', shape: fp, blend: spec.blend ?? 3, level: level + spec.rise })),
    ],
    dry: (p) => {
      const worst = [...wet, ...raised.filter((t) => t.spec.rise < 0)].reduce((w, { fp }) => Math.max(w, -fp.dist(p.x, p.z)), -Infinity);
      return raised.reduce((w, { spec, fp }) => (spec.rise >= 0 ? Math.min(w, fp.dist(p.x, p.z)) : w), worst); // (a causeway across the water is dry)
    },
  };
}
