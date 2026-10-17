import { describe, expect, it } from 'vitest';
import { distXZ } from '../src/core/geom';
import { PLAYER } from '../src/data/tuning';
import { brainSystem } from '../src/systems/brain';
import { shove, strike, targetsOf } from '../src/systems/combat';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';
import { movementSystem } from '../src/systems/movement';
import { npcEntity, talk } from '../src/systems/npcs';
import { populationSystem } from '../src/systems/population';
import { hasLineOfSight, resolveCapsule } from '../src/world/colliders';
import { kitOfRoom } from '../src/world/dungeonKit';
import { grounded, outerFace } from '../src/world/moundBanks';
import { worldLayout } from '../src/world/placements';
import { createWorldCollision } from '../src/world/worldCollision';
import { DIRS } from '../src/world/worldMap';

const world = createWorldCollision();

describe('the outside of a dungeon stops feet', () => {
  it('the steep mound shell is outside the walking boundary, on every exposed wall', () => {
    let checked = 0;
    for (const d of worldLayout().dungeons) for (const p of d.parts) {
      if (!grounded(d.layout, p) || kitOfRoom(d.layout, d.layout.rooms[p.room]).shell !== 'mound') continue;
      const n = DIRS[p.outer];
      const face = outerFace(p);
      const centre = { x: (p.min.x + p.max.x) / 2, z: (p.min.z + p.max.z) / 2 };
      const at = { ...centre, x: n.x ? face + n.x * 2.4 : centre.x, z: n.z ? face + n.z * 2.4 : centre.z };
      const pos = { ...at, y: world.ground(at.x, at.z) };
      resolveCapsule(world, pos, PLAYER.radius, PLAYER.height);
      const out = (pos.x - at.x) * n.x + (pos.z - at.z) * n.z;
      expect(out, `${d.layout.def.id}/${d.layout.rooms[p.room].def.id}/${p.outer}`).toBeGreaterThan(0.5);
      checked++;
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('the added boundary leaves every outside doorway open to feet and eyes', () => {
    for (const d of worldLayout().dungeons) for (const door of d.layout.doors) {
      if (door.b) continue;
      const n = DIRS[door.side];
      for (const side of [-1, 1]) {
        const at = { x: door.x + n.x * side * 2.5, y: door.level, z: door.z + n.z * side * 2.5 };
        const pos = { ...at };
        resolveCapsule(world, pos, PLAYER.radius, PLAYER.height);
        expect(distXZ(at, pos), `${d.layout.def.id}: doorway feet`).toBeLessThan(0.01);
      }
      expect(hasLineOfSight(world,
        { x: door.x - n.x * 3, y: door.level + 1.5, z: door.z - n.z * 3 },
        { x: door.x + n.x * 3, y: door.level + 1.5, z: door.z + n.z * 3 }), `${d.layout.def.id}: doorway eyes`).toBe(true);
    }
  });
});

function cavern() {
  const g = createWorldGame();
  const r = worldLayout().dungeons.find((d) => d.layout.def.id === 'slumber')!.layout.rooms.find((r) => r.def.id === 'cavern')!;
  const pp = g.ecs.c.transform.get(g.player.id)!;
  pp.pos = { x: r.x - 1, y: r.level, z: r.z - 3 };
  pp.prev = { ...pp.pos };
  populationSystem(g);
  for (const [e, c] of g.ecs.c.combatant) if (c.faction === 'enemy') g.ecs.despawn(e);
  const e = npcEntity(g, 'nasht')!;
  return { g, r, e, tr: g.ecs.c.transform.get(e)! };
}

describe('the Cavern of Flame priests are found at their place', () => {
  it('wait on clear ground for their introduction, then still assist after talking', () => {
    const { g, e, tr } = cavern();
    const at = { ...tr.pos };
    const b = g.ecs.c.body.get(e)!;
    const resolved = { ...at };
    resolveCapsule(g.world, resolved, b.radius, b.height);
    expect(distXZ(at, resolved)).toBeLessThan(0.01);
    for (let i = 0; i < 120; i++) { brainSystem(g); movementSystem(g, 1 / 60); }
    expect(distXZ(at, tr.pos)).toBeLessThan(0.01);
    expect(g.ecs.c.brain.get(e)!.joined).toBeFalsy();
    talk(g, 'nasht');
    g.player.listening = null;
    for (let i = 0; i < 120; i++) { brainSystem(g); movementSystem(g, 1 / 60); }
    expect(g.ecs.c.brain.get(e)!.state).toBe('follow');
    expect(distXZ(at, tr.pos)).toBeGreaterThan(1);
  });

  it('nearby creatures cannot draw the unmet priests into off-screen combat or teleports', () => {
    const { g, r, e, tr } = cavern();
    const at = { ...tr.pos };
    spawnCreature(g, 'zoog', { x: r.x, z: r.z + 1, yaw: 0 });
    brainSystem(g);
    expect(g.ecs.c.brain.get(e)!.target).toBeNull();
    expect(g.ecs.c.actor.get(e)!.move).toBeNull();
    movementSystem(g, 1 / 60);
    expect(distXZ(at, tr.pos)).toBeLessThan(0.01);
  });

  it('cannot be attacked or pushed into a corner before introduction, and regains normal combat after talking', () => {
    const { g, e, tr } = cavern();
    const at = { ...tr.pos };
    const enemy = spawnCreature(g, 'night_gaunt', { x: at.x + 0.1, z: at.z, yaw: 0 })!;
    const health = g.ecs.c.health.get(e)!;
    const hp = health.hp;
    const blow = { damage: 100, poise: 1000, guard: 0, hitstop: 3, parryable: false, interrupts: true };
    expect(targetsOf(g, enemy)).not.toContain(e);
    expect(strike(g, enemy, e, blow)).toBe('dodged');
    shove(g, e, { ...at, x: at.x - 1 }, 10);
    expect(g.ecs.c.shove.has(e)).toBe(false);
    g.ecs.c.shove.set(e, { x: 1, z: 1, frames: 3 }); // a persistent wind's direct force also cannot move them
    movementSystem(g, 1 / 60); // overlaps the night-gaunt: body separation must leave the priest anchored
    expect(distXZ(at, tr.pos)).toBeLessThan(0.01);
    expect(g.ecs.c.shove.has(e)).toBe(false);
    expect(health.hp).toBe(hp);
    expect(g.ecs.c.actor.get(e)!.move).toBeNull();
    expect(distXZ(at, g.ecs.c.transform.get(enemy)!.pos)).toBeGreaterThan(0.5);
    talk(g, 'nasht');
    expect(targetsOf(g, enemy)).toContain(e);
    expect(strike(g, enemy, e, blow)).not.toBe('dodged');
    expect(health.hp).toBeLessThan(hp);
    shove(g, e, { ...at, x: at.x - 1 }, 10);
    expect(g.ecs.c.shove.has(e)).toBe(true);
    movementSystem(g, 1 / 60);
    expect(distXZ(at, tr.pos)).toBeGreaterThan(0.1);
  });
});
