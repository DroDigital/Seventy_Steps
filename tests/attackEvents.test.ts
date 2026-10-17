import { describe, expect, it } from 'vitest';
import { startMove } from '../src/systems/actions';
import { loose } from '../src/systems/projectiles';
import { steps } from './helpers';
import { bossGame, calm, engage } from './bossHelpers';

function watch(id: string) {
  const b = bossGame(id, undefined, 8);
  engage(b);
  calm(b);
  const log: { type: string; data: Record<string, unknown> }[] = [];
  for (const type of ['BoltLoosed', 'BoltLanded', 'Swung'] as const) b.g.events.on(type, (data) => void log.push({ type, data: data as unknown as Record<string, unknown> }));
  const act = b.g.ecs.c.actor.get(b.boss)!;
  return { ...b, log, act, of: (type: string) => log.filter((e) => e.type === type) };
}

describe('the events the effects of a blow keep to (round 51)', () => {
  it('a volley is loosed once for each bolt, and each lands exactly once: on a body, the world, or spent', () => {
    const w = watch('keziah_mason');
    startMove(w.act, 'projectile_fan');
    steps(w.g, 200);
    const loosed = w.of('BoltLoosed');
    const landed = w.of('BoltLanded');
    expect(loosed.length).toBe(5);
    expect(landed.length).toBe(5);
    for (const e of landed) {
      expect(['body', 'ground', 'wall', 'spent']).toContain(e.data.on);
      for (const k of ['x', 'y', 'z']) expect(Number.isFinite((e.data.at as Record<string, number>)[k])).toBe(true);
      expect(e.data.owner).toBe(w.boss);
    }
    expect(w.g.ecs.c.bolt.size).toBe(0);
  });

  it('a bolt that gives out in the air is landed as spent, and a flask\'s bolt is marked fire', () => {
    const w = watch('keziah_mason');
    const shot = { speed: 5, radius: 0.3, range: 2, damage: 1, poise: 0, lob: false };
    loose(w.g, w.boss, { x: 40, y: 3, z: 40 }, { x: 0, y: 2, z: 0 }, shot); // up into the air, out of everyone's reach
    loose(w.g, w.g.player.id, { x: 44, y: 3, z: 40 }, { x: 0, y: 2, z: 0 }, { ...shot, pool: { radius: 1, life: 60, tick: 30, damage: 1, fire: true } });
    steps(w.g, 200);
    const mine = (list: { data: Record<string, unknown> }[]) => list.filter((e) => ((e.data.at ?? e.data.vel) as { x: number }).x > 30 || (e.data.at as { x: number }).x > 30); // (the boss's own attack began as it was engaged: not these two)
    const landed = mine(w.of('BoltLanded'));
    expect(landed.map((e) => e.data.on)).toEqual(['spent', 'spent']);
    expect(landed.map((e) => e.data.fire)).toEqual([false, true]);
    expect(mine(w.of('BoltLoosed')).map((e) => e.data.fire)).toEqual([false, true]);
    expect(w.g.ecs.c.bolt.size).toBe(0);
  });

  it('a blow that opens its hit window is swung once, however long the window is', () => {
    const w = watch('cthulhu');
    startMove(w.act, 'slam');
    steps(w.g, 120);
    expect(w.of('Swung').length).toBe(1);
    expect(w.of('Swung')[0]!.data.entity).toBe(w.boss);
    startMove(w.act, 'tentacle_burst');
    steps(w.g, 120);
    expect(w.of('Swung').length).toBe(2);
  });
});
