import { describe, expect, it } from 'vitest';
import { MOUNT_QUEST } from '../src/data/mounts';
import { QUESTS } from '../src/data/quests';
import { PLAYER } from '../src/data/tuning';
import { fallSystem } from '../src/systems/falls';
import { applySave, snapshot } from '../src/systems/save';
import { createWorldGame } from '../src/systems/game';
import { spawnPiece } from '../src/systems/hiddenLayer';
import { movementSystem } from '../src/systems/movement';
import { teleport } from '../src/systems/checkpoints';
import { toggleMount } from '../src/systems/mounts';
import { resolveCapsule, type Collider } from '../src/world/colliders';
import { worldLayout } from '../src/world/placements';
import { createWorldCollision } from '../src/world/worldCollision';
import { regionAt } from '../src/world/worldMap';
import { scriptedGame } from './helpers';

describe('fatal edges', () => {
  it('lets the investigator walk into a drop and off the land, and still stops everyone else', () => {
    const world = createWorldCollision();
    // West of Arkham: x < -512 is owned by no region. A closed capsule is pushed back onto the land.
    const open = { x: -520, y: 4, z: 220 };
    expect(regionAt(open.x, open.z)).toBeUndefined();
    resolveCapsule(world, open, PLAYER.radius, PLAYER.height, true);
    expect(open.x).toBeCloseTo(-520);
    const shut = { x: -520, y: 4, z: 220 };
    resolveCapsule(world, shut, PLAYER.radius, PLAYER.height);
    expect(shut.x).toBeGreaterThanOrEqual(-512);
    expect(regionAt(shut.x, shut.z)).toBeDefined();

    const hole = {
      colliders: [{ kind: 'box' as const, fall: true, min: { x: -2, y: -4, z: -2 }, max: { x: 2, y: 3, z: 2 } }],
      off: new Set<Collider>(),
      ground: () => 0,
      contain: () => {},
    };
    const inIt = { x: 0, y: 0, z: 0 };
    resolveCapsule(hole, inIt, 0.4, 1.8, true);
    expect(inIt).toMatchObject({ x: 0, z: 0 });
    resolveCapsule(hole, inIt, 0.4, 1.8);
    expect(Math.hypot(inIt.x, inIt.z)).toBeGreaterThan(1);
  });

  it('drops the Lost Echoes on the last safe ground, not in the void', () => {
    const g = createWorldGame();
    const tr = g.ecs.c.transform.get(g.player.id)!;
    const y = g.world.ground(12, 220);
    tr.prev = { x: 12, y, z: 220 };
    tr.pos = { x: -40, y: -6, z: 220 };
    g.player.echoes = 40;
    fallSystem(g);
    const [drop] = g.ecs.query('drop');
    expect(g.ecs.c.drop.get(drop)!.amount).toBe(40);
    expect(g.ecs.c.transform.get(drop)!.pos.x).toBeCloseTo(12);
    expect(g.ecs.c.transform.get(drop)!.pos.z).toBeCloseTo(220);
    expect(g.ecs.c.transform.get(drop)!.pos.y).toBeCloseTo(g.world.ground(12, 220));
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(0);
    expect(g.ecs.c.actor.get(g.player.id)!.move).toBe('death');
    fallSystem(g);
    expect(g.ecs.query('drop')).toHaveLength(1);
  });

  it('does not kill an arena fight for standing off the world map', () => {
    const { g, player } = scriptedGame();
    const tr = g.ecs.c.transform.get(player)!;
    tr.pos = { x: -80, y: -4, z: -80 };
    tr.prev = { ...tr.pos };
    fallSystem(g);
    expect(g.ecs.c.health.get(player)!.hp).toBe(PLAYER.hp);
    g.cutscene = true;
    g.overworld = createWorldGame().overworld;
    fallSystem(g);
    expect(g.ecs.c.health.get(player)!.hp).toBe(PLAYER.hp);
  });

  it('marks pits, bridge gaps and wells as falls, and leaves mound banks solid', () => {
    let holes = 0;
    let banks = 0;
    let wells = 0;
    for (const d of worldLayout().dungeons) {
      for (const p of d.parts) {
        if (p.look === 'none' && p.solid && p.fall) holes++;
        if (p.look === 'none' && p.solid && !p.fall) banks++;
        if (p.shape === 'cyl' && p.look === 'rim' && p.fall) wells++;
      }
    }
    expect(holes).toBeGreaterThan(0);
    expect(banks).toBeGreaterThan(0);
    expect(wells).toBeGreaterThan(0);
    const g = scriptedGame().g;
    const pieces = worldLayout().pieces;
    const bridge = spawnPiece(g, pieces.find((p) => p.seal?.look === 'none')!);
    const door = spawnPiece(g, pieces.find((p) => p.seal?.look === 'wall')!);
    expect(g.ecs.c.piece.get(bridge)!.seal.every((c) => c.fall)).toBe(true);
    expect(g.ecs.c.piece.get(door)!.seal.every((c) => !c.fall)).toBe(true);
  });

  it('lets a mount take one step off the land, then stops', () => {
    const g = createWorldGame();
    g.world = { ground: () => 0, colliders: [], off: new Set(), contain: () => {} };
    g.overworld!.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length);
    // South edge of the university. z < 0 is owned by no region; east of the hub is still Providence.
    teleport(g, { x: 256, z: 4, yaw: Math.PI });
    expect(regionAt(256, 4)?.id).toBe('hub');
    for (const [id, bodyTr] of g.ecs.c.transform) if (id !== g.player.id) bodyTr.pos.x += 20000;
    expect(toggleMount(g)).toBe(true);
    g.player.mount.speed = 20;
    const m = g.ecs.c.mover.get(g.player.id)!;
    m.vx = 0;
    m.vz = -20;
    m.face = Math.PI;
    movementSystem(g, 0.25);
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    expect(regionAt(at.x, at.z)).toBeUndefined();
    expect(g.player.mount.speed).toBe(0);
  });
});

describe('a fall is not saved into (round 50)', () => {
  const pitAt = (x: number, z: number): Collider => ({ kind: 'box', fall: true, min: { x: x - 3, y: -9, z: z - 3 }, max: { x: x + 3, y: 9, z: z + 3 } });

  it('a save whose feet are in a pit wakes at the checkpoint, with the Echoes it carried', () => {
    const g = createWorldGame();
    const home = g.player.checkpoint;
    const spot = { x: home.x + 12, z: home.z + 9 };
    const save = { ...snapshot(g), at: { x: spot.x, z: spot.z, yaw: 0 }, echoes: 70 };
    const loaded = createWorldGame();
    loaded.world = { ...loaded.world, near: (x0, z0, x1, z1) => (x0 <= spot.x && x1 >= spot.x && z0 <= spot.z && z1 >= spot.z ? [pitAt(spot.x, spot.z)] : []) };
    applySave(loaded, save);
    const at = loaded.ecs.c.transform.get(loaded.player.id)!.pos;
    expect(Math.hypot(at.x - spot.x, at.z - spot.z)).toBeGreaterThan(5);
    expect(Math.hypot(at.x - home.x, at.z - home.z)).toBeLessThan(1);
    expect(loaded.player.echoes).toBe(70);
    fallSystem(loaded);
    expect(loaded.ecs.c.actor.get(loaded.player.id)!.move).not.toBe('death');
    expect(loaded.ecs.c.health.get(loaded.player.id)!.hp).toBeGreaterThan(0);
  });

  it('a save on ordinary ground loads where it was taken', () => {
    const g = createWorldGame();
    const home = g.player.checkpoint;
    const here = { x: home.x + 2, z: home.z + 2, yaw: 1 };
    const loaded = createWorldGame();
    applySave(loaded, { ...snapshot(g), at: here });
    const at = loaded.ecs.c.transform.get(loaded.player.id)!.pos;
    expect(at.x).toBeCloseTo(here.x);
    expect(at.z).toBeCloseTo(here.z);
  });
});
