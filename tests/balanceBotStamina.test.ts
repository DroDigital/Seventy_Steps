import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES } from '../src/data/moves';
import { startMove } from '../src/systems/actions';
import { bossGame } from './bossHelpers';
import { driveBot } from './botHelpers';

describe('balance bot stamina', () => {
  it('waits to attack until it can keep enough stamina for a roll', () => {
    const { g, boss } = bossGame('the_outsider', undefined, 2);
    const stamina = g.ecs.c.stamina.get(g.player.id)!;
    stamina.value = PLAYER_MOVES.roll.stamina + PLAYER_MOVES.light1.stamina! - 1;
    driveBot(g, boss, 1, false, { levels: {}, skill: 1 });
    expect(g.ecs.c.actor.get(g.player.id)!.move).not.toBe('light1');
    expect(stamina.value).toBeGreaterThanOrEqual(PLAYER_MOVES.roll.stamina);
  });

  it('prioritizes an incoming blow over a simultaneous attack', () => {
    const { g, boss } = bossGame('other_gods', undefined, 2);
    const enemy = g.ecs.c.actor.get(boss)!;
    startMove(enemy, 'quake');
    enemy.frame = enemy.moves.quake.wave!.frame - 8;
    driveBot(g, boss, 2, false, { levels: {}, skill: 1 });
    expect(g.ecs.c.actor.get(g.player.id)!.move).toBe('roll');
  });

  it('keeps a queued dodge while waiting for an action to recover', () => {
    const { g, boss } = bossGame('other_gods', undefined, 2);
    const enemy = g.ecs.c.actor.get(boss)!;
    startMove(enemy, 'quake');
    enemy.frame = enemy.moves.quake.wave!.frame - 18;
    g.ecs.c.actor.get(g.player.id)!.hitstop = 30;
    driveBot(g, boss, 23, false, { levels: {}, skill: 1 });
    expect(g.player.buffer.action).toBe('dodge');
  });

  it('retries a drink after a simultaneous dodge takes priority', () => {
    const { g, boss } = bossGame('other_gods', undefined, 2);
    const enemy = g.ecs.c.actor.get(boss)!;
    startMove(enemy, 'quake');
    enemy.frame = enemy.moves.quake.wave!.frame - 8;
    g.mind.sanity = 30;
    driveBot(g, boss, 3, false, { levels: {}, skill: 1, mind: true });
    expect(g.player.buffer.action).toBe('item');
  });
});
