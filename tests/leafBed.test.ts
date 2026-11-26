/**
 * The trees heard (round 125; recorded in round 126, render/audio/leafBed.ts): the woods are heard and the desert and the ice are not; a
 * broadleaf wood rustles where a conifer wood sighs; a gust swells them and a gale brings the boughs; a thin stand is duller than the midst
 * of a wood; the rain drowns half; nothing under a roof; a trunk groans only in a gust, and never twice in a breath. The beds are recorded,
 * credited and measured, and no region's bed doubles them.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getRegion } from '../src/data/regions';
import { AMBIENCE, SAMPLE_SETS } from '../src/data/samples';
import { SAMPLE_LEVELS } from '../src/data/sampleLevels';
import { LEAF_SOUND } from '../src/data/windTuning';
import { creaks, leafLevels, rainOf, standAt, type Stand } from '../src/render/audio/leafBed';
import { chunkContent } from '../src/world/chunks';
import { WORLD } from '../src/data/tuning';

/** The thickest stand along a region's middle row of chunks (where its woods stand, if it has any). */
function most(id: string, kind: 'tree' | 'pine' = 'tree'): Stand {
  const [tx, tz, w] = getRegion(id)!.area;
  let best = standAt(WORLD.chunk * 1000, 0);
  for (let i = 0; i < w * 8; i++) {
    const [cx, cz] = [tx * 8 + i, tz * 8 + 4];
    if (chunkContent(cx, cz).region?.id !== id) continue;
    for (const p of chunkContent(cx, cz).props) {
      if (p.kind !== kind) continue;
      const s = standAt(p.x + 2, p.z + 2);
      if (s.broad + s.conifer > best.broad + best.conifer) best = s;
    }
  }
  return best;
}
const all = (s: Stand): number => Math.min(1, s.broad + s.conifer);

describe('the trees heard (round 126)', () => {
  it('are heard in the woods, and not in the desert or on the ice', () => {
    expect(all(most('vermont'))).toBeGreaterThan(0.6);
    expect(all(most('dunwich'))).toBeGreaterThan(0.6);
    expect(all(most('mountains'))).toBeLessThan(0.15);
    expect(all(standAt(WORLD.chunk * 1000, WORLD.chunk * 1000))).toBe(0); // (out past the world)
  });

  it('tells a broadleaf wood from a conifer wood, and knows which side the trees stand on', () => {
    const oak = most('dunwich');
    expect(oak.broad).toBeGreaterThan(oak.conifer);
    const w = leafLevels(oak, 0.5, 1, 0, false);
    expect(w.canopy).toBeGreaterThan(w.pines);
    const fir = leafLevels({ broad: 0, conifer: 1 }, 0.5, 1, 0, false);
    expect(fir.pines).toBeGreaterThan(0);
    expect(fir.canopy).toBe(0);
    expect(Math.hypot(...oak.side)).toBeLessThanOrEqual(1.0001);
    expect(oak.trunks.length).toBeGreaterThan(0);
  });

  it('swells in a gust, heaves its boughs in a gale, and is calmer, never silent, in a lull', () => {
    const still = leafLevels({ broad: 1, conifer: 0 }, 0, 1, 0, false);
    const gust = leafLevels({ broad: 1, conifer: 0 }, 1, 1, 0, false);
    const gale = leafLevels({ broad: 1, conifer: 0 }, 1, 3, 0, false);
    expect(still.canopy).toBeGreaterThan(0.2);
    expect(gust.canopy).toBeGreaterThan(still.canopy * 2);
    expect(still.boughs).toBe(0);
    expect(gale.boughs).toBeGreaterThan(gust.boughs * 2);
    expect(gust.lowpass).toBeGreaterThan(still.lowpass);
  });

  it('is dull from a thin stand and bright in the midst of a wood; drowned by half in rain; silent under a roof', () => {
    const thin = leafLevels({ broad: 0.15, conifer: 0 }, 0.5, 1, 0, false);
    const thick = leafLevels({ broad: 1, conifer: 0 }, 0.5, 1, 0, false);
    expect(thick.lowpass - thin.lowpass).toBeGreaterThan(2500);
    const wet = leafLevels({ broad: 1, conifer: 0 }, 0.5, 1, 1, false);
    expect(wet.canopy / thick.canopy).toBeCloseTo(1 - LEAF_SOUND.rain, 5);
    expect(rainOf({ kind: 'storm', amount: 0.7 })).toBe(0.7);
    expect(rainOf({ kind: 'gale', amount: 0.7 })).toBe(0);
    const none = { canopy: 0, pines: 0, boughs: 0 };
    expect(leafLevels({ broad: 1, conifer: 1 }, 1, 3, 0, true)).toMatchObject(none);
    expect(leafLevels({ broad: 0, conifer: 0 }, 1, 3, 0, false)).toMatchObject(none);
  });

  it('groans a trunk now and then in a gust, seldom in a lull, never twice within its gap', () => {
    const count = (gust: number): number => {
      let [n, last] = [0, -Infinity];
      for (let t = 0; t < 3600; t += 0.1) if (creaks(1, gust, 1, t - last, 0.1, Math.random())) [n, last] = [n + 1, t];
      return n;
    };
    const [lull, gusty] = [count(0), count(1)];
    expect(gusty).toBeGreaterThan(lull * 3);
    expect(gusty).toBeLessThanOrEqual(3600 / LEAF_SOUND.creak.gap);
    expect(gusty).toBeGreaterThan(30);
    expect(creaks(1, 1, 1, LEAF_SOUND.creak.gap - 0.1, 10, 0)).toBe(false);
    expect(creaks(0.05, 1, 1, 100, 10, 0)).toBe(false); // (a lone bush does not)
  });

  it('plays recordings that are there, measured and credited, and no region doubles them with a bed of leaves', () => {
    const credits = readFileSync('public/audio/CREDITS.md', 'utf8');
    for (const f of Object.values(LEAF_SOUND.beds)) {
      expect(SAMPLE_LEVELS[f], f).toBeDefined();
      expect(SAMPLE_LEVELS[f].sec, f).toBeGreaterThan(30);
      expect(credits, f).toContain(`\`${f}.mp3\``);
    }
    for (const f of SAMPLE_SETS.treeCreak.files) expect(credits, f).toContain(`\`sfx/${f}.mp3\``);
    for (const [id, a] of Object.entries(AMBIENCE)) for (const [bed] of a.beds) expect(Object.values(LEAF_SOUND.beds).map((b) => b.slice(4)), id).not.toContain(bed);
    for (const a of Object.values(AMBIENCE)) for (const [bed] of a.beds) expect(bed).not.toBe('leaves');
  });
});
