/** Round 78: the open world's ground mist, thickened in the courts of the horrors it fits (data/arenaMists.ts, render/courtMist.ts). */

import { describe, expect, it } from 'vitest';
import { ARENA_MISTS } from '../src/data/arenaMists';
import { FOGS } from '../src/data/fogs';
import { courtAt, courtShare } from '../src/render/courtMist';
import { fogOf } from '../src/render/volumetricFog';
import { worldLayout } from '../src/world/placements';

const arenas = worldLayout().arenas;

describe('the mist of a court', () => {
  it('names only open arenas, and leaves the dry ones (the Colossus, Yig) without', () => {
    const horrors = new Set(arenas.map((a) => a.bosses[0]));
    for (const id of Object.keys(ARENA_MISTS)) expect(horrors.has(id), id).toBe(true);
    expect(ARENA_MISTS.colossus_pyramids).toBeUndefined();
    expect(ARENA_MISTS.yig).toBeUndefined();
    expect(Object.keys(ARENA_MISTS).length).toBeGreaterThanOrEqual(15);
  });

  it('gathers from outside the wall to whole a few metres within it', () => {
    expect(courtShare(20)).toBe(0);
    expect(courtShare(6)).toBe(0);
    expect(courtShare(0)).toBeGreaterThan(0.5);
    expect(courtShare(-4)).toBe(1);
    expect(courtShare(-30)).toBe(1);
    expect(courtShare(1)).toBeLessThan(courtShare(-1));
  });

  it('is found at the middle of each court that has one, and nowhere far from them', () => {
    for (const a of arenas) {
      const boss = a.bosses[0]!;
      const at = courtAt(a.x, a.z);
      if (ARENA_MISTS[boss]) expect(at, boss).toMatchObject({ boss, share: 1 });
      else expect(at?.boss, boss).not.toBe(boss);
    }
    expect(courtAt(1e5, 1e5)).toBeNull();
  });

  it('thickens the realm\'s own mist by the court\'s, whole in the court and not at all outside it, and stays a low mist', () => {
    for (const a of arenas) {
      const boss = a.bosses[0]!;
      const m = ARENA_MISTS[boss];
      const base = fogOf(a.region, false);
      if (!m) continue;
      const whole = fogOf(a.region, false, { boss, share: 1 });
      expect(whole.density, boss).toBeCloseTo(base.density * m.density, 6);
      expect(whole.height, boss).toBeCloseTo(base.height * m.height, 6);
      expect(fogOf(a.region, false, { boss, share: 0 }), boss).toEqual(base);
      expect(fogOf(a.region, false, { boss, share: 0.5 }).density, boss).toBeGreaterThan(base.density);
      expect(whole.density, `${boss}: no blanket (a fight keeps its contrast)`).toBeLessThanOrEqual(0.16);
      expect(whole.height, `${boss}: a low mist, the roofs and the sky clear above it`).toBeLessThanOrEqual(4);
    }
    expect(FOGS.hub).toBeDefined();
  });
});
