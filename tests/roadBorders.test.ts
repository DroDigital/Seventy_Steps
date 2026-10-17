import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { chunkContent } from '../src/world/chunks';
import { regionPlan } from '../src/world/regionPlan';
import { keyChunk, regionOfChunk } from '../src/world/worldMap';

describe("a road's ground reaches over the border of its region (round 55)", () => {
  it('every road piece a region plans over a chunk of another region is on that chunk too, so the road is not cut where the regions meet', () => {
    let over = 0;
    for (const region of Object.values(REGIONS)) {
      for (const [key, segs] of regionPlan(region).segs) {
        const [cx, cz] = keyChunk(key);
        const owner = regionOfChunk(cx, cz);
        if (!owner || owner.id === region.id) continue;
        for (const s of segs) expect(chunkContent(cx, cz).roads, `${region.id} over ${owner.id} at ${cx},${cz}`).toContain(s);
        over++;
      }
    }
    expect(over).toBeGreaterThan(0);
  });
});
