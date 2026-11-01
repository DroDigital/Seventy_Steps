import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { FALL } from '../src/data/tuning';
import { createAzathothFloor } from '../src/render/azathothFloor';
import { createArenaFloor, FLOOR, stepArenaFloor, tileAt } from '../src/systems/azathothFloor';
import { spawnCreature } from '../src/systems/creatures';
import { setArena } from '../src/systems/bossFight';
import { fallSystem, footingSafe } from '../src/systems/falls';
import { createWorldGame } from '../src/systems/game';
import { teleport } from '../src/systems/checkpoints';
import { priorOf } from '../src/systems/sealCount';
import { worldLayout } from '../src/world/placements';
import { bossGame, calm, engage } from './bossHelpers';
import { record, run } from './worldHelpers';

const arena = { x: 0, z: 0, radius: 44 };

describe('the disintegrating court', () => {
  it('starts whole and leaves crossing routes and the outside protected', () => {
    const floor = createArenaFloor(arena);
    expect(floor.tiles.length).toBeGreaterThan(100);
    expect(floor.tiles.every((t) => t.strain === 0 && !t.collapsed)).toBe(true);
    expect(floor.tiles.some((t) => !t.protected)).toBe(true);
    expect(floor.tiles.filter((t) => t.x === 0 || t.z === 0).every((t) => t.protected)).toBe(true);
    expect(floor.tiles.filter((t) => Math.hypot(t.x, t.z) > arena.radius - 2 * FLOOR.size).every((t) => t.protected)).toBe(true);
  });

  it('deteriorates faster when the investigator moves over an already visible crack', () => {
    const b = bossGame('azathoth', undefined, 20);
    b.fight.arenaFloor = createArenaFloor(arena);
    const tile = b.fight.arenaFloor.tiles.find((t) => !t.protected)!;
    tile.strain = 0.4;
    const tr = b.g.ecs.c.transform.get(b.g.player.id)!;
    tr.pos = { x: tile.x, y: 0, z: tile.z };
    tr.prev = { ...tr.pos };
    stepArenaFloor(b.g, b.fight);
    const quietGain = tile.strain - 0.4;
    tile.strain = 0.4;
    tr.prev = { ...tr.pos, x: tr.pos.x - 0.1 };
    stepArenaFloor(b.g, b.fight);
    expect(tile.strain - 0.4).toBeGreaterThan(quietGain * 10);
    tile.strain = 0;
    stepArenaFloor(b.g, b.fight);
    expect(tile.strain).toBeCloseTo(quietGain, 8); // sound floor does not wear down just from a footstep
  });

  it('warns locally for at least three seconds before a damaged tile can collapse', () => {
    const b = bossGame('azathoth', undefined, 20);
    b.fight.arenaFloor = createArenaFloor(arena);
    const tile = b.fight.arenaFloor.tiles.find((t) => !t.protected)!;
    tile.strain = 0.99;
    const tr = b.g.ecs.c.transform.get(b.g.player.id)!;
    tr.pos = { x: tile.x, y: 0, z: tile.z };
    tr.prev = { ...tr.pos };
    const tremors = record(b.g, 'FloorTremor');
    for (let i = 0; i < FLOOR.warningFrames - 1; i++) { b.g.frame++; stepArenaFloor(b.g, b.fight); }
    expect(tile.collapsed).toBe(false);
    expect(tremors.length).toBeGreaterThan(0);
    expect(tremors[0].at).toMatchObject({ x: tile.x, z: tile.z });
    b.g.frame++;
    stepArenaFloor(b.g, b.fight);
    expect(tile.collapsed).toBe(true);
  });

  it('limits collapse before the final phase and keeps protected routes intact throughout', () => {
    const b = bossGame('azathoth', undefined, 20);
    b.fight.arenaFloor = createArenaFloor(arena);
    const floor = b.fight.arenaFloor;
    for (const tile of floor.tiles) if (!tile.protected) { tile.strain = 1; tile.warning = FLOOR.warningFrames - 1; }
    for (let phase = 0; phase < 3; phase++) {
      b.fight.phase = phase;
      for (const t of floor.tiles) if (!t.protected && !t.collapsed) { t.strain = 1; t.warning = FLOOR.warningFrames - 1; }
      stepArenaFloor(b.g, b.fight);
      const eligible = floor.tiles.filter((t) => !t.protected);
      expect(eligible.filter((t) => t.collapsed).length).toBeLessThanOrEqual(Math.floor(eligible.length * FLOOR.phaseCap[phase]));
      expect(floor.tiles.some((t) => !t.collapsed)).toBe(true);
    }
    b.fight.phase = 3;
    for (const t of floor.tiles) if (!t.protected && !t.collapsed) { t.strain = 1; t.warning = FLOOR.warningFrames - 1; }
    stepArenaFloor(b.g, b.fight);
    expect(floor.tiles.filter((t) => t.protected).every((t) => !t.collapsed)).toBe(true);
  });

  it('only drops the investigator, uses the normal fatal fall, and restores the floor when the fight ends', () => {
    const g = createWorldGame();
    const player = g.ecs.c.transform.get(g.player.id)!;
    const home = { ...player.pos };
    const boss = spawnCreature(g, 'azathoth', { x: home.x, z: home.z, yaw: 0 })!;
    const fight = g.ecs.c.fight.get(boss)!;
    fight.arena = { x: home.x, z: home.z, radius: 44 };
    fight.arenaFloor = createArenaFloor(fight.arena);
    fight.engaged = true;
    const tile = fight.arenaFloor.tiles.find((t) => !t.protected && Math.hypot(t.x - home.x, t.z - home.z) < 18)!;
    expect(tileAt(fight.arenaFloor, tile.x, tile.z)).toBe(tile);
    tile.collapsed = true;
    const bossTransform = g.ecs.c.transform.get(boss)!;
    bossTransform.pos = { x: tile.x, y: g.world.ground(tile.x, tile.z), z: tile.z };
    const bossHealth = g.ecs.c.health.get(boss)!.hp;
    fallSystem(g);
    expect(g.player.falling).toBeNull();
    expect(bossTransform.pos.y).toBe(g.world.ground(tile.x, tile.z));
    player.pos = { x: tile.x + FLOOR.size / 2 - FALL.foot / 2, y: g.world.ground(tile.x, tile.z), z: tile.z };
    player.prev = { ...player.pos };
    fallSystem(g);
    expect(g.player.falling).toBeNull(); // a foot still on the neighbouring tile can step back
    player.pos = { x: tile.x, y: g.world.ground(tile.x, tile.z), z: tile.z };
    player.prev = { ...player.pos };
    const fell = record(g, 'Fell');
    fallSystem(g);
    expect(fell.map((f) => f.entity)).toEqual([g.player.id]);
    expect(g.player.falling).not.toBeNull();
    for (let i = 0; i < FALL.frames; i++) fallSystem(g);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(0);
    expect(g.ecs.c.health.get(boss)!.hp).toBe(bossHealth);
  });

  it('creates unstable tiles around the anchored boss in the actual streamed Court', () => {
    const spawn = worldLayout().spawns.find((s) => s.id === 'boss:azathoth')!;
    const g = createWorldGame();
    const prior = priorOf(spawn.entity);
    if (prior) g.overworld!.slain.add(`boss:${prior}`);
    teleport(g, { x: spawn.at.x, z: spawn.at.z + 24, yaw: Math.PI });
    run(g, 60);
    const boss = g.overworld!.alive.get(spawn.id)!;
    Object.assign(g.ecs.c.brain.get(boss)!, { state: 'engage', target: g.player.id, cooldown: 1e6 });
    run(g, 3);
    const fight = g.ecs.c.fight.get(boss)!;
    expect(fight.engaged).toBe(true);
    expect(fight.arenaFloor!.tiles.filter((t) => !t.protected).length).toBeGreaterThan(10);
    const at = g.ecs.c.transform.get(boss)!.pos;
    const radius = g.ecs.c.body.get(boss)!.radius;
    expect(fight.arenaFloor!.tiles.filter((t) => Math.hypot(t.x - at.x, t.z - at.z) < radius + FLOOR.size * Math.SQRT1_2).every((t) => t.protected)).toBe(true);
    const height = g.ecs.c.body.get(g.player.id)!.height;
    const tile = fight.arenaFloor!.tiles.find((t) => !t.protected && footingSafe(g, { x: t.x, y: g.world.ground(t.x, t.z), z: t.z }, 0, height))!;
    expect(tile).toBeDefined();
    tile.collapsed = true;
    const player = g.ecs.c.transform.get(g.player.id)!;
    player.pos = { x: tile.x, y: g.world.ground(tile.x, tile.z), z: tile.z };
    player.prev = { ...player.pos };
    fallSystem(g);
    expect(g.player.falling).not.toBeNull();
    expect(g.ecs.c.transform.get(boss)!.pos.y).toBe(at.y);
  });

  it('renders growing cracks and removes them when the encounter resets', () => {
    const b = bossGame('azathoth', undefined, 20);
    const bossAt = b.g.ecs.c.transform.get(b.boss)!.pos;
    setArena(b.g, b.boss, { x: bossAt.x, z: bossAt.z, radius: 44 });
    engage(b);
    calm(b);
    const bossRadius = b.g.ecs.c.body.get(b.boss)!.radius;
    expect(b.fight.arenaFloor!.tiles.filter((t) => Math.hypot(t.x - bossAt.x, t.z - bossAt.z) < bossRadius + FLOOR.size * Math.SQRT1_2).every((t) => t.protected)).toBe(true);
    const tile = b.fight.arenaFloor!.tiles.find((t) => !t.protected)!;
    tile.strain = 0.8;
    const scene = new THREE.Scene();
    const view = createAzathothFloor(scene, b.g);
    view.update(1);
    const mesh = scene.children[0] as THREE.InstancedMesh;
    expect(mesh.count).toBe(1);
    const attributes = mesh.geometry.getAttribute('aFloor') as THREE.InstancedBufferAttribute;
    expect(attributes.getX(0)).toBeCloseTo(0.8);
    tile.collapsed = true;
    view.update(2);
    expect(attributes.getY(0)).toBe(1);
    b.fight.engaged = false;
    view.update(3);
    expect(mesh.count).toBe(0);
  });
});
