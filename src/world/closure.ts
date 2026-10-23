/**
 * Whether a body can get through an enclosure's wall anywhere but its gate (round 66; a wall of any outline: the audit of round 63 walked a
 * body at a ring from eight sides, this one asks every place). The ground within the wall's box and a margin about it is gridded; a place is
 * shut when a body of `CLOSURE.radius` standing there would be pushed out of a collider that reaches its height (the same rule as
 * `resolveCapsule`); a flood from outside the wall takes every place it can walk to. Sealed, it must reach nothing inside the wall; open,
 * it must reach what is asked of it (the gate leads to the fight's ring). Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { toBoxFrame, type Collider } from './colliders';
import type { Rect } from './worldMap';

export const CLOSURE = {
  cell: 0.2, // metres: a gap in a wall narrower than the body and a cell is not found
  radius: 0.35, // metres: a body a little smaller than the investigator's (0.4), so a leak the investigator's size would be missed by is found
  height: 1.8, // metres
  margin: 8, // metres of open ground scanned beyond the wall's box, where the flood begins
} as const;

export interface ClosureInput {
  rect: Rect; // the wall's box
  colliders: readonly Collider[];
  ground(x: number, z: number): number;
  inside(p: XZ): boolean; // a place within the wall (clear of its own thickness)
  into?: XZ; // a place within it that an open gate must lead to
}

export interface ClosureResult {
  leak: XZ | null; // the first place within the wall that a body outside can walk to
  reached: boolean; // whether `into` can be walked to from outside
  cells: number; // places of the grid
}

/** Metres from (x, z) to a collider's footprint (negative within); NaN when its height misses a body standing on `y`. */
function distance(c: Collider, x: number, z: number, y: number): number {
  const [lo, hi] = c.kind === 'box' ? [c.min.y, c.max.y] : [c.y0, c.y1];
  if (y + CLOSURE.height <= lo || y >= hi) return NaN;
  if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) - c.radius;
  const [local, hx, hz] = c.kind === 'obox' ? [toBoxFrame(c, x, z), c.hx, c.hz] : [{ x: x - (c.min.x + c.max.x) / 2, z: z - (c.min.z + c.max.z) / 2 }, (c.max.x - c.min.x) / 2, (c.max.z - c.min.z) / 2];
  const [dx, dz] = [Math.max(Math.abs(local.x) - hx, 0), Math.max(Math.abs(local.z) - hz, 0)];
  return dx > 0 || dz > 0 ? Math.hypot(dx, dz) : Math.max(Math.abs(local.x) - hx, Math.abs(local.z) - hz);
}

/** Floods from outside the wall over the places a body can stand. */
export function closure(inp: ClosureInput): ClosureResult {
  const { cell, radius, margin } = CLOSURE;
  const [x0, z0] = [inp.rect.x0 - margin, inp.rect.z0 - margin];
  const [nx, nz] = [Math.ceil((inp.rect.x1 + margin - x0) / cell), Math.ceil((inp.rect.z1 + margin - z0) / cell)];
  const shut = new Uint8Array(nx * nz);
  const at = (i: number, j: number): XZ => ({ x: x0 + (i + 0.5) * cell, z: z0 + (j + 0.5) * cell });
  for (const c of inp.colliders) {
    const [bx0, bz0, bx1, bz1] = c.kind === 'box' ? [c.min.x, c.min.z, c.max.x, c.max.z] : c.kind === 'cylinder' ? [c.x - c.radius, c.z - c.radius, c.x + c.radius, c.z + c.radius] : [c.x - Math.hypot(c.hx, c.hz), c.z - Math.hypot(c.hx, c.hz), c.x + Math.hypot(c.hx, c.hz), c.z + Math.hypot(c.hx, c.hz)];
    const [i0, i1] = [Math.max(0, Math.floor((bx0 - radius - x0) / cell)), Math.min(nx - 1, Math.ceil((bx1 + radius - x0) / cell))];
    const [j0, j1] = [Math.max(0, Math.floor((bz0 - radius - z0) / cell)), Math.min(nz - 1, Math.ceil((bz1 + radius - z0) / cell))];
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        if (shut[j * nx + i]) continue;
        const p = at(i, j);
        if (distance(c, p.x, p.z, inp.ground(p.x, p.z)) < radius) shut[j * nx + i] = 1;
      }
    }
  }
  const seen = new Uint8Array(nx * nz);
  const queue: number[] = []; // first in, first out: the first place found within the wall is the one nearest the way in
  const push = (i: number, j: number): void => {
    const k = j * nx + i;
    if (i < 0 || j < 0 || i >= nx || j >= nz || shut[k] || seen[k]) return;
    seen[k] = 1;
    queue.push(k);
  };
  for (let i = 0; i < nx; i++) {
    push(i, 0);
    push(i, nz - 1);
  }
  for (let j = 0; j < nz; j++) {
    push(0, j);
    push(nx - 1, j);
  }
  let leak: XZ | null = null;
  for (let n = 0; n < queue.length; n++) {
    const k = queue[n]!;
    const [i, j] = [k % nx, Math.floor(k / nx)];
    if (!leak && inp.inside(at(i, j))) leak = at(i, j);
    push(i + 1, j);
    push(i - 1, j);
    push(i, j + 1);
    push(i, j - 1);
  }
  const reached = !!inp.into && seen[Math.min(nz - 1, Math.max(0, Math.floor((inp.into.z - z0) / cell))) * nx + Math.min(nx - 1, Math.max(0, Math.floor((inp.into.x - x0) / cell)))] === 1;
  return { leak, reached, cells: nx * nz };
}
