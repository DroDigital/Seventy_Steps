/**
 * The punish windows (round 83, data/bossPunish.ts): a horror is held after each blow for a time its band gives, longer the earlier it is
 * met, and a time skip no longer takes the opening a recovery gives. Measured on the investigator's own moves, not on a number written here.
 */
import { describe, expect, it } from 'vitest';
import { ATTACKS, compileAttack } from '../src/data/attacks';
import { BOSS_BAND, PUNISH, bandOf, blowWeight, recoveryFor, type PunishBand } from '../src/data/bossPunish';
import { BOSS_STANDING } from '../src/data/bossStanding';
import { PLAYER_MOVES } from '../src/data/moves';
import { ENTITIES, paramsOf, variantOf } from '../src/data/registry';
import type { EntityDef } from '../src/data/schema';
import { BOSS, REALITY } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { attacksOf, reachOf, toCombatant } from '../src/systems/creatures';
import { phaseBrain } from '../src/systems/fightPhase';
import { REALITY_TRICKS } from '../src/systems/realityTricks';
import { hookFight } from './bossHelpers';
import { record } from './worldHelpers';

const BANDS: readonly PunishBand[] = ['first', 'middle', 'deep', 'last'];
const forms = ENTITIES.flatMap((e) => [e, variantOf(e, 'eldritch'), variantOf(e, 'boss')]).filter((d): d is EntityDef => !!d); // the Elder Shoggoth and the Polyp Swarm fight by a script only in a form
const bosses = forms.filter((e) => e.bossScript);

/** How the investigator's moves measure a window: a roll started when the blow lands is out of it 34 frames on, one read eight frames sooner 26, and a light blow strikes on its own frame. */
const strike = PLAYER_MOVES.light1.hit!.window[0];
const lateRoll = PLAYER_MOVES.roll.release;
const readRoll = lateRoll - 8;

describe('the punish windows (round 83)', () => {
  it('gives every horror that fights by a script a band, and no other creature one', () => {
    expect(Object.keys(BOSS_BAND).sort()).toEqual([...new Set(bosses.map((e) => e.id))].sort());
    for (const e of forms.filter((x) => !x.bossScript && !(x.id in BOSS_BAND))) expect(bandOf(e.id), e.id).toBeUndefined();
  });

  it('holds the bands in the balance model\'s order: the thirteen first, fourteen of the middle, ten deep, ten last', () => {
    const order = Object.keys(BOSS_STANDING); // written in the order the horrors are met
    const edges: [PunishBand, number][] = [['first', 13], ['middle', 27], ['deep', 37], ['last', order.length]];
    order.forEach((id, i) => expect(bandOf(id), `${id} (${i + 1} of ${order.length})`).toBe(edges.find(([, end]) => i < end)![0]));
    for (const id of ['shoggoth', 'flying_polyp']) expect(bandOf(id), id).toBe('middle'); // which stand outside that order
  });

  it('asks less of a horror the later it is met, and grows its blows only to make up for the pauses', () => {
    BANDS.forEach((band, i) => {
      const p = PUNISH[band];
      if (i) {
        const before = PUNISH[BANDS[i - 1]];
        expect(p.scale, band).toBeLessThanOrEqual(before.scale);
        expect(p.least, band).toBeLessThan(before.least);
        expect(p.heavy, band).toBeLessThanOrEqual(before.heavy);
        expect(p.evade, band).toBeGreaterThanOrEqual(before.evade);
      }
      expect(p.blow, band).toBeGreaterThanOrEqual(1);
      expect(p.blow, band).toBeLessThanOrEqual(1.15); // a share, not a second balance table
      expect(p.evade, band).toBeGreaterThan(0);
      expect(p.evade, band).toBeLessThanOrEqual(1);
    });
  });

  it('measures up on the investigator\'s moves: a blow that lasts six frames or less is punished by a light blow after a roll read late, in the first three bands, and after one read early, in the last', () => {
    for (const band of ['first', 'middle', 'deep'] as const) expect(PUNISH[band].least, band).toBeGreaterThanOrEqual(lateRoll + strike - 6);
    expect(PUNISH.last.least).toBeGreaterThanOrEqual(readRoll + strike - 2);
    expect(PUNISH.last.least).toBeGreaterThan(30); // a recovery under 30 cannot be punished inside itself by anyone
  });

  it('leaves every blow of a horror its horror\'s band recovery or more, and the heavier the blow, the more it costs', () => {
    for (const def of bosses) {
      const band = bandOf(def.id)!;
      const p = PUNISH[band];
      const moves = toCombatant(def).moves;
      for (const id of attacksOf(def)) {
        const a = ATTACKS[id];
        const recovery = moves[id].frames - a.windup - a.active;
        if (a.follow || (a.kind === 'special' && !a.sanity)) {
          expect(recovery, `${def.id} ${id}`).toBe(a.recovery); // a link that runs on, and a special that harms nothing, as the library has them
          continue;
        }
        expect(recovery, `${def.id} ${id}`).toBe(recoveryFor(a, band));
        expect(recovery, `${def.id} ${id}`).toBeGreaterThanOrEqual(Math.max(a.recovery, p.least + p.heavy * Math.max(0, a.power - 1) - 1));
      }
    }
  });

  it('is for the horrors alone: a lesser foe has the library\'s numbers, and the library is as it was', () => {
    for (const def of forms.filter((e) => !e.bossScript)) {
      const moves = toCombatant(def).moves;
      for (const id of attacksOf(def)) {
        const a = ATTACKS[id];
        expect(moves[id].frames, `${def.id} ${id}`).toBe(a.windup + a.active + a.recovery);
        expect(moves[id], `${def.id} ${id}`).toEqual(compileAttack(id, def.stats, reachOf(def)));
      }
    }
  });

  it('takes the weight of its lighter blows and its evasion from the band, a horror at a time, and leaves the heaviest blow as it was', () => {
    for (const def of bosses) {
      const p = PUNISH[bandOf(def.id)!];
      expect(phaseBrain(def, 0, reachOf(def)).params.evade, def.id).toBeCloseTo(paramsOf(def.behavior).evade * p.evade, 6);
      const [moves, ids] = [toCombatant(def).moves, attacksOf(def)];
      const top = Math.max(...ids.map((x) => ATTACKS[x].power));
      for (const id of ids.filter((x) => ATTACKS[x].kind === 'melee')) {
        const was = Math.round(ATTACKS[id].power * def.stats.damage);
        expect(moves[id].hit!.damage, `${def.id} ${id}`).toBe(Math.round(ATTACKS[id].power * def.stats.damage * blowWeight(bandOf(def.id)!, ATTACKS[id].power, top)));
        expect(moves[id].hit!.damage, `${def.id} ${id}`).toBeGreaterThanOrEqual(was);
        expect(moves[id].hit!.damage, `${def.id} ${id}`).toBeLessThanOrEqual(Math.round(top * def.stats.damage)); // no blow passes the heaviest as it was
        if (ATTACKS[id].power >= top) expect(moves[id].hit!.damage, `${def.id} ${id}`).toBe(was); // and the heaviest is as it was
      }
    }
  });
});

describe('time_skip (round 83)', () => {
  /** A calm fight whose boss is in `move` at `frame` (null: free, with this much pause left), and a skip due on the next step. */
  const due = (move: string | null, frame: number, cooldown = 0) => {
    const b = hookFight(['time_skip']);
    const a = b.g.ecs.c.actor.get(b.boss)!;
    if (move === null) a.move = null;
    else startMove(a, move);
    a.frame = frame;
    b.g.ecs.c.brain.get(b.boss)!.cooldown = cooldown;
    b.g.reality.skipIn = 1;
    return { ...b, a, skips: record(b.g, 'TimeSkipped'), skip: () => REALITY_TRICKS.time_skip(b.g, [[b.boss, b.fight]]) };
  };

  it('lands further from the blow than a person can react to', () => {
    expect(REALITY.skipLead).toBeGreaterThanOrEqual(20);
    expect(REALITY.skipLead).toBeLessThanOrEqual(BOSS.gap[0]);
  });

  it('does not take a recovery: a boss that has struck and is held waits for another time', () => {
    const t = due('sweep', 0);
    t.a.frame = t.a.moves.sweep.open!;
    const where = { ...t.g.ecs.c.transform.get(t.boss)!.pos };
    t.skip();
    expect(t.skips).toEqual([]);
    expect(t.g.reality.skipIn).toBe(REALITY.skipRetry);
    expect(t.g.ecs.c.transform.get(t.boss)!.pos).toEqual(where);
    expect(t.a.frame).toBe(t.a.moves.sweep.open);
  });

  it('does not take a stagger, or the long pause a boss keeps after a blow', () => {
    for (const reeling of ['stagger', 'guardBreak', 'parried']) {
      const t = due(reeling, 2);
      t.skip();
      expect(t.skips, reeling).toEqual([]);
    }
    const pause = due(null, 0, BOSS.gap[1]);
    pause.skip();
    expect(pause.skips).toEqual([]);
    expect(pause.g.reality.skipIn).toBe(REALITY.skipRetry);
  });

  it('skips a boss that was about to strike anyway, and leaves it the ordinary pause after the blow', () => {
    for (const t of [due(null, 0, REALITY.skipLead), due('sweep', 3)]) {
      t.skip();
      expect(t.skips).toEqual([{ entity: t.boss }]);
      expect(t.a.move).toBe('sweep');
      expect(t.g.ecs.c.brain.get(t.boss)!.cooldown).toBeGreaterThanOrEqual(BOSS.gap[0]);
      expect(t.g.reality.skipIn).toBeGreaterThanOrEqual(REALITY.skipEvery[0]);
    }
  });
});
