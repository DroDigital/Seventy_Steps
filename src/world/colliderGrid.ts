/**
 * Colliders filed in square cells `cell` metres wide, each under every cell its bounds reach `pad` metres past: `near(x, z)` gives the colliders a
 * point at (x, z) may lie within `pad` of, so a test looks only at those. The planner's solids (planSpawns.ts) and the wing walk (sealWings.ts) both
 * read it (round 112). Pure.
 */

import { colliderBounds, type Collider } from './colliders';

export function colliderGrid(colliders: readonly Collider[], cell: number, pad: number): (x: number, z: number) => readonly Collider[] {
  const key = (i: number, j: number): number => i * 65536 + j;
  const grid = new Map<number, Collider[]>();
  for (const c of colliders) {
    const b = colliderBounds(c);
    for (let i = Math.floor((b.x0 - pad) / cell); i <= Math.floor((b.x1 + pad) / cell); i++) {
      for (let j = Math.floor((b.z0 - pad) / cell); j <= Math.floor((b.z1 + pad) / cell); j++) {
        const k = key(i, j);
        const list = grid.get(k);
        if (list) list.push(c);
        else grid.set(k, [c]);
      }
    }
  }
  return (x, z) => grid.get(key(Math.floor(x / cell), Math.floor(z / cell))) ?? [];
}
