/**
 * No horror's blow kills from full health (round 68, "make sure that bosses never one-hit kill"): `BOSS.blowMost` of the investigator's greatest
 * health is the most any one blow of a foe takes, whatever stacks on it (Nightmare, a mind Unmoored, a relic that costs, the scaling of levels
 * and a second journey). A horror's heaviest blow is 30% where it is met (tests/bossBlows.test.ts), so in the journey as it is made the cap
 * is only a backstop; it is Nightmare and the journeys after the first that reach it.
 */
import { describe, expect, it } from 'vitest';
import { BOSS } from '../src/data/bossTuning';
import { ENTITIES } from '../src/data/registry';
import { BOSS_LEVEL_SCALING, DIFFICULTIES, NEW_GAME_PLUS, SANITY } from '../src/data/tuning';
import { strike, type Blow } from '../src/systems/combat';
import { toCombatant } from '../src/systems/creatures';
import { levelsOf } from '../src/systems/levels';
import { overmatch } from '../src/systems/bossScaling';
import { standings } from './balanceModel';
import { scriptedGame } from './helpers';

const blow = (damage: number): Blow => ({ damage, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false });
const WORST_RELIC = 1.08; // data/relics.ts: the Coin of the Black Pharaoh's `taken`, the heaviest a relic puts on a blow

describe('no blow of a foe kills from full health (round 68)', () => {
  it('takes at most BOSS.blowMost of the greatest health, however heavy it is made', () => {
    const { g, player, deepOne } = scriptedGame();
    const h = g.ecs.c.health.get(player)!;
    g.player.difficulty = 'nightmare';
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

  it('is only a backstop in the journey as it is made: Deep Slumber, the first journey, a mind Unmoored and a relic that costs, at the level each horror is met, the heaviest blow of every horror is under it', () => {
    const worst = Math.max(...SANITY.taken) * WORST_RELIC;
    for (const s of standings()) {
      const e = ENTITIES.find((x) => x.id === s.id)!;
      const heaviest = Math.max(...Object.values(toCombatant(e).moves).map((m) => m.hit?.damage ?? m.volley?.damage ?? m.marks?.damage ?? m.wave?.damage ?? m.sweep?.damage ?? m.barrage?.damage ?? m.shot?.damage ?? m.pool?.damage ?? 0));
      const bought = levelsOf(s.levels);
      const scaled = heaviest * (1 + BOSS_LEVEL_SCALING.damage * bought) * overmatch(s.levels, s.id).damage * DIFFICULTIES.deep.foe * worst;
      expect(scaled / s.hp, `${s.id}: ${scaled.toFixed(0)} of ${s.hp}`).toBeLessThanOrEqual(BOSS.blowMost);
    }
  });
});
