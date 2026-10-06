import { describe, expect, it } from 'vitest';
import { getEntity } from '../src/data/registry';
import { WORLD } from '../src/data/tuning';
import { rest, travel } from '../src/systems/checkpoints';
import { createWorldGame } from '../src/systems/game';
import { chunkContent } from '../src/world/chunks';
import { worldLayout } from '../src/world/placements';
import { chunkSpan } from '../src/world/streaming';
import { chunkOf } from '../src/world/worldMap';
import { run } from './worldHelpers';

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
        killed.push(id);
      }
      expect(killed.length).toBeGreaterThan(5);
      run(g, 10); // the dead are cleared, and the posts further off fill the count
      expect(rest(g, sign)).toBe(true);
      run(g, 5);
      expect(killed.filter((id) => !ow.alive.has(id)), sign).toEqual([]);
    }
  });

  it('no foe that returns stands within signClear of an Elder Sign (no farming Echoes by resting)', () => {
    const near: string[] = [];
    for (const s of worldLayout().signs) {
      const [cx, cz] = [chunkOf(s.rest.x), chunkOf(s.rest.z)];
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) for (const w of chunkContent(cx + i, cz + j).spawns) {
        if (w.unique || w.id.startsWith('ally:') || getEntity(w.entity)?.tier === 'ally') continue;
        const d = Math.hypot(w.at.x - s.rest.x, w.at.z - s.rest.z);
        if (d < WORLD.signClear) near.push(`${s.id}: ${w.entity} (${w.id}) ${d.toFixed(0)} m`);
      }
    }
    expect(near).toEqual([]);
  });
});
