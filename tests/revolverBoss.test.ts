import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { PLAYER_MOVES } from '../src/data/moves';
import { BOSS, GUN } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import { strike, type Blow } from '../src/systems/combat';
import type { Entity } from '../src/core/ecs';
import type { Game } from '../src/systems/components';
import { createGame, stepGame } from '../src/systems/game';
import { setLock } from '../src/systems/lockOn';
import { bossGame } from './bossHelpers';
import { place } from './helpers';

const shot: Blow = { damage: 30, poise: 16, guard: 30, hitstop: 3, parryable: false, interrupts: true, ranged: true };

/** The revolver alone against `id` from 3 m: a full carry (the cylinder and the spare rounds), reloading, for forty seconds. The share of its bar it took. */
function emptied(id: string): number {
  const { g, boss } = bossGame(id, undefined, 3);
  [g.player.ammo, g.player.rounds] = [GUN.chamber, GUN.carry];
  const me = g.ecs.c.health.get(g.player.id)!;
  me.hp = me.max = 1e7;
  const h = g.ecs.c.health.get(boss)!;
  let [dealt, held] = [0, false];
  g.events.on('Hit', (e) => void (e.attacker === g.player.id && e.target === boss && (dealt += e.damage)));
  for (let f = 0; f < 60 * 40 && !g.ecs.c.dead.has(boss); f++) {
    if (f === 2) setLock(g, boss);
    const i = emptyInput();
    const want = f % 4 < 2;
    const b = g.player.ammo > 0 ? 'shoot' : 'reload';
    [i.held[b], i.pressed[b], held] = [want, want && !held, want];
    stepGame(g, i);
  }
  expect(g.player.ammo + g.player.rounds, `${id}: the carry was not spent`).toBe(0);
  return dealt / h.max;
}

describe('the revolver breaks a horror\'s wind-up and chips it; it does not fell it (round 60)', () => {
  it('a full carry of rounds, fired alone, takes no more than a third of a human-sized horror\'s bar (it felled them)', () => {
    for (const id of ['dr_munoz', 'the_outsider', 'the_hound']) expect(emptied(id), id).toBeLessThan(0.35);
  }, 60_000);

  it('a shot lands on a horror at BOSS.shot of its weight, whole on a common foe', () => {
    const fire = (g: Game, at: Entity): number[] => {
      g.ecs.c.brain.delete(at); // it stands still to be shot
      setLock(g, at);
      const seen: number[] = [];
      g.events.on('Hit', (e) => void (e.attacker === g.player.id && e.target === at && seen.push(e.damage)));
      const i = emptyInput();
      [i.held.shoot, i.pressed.shoot] = [true, true];
      stepGame(g, i);
      for (let f = 0; f < PLAYER_MOVES.shoot.shot.frame + 2; f++) stepGame(g, emptyInput());
      return seen;
    };
    const { g, boss } = bossGame('dr_munoz', undefined, 3);
    expect(fire(g, boss)).toEqual([Math.round(PLAYER_MOVES.shoot.shot.damage * BOSS.shot)]);
    const a = createGame(); // the arena's Deep One, a common foe, as near
    const foe = [...a.ecs.c.brain.keys()][0];
    const p = a.ecs.c.transform.get(foe)!.pos;
    place(a, a.player.id, p.x, p.z + 2.5, Math.PI);
    expect(fire(a, foe)).toEqual([PLAYER_MOVES.shoot.shot.damage]);
  });

  it('no shot ripostes, and a wind-up a shot has broken cannot be broken again within BOSS.rearm', () => {
    const { g, boss } = bossGame('dr_munoz');
    const a = g.ecs.c.actor.get(boss)!;
    startMove(a, 'parried');
    expect(strike(g, g.player.id, boss, shot)).not.toBe('riposte');
    const attack = Object.keys(a.moves).find((m) => a.moves[m].interrupt)!;
    const windUp = (): void => {
      startMove(a, attack);
      a.frame = a.moves[attack].interrupt![0];
    };
    windUp();
    expect(strike(g, g.player.id, boss, shot)).toBe('interrupted');
    windUp();
    expect(strike(g, g.player.id, boss, shot)).not.toBe('interrupted'); // at once again: it holds its blow
    g.frame += BOSS.rearm;
    windUp();
    expect(strike(g, g.player.id, boss, shot)).toBe('interrupted');
  });
});
