/**
 * The Cavern of Flame's priests (round 123, asked: "to make sure the ally isn't stuck anywhere when arriving in the cavern of flame the first time
 * it should have a fixed location in the cavern and you need to talk to them to progress further down the steps and then they follow and help
 * you"): Nasht and Kaman-Thah stand at a place of their own, the way on down is sealed until they are spoken with, and then they go all the
 * way down with the investigator, turn for turn, never left stuck, and no farther than the Gate of Deeper Slumber.
 */

import { describe, expect, it } from 'vitest';
import type { Entity } from '../src/core/ecs';
import { ALLY_TRAIL, PLAYER } from '../src/data/tuning';
import { brainSystem } from '../src/systems/brain';
import { passGate } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { movementSystem } from '../src/systems/movement';
import { npcEntity, talk } from '../src/systems/npcs';
import { passageSystem } from '../src/systems/passages';
import { populationSystem } from '../src/systems/population';
import { sealedHere } from '../src/systems/seals';
import { hasLineOfSight, resolveCapsule } from '../src/world/colliders';
import { roomPoint, type RoomLayout } from '../src/world/dungeonKit';
import { worldLayout } from '../src/world/placements';
import { dungeonRoomAt } from '../src/world/terrain';
import { regionAt } from '../src/world/worldMap';

const stairs = worldLayout().dungeons.find((d) => d.layout.def.id === 'slumber')!.layout;
const room = (id: string): RoomLayout => stairs.rooms.find((r) => r.def.id === id)!;
const WAY = ['deep_1', 'deep_2', 'deep_3', 'deep_4', 'landing_1', 'deep_5', 'deep_6', 'deep_7', 'turn_1', 'span', 'turn_2', 'deep_8', 'deep_9', 'deep_10', 'landing_2', 'deep_11', 'deep_12', 'deep_13', 'deep_14', 'deeper'];

/** A world game with the investigator in the Cavern of Flame, south of its flame, the priests risen at their place and no foe about. */
function inCavern(): { g: Game; e: Entity } {
  const g = createWorldGame();
  const c = room('cavern');
  const pp = g.ecs.c.transform.get(g.player.id)!;
  const at = roomPoint(c, 0, -12);
  pp.pos = { x: at.x, y: g.world.ground(at.x, at.z), z: at.z };
  pp.prev = { ...pp.pos };
  populationSystem(g);
  for (const [e, k] of g.ecs.c.combatant) if (k.faction === 'enemy') g.ecs.despawn(e);
  return { g, e: npcEntity(g, 'nasht')! };
}

/** The piece that seals the way on down from the cavern. */
const sealOf = (g: Game): Entity => [...g.ecs.c.piece].find(([, p]) => p.def.met === 'nasht')![0];

/** Walks the investigator from where they are to (x, z) at `speed` metres a second, a step a frame, running what moves and minds the bodies; `each` sees every frame. */
function walkTo(g: Game, to: { x: number; z: number }, speed: number, each: () => void): void {
  const pp = g.ecs.c.transform.get(g.player.id)!;
  let was = { ...pp.pos };
  for (let n = 0; n < 20000; n++) {
    const [dx, dz] = [to.x - pp.pos.x, to.z - pp.pos.z];
    const d = Math.hypot(dx, dz);
    if (d < 0.05) return;
    if (n % 120 === 119) {
      if (Math.hypot(pp.pos.x - was.x, pp.pos.z - was.z) < 0.1) return; // held fast: the test's own assertions say where
      was = { ...pp.pos };
    }
    const k = Math.min(1, speed / 60 / d);
    pp.prev = { ...pp.pos };
    const next = { x: pp.pos.x + dx * k, y: 0, z: pp.pos.z + dz * k };
    next.y = g.world.ground(next.x, next.z);
    resolveCapsule(g.world, next, PLAYER.radius, PLAYER.height);
    pp.pos = next;
    passageSystem(g);
    brainSystem(g);
    movementSystem(g, 1 / 60);
    g.frame++;
    each();
  }
}

describe('the priests of the Cavern of Flame (round 123)', () => {
  it('stand at a place of their own, between their effigies before the way on down, facing whoever comes in', () => {
    const post = roomPoint(room('cavern'), 0, 13);
    const spawn = worldLayout().spawns.find((s) => s.id === 'ally:nasht_kaman_thah')!;
    expect(Math.hypot(spawn.at.x - post.x, spawn.at.z - post.z)).toBeLessThan(0.01);
    const { g, e } = inCavern();
    const at = { ...g.ecs.c.transform.get(e)!.pos };
    expect(Math.hypot(at.x - post.x, at.z - post.z)).toBeLessThan(0.01);
    for (let i = 0; i < 600; i++) { brainSystem(g); movementSystem(g, 1 / 60); } // ten seconds with the investigator in sight: they wait
    expect(Math.hypot(g.ecs.c.transform.get(e)!.pos.x - at.x, g.ecs.c.transform.get(e)!.pos.z - at.z)).toBeLessThan(0.01);
  });

  it('keep the way on down sealed until they are spoken with, and say so; a word with them opens it', () => {
    const { g } = inCavern();
    const seal = sealOf(g);
    const door = g.ecs.c.piece.get(seal)!.def;
    expect(door.seal?.look).toBe('sealed');
    expect(g.ecs.c.layer.get(seal)!.shown).toBe(false);
    const [c, on] = [room('cavern'), room('deep_1')];
    const eyeOf = (r: RoomLayout) => ({ x: r.x, y: r.level + 1.5, z: r.z });
    const [inside, below] = [{ ...roomPoint(c, 0, 20), y: c.level + 1.5 }, { ...eyeOf(on) }];
    expect(hasLineOfSight(g.world, inside, below)).toBe(false); // a slab in the doorway
    const pp = g.ecs.c.transform.get(g.player.id)!;
    pp.pos = { x: door.x - (on.x - c.x) * 0.15, y: c.level, z: door.z - (on.z - c.z) * 0.15 };
    expect(sealedHere(g)).toContain('NASHT & KAMAN-THAH');
    walkTo(g, { x: on.x, z: on.z }, 4, () => {});
    expect(dungeonRoomAt(pp.pos.x, pp.pos.z)?.room.def.id).toBe('cavern'); // walked into the slab, and no farther
    const said: string[] = [];
    g.events.on('Notice', (n) => said.push(n.text));
    talk(g, 'nasht');
    g.player.listening = null;
    expect(g.ecs.c.layer.get(seal)!.shown).toBe(true);
    expect(said.some((t) => t.includes('OPEN THE WAY DOWN'))).toBe(true);
    walkTo(g, { x: on.x, z: on.z }, 4, () => {});
    expect(dungeonRoomAt(pp.pos.x, pp.pos.z)?.room.def.id).toBe('deep_1'); // the slab drawn aside, and the steps beyond
  });

  /** Spoken with where they stand, then down the whole of the seven hundred steps at `speed` metres a second: how it went. */
  function descend(speed: number): { far: number; off: number; steps: number; end: number; room?: string; state?: string } {
    const { g, e } = inCavern();
    const pp = g.ecs.c.transform.get(g.player.id)!;
    const beside = roomPoint(room('cavern'), 2, 10);
    pp.pos = pp.prev = { x: beside.x, y: g.world.ground(beside.x, beside.z), z: beside.z };
    talk(g, 'nasht');
    g.player.listening = null;
    const tr = g.ecs.c.transform.get(e)!;
    let [far, off, steps] = [0, 0, 0];
    g.events.on('Teleported', (t) => void (t.entity === e && steps++));
    for (const to of [roomPoint(room('cavern'), 0, 19), ...WAY.map(room)]) { // past them, and down
      walkTo(g, to, speed, () => {
        const me = g.ecs.c.transform.get(g.player.id)!.pos;
        far = Math.max(far, Math.hypot(tr.pos.x - me.x, tr.pos.y - me.y, tr.pos.z - me.z));
        if (!dungeonRoomAt(tr.pos.x, tr.pos.z) || Math.abs(tr.pos.y - g.world.ground(tr.pos.x, tr.pos.z)) > 1.5) off++; // on the stair, on its floor
      });
    }
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    const end = Math.hypot(tr.pos.x - me.x, tr.pos.y - me.y, tr.pos.z - me.z);
    return { far, off, steps, end, room: dungeonRoomAt(me.x, me.z)?.room.def.id, state: g.ecs.c.brain.get(e)?.state };
  }

  it('once spoken with, walk all the way down with the investigator at a walk, turn for turn, never stuck', () => {
    const r = descend(3.2);
    expect(r.room).toBe('deeper');
    expect(r.state).toBe('follow');
    expect(r.off, 'never off the stair').toBe(0);
    expect(r.far, 'a few paces behind at most').toBeLessThan(ALLY_TRAIL.near);
    expect(r.end, 'beside them at the Gate').toBeLessThan(ALLY_TRAIL.near);
    expect(r.steps, 'they walk it: no step through the dream at a walk').toBe(0);
  });

  it('and kept up with at a run: left behind, they step through the dream to the investigator\'s back', () => {
    const r = descend(5.5);
    expect(r.room).toBe('deeper');
    expect(r.off, 'never off the stair').toBe(0);
    expect(r.far, 'never left far behind').toBeLessThan(ALLY_TRAIL.far + 2);
    expect(r.end, 'beside them at the Gate').toBeLessThan(ALLY_TRAIL.far);
    expect(r.steps).toBeGreaterThan(0);
    expect(r.steps, 'now and then, not at every turn').toBeLessThan(20);
  });

  it('go no farther than the Gate of Deeper Slumber: left at a realm\'s edge, they stay', () => {
    const { g, e } = inCavern();
    talk(g, 'nasht');
    g.player.listening = null;
    const pp = g.ecs.c.transform.get(g.player.id)!;
    const gate = room('deeper');
    pp.pos = { x: gate.x, y: gate.level, z: gate.z };
    pp.prev = { ...pp.pos };
    expect(passGate(g, 'dream_deeper')).toBe(true);
    expect(regionAt(pp.pos.x, pp.pos.z)?.id).toBe('dreamlands');
    for (let i = 0; i < 600; i++) { brainSystem(g); movementSystem(g, 1 / 60); g.frame++; }
    const tr = g.ecs.c.transform.get(e)!;
    expect(regionAt(tr.pos.x, tr.pos.z)?.id).toBe('slumber_stairs');
  });
});
