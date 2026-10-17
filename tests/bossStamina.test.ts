import { describe, expect, it } from 'vitest';
import { emptyInput, type InputFrame } from '../src/core/input';
import { PLAYER_MOVES } from '../src/data/moves';
import { PLAYER, SIM, STAMINA } from '../src/data/tuning';
import { startMove } from '../src/systems/actions';
import type { Game, GameEvents } from '../src/systems/components';
import { createGame, stepGame } from '../src/systems/game';
import { place, press, steps } from './helpers';

const guard: InputFrame = { ...emptyInput(), held: press('block').held };

/** Actual roster stats and compiled moves; only the choice of attack is hand-driven. */
function otherGods() {
  const g = createGame({ creature: 'other_gods' });
  const player = g.player.id;
  const [boss] = [...g.ecs.c.fight].find(([, fight]) => fight.id === 'other_gods')!;
  g.ecs.c.brain.delete(boss);
  place(g, boss, 0, 5, 0);
  place(g, player, 0, 10, Math.PI);
  g.camera.yaw = Math.PI;
  const stamina = g.ecs.c.stamina.get(player)!;
  const hits: (GameEvents['Hit'] & { stamina: number })[] = [];
  g.events.on('Hit', (hit) => {
    if (hit.attacker === boss && hit.target === player) hits.push({ ...hit, stamina: stamina.value });
  });
  return { g, player, boss, stamina, hits };
}

function until(g: Game, done: () => boolean, input: InputFrame = guard, max = 300): void {
  for (let n = 0; n < max && !done(); n++) stepGame(g, input);
  expect(done()).toBe(true);
}

describe('stamina against the Other Gods', () => {
  it('blocks a wave for at most 40 base stamina, leaving a full roll and counterattack', () => {
    const { g, player, boss, stamina, hits } = otherGods();
    expect(g.player.levels.endurance).toBe(0);
    expect(stamina.max).toBe(100);
    startMove(g.ecs.c.actor.get(boss)!, 'quake');
    until(g, () => hits.length > 0);

    expect(hits[0]).toMatchObject({ outcome: 'blocked', damage: 0, stamina: 60.5 });
    expect(100 - hits[0].stamina).toBeLessThanOrEqual(40);
    expect(hits[0].stamina).toBeGreaterThanOrEqual(60);
    expect(g.ecs.c.health.get(player)!.hp).toBe(PLAYER.hp);

    steps(g, 4, guard); // the blocked impact's hitstop ends before the dodge input
    stepGame(g, { ...press('dodge'), moveX: 1 });
    const release = emptyInput();
    release.moveX = 1;
    release.released.dodge = true;
    stepGame(g, release);
    const actor = g.ecs.c.actor.get(player)!;
    expect(actor.move).toBe('roll');
    expect(stamina.value).toBeCloseTo(60.5 - PLAYER_MOVES.roll.stamina, 6);
    until(g, () => actor.frame >= PLAYER_MOVES.roll.cancel, emptyInput());
    stepGame(g, press('light'));
    expect(actor.move).toBe('light1');
    expect(stamina.value).toBeGreaterThan(0);

    until(g, () => g.ecs.c.wave.size === 0, emptyInput());
    expect(hits).toHaveLength(1); // the same expanding wave cannot bill the guard again
    expect(g.ecs.c.health.get(player)!.hp).toBe(PLAYER.hp);
  });

  it('breaks a low-stamina guard and only absorbs the funded share of the wave', () => {
    const { g, player, boss, stamina, hits } = otherGods();
    stamina.value = 20;
    stamina.delay = STAMINA.regenDelay;
    startMove(g.ecs.c.actor.get(boss)!, 'quake');
    until(g, () => hits.length > 0);

    const wave = g.ecs.c.actor.get(boss)!.moves.quake.wave!;
    const overflow = wave.damage * (1 - 20 / 39.5); // the same 39.5 cost as a fully blocked wave
    expect(hits[0]).toMatchObject({ outcome: 'guardBreak', stamina: 0 });
    expect(hits[0].damage).toBeCloseTo(overflow, 6);
    expect(g.ecs.c.actor.get(player)!.move).toBe('guardBreak');
    expect(g.ecs.c.health.get(player)!.hp).toBeCloseTo(PLAYER.hp - overflow, 6);
  });

  it('keeps a heavy slam costly and breaks a guard that takes repeated slams', () => {
    const { g, player, boss, stamina, hits } = otherGods();
    const actor = g.ecs.c.actor.get(boss)!;
    for (let n = 0; n < 4; n++) {
      startMove(actor, 'slam');
      until(g, () => hits.length > n);
      if (hits[n].outcome === 'guardBreak') break;
      until(g, () => actor.move === null);
    }

    const firstCost = 100 - hits[0].stamina;
    expect(hits[0]).toMatchObject({ outcome: 'blocked', damage: 0 });
    expect(firstCost).toBeGreaterThan(50);
    expect(firstCost).toBeLessThanOrEqual(65);
    expect(hits.length).toBeGreaterThan(1);
    expect(hits.at(-1)).toMatchObject({ outcome: 'guardBreak', stamina: 0 });
    expect(hits.at(-1)!.damage).toBeGreaterThan(0);
    expect(stamina.value).toBe(0);
    expect(g.ecs.c.health.get(player)!.hp).toBeCloseTo(PLAYER.hp - hits.at(-1)!.damage, 6);
  });

  it('still exhausts stamina and refuses a roll when full-duration rolls run straight on', () => {
    const { g, player, stamina } = otherGods();
    const actor = g.ecs.c.actor.get(player)!;
    const down = press('dodge');
    const release = emptyInput();
    release.moveX = 1;
    release.released.dodge = true;
    stepGame(g, down);
    stepGame(g, release);
    expect(actor.move).toBe('roll');

    let rolls = 1;
    for (; rolls < 10; rolls++) {
      steps(g, PLAYER_MOVES.roll.frames - 2);
      stepGame(g, down); // frame 47: hold the next tap, without cutting this roll short
      expect(actor.frame).toBe(PLAYER_MOVES.roll.frames - 1);
      stepGame(g, release); // frame 48: the whole roll ends before the next one is requested
      if (actor.move === null) break;
      expect(actor.move).toBe('roll');
      expect(actor.frame).toBe(0);
    }

    expect(rolls).toBe(6);
    expect(actor.move).toBeNull();
    expect(stamina.value).toBeLessThanOrEqual(STAMINA.regen / SIM.hz); // recovery can begin after the refused action
  });
});
