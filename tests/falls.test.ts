import { describe, expect, it } from 'vitest';
import { MOUNT_QUEST } from '../src/data/mounts';
import { QUESTS } from '../src/data/quests';
import { FALL, PLAYER, SIM } from '../src/data/tuning';
import { shove, strike } from '../src/systems/combat';
import { fallDark, fallSystem } from '../src/systems/falls';
import { restore } from '../src/systems/death';
import { playerControl } from '../src/systems/playerControl';
import { emptyInput } from '../src/core/input';
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


describe('a ledge is a fall, not a wall of death (round 54)', () => {
  /** A pit east of the hub's spawn, on flat ground, and the investigator on its western lip. */
  function atTheLip() {
    const g = createWorldGame();
    const home = g.player.checkpoint;
    const pit: Collider = { kind: 'box', fall: true, min: { x: home.x + 10, y: -9, z: home.z - 3 }, max: { x: home.x + 16, y: 9, z: home.z + 3 } };
    g.world = { ground: () => 0, colliders: [pit], off: new Set(), contain: () => {} };
    const tr = g.ecs.c.transform.get(g.player.id)!;
    const place = (x: number): void => {
      tr.prev = { x: tr.pos.x, y: 0, z: home.z };
      tr.pos = { x, y: 0, z: home.z };
    };
    return { g, tr, pit, place, home };
  }

  it('lets the body balance on the very edge and step back: nothing begins while any of the feet is on the floor', () => {
    const { g, tr, pit, place } = atTheLip();
    const fell: string[] = [];
    g.events.on('Fell', () => void fell.push('Fell'));
    place(pit.min.x - PLAYER.radius + 0.1); // the capsule hangs over the void by a hand's breadth: the centre is a stride short of it
    fallSystem(g);
    for (const over of [0.05, 0.12, FALL.foot - 0.01]) { // the centre over the void, a heel still on the stone
      place(pit.min.x + over);
      fallSystem(g);
      expect(g.player.falling).toBeNull();
      expect(g.ecs.c.actor.get(g.player.id)!.move).toBeNull(); // no animation is begun that would condemn a body that can still save itself
    }
    place(pit.min.x - 0.5); // stepping back
    fallSystem(g);
    expect(g.player.falling).toBeNull();
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(PLAYER.hp);
    expect(fell).toEqual([]);
    expect(tr.pos.x).toBeCloseTo(pit.min.x - 0.5);
  });

  it('falls only when none of the feet has the floor, along any side of the drop', () => {
    const { g, pit, place, home } = atTheLip();
    place(pit.min.x + FALL.foot + 0.03);
    fallSystem(g);
    expect(g.player.falling).not.toBeNull();
    // The far side too, and the corner: a ring that still reaches the floor keeps the body up.
    const again = atTheLip();
    again.place(pit.max.x - FALL.foot + 0.03);
    fallSystem(again.g);
    expect(again.g.player.falling).toBeNull();
    again.place(pit.max.x - FALL.foot - 0.03);
    fallSystem(again.g);
    expect(again.g.player.falling).not.toBeNull();
    const corner = atTheLip();
    corner.tr.pos = { x: pit.min.x + FALL.foot * 0.8, y: 0, z: home.z - 3 + FALL.foot * 0.8 }; // over the corner by less than a foot each way
    fallSystem(corner.g);
    expect(corner.g.player.falling).toBeNull();
  });

  it('goes over, falls for a second and a bit with the run-up carried a little way, and dies at the foot of the drop', () => {
    const { g, tr, pit, place } = atTheLip();
    const events: string[] = [];
    let died: { x: number; y: number; z: number } | undefined;
    g.events.on('Fell', () => void events.push('Fell'));
    g.events.on('Died', ({ entity, at }) => {
      if (entity !== g.player.id) return;
      events.push('Died');
      died = at;
    });
    g.player.echoes = 55;
    place(pit.min.x - 0.2);
    fallSystem(g); // safe: the last feet are stored here
    const lip = { x: tr.pos.x, z: tr.pos.z };
    tr.prev = { ...tr.pos };
    tr.pos = { ...tr.pos, x: pit.min.x + 0.25 }; // a run of 6 m/s a frame over: no part of the feet is on the floor
    tr.prev.x = tr.pos.x - 6 / SIM.hz;
    fallSystem(g);
    expect(g.player.falling).not.toBeNull();
    expect(events).toEqual(['Fell']);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(PLAYER.hp); // alive: it is a fall, not a wall
    const x0 = tr.pos.x;
    let last = tr.pos.y;
    for (let i = 1; i < FALL.frames; i++) {
      movementSystem(g, 1 / SIM.hz); // the ground has no say over the falling body
      fallSystem(g);
      expect(tr.pos.y).toBeLessThan(last);
      last = tr.pos.y;
      expect(g.ecs.c.actor.get(g.player.id)!.move).not.toBe('death');
    }
    expect(tr.pos.x - x0).toBeGreaterThan(0.1); // the run-up carried it on...
    expect(tr.pos.x - x0).toBeLessThan(0.5); // ...but not across the pit
    expect(last).toBeLessThan(-8); // a deep drop
    expect(events).toEqual(['Fell']);
    movementSystem(g, 1 / SIM.hz);
    fallSystem(g); // the last frame of the drop
    expect(events).toEqual(['Fell', 'Died']);
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(0);
    expect(g.ecs.c.actor.get(g.player.id)!.move).toBe('death');
    expect(died!.x).toBeCloseTo(lip.x);
    expect(died!.z).toBeCloseTo(lip.z);
    const [drop] = g.ecs.query('drop');
    expect(g.ecs.c.drop.get(drop)!.amount).toBe(55);
    expect(g.ecs.c.transform.get(drop)!.pos.x).toBeCloseTo(lip.x); // the Echoes wait on the ground at the lip, not in the pit
    for (let i = 0; i < 90; i++) movementSystem(g, 1 / SIM.hz);
    expect(tr.pos.y).toBeLessThan(-8); // and the body stays where it fell until the waking
    restore(g, g.player.id, g.player.checkpoint);
    expect(g.player.falling).toBeNull();
    expect(tr.pos.y).toBeGreaterThan(-1);
  });

  it('lets go of what the body was doing, and hears no input while it falls', () => {
    const { g, tr, pit, place } = atTheLip();
    place(pit.min.x - 0.2);
    fallSystem(g);
    Object.assign(g.player, { sprinting: true, dodgeHeld: 20, blockHeld: true });
    tr.prev = { ...tr.pos };
    tr.pos.x = pit.min.x + 0.25;
    fallSystem(g);
    expect(g.player.falling).not.toBeNull();
    expect(g.player.sprinting).toBe(false);
    expect(g.player.dodgeHeld).toBe(-1);
    expect(g.player.blockHeld).toBe(false);
    const input = emptyInput();
    input.moveY = 1;
    input.pressed.light = true;
    playerControl(g, input);
    const m = g.ecs.c.mover.get(g.player.id)!;
    expect([m.vx, m.vz]).toEqual([0, 0]);
    expect(g.player.buffer.action).toBeNull(); // a press while falling is not queued for the waking
  });

  it('cannot be struck or shoved by any source while it falls, a ground strike included (Codex, PR #132)', () => {
    const { g, tr, pit, place } = atTheLip();
    place(pit.min.x + 0.25);
    fallSystem(g);
    expect(g.player.falling).not.toBeNull();
    const sky = g.ecs.spawn(); // a body of no kind, as a bolt from the sky is dealt (skyStrikes.ts)
    g.ecs.c.transform.set(sky, { pos: { ...tr.pos }, prev: { ...tr.pos }, yaw: 0, prevYaw: 0 });
    const outcome = strike(g, sky, g.player.id, { damage: 500, poise: 99, guard: 0, hitstop: 6, parryable: false, interrupts: false, unblockable: true }, tr.pos);
    expect(outcome).toBe('dodged');
    expect(g.ecs.c.health.get(g.player.id)!.hp).toBe(PLAYER.hp);
    const at = { ...tr.pos };
    shove(g, g.player.id, { x: at.x - 2, y: at.y, z: at.z }, 3);
    expect(g.ecs.c.shove.has(g.player.id)).toBe(false);
    g.player.falling = null; // and once up again, the same bolt strikes
    expect(strike(g, sky, g.player.id, { damage: 5, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false, unblockable: true }, tr.pos)).not.toBe('dodged');
  });

  it('closes the picture to black as the drop goes on, and holds it black until the waking', () => {
    const f = (frame: number) => fallDark({ frame, vy: 0, vx: 0, vz: 0, spin: 1, lip: { x: 0, y: 0, z: 0 } });
    expect(fallDark(null)).toBe(0);
    expect(f(0)).toBe(0);
    expect(f(Math.floor(FALL.frames * FALL.dark[0]))).toBe(0);
    let before = 0;
    for (let i = 0; i <= FALL.frames; i++) {
      expect(f(i)).toBeGreaterThanOrEqual(before);
      before = f(i);
    }
    expect(f(FALL.frames)).toBe(1);
    expect(f(FALL.frames + 150)).toBe(1);
  });
});
