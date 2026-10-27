/**
 * The ladder of the later journeys (round 95, "progressively more difficult without being impossible at any NG+", and one difficulty in place
 * of three): the rungs, who stands on which, and that nothing of the three difficulties is left to load. What a rung costs the balance bot is
 * tests/ngPlus.test.ts's (the slow set).
 */
import { describe, expect, it } from 'vitest';
import { BOSS_NG_PLUS } from '../src/data/bossNgPlus';
import { BOSS_STANDING } from '../src/data/bossStanding';
import { ENTITIES } from '../src/data/registry';
import { BOSS, NEW_GAME_PLUS } from '../src/data/tuning';
import { strike, type Blow } from '../src/systems/combat';
import { parseCarry, foeDamage } from '../src/systems/cycles';
import { createWorldGame } from '../src/systems/game';
import { bossRung, foeRung, ngStep } from '../src/systems/ngPlus';
import { parseSave, snapshot } from '../src/systems/save';
import { summon } from '../src/systems/specials';
import { EXEMPT } from './balanceBands';
import { bossGame } from './bossHelpers';
import { scriptedGame } from './helpers';

const blow = (damage: number): Blow => ({ damage, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false });
const JOURNEYS = Array.from({ length: NEW_GAME_PLUS.most + 1 }, (_, k) => k);
const FITTED = Object.keys(BOSS_STANDING).filter((id) => !EXEMPT.includes(id)); // what the balance bot can measure (tests/ngPlus.test.ts)
/** The horrors that take `NEW_GAME_PLUS.boss`: the two the bot cannot measure, and the Elder Shoggoth and the Polyp Swarm, the boss variants of two lesser creatures that stand in dungeon halls and are not in the table (docs/NGPLUS.md). */
const FALLBACK = [...EXEMPT, 'shoggoth', 'flying_polyp'];
const SCRIPTED = ENTITIES.filter((e) => e.bossScript || e.bossVariant?.bossScript).map((e) => e.id); // every horror that fights, as a base entry or as a boss variant

describe('the ladder (round 95)', () => {
  it('is the first journey as authored, climbing in equal steps to the last counted, and no further', () => {
    expect(ngStep(0)).toBe(0);
    expect(ngStep(NEW_GAME_PLUS.most)).toBe(1);
    expect(ngStep(NEW_GAME_PLUS.most + 5)).toBe(1);
    expect(ngStep(-1)).toBe(0);
    expect(foeRung(0)).toEqual({ health: 1, damage: 1 });
    expect(bossRung('dr_munoz', 0)).toEqual({ health: 1, damage: 1 });
    const gaps = JOURNEYS.slice(1).map((k) => foeRung(k).health - foeRung(k - 1).health);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0], 12);
    expect(foeRung(NEW_GAME_PLUS.most)).toEqual({ health: 1 + NEW_GAME_PLUS.foes.health, damage: 1 + NEW_GAME_PLUS.foes.damage });
  });

  it('gives an ordinary foe a gentle rung, a horror its own, and a horror the fit does not name the fallback', () => {
    const top = NEW_GAME_PLUS.most;
    expect(NEW_GAME_PLUS.foes.health).toBeLessThanOrEqual(1);
    expect(NEW_GAME_PLUS.foes.damage).toBeLessThanOrEqual(1);
    for (const id of FALLBACK) expect(bossRung(id, top)).toEqual({ health: 1 + NEW_GAME_PLUS.boss.health, damage: 1 + NEW_GAME_PLUS.boss.damage });
    expect(bossRung(undefined, top).health).toBe(1 + NEW_GAME_PLUS.boss.health);
    const [health, damage] = BOSS_NG_PLUS[FITTED[0]];
    expect(bossRung(FITTED[0], top)).toEqual({ health: 1 + health, damage: 1 + damage });
  });

  it('names a rung for every horror the bot measures, and none that is not there; any other horror that fights is one named as taking the fallback', () => {
    expect(FITTED.filter((id) => !(id in BOSS_NG_PLUS))).toEqual([]);
    expect(Object.keys(BOSS_NG_PLUS).filter((id) => !FITTED.includes(id))).toEqual([]);
    expect(SCRIPTED.filter((id) => !(id in BOSS_NG_PLUS) && !FALLBACK.includes(id))).toEqual([]); // (a new horror is fitted, or is named in FALLBACK on purpose)
    expect(FALLBACK.filter((id) => !SCRIPTED.includes(id) || id in BOSS_NG_PLUS)).toEqual([]);
  });

  it('never makes a horror easier as the journeys go on, and holds what it adds within what a blow and a fight can bear', () => {
    for (const id of FITTED) {
      const [health, damage] = BOSS_NG_PLUS[id];
      expect(health, id).toBeGreaterThanOrEqual(0);
      expect(health, id).toBeLessThanOrEqual(1);
      expect(damage, id).toBeGreaterThanOrEqual(0);
      expect(damage, id).toBeLessThanOrEqual(0.7); // (the fit's most, `FIT.damage`; the heaviest blow of each, grown by its own, stays short of BOSS.blowMost: tests/oneHit.test.ts)
      let last = { health: 1, damage: 1 };
      for (const k of JOURNEYS) {
        const r = bossRung(id, k);
        expect(r.health, `${id} journey ${k + 1}`).toBeGreaterThanOrEqual(last.health);
        expect(r.damage, `${id} journey ${k + 1}`).toBeGreaterThanOrEqual(last.damage);
        last = r;
      }
    }
  });

  it('weighs a foe\'s blow by its rung, a servant\'s by the ordinary rung and the servant\'s weight, and the investigator\'s not at all', () => {
    const { g, player, deepOne } = scriptedGame();
    g.player.cycle = 5;
    let seen = 0;
    g.events.on('Hit', (e) => void (seen = e.damage));
    strike(g, deepOne, player, blow(20));
    expect(seen).toBe(Math.round(20 * foeRung(5).damage));
    expect(foeDamage(g, player)).toBe(1);
    const { g: arena, boss } = bossGame('shub_niggurath');
    arena.player.cycle = 4;
    const add = summon(arena, boss, 'thousand_young')!;
    expect(foeDamage(arena, add)).toBeCloseTo(BOSS.servantDamage * foeRung(4).damage, 12);
  });

  it('is the one difficulty: a save or a carry from the builds that had three loads, plays as it is, and is kept without the choice', () => {
    const g = createWorldGame();
    const kept = JSON.parse(JSON.stringify(snapshot(g))) as Record<string, unknown>;
    expect(kept).not.toHaveProperty('difficulty');
    expect(g.player).not.toHaveProperty('difficulty');
    for (const old of ['light', 'nightmare', 'impossible']) {
      const loaded = createWorldGame({ save: parseSave(JSON.stringify({ ...kept, difficulty: old }))! });
      expect(loaded.player).not.toHaveProperty('difficulty');
      expect(snapshot(loaded)).not.toHaveProperty('difficulty');
    }
    const carry = parseCarry({ cycle: 2, difficulty: 'nightmare' })!;
    expect(carry).not.toHaveProperty('difficulty');
    expect(carry.cycle).toBe(2);
  });
});
