import { describe, expect, it } from 'vitest';
import { AOE_MOTIFS } from '../src/render/aoeLook';
import { lookOf } from '../src/render/attackLook';
import { fxAudit } from './bossFxHelpers';

/** One horror of each element, with the moves each has between them: every attack kind is drawn at least once. */
const ONE_EACH = ['cthulhu', 'hastur', 'dunwich_horror', 'keziah_mason', 'nug', 'yig', 'haunter_of_the_dark', 'shub_niggurath', 'yog_sothoth', 'edward_hutchinson', 'flying_polyp', 'shoggoth'];

describe('every attack of a horror of each element is drawn (round 51)', () => {
  it('covers every element', () => {
    expect(new Set(ONE_EACH.map((id) => lookOf(id).motif)).size).toBe(AOE_MOTIFS.length - 1); // all but plain
  });

  it.each(ONE_EACH)('%s: every move, no throw, nothing not a number, within the batches\' budgets', (id) => {
    const r = fxAudit(id);
    expect(r.moves.length).toBeGreaterThanOrEqual(3);
    expect(r.bad).toEqual([]);
    expect(r.spawned).toBeGreaterThan(50);
    expect(r.peakLive).toBeLessThan(1500);
    expect(r.peakDecals).toBeLessThan(80);
  }, 60_000);
});
