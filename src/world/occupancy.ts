/**
 * A region's occupancy (spec §3D, moved out of regionPlan.ts in round 66): which ground is taken, in cells of `CELL` metres: by sites,
 * roads, houses and features. What fills the land between (copses, wayside stones, farmsteads, the biome's props) keeps to the cells that
 * are free. Pure.
 */

import type { Rect } from './worldMap';
import type { Footprint } from './sitePads';

const CELL = 4; // metres per occupancy cell

/** The plan's occupancy: which ground is free, and a disk of it taken. */
export interface Occ {
  free(x: number, z: number): boolean;
  disk(x: number, z: number, r: number, mark: boolean): boolean;
}

export type Occupancy = ReturnType<typeof occupancy>;

/** Which cells of the region are taken: sites, roads, houses and features. */
export function occupancy(rect: Rect) {
  const taken = new Set<number>();
  const key = (x: number, z: number): number => Math.floor((x - rect.x0) / CELL) * 4096 + Math.floor((z - rect.z0) / CELL);
  const inside = (x: number, z: number, m: number): boolean => x > rect.x0 + m && x < rect.x1 - m && z > rect.z0 + m && z < rect.z1 - m;
  return {
    free: (x: number, z: number): boolean => inside(x, z, 3) && !taken.has(key(x, z)),
    disk(x: number, z: number, r: number, mark: boolean): boolean {
      for (let dx = -r; dx <= r; dx += CELL / 2) {
        for (let dz = -r; dz <= r; dz += CELL / 2) {
          if (dx * dx + dz * dz > r * r) continue;
          if (mark) taken.add(key(x + dx, z + dz));
          else if (!inside(x + dx, z + dz, 8) || taken.has(key(x + dx, z + dz))) return false;
        }
      }
      return true;
    },
    rect(r: Rect, m: number): void {
      for (let x = r.x0 - m; x <= r.x1 + m; x += CELL / 2) for (let z = r.z0 - m; z <= r.z1 + m; z += CELL / 2) taken.add(key(x, z));
    },
    /** Takes every cell within `margin` metres of a shape of any outline (a cell whose middle is that near, or a half cell's diagonal nearer). */
    cover(f: Footprint, margin: number): void {
      const m = margin + CELL * Math.SQRT1_2;
      for (let x = f.bounds.x0 - m; x <= f.bounds.x1 + m; x += CELL / 2) for (let z = f.bounds.z0 - m; z <= f.bounds.z1 + m; z += CELL / 2) if (f.dist(x, z) <= m) taken.add(key(x, z));
    },
  };
}
