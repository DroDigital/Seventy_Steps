/**
 * Insight to spare (round 61: "determine an optimal resolution for excess Insight points once all Mind attributes are maximized": a whole
 * run brings some 170 of it, the Mind's two upgrades cost 14 and no hidden passage wants more than 3): what nothing asks for can be
 * offered at an Elder Sign for Echoes, and what is kept is never taken.
 */
import { describe, expect, it } from 'vitest';
import { GUIDE } from '../src/data/fieldGuide';
import { LORE, UPGRADES } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { buyUpgrade, changeInsight, insightKept, loreWorth, offerInsight, surplusInsight } from '../src/systems/insight';
import { heldOpen, PASSAGE_NEED, PASSAGES } from '../src/systems/veil';
import { watch } from '../src/ui/hintWatch';
import { record } from './worldHelpers';

const grown = () => {
  const g = createWorldGame();
  for (const id of Object.keys(UPGRADES) as (keyof typeof UPGRADES)[]) g.mind.upgrades[id] = UPGRADES[id].max;
  return g;
};

describe('what insight is for once the Mind is grown (round 61)', () => {
  it('keeps what every hidden passage wants, and the cost of each upgrade not yet bought', () => {
    const g = createWorldGame();
    const all = (Object.keys(UPGRADES) as (keyof typeof UPGRADES)[]).reduce((n, id) => n + UPGRADES[id].max * UPGRADES[id].cost, 0);
    expect(PASSAGE_NEED).toBe(Math.max(...PASSAGES.map((p) => p.need)));
    expect(insightKept(g)).toBe(PASSAGE_NEED + all);
    g.mind.upgrades.resolve = 1;
    expect(insightKept(g)).toBe(PASSAGE_NEED + all - UPGRADES.resolve.cost);
    expect(insightKept(grown())).toBe(PASSAGE_NEED); // all grown: only the passages' want is kept
  });

  it('has a surplus only beyond what is kept', () => {
    const g = grown();
    changeInsight(g, PASSAGE_NEED, 'debug', 'test');
    expect(surplusInsight(g)).toBe(0);
    changeInsight(g, 12, 'debug', 'test');
    expect(surplusInsight(g)).toBe(12);
    const fresh = createWorldGame();
    changeInsight(fresh, insightKept(fresh), 'debug', 'test');
    expect(surplusInsight(fresh)).toBe(0); // before the upgrades are bought, what they would cost is kept
  });

  it('offers it for Echoes, all of it or some, the Echoes given and the insight gone, no passage shut', () => {
    const g = grown();
    changeInsight(g, PASSAGE_NEED + 30, 'debug', 'test');
    const [earned, moved] = [record(g, 'Echoes'), record(g, 'InsightChanged')];
    const before = g.player.echoes;
    expect(offerInsight(g, 5)).toBe(loreWorth(5));
    expect(g.player.echoes).toBe(before + 5 * LORE.echoes);
    expect(g.mind.insight).toBe(PASSAGE_NEED + 25);
    expect(earned.at(-1)).toMatchObject({ change: 'earned', amount: 5 * LORE.echoes });
    expect(moved.at(-1)).toMatchObject({ change: -5, cause: 'sale' });
    expect(offerInsight(g)).toBe(loreWorth(25)); // all that is left
    expect(g.mind.insight).toBe(PASSAGE_NEED);
    expect(heldOpen(g.mind.insight)).toHaveLength(PASSAGES.length); // every passage still held open
    expect(offerInsight(g)).toBe(0); // and no more to offer
    expect(offerInsight(g, -3)).toBe(0);
  });

  it('never takes the insight an upgrade not yet bought would have cost: it is bought first, and what is left is offered', () => {
    const g = createWorldGame();
    changeInsight(g, 40, 'debug', 'test');
    const owed = insightKept(g) - PASSAGE_NEED;
    expect(surplusInsight(g)).toBe(40 - PASSAGE_NEED - owed);
    expect(offerInsight(g)).toBeGreaterThan(0);
    expect(g.mind.insight).toBe(PASSAGE_NEED + owed); // the upgrades can still all be bought
    for (let i = 0; i < 20; i++) (['resolve', 'draught'] as const).forEach((id) => buyUpgrade(g, id));
    expect(g.mind.upgrades).toEqual({ resolve: UPGRADES.resolve.max, draught: UPGRADES.draught.max });
    expect(g.mind.insight).toBe(PASSAGE_NEED);
  });

  it('is worth setting against the economy: a run\'s surplus is a few levels, not a way round them', () => {
    expect(LORE.echoes).toBeGreaterThanOrEqual(100);
    expect(loreWorth(155)).toBeLessThan(60000); // some 155 to spare over a whole run
    expect(loreWorth(155)).toBeGreaterThan(5000);
  });

  it('is told once it is a few points: the Field Guide has the hint and the watch raises it', () => {
    const g = grown();
    expect(GUIDE.lore.group).toBe('The mind');
    changeInsight(g, PASSAGE_NEED + LORE.hintAt - 1, 'debug', 'test');
    expect(watch(g)).not.toContain('lore');
    changeInsight(g, 1, 'debug', 'test');
    expect(watch(g)).toContain('lore');
  });
});
