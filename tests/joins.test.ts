import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { startMove } from '../src/systems/actions';
import { stonesOf } from '../src/systems/arms';
import { meleeSystem, strike } from '../src/systems/combat';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame, stepGame } from '../src/systems/game';
import { snapshot } from '../src/systems/save';
import { worldLayout } from '../src/world/placements';
import { deathblow, goTo, record, run } from './worldHelpers';

function witchHouse(joined: boolean) {
  const g = createWorldGame();
  const at = worldLayout().spawns.find((s) => s.id === 'boss:keziah_mason')!.at;
  goTo(g, at.x, at.z);
  run(g, 1); // stream both bosses into their actual room
  const keziah = g.overworld!.alive.get('boss:keziah_mason')!;
  const jenkin = g.overworld!.alive.get('boss:brown_jenkin')!;
  if (joined) g.ecs.c.health.get(keziah)!.hp *= 0.45;
  run(g, 1); // Jenkin waits in the walls, or joins Keziah
  return { g, keziah, jenkin };
}

describe('a boss that joins another (playtest round 17)', () => {
  it('Brown Jenkin waits in the walls, unseen, until Keziah is half spent, then comes out and says so', () => {
    const g = createWorldGame();
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    const keziah = spawnCreature(g, 'keziah_mason', { x: p.x + 8, z: p.z, yaw: 0 })!;
    const jenkin = spawnCreature(g, 'brown_jenkin', { x: p.x + 3, z: p.z, yaw: 0 })!;
    const notices: string[] = [];
    g.events.on('Notice', (e) => void notices.push(e.text));
    for (let i = 0; i < 30; i++) stepGame(g, emptyInput());
    expect(g.ecs.c.brain.get(jenkin)!.state).toBe('hidden'); // three metres off, and still in the walls
    const h = g.ecs.c.health.get(keziah)!;
    h.hp = h.max * 0.45;
    for (let i = 0; i < 5; i++) stepGame(g, emptyInput());
    expect(g.ecs.c.brain.get(jenkin)!.state).toBe('engage');
    expect(notices).toContain('BROWN JENKIN JOINS THE FIGHT');
  });

  it.each([false, true])('Keziah falling eliminates Jenkin immediately, even before he joins: joined=%s', (joined) => {
    const { g, keziah, jenkin } = witchHouse(joined);
    const c = g.ecs.c;
    expect(c.brain.get(jenkin)!.state).toBe(joined ? 'engage' : 'hidden');
    const deaths = record(g, 'Died');
    const notices = record(g, 'Notice');
    const before = g.player.echoes;
    const reward = c.combatant.get(keziah)!.bounty + c.combatant.get(jenkin)!.bounty;
    strike(g, g.player.id, keziah, deathblow);

    for (const e of [keziah, jenkin]) {
      expect(c.health.get(e)!.hp).toBe(0);
      expect(c.actor.get(e)!.move).toBe('death');
      expect(c.fight.get(e)!.engaged).toBe(false);
    }
    expect(deaths.map((d) => d.entity).sort()).toEqual([keziah, jenkin].sort());
    expect(g.player.echoes - before).toBe(reward);
    expect(g.overworld!.slain).toEqual(new Set(['boss:keziah_mason', 'boss:brown_jenkin']));
    run(g, 90);
    expect(notices.some((n) => n.text === 'BROWN JENKIN JOINS THE FIGHT')).toBe(false);
    expect(g.player.echoes - before).toBe(reward);
    const loaded = createWorldGame({ save: snapshot(g) });
    expect(loaded.overworld!.alive.has('boss:keziah_mason')).toBe(false);
    expect(loaded.overworld!.alive.has('boss:brown_jenkin')).toBe(false);
  });

  it('a single sweep through both bosses grants each death and reward only once', () => {
    const { g, keziah, jenkin } = witchHouse(true);
    const c = g.ecs.c;
    const p = c.transform.get(g.player.id)!;
    p.yaw = 0;
    for (const e of [keziah, jenkin]) c.transform.get(e)!.pos = { x: p.pos.x, y: p.pos.y, z: p.pos.z + 1 };
    const a = c.actor.get(g.player.id)!;
    a.moves = { ...a.moves, pairSweep: { frames: 2, hit: { ...a.moves.light1.hit!, ...deathblow, window: [0, 1], height: 0.3, reach: 1, radius: 1, arc: [0, 0] } } };
    startMove(a, 'pairSweep');
    const deaths = record(g, 'Died');
    const vanquished = record(g, 'Vanquished');
    const earned = record(g, 'Echoes');
    const stones = g.player.stones;
    meleeSystem(g);
    expect(deaths).toHaveLength(2);
    expect(vanquished).toHaveLength(2);
    expect(earned.filter((e) => e.change === 'earned')).toHaveLength(2);
    expect(g.player.stones - stones).toBe(stonesOf('keziah_mason') + stonesOf('brown_jenkin'));
  });

  it('Jenkin dying first does not kill Keziah or pay for his death twice when she falls', () => {
    const { g, keziah, jenkin } = witchHouse(true);
    const deaths = record(g, 'Died');
    strike(g, g.player.id, jenkin, deathblow);
    expect(g.ecs.c.health.get(keziah)!.hp).toBeGreaterThan(0);
    strike(g, g.player.id, keziah, deathblow);
    expect(deaths.map((d) => d.entity)).toEqual([jenkin, keziah]);
  });

  it('a slain Keziah keeps an unspawned Jenkin eliminated, including saves from before the paired fall', () => {
    const g = createWorldGame();
    g.overworld!.slain.add('boss:keziah_mason');
    const at = worldLayout().spawns.find((s) => s.id === 'boss:keziah_mason')!.at;
    goTo(g, at.x, at.z);
    run(g, 1);
    expect(g.overworld!.alive.has('boss:brown_jenkin')).toBe(false);
    expect(g.overworld!.slain.has('boss:brown_jenkin')).toBe(true);
  });
});
