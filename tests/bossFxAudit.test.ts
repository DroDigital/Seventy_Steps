/**
 * Every creature of the roster, every move of it, with the render side of its attacks running beside the
 * simulation against stand-ins for what draws (round 51): nothing may throw or be left not a number, and
 * the budgets of the particle and decal batches hold. The everyday set (bossFx.test.ts) has one horror of
 * each element; this is all of them.
 */
import { describe, expect, it } from 'vitest';
import { ENTITIES } from '../src/data/registry';
import { fxAudit } from './bossFxHelpers';

const IDS = Object.values(ENTITIES).filter((e) => e.bossScript || e.sprite || e.assembly).map((e) => e.id);

describe('every creature\'s attacks are drawn (round 51)', () => {
  it('has creatures to draw', () => expect(IDS.length).toBeGreaterThanOrEqual(90));

  it.each(IDS)('%s', (id) => {
    const r = fxAudit(id);
    expect(r.bad).toEqual([]);
    expect(r.peakLive).toBeLessThan(2000);
    expect(r.peakDecals).toBeLessThan(100);
  }, 60_000);
});
