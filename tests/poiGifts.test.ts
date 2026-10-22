/**
 * The gifts for the land's secrets found (round 68, "greater incentives" to explore: systems/poiGifts.ts, `POI.gifts`), and the hoards
 * rescaled to what a level costs where each realm is met (data/pois*.ts).
 */
import { describe, expect, it } from 'vitest';
import { POIS, poiKey } from '../src/data/pois';
import { getEntity } from '../src/data/registry';
import { REINFORCE, POI } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { giftKey, giveGifts, nextGift, secretsFound } from '../src/systems/poiGifts';
import { levelCost, levelsOf } from '../src/systems/levels';
import { RINGS, standings } from './balanceModel';
import { record } from './worldHelpers';

const find = (g: ReturnType<typeof createWorldGame>, n: number): void => POIS.slice(0, n).forEach((p) => g.overworld!.told.add(poiKey(p.id)));

describe('the gifts for the secrets found', () => {
  it('rise with the count, the last at every secret there is, and the stones are what one weapon takes to its fifth level', () => {
    const at = POI.gifts.map((x) => x.at);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(at[at.length - 1]).toBe(POIS.length);
    expect(POI.gifts.reduce((n, x) => n + x.stones, 0)).toBe(REINFORCE.cost.reduce((n, x) => n + x, 0));
    for (const x of POI.gifts) expect(x.levels, `${x.at}`).toBeGreaterThan(0);
  });

  it('give each gift once, as the count reaches it: Echoes worth its levels at the next price, and its star-stones', () => {
    const g = createWorldGame();
    const notices = record(g, 'Notice');
    const first = POI.gifts[0];
    find(g, first.at - 1);
    giveGifts(g);
    expect(g.player.echoes).toBe(0);
    expect(g.player.stones).toBe(0);
    expect(nextGift(g)?.at).toBe(first.at);
    find(g, first.at);
    const price = levelCost(levelsOf(g.player.levels));
    giveGifts(g);
    expect(secretsFound(g)).toBe(first.at);
    expect(g.player.echoes).toBe(first.levels * price);
    expect(g.player.stones).toBe(first.stones);
    expect(g.overworld!.told.has(giftKey(first.at))).toBe(true);
    expect(notices).toHaveLength(1);
    expect(notices[0].text).toContain(String(first.at));
    giveGifts(g);
    expect(g.player.echoes).toBe(first.levels * price); // once
    expect(g.player.stones).toBe(first.stones);
    expect(nextGift(g)?.at).toBe(POI.gifts[1].at);
  });

  it('are all owed to a save that found them before the round', () => {
    const g = createWorldGame();
    find(g, POIS.length);
    giveGifts(g);
    expect(g.player.stones).toBe(POI.gifts.reduce((n, x) => n + x.stones, 0));
    expect(nextGift(g)).toBeUndefined();
  });
});

describe('the hoards (round 68)', () => {
  it('are worth a good part of a level where the realm is met, and no more than one: dens, rites and hoards more than the strange', () => {
    const st = standings();
    const levelsIn = (region: string): number => {
      const ring = RINGS.find((r) => r.includes(region))!;
      const mine = st.filter((s) => getEntity(s.id)!.regions.some((x) => ring.includes(x)));
      return mine.reduce((n, s) => n + levelsOf(s.levels), 0) / mine.length;
    };
    for (const p of POIS) {
      const price = levelCost(Math.round(levelsIn(p.region)));
      const strange = p.kind === 'anomaly' || p.kind === 'tale';
      expect(p.hoard!, `${p.id} (${p.kind}) is worth ${(p.hoard! / price).toFixed(2)} of a level`).toBeGreaterThanOrEqual(price * (strange ? 0.04 : 0.2));
      expect(p.hoard!, `${p.id} (${p.kind}) is worth ${(p.hoard! / price).toFixed(2)} of a level`).toBeLessThanOrEqual(price * 1.2);
    }
  });
});
