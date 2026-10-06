import { describe, expect, it } from 'vitest';
import { WORLD } from '../src/data/tuning';
import { rest, signPlace, travel } from '../src/systems/checkpoints';
import { createWorldGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';
import { chunkSpan } from '../src/world/streaming';
import { chunkOf } from '../src/world/worldMap';
import { goTo, run } from './worldHelpers';

describe('resting at an Elder Sign', () => {
  it('brings back every foe killed, even where the 60 alive were refilled from further off', () => {
    for (const sign of ['arkham_streets', 'hub_archive', 'arkham_heath']) {
      const g = createWorldGame();
      for (const s of worldLayout().signs) g.overworld!.discovered.add(s.id);
      travel(g, sign);
      run(g, 31);
      const ow = g.overworld!;
      const pp = g.ecs.c.transform.get(g.player.id)!.pos;
      const killed: string[] = [];
      for (const [id, e] of ow.alive) {
        if (id.startsWith('boss:') || id.startsWith('ally:')) continue;
        const t = g.ecs.c.transform.get(e)!.pos;
        if (chunkSpan(chunkOf(t.x), chunkOf(t.z), chunkOf(pp.x), chunkOf(pp.z)) > WORLD.load - 1) continue;
        g.ecs.c.health.get(e)!.hp = 0;
        g.ecs.c.dead.set(e, true);
        ow.killed.add(id);
        ow.posts.set(id, { x: t.x, z: t.z });
        if (Math.hypot(t.x - pp.x, t.z - pp.z) >= WORLD.signClear) killed.push(id); // (those nearer stay down: the next test)
      }
      expect(killed.length).toBeGreaterThan(5);
      run(g, 10); // the dead are cleared, and the posts further off fill the count
      expect(rest(g, sign)).toBe(true);
      run(g, 5);
      expect(killed.filter((id) => !ow.alive.has(id)), sign).toEqual([]);
    }
  });

  it('foes posted about a sign stay down when it is rested at, and come back with a rest elsewhere', () => {
    const g = createWorldGame();
    for (const s of worldLayout().signs) g.overworld!.discovered.add(s.id);
    const sign = signPlace('dunwich_sentinel')!; // a sign in a dungeon, its foes about it
    travel(g, sign.id);
    run(g, 31);
    const ow = g.overworld!;
    const near: string[] = [];
    for (const [id, e] of ow.alive) {
      const t = g.ecs.c.transform.get(e)!.pos;
      if (id.startsWith('boss:') || id.startsWith('ally:') || Math.hypot(t.x - sign.rest.x, t.z - sign.rest.z) >= WORLD.signClear) continue;
      g.ecs.c.health.get(e)!.hp = 0;
      g.ecs.c.dead.set(e, true);
      ow.killed.add(id);
      ow.posts.set(id, { x: t.x, z: t.z });
      near.push(id);
    }
    expect(near.length).toBeGreaterThan(3);
    run(g, 10);
    expect(rest(g, sign.id)).toBe(true);
    run(g, 5);
    expect(near.filter((id) => ow.alive.has(id)), 'back at once').toEqual([]);
    travel(g, 'hub_quad');
    run(g, 5);
    const far = signPlace('hub_quad')!;
    goTo(g, far.rest.x, far.rest.z);
    expect(rest(g, 'hub_quad')).toBe(true);
    travel(g, sign.id);
    run(g, 31);
    expect(near.filter((id) => !ow.alive.has(id)), 'back after a rest elsewhere').toEqual([]);
  });
});
