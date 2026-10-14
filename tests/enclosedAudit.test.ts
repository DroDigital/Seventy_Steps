/**
 * The whole land, on a grid (round 49: a ruin's walls shut two foes in and the investigator out): every point a body can
 * stand at is walked out from, and a pocket that is a place, not a nook between stones, fails with where it is and what
 * stands round it. Slow (a few minutes): `npm run audit`. The same checks on the generators and on what is posted is
 * `enclosed.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { walkOut } from '../src/world/escape';
import { worldLayout } from '../src/world/placements';
import { regionPlan } from '../src/world/regionPlan';
import { regionRect } from '../src/world/worldMap';
import { worldBlocked } from './enclosedHelpers';

const GRID = 4; // metres between the points tried
const NOOK = 100; // cells: a pocket of fewer is a nook between a stone and a wall (enclosed.test.ts)

describe('no part of the land is walled off', () => {
  it('every region, on a grid: no pocket a body can stand in and cannot walk out of', () => {
    const blocked = worldBlocked();
    const w = worldLayout();
    const found: string[] = [];
    for (const region of REGIONS) {
      const rect = regionRect(region);
      const plan = regionPlan(region);
      const props = [...plan.props.values()].flat();
      const pockets: { x: number; z: number; cells: number }[] = [];
      for (let x = rect.x0 + 8; x < rect.x1 - 8; x += GRID) {
        for (let z = rect.z0 + 8; z < rect.z1 - 8; z += GRID) {
          if (w.dungeons.some((d) => x > d.layout.rect.x0 - 14 && x < d.layout.rect.x1 + 14 && z > d.layout.rect.z0 - 14 && z < d.layout.rect.z1 + 14)) continue; // (a dungeon is its own walls; its doors are checked in enclosed.test.ts)
          if (w.arenas.some((a) => Math.hypot(a.x - x, a.z - z) < a.radius + 6)) continue; // (a horror's ring is held by its fog)
          if (blocked(x, z)) continue;
          const out = walkOut(blocked, x, z, 14);
          if (out.out || out.cells < NOOK) continue;
          const seen = pockets.find((p) => Math.hypot(p.x - x, p.z - z) < 14);
          if (seen) seen.cells = Math.max(seen.cells, out.cells);
          else pockets.push({ x, z, cells: out.cells });
        }
      }
      for (const p of pockets) {
        const near = props.map((q) => ({ q, d: Math.hypot(q.x - p.x, q.z - p.z) })).sort((a, b) => a.d - b.d).slice(0, 4).map((o) => `${o.q.kind} ${o.d.toFixed(1)} m`);
        found.push(`${region.id}: shut in at ${p.x.toFixed(0)}, ${p.z.toFixed(0)} (a pocket of ${p.cells} cells), by ${near.join(', ')}`);
      }
    }
    expect(found).toEqual([]);
  }, 900_000);
});
