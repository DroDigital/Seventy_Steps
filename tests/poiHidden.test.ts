import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { toBoxFrame, type Collider } from '../src/world/colliders';
import { houseSolids } from '../src/world/houseAddons';
import { allPoiSites } from '../src/world/poiSites';
import { regionPlan } from '../src/world/regionPlan';

const MARGIN = 0.8; // metres a chest or flask keeps from a house's wing, bay or porch, as the planner's solids read it (round 112)

/** Whether (x, z) lies within `m` of the collider, as the planner's solids read it. */
function within(c: Collider, x: number, z: number, m: number): boolean {
  if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) < c.radius + m;
  if (c.kind === 'obox') {
    const l = toBoxFrame(c, x, z);
    return Math.abs(l.x) < c.hx + m && Math.abs(l.z) < c.hz + m;
  }
  return false;
}

describe("a point of interest's chest or flask is never set in a house's wing, bay or porch (round 112)", () => {
  it('every chest and flask stands clear of every house extra in its region', () => {
    const shut: string[] = [];
    for (const s of allPoiSites()) {
      const region = REGIONS.find((r) => r.id === s.def.region)!;
      const houses = [...regionPlan(region).props.values()].flat().filter((p) => p.kind === 'house');
      for (const at of [s.chest, s.flask]) {
        if (!at) continue;
        for (const h of houses) for (const c of houseSolids(h)) if (within(c, at.x, at.z, MARGIN)) shut.push(`${s.def.id} at ${at.x.toFixed(1)},${at.z.toFixed(1)}`);
      }
    }
    expect(shut).toEqual([]);
  });
});
