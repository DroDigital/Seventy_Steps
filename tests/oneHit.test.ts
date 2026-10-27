/**
 * No horror's blow kills from full health (round 68, "make sure that bosses never one-hit kill"): `BOSS.blowMost` of the investigator's greatest
 * health is the most any one blow of a foe takes, whatever stacks on it (a mind Unmoored, a relic that costs, the scaling of levels
 * and a later journey). A horror's heaviest blow is 30% where it is met (tests/bossBlows.test.ts), so in the journey as it is made the cap
 * is only a backstop; it is the journeys after the first that can reach it (round 95: the ladder keeps the last of them under it, tests/ngPlus.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { BOSS } from '../src/data/bossTuning';
import { BOSS_LEVEL_SCALING, LEVELS, NEW_GAME_PLUS, SANITY } from '../src/data/tuning';
import { strike, type Blow } from '../src/systems/combat';
import { levelsOf } from '../src/systems/levels';
import { overmatch } from '../src/systems/bossScaling';
import { healthAt } from '../src/systems/levelWorth';
import { bossRung } from '../src/systems/ngPlus';
import { blowShare, heaviestOf } from './balanceBlows';
import { standings } from './balanceModel';
import { scriptedGame } from './helpers';

const blow = (damage: number): Blow => ({ damage, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false });
const WORST_RELIC = 1.08; // data/relics.ts: the Coin of the Black Pharaoh's `taken`, the heaviest a relic puts on a blow

describe('no blow of a foe kills from full health (round 68)', () => {
  it('takes at most BOSS.blowMost of the greatest health, however heavy it is made', () => {
    const { g, player, deepOne } = scriptedGame();
    const h = g.ecs.c.health.get(player)!;
    g.player.cycle = NEW_GAME_PLUS.most;
    g.mind.band = 'unmoored';
    let seen = 0;
    g.events.on('Hit', (e) => void (seen = e.damage));
    strike(g, deepOne, player, blow(h.max * 4));
    expect(seen).toBe(Math.floor(h.max * BOSS.blowMost));
    expect(h.hp).toBeGreaterThan(0);
    expect(h.hp).toBeCloseTo(h.max - Math.floor(h.max * BOSS.blowMost), 5);
  });

  it('leaves a blow that is lighter than the cap as it was, and holds nothing against the investigator\'s own', () => {
    const { g, player, deepOne } = scriptedGame();
    const h = g.ecs.c.health.get(player)!;
    let seen = 0;
    g.events.on('Hit', (e) => void (seen = e.damage));
    strike(g, deepOne, player, blow(h.max * 0.2));
    expect(seen).toBe(Math.round(h.max * 0.2));
    const foe = g.ecs.c.health.get(deepOne)!;
    strike(g, player, deepOne, blow(foe.max * 3));
    expect(foe.hp).toBe(0); // the cap is for what falls on them, not what they deal
  });

  it('is only a backstop in the journey as it is made: the first journey, a mind Unmoored and a relic that costs, at the level each horror is met, the heaviest blow of every horror is under it', () => {
    const worst = Math.max(...SANITY.taken) * WORST_RELIC;
    for (const s of standings()) {
      const bought = levelsOf(s.levels);
      const scaled = heaviestOf(s.id) * (1 + BOSS_LEVEL_SCALING.damage * bought) * overmatch(s.levels, s.id).damage * worst;
      expect(scaled / s.hp, `${s.id}: ${scaled.toFixed(0)} of ${s.hp}`).toBeLessThanOrEqual(BOSS.blowMost);
    }
  });

  it('is not reached by the ladder either (round 95): on the last journey, with a clear mind, whether a person has all the levels or only what the first journey ended with, the heaviest blow of every horror is under it, so no blow is held level and the climb is felt', () => {
    const last = standings().at(-1)!; // the least a second journey begins with (tests/ngPlus.test.ts)
    const cap = { vigour: LEVELS.vigour.max, endurance: LEVELS.endurance.max, might: LEVELS.might.max };
    for (const levels of [last.levels, cap]) {
      for (const s of standings()) {
        const share = blowShare(s.id, levels) * bossRung(s.id, NEW_GAME_PLUS.most).damage;
        expect(share, `${s.id} with ${levels.vigour} Vigour: ${(share * healthAt(levels.vigour)).toFixed(0)} of ${healthAt(levels.vigour)}`).toBeLessThanOrEqual(BOSS.blowMost);
      }
    }
  });
});
