/** A horror grows to meet an investigator past its standing at most `BOSS_OVERMATCH.most` times, by the weapon in hand; later journeys keep their own scaling (2026-11-24, docs/RULES.md). */
import { describe, expect, it } from 'vitest';
import { BOSS_STANDING } from '../src/data/bossStanding';
import { JOURNEY_REFERENCE } from '../src/data/ngPlusTuning';
import { BOSS_OVERMATCH, REINFORCE } from '../src/data/tuning';
import { WEAPON_IDS } from '../src/data/weapons';
import { equip } from '../src/systems/arms';
import { bossDamageScale, journeyBossDamage, overmatch, overmatchHealth } from '../src/systems/bossScaling';
import { levelsWorth } from '../src/systems/levelWorth';
import { applyLevels } from '../src/systems/levels';
import { bossRung } from '../src/systems/ngPlus';
import { bossGame, engage } from './bossHelpers';

const TOP = { vigour: 30, endurance: 30, might: 30 };

describe('a horror grows to meet the investigator, within a cap', () => {
  it('never grows its blows or its health past the cap, and the first horror met last is at it', () => {
    for (const id of Object.keys(BOSS_STANDING)) {
      expect(overmatch(TOP, id).damage, id).toBeLessThanOrEqual(BOSS_OVERMATCH.most);
      expect(overmatchHealth(TOP, REINFORCE.max, id), id).toBeLessThanOrEqual(BOSS_OVERMATCH.most);
    }
    expect(overmatch(TOP, 'dr_munoz').damage).toBe(BOSS_OVERMATCH.most);
    expect(overmatchHealth(TOP, REINFORCE.max, 'dr_munoz')).toBe(BOSS_OVERMATCH.most);
  });

  it('grows by the weapon in hand, not the best one owned, and meets a weapon taken up in the fight', () => {
    const b = bossGame('dr_munoz');
    const { g, boss } = b;
    const [vigour, might, edge = 0] = BOSS_STANDING.dr_munoz!;
    Object.assign(g.player.levels, { vigour, endurance: 0, might });
    applyLevels(g);
    const other = WEAPON_IDS.find((w) => w !== 'cane')!;
    g.player.arms.push(other);
    g.player.reinforced.cane = edge;
    g.player.reinforced[other] = REINFORCE.max;
    const authored = g.ecs.c.health.get(boss)!.max;
    engage(b);
    expect(b.fight.engaged).toBe(true);
    const h = g.ecs.c.health.get(boss)!;
    expect(h.max).toBe(authored); // the keen weapon is owned, not in hand
    h.hp = h.max * 0.4;
    expect(equip(g, other)).toBe(true);
    expect(h.max).toBe(Math.round(authored * overmatchHealth(g.player.levels, REINFORCE.max, 'dr_munoz')));
    expect(h.max).toBeGreaterThan(authored);
    expect(h.hp / h.max).toBeCloseTo(0.4);
    expect(equip(g, 'cane')).toBe(true);
    expect(h.max).toBe(authored);
    expect(h.hp / h.max).toBeCloseTo(0.4);
  });

  it('leaves later journeys the growth of their fixed reference, uncapped', () => {
    const grown = journeyBossDamage('dr_munoz', 1) / bossRung('dr_munoz', 1).damage;
    expect(grown).toBeGreaterThan(bossDamageScale(levelsWorth(JOURNEY_REFERENCE), BOSS_OVERMATCH.most));
  });
});
