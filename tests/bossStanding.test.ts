/**
 * The standing each horror is met at (data/bossStanding.ts; round 68) is the balance model's: a horror that is not there is met by no one,
 * and a table that has drifted from the model (the world's foes or a horror's Echoes changed) is told to be written again.
 */
import { describe, expect, it } from 'vitest';
import { BOSS_STANDING } from '../src/data/bossStanding';
import { ENTITIES } from '../src/data/registry';
import { standings } from './balanceModel';

const SLACK = 3; // levels a stat may have drifted before the file is stale

describe('the horrors\' standing (round 68)', () => {
  it('has every scripted horror, and none that is not', () => {
    const bosses = ENTITIES.filter((e) => e.bossScript).map((e) => e.id).sort();
    expect(Object.keys(BOSS_STANDING).sort()).toEqual(bosses);
  });

  it('is what the balance model says, give or take a few levels: write it again with BALANCE_WRITE=1 npm run audit', () => {
    for (const s of standings()) {
      const [vigour, might] = BOSS_STANDING[s.id]!;
      expect(Math.abs(vigour - s.levels.vigour), `${s.id} Vigour`).toBeLessThanOrEqual(SLACK);
      expect(Math.abs(might - s.levels.might), `${s.id} Might`).toBeLessThanOrEqual(SLACK);
    }
  });

  it('rises through the game: a horror met later is met stronger', () => {
    const [first, last] = [BOSS_STANDING.dr_munoz!, BOSS_STANDING.yog_sothoth!];
    expect(last[0]).toBeGreaterThan(first[0] + 8);
    expect(last[1]).toBeGreaterThan(first[1] + 8);
  });
});
