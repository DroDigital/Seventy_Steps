import { describe, expect, it } from 'vitest';
import { fill } from '../src/ui/glyphs';
import { LANGS } from '../src/data/lang';
import { watch } from '../src/ui/hintWatch';
import { teleport } from '../src/systems/checkpoints';
import { spawnCreature } from '../src/systems/creatures';
import { allFogs } from '../src/systems/fogGates';
import { createWorldGame } from '../src/systems/game';
import { run } from './worldHelpers';

describe('the first hour: hints before it costs', () => {
  const at = (g: ReturnType<typeof createWorldGame>) => g.ecs.c.transform.get(g.player.id)!.pos;

  it('every hint has words, and every {button} in one is a button the hint line knows', () => {
    for (const lang of LANGS) {
      for (const [id, text] of Object.entries(lang.table).filter(([k]) => k.startsWith('hint.'))) {
        expect(text.length, `${lang.id} ${id}`).toBeGreaterThan(20);
        expect(fill(text), `${lang.id} ${id}`).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it('a foe closing in, a breath spent, a wall of fog near and a person to talk to are each noticed', () => {
    const g = createWorldGame();
    run(g, 5);
    expect(watch(g)).not.toContain('fight');
    const p = at(g);
    const e = spawnCreature(g, 'deep_one', { x: p.x + 12, z: p.z, yaw: 0 })!;
    Object.assign(g.ecs.c.brain.get(e)!, { state: 'engage', target: g.player.id });
    expect(watch(g)).toContain('fight');
    g.ecs.c.health.get(e)!.hp = 0; // gone: nothing hunts
    g.ecs.c.dead.set(e, true);
    expect(watch(g)).not.toContain('fight');
    g.ecs.c.stamina.get(g.player.id)!.value = 0;
    expect(watch(g)).toContain('breath');
    const wall = allFogs()[0];
    teleport(g, { x: wall.x, z: wall.z, yaw: 0 });
    expect(watch(g)).toContain('fog');
    const [npc] = g.ecs.c.npc.keys();
    const q = g.ecs.c.transform.get(npc)!.pos;
    teleport(g, { x: q.x + 3, z: q.z, yaw: 0 });
    expect(watch(g)).toContain('talk');
  });
});
