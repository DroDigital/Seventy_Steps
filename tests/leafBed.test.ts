/**
 * Round 125, the leaves heard (render/audio/leafBed.ts): the woods rustle and the desert and the ice do not; a gust swells the rustle
 * and a gale brings the boughs' rush; nothing is heard under a roof.
 */
import { describe, expect, it } from 'vitest';
import { getRegion } from '../src/data/regions';
import { leafCover, leafLevels } from '../src/render/audio/leafBed';
import { chunkContent } from '../src/world/chunks';
import { WORLD } from '../src/data/tuning';

/** The most cover along a region's middle row of chunks (where its woods stand, if it has any). */
function most(id: string): number {
  const [tx, tz, w] = getRegion(id)!.area;
  let best = 0;
  for (let i = 0; i < w * 8; i++) {
    const [cx, cz] = [tx * 8 + i, tz * 8 + 4];
    if (chunkContent(cx, cz).region?.id !== id) continue;
    for (const p of chunkContent(cx, cz).props) if (p.kind === 'tree') best = Math.max(best, leafCover(p.x + 2, p.z + 2));
    if (best > 0.99) break;
  }
  return best;
}

describe('the leaves heard (round 125)', () => {
  it('rustle in the woods, and not in the desert or on the ice', () => {
    expect(most('vermont')).toBeGreaterThan(0.6);
    expect(most('dunwich')).toBeGreaterThan(0.6);
    expect(most('mountains')).toBeLessThan(0.15);
    expect(leafCover(WORLD.chunk * 1000, WORLD.chunk * 1000)).toBe(0); // (out past the world)
  });

  it('swell with a gust, bring the boughs in a gale, and are not heard under a roof', () => {
    const still = leafLevels(1, 0, 1, false);
    const gust = leafLevels(1, 1, 1, false);
    const gale = leafLevels(1, 1, 3, false);
    expect(gust.rustle).toBeGreaterThan(still.rustle * 3);
    expect(still.rustle).toBeGreaterThan(0);
    expect(gale.boughs).toBeGreaterThan(gust.boughs * 2);
    expect(leafLevels(1, 1, 3, true)).toEqual({ rustle: 0, boughs: 0 });
    expect(leafLevels(0, 1, 3, false)).toEqual({ rustle: 0, boughs: 0 });
  });
});
