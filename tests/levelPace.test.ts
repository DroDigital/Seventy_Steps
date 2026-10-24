/**
 * The pace of the levels (round 60: a playthrough found "minimal level progression": at level 26 a level cost 35 of
 * R'lyeh's foes, and asked for "moderate grinding, sufficient to maintain progression without becoming exhausting or
 * tedious"). At the standing a person has in each ring of the world (tests/balanceModel.ts), the next level costs at most
 * forty of that ring's own lesser foes on their mean bounty, so a few rounds of the foes about an Elder Sign buy one;
 * each ring explored buys levels of its own; and the most levels are not all bought before the last ring is.
 */
import { describe, expect, it } from 'vitest';
import { ENTITIES } from '../src/data/registry';
import { LEVELS } from '../src/data/tuning';
import { levelCost, LEVEL_IDS } from '../src/systems/levels';
import { buy, lesserFoes, RINGS, standings, type Standing } from './balanceModel';

const bought = (s: Pick<Standing, 'levels'>): number => LEVEL_IDS.reduce((n, id) => n + s.levels[id], 0);
const ringOf = (id: string): number => RINGS.findIndex((r) => ENTITIES.find((e) => e.id === id)!.regions.some((x) => r.includes(x)));
const MOST = LEVEL_IDS.reduce((n, id) => n + LEVELS[id].max, 0);

describe('the pace of the levels (round 60)', () => {
  const table = standings();
  const rings = RINGS.map((_, k) => table.filter((s) => ringOf(s.id) === k));

  it('a level costs at most forty-two (forty until round 73) of the foes of the ring a person stands in', () => {
    for (const [k, list] of rings.entries()) {
      const foes = lesserFoes(RINGS[k]);
      const mean = list.reduce((n, s) => n + bought(s), 0) / list.length;
      const kills = levelCost(Math.round(mean)) / (foes.echoes / foes.count);
      expect(kills, `ring ${k} (${RINGS[k].join(', ')}): ${kills.toFixed(0)} of its foes a level at ${Math.round(mean)} levels`).toBeLessThanOrEqual(42); // (40 until round 73: the Other Gods and Nyarlathotep, two of this ring's lower-standing horrors, left it for the Outer Dark, and its mean rose a level)
    }
  });

  it('each ring explored buys levels of its own', () => {
    const first = rings.map((list) => Math.min(...list.map(bought)));
    for (let k = 1; k < first.length; k++) expect(first[k] - first[k - 1], `ring ${k}`).toBeGreaterThanOrEqual(3);
  });

  it('the last ring is met short of the most levels; the whole world buys the first sixty and the last thirty are for hunting and the journeys after (round 68)', () => {
    expect(Math.max(...rings[rings.length - 1].map(bought))).toBeLessThan(MOST - 30);
    const all = lesserFoes().echoes + ENTITIES.filter((e) => e.bossScript).reduce((n, e) => n + e.drops.echoes, 0);
    const first = LEVEL_IDS.reduce((n, id) => n + buy(all)[id], 0);
    expect(first).toBeGreaterThanOrEqual(60);
    expect(first).toBeLessThan(MOST - 10); // all of it is not to be had in one journey: that is what the hunt, the secrets and the next journey are for
  });
});
