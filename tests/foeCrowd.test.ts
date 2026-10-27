/**
 * A crowd of creatures draws no more than a few would (round 90; render/foeCrowd.ts, data/foeTuning.ts `FOE_FX.crowd`): the nearest draw all, the
 * next only their marks, the rest little or nothing, and one rolling budget of particles in half a second is shared by all of them.
 */

import { describe, expect, it } from 'vitest';
import { FOE_FX } from '../src/data/fxTuning';
import { createCrowd, tiersOf, type Foe, type Tier } from '../src/render/foeCrowd';

const C = FOE_FX.crowd;
const pack = (...d: number[]): Foe[] => d.map((x, i) => ({ id: i + 1, d: x }));
const rank = (t: Tier): number => (t === 'full' ? 0 : t === 'marks' ? 1 : 2);

describe('who draws how much (round 90)', () => {
  it('the nearest few draw all, the next few their marks, the rest only when close, and every tier has its range', () => {
    const foes = pack(2, 3, 4, 5, 6, 7, 8, 9, 9.5, 12, 20, 26);
    const t = tiersOf(foes);
    expect([1, 2, 3].map((id) => t.get(id))).toEqual(['full', 'full', 'full']);
    expect([4, 5, 6, 7, 8].map((id) => t.get(id))).toEqual(['marks', 'marks', 'marks', 'marks', 'marks']);
    expect(t.get(9), 'the rest within `range.rest` still draw marks').toBe('marks');
    expect(t.get(10), 'the rest beyond it nothing').toBe('none');
    expect(t.get(12)).toBe('none');
    const far = tiersOf(pack(C.range.full + 1, C.range.marks + 1));
    expect(far.get(1), 'the nearest, but beyond the range of the full tier').toBe('marks');
    expect(far.get(2), 'beyond the marks tier\'s').toBe('none');
  });

  it('ranks follow distance, whatever order the foes are listed in, ties by id', () => {
    const foes = pack(14, 2, 8, 3, 30, 5, 5, 9, 1, 11, 6, 12);
    const tiers = tiersOf(foes);
    const byDistance = [...foes].sort((a, b) => a.d - b.d || a.id - b.id).map((f) => rank(tiers.get(f.id)!));
    expect(byDistance).toEqual([...byDistance].sort((a, b) => a - b)); // never a nearer foe on a lower tier than a farther one
    expect([...tiers.values()].filter((x) => x === 'full')).toHaveLength(C.full);
    expect(tiersOf(foes)).toEqual(tiers); // the same each time
  });

  it('a foe not ranked yet is on the marks tier, and none draws nothing', () => {
    const crowd = createCrowd();
    expect(crowd.tierOf(99)).toBe('marks');
    crowd.rank(pack(50));
    expect(crowd.tierOf(1)).toBe('none');
    expect(crowd.ask(1, 'mark', 3, 0)).toBe(0);
    expect(crowd.ask(1, 'speck', 3, 0)).toBe(0);
  });
});

describe('the rolling budget (round 90)', () => {
  it('only the full tier draws what is optional, and the marks-only tier a part of the budget', () => {
    const crowd = createCrowd();
    crowd.rank(pack(1, 2, 3, 4, 5));
    for (const want of ['speck', 'trail', 'tell', 'mote'] as const) {
      expect(crowd.ask(1, want, 1, 0), `${want}: a full-tier foe`).toBe(1);
      expect(crowd.ask(4, want, 1, 0), `${want}: a marks-only foe`).toBe(0);
    }
    const marks = createCrowd();
    marks.rank(pack(1, 2, 3, 4));
    let got = 0;
    for (let i = 0; i < 100; i++) got += marks.ask(4, 'mark', 1, 0);
    expect(got).toBe(Math.floor(C.budget * C.markShare));
    expect(marks.ask(1, 'mark', 1, 0), 'a full-tier foe\'s mark is not crowded out by the farther foes\'').toBe(1);
  });

  it('what is optional may spend only a share of the budget, all of it together never more, and the window frees it again', () => {
    const crowd = createCrowd();
    crowd.rank(pack(1));
    let optional = 0;
    for (let i = 0; i < 200; i++) optional += crowd.ask(1, 'speck', 1, 0.1);
    expect(optional).toBe(Math.floor(C.budget * C.optional));
    let all = optional;
    for (let i = 0; i < 200; i++) all += crowd.ask(1, 'mark', 1, 0.1);
    expect(all).toBe(C.budget);
    expect(crowd.spent(0.1)).toBe(C.budget);
    expect(crowd.ask(1, 'mark', 5, 0.1 + C.window / 2)).toBe(0); // (half a window on, all is still spent)
    expect(crowd.spent(0.1 + C.window + 0.01)).toBe(0);
    expect(crowd.ask(1, 'mark', 5, 0.1 + C.window + 0.01)).toBe(5);
  });

  it('a pack of twelve spends what a pack of four would, over any half second', () => {
    const spend = (n: number): number => {
      const crowd = createCrowd();
      crowd.rank(pack(...Array.from({ length: n }, (_, i) => 2 + i)));
      let total = 0;
      for (let frame = 0; frame < 30; frame++) {
        for (let id = 1; id <= n; id++) for (const want of ['mark', 'speck', 'trail', 'mote'] as const) total += crowd.ask(id, want, 3, frame / 60);
      }
      return total;
    };
    expect(spend(12)).toBeLessThanOrEqual(C.budget);
    expect(spend(4)).toBeLessThanOrEqual(C.budget);
    expect(spend(12)).toBeLessThanOrEqual(spend(4) + C.full * 3); // (no more than the nearest three's share more)
  });

  it('a clock that goes back (a new game) forgets what was spent', () => {
    const crowd = createCrowd();
    crowd.rank(pack(1));
    expect(crowd.ask(1, 'mark', C.budget, 100)).toBe(C.budget);
    expect(crowd.ask(1, 'mark', 1, 100)).toBe(0);
    expect(crowd.ask(1, 'mark', 1, 0)).toBe(1);
  });
});
