import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { MOUNTS, MOUNT_QUEST, MOUNT_TRAVERSAL } from '../src/data/mounts';
import { QUESTS } from '../src/data/quests';
import { CAMERA, PLAYER, SIM } from '../src/data/tuning';
import { discover, rest, teleport, travel } from '../src/systems/checkpoints';
import { strike } from '../src/systems/combat';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { mountAvailable, mountBar, controlMount, dismissMount, mountSystem, selectMount, setAutomobileEntitlement, toggleMount } from '../src/systems/mounts';
import { movementSystem } from '../src/systems/movement';
import { talk } from '../src/systems/npcs';
import { playerControl } from '../src/systems/playerControl';
import { isDone, questSystem, stageOf } from '../src/systems/quests';
import { parseSave, snapshot } from '../src/systems/save';
import { vitalsSystem } from '../src/systems/vitals';
import { restore } from '../src/systems/death';
import { worldLayout } from '../src/world/placements';

/** An open patch of quad without random scenery; world access checks still use the real layout. */
function openGame(): Game {
  const g = createWorldGame();
  g.world = { ground: () => 0, colliders: [], off: new Set(), contain: () => {} };
  teleport(g, { x: 256, z: 240, yaw: 0 });
  g.overworld!.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length);
  return g;
}

function ride(g: Game, frames: number, gallop = false, dt = 1 / SIM.hz): void {
  const input = emptyInput();
  input.moveY = 1;
  input.held.dodge = gallop;
  if (gallop) input.pressed.dodge = true;
  for (let i = 0; i < frames; i++) {
    controlMount(g, input);
    movementSystem(g, dt);
    vitalsSystem(g, dt);
    input.pressed.dodge = false;
  }
}

describe('the borrowed reins', () => {
  it('offers an early quest and unlocks the free chariot without a kill, purchase or consumable', () => {
    const g = createWorldGame();
    expect(stageOf(g, MOUNT_QUEST)).toBe(0);
    expect(mountAvailable(g, 'chariot')).toBe(false);
    talk(g, 'peaslee');
    expect(stageOf(g, MOUNT_QUEST)).toBe(1);
    discover(g, 'hub_dream');
    g.frame = 30;
    questSystem(g);
    expect(isDone(g, MOUNT_QUEST)).toBe(true);
    expect(g.overworld!.slain.size).toBe(0);
    expect(mountAvailable(g, 'chariot')).toBe(true);
    expect(mountAvailable(g, 'automobile')).toBe(false);
    expect(selectMount(g, 'automobile')).toBe(false);
    setAutomobileEntitlement(g, true);
    expect(mountAvailable(g, 'automobile')).toBe(true);
  });

  it('does not unlock either appearance merely because the optional DLC is owned', () => {
    const g = createWorldGame();
    setAutomobileEntitlement(g, true);
    expect(mountAvailable(g, 'chariot')).toBe(false);
    expect(mountAvailable(g, 'automobile')).toBe(false);
  });

  it('uses the identical immutable traversal model and produces the same motion and stamina for both', () => {
    expect(MOUNTS.chariot.traversal).toBe(MOUNTS.automobile.traversal);
    expect(Object.isFrozen(MOUNT_TRAVERSAL)).toBe(true);
    expect(Object.isFrozen(MOUNT_TRAVERSAL.offsets)).toBe(true);
    const results = (['chariot', 'automobile'] as const).map((id) => {
      const g = openGame();
      setAutomobileEntitlement(g, true);
      selectMount(g, id);
      expect(toggleMount(g)).toBe(true);
      ride(g, 60, true);
      return { at: { ...g.ecs.c.transform.get(g.player.id)!.pos }, stamina: g.ecs.c.stamina.get(g.player.id)!.value, speed: g.player.mount.speed };
    });
    expect(results[0]).toEqual(results[1]);
    expect(results[0].speed).toBeGreaterThan(PLAYER.sprintSpeed);
    expect(results[0].stamina).toBeLessThan(PLAYER.stamina);
  });

  it('accelerates, brakes and steers its heading instead of translating sideways', () => {
    const g = openGame();
    expect(toggleMount(g)).toBe(true);
    ride(g, 50);
    expect(g.player.mount.speed).toBeCloseTo(MOUNT_TRAVERSAL.cruise);
    const before = g.ecs.c.transform.get(g.player.id)!.yaw;
    const turn = emptyInput();
    turn.moveX = 1;
    controlMount(g, turn);
    movementSystem(g, 1 / SIM.hz);
    expect(Math.abs(g.ecs.c.transform.get(g.player.id)!.yaw - before)).toBeLessThan(0.04);
    controlMount(g, emptyInput());
    const oldSpeed = g.player.mount.speed;
    movementSystem(g, 1 / SIM.hz);
    expect(g.player.mount.speed).toBeLessThan(oldSpeed);
    expect(g.player.mount.speed).toBeGreaterThan(0);
  });

  it('cannot sweep through a thin wall at maximum speed, including a long step', () => {
    const results = (['chariot', 'automobile'] as const).map((id) => {
      const g = openGame();
      setAutomobileEntitlement(g, true);
      selectMount(g, id);
      toggleMount(g);
      g.world.colliders.push({ kind: 'box', min: { x: 250, y: -1, z: 246 }, max: { x: 262, y: 5, z: 246.02 } });
      g.player.mount.speed = MOUNT_TRAVERSAL.gallop;
      const m = g.ecs.c.mover.get(g.player.id)!;
      m.vx = 0; m.vz = MOUNT_TRAVERSAL.gallop; m.face = 0;
      movementSystem(g, 1);
      const pos = g.ecs.c.transform.get(g.player.id)!.pos;
      expect(pos.z + Math.max(...MOUNT_TRAVERSAL.offsets) + MOUNT_TRAVERSAL.radius).toBeLessThanOrEqual(246);
      expect(g.player.mount.speed).toBe(0);
      return pos.z;
    });
    expect(results[0]).toBe(results[1]);
  });

  it('refuses cramped summons without pushing or teleporting the investigator', () => {
    const g = openGame();
    const pos = g.ecs.c.transform.get(g.player.id)!.pos;
    g.world.colliders.push({ kind: 'box', min: { x: 255.4, y: -1, z: 241 }, max: { x: 256.6, y: 4, z: 242 } });
    const before = { ...pos };
    expect(toggleMount(g)).toBe(false);
    expect(pos).toEqual(before);
    expect(mountBar(g)).toContain('clear ground');
  });

  it('stops its whole footprint at another body and consumes wind shoves after dismounting', () => {
    const g = openGame();
    expect(toggleMount(g)).toBe(true);
    const obstacle = g.ecs.spawn();
    const pos = { x: 256, y: 0, z: 248 };
    g.ecs.c.transform.set(obstacle, { pos, prev: { ...pos }, yaw: 0, prevYaw: 0 });
    g.ecs.c.body.set(obstacle, { radius: 0.6, height: 1.8, aimHeight: 1.5, fixed: true });
    ride(g, 90);
    expect(g.ecs.c.transform.get(g.player.id)!.pos.z + Math.max(...MOUNT_TRAVERSAL.offsets) + MOUNT_TRAVERSAL.radius).toBeLessThanOrEqual(248 - 0.6);
    g.ecs.c.shove.set(g.player.id, { x: 0.1, z: 0, frames: 2 });
    movementSystem(g, 1 / SIM.hz);
    expect(g.player.mount.active).toBe(null);
    expect(g.ecs.c.shove.get(g.player.id)?.frames).toBe(1);
    movementSystem(g, 1 / SIM.hz);
    expect(g.ecs.c.shove.has(g.player.id)).toBe(false);
  });

  it('refuses dungeons, boss grounds, floods and ground below the waterline', () => {
    const g = openGame();
    const room = worldLayout().dungeons[0].layout.rooms[0];
    teleport(g, { x: room.x, z: room.z, yaw: 0 });
    expect(toggleMount(g)).toBe(false);
    const arena = worldLayout().arenas[0];
    teleport(g, { x: arena.x, z: arena.z, yaw: 0 });
    expect(toggleMount(g)).toBe(false);
    teleport(g, { x: 256, z: 240, yaw: 0 });
    g.reality.flood = 1;
    expect(toggleMount(g)).toBe(false);
    g.reality.flood = 0;
    g.world.ground = () => -4;
    teleport(g, { x: 256, z: 240, yaw: 0 });
    expect(toggleMount(g)).toBe(false);
  });

  it('stalls before unsafe water and slopes', () => {
    for (const ground of [
      (_x: number, z: number) => z > 247 ? -4 : 0,
      (_x: number, z: number) => Math.max(0, z - 247) * 2,
    ]) {
      const g = openGame();
      g.world.ground = ground;
      expect(toggleMount(g)).toBe(true);
      ride(g, 90);
      expect(g.ecs.c.transform.get(g.player.id)!.pos.z).toBeLessThan(247);
      expect(g.player.mount.speed).toBe(0);
    }
  });

  it('dissolves on damage and cannot grant invulnerability, replenish stamina or bypass recovery', () => {
    const g = openGame();
    const health = g.ecs.c.health.get(g.player.id)!;
    const stamina = g.ecs.c.stamina.get(g.player.id)!;
    stamina.value = 23;
    expect(toggleMount(g)).toBe(true);
    expect(stamina.value).toBe(23);
    const attacker = g.ecs.spawn();
    const before = health.hp;
    const outcome = strike(g, attacker, g.player.id, { damage: 10, poise: 0, guard: 0, hitstop: 0, parryable: false, interrupts: false });
    expect(outcome).toBe('hit');
    expect(health.hp).toBeLessThan(before);
    expect(g.player.mount.active).toBe(null);
    expect(toggleMount(g)).toBe(false);
    expect(stamina.value).toBe(23);
    g.frame = g.player.mount.cooldownUntil;
    const a = g.ecs.c.actor.get(g.player.id)!;
    a.move = 'dodge';
    a.frame = 6;
    expect(toggleMount(g)).toBe(false);
    expect(a.move).toBe('dodge');
    expect(a.frame).toBe(6);
  });

  it('dismisses before combat, and releasing gallop does not queue a dodge', () => {
    const g = openGame();
    toggleMount(g);
    const release = emptyInput();
    release.released.dodge = true;
    g.player.dodgeHeld = 20;
    playerControl(g, release);
    expect(g.player.buffer.action).toBe(null);
    expect(g.player.mount.active).toBe('chariot');
    const attack = emptyInput();
    attack.pressed.light = true;
    playerControl(g, attack);
    expect(g.player.mount.active).toBe(null);
    expect(g.player.buffer.action).toBe('light');
  });

  it('dismisses for rest, travel, teleport, death and lost ownership', () => {
    const g = openGame();
    toggleMount(g);
    expect(rest(g, 'hub_quad')).toBe(true);
    expect(g.player.mount.active).toBe(null);
    g.player.kneeling = null;
    toggleMount(g);
    expect(travel(g, 'hub_quad')).toBe(true);
    expect(g.player.mount.active).toBe(null);
    teleport(g, { x: 256, z: 240, yaw: 0 });
    toggleMount(g);
    teleport(g, { x: 260, z: 240, yaw: 0 });
    expect(g.player.mount.active).toBe(null);
    toggleMount(g);
    g.events.emit('Died', { entity: g.player.id, killer: null, at: { ...g.ecs.c.transform.get(g.player.id)!.pos } });
    expect(g.player.mount.active).toBe(null);
    setAutomobileEntitlement(g, true);
    selectMount(g, 'automobile');
    toggleMount(g);
    setAutomobileEntitlement(g, false);
    expect(g.player.mount.active).toBe(null);
    expect(g.player.mount.selected).toBe('chariot');
    expect(mountAvailable(g, 'automobile')).toBe(false);
    dismissMount(g);
    mountSystem(g);
  });

  it('resets the mounted camera before frozen destination or respawn frames are drawn', () => {
    const g = openGame();
    for (const arrive of [() => teleport(g, { x: 260, z: 240, yaw: 0 }), () => restore(g, g.player.id, { x: 260, z: 240, yaw: 0 })]) {
      Object.assign(g.camera, { mountLift: 1.05, prevMountLift: 1.05, dist: 8.5, prevDist: 8.5 });
      arrive();
      expect(g.camera.mountLift).toBe(0);
      expect(g.camera.prevMountLift).toBe(0);
      expect(g.camera.dist).toBe(CAMERA.distance);
      expect(g.camera.prevDist).toBe(CAMERA.distance);
    }
  });

  it('saves progress and preference, never active state or runtime ownership; older saves remain readable', () => {
    const g = openGame();
    setAutomobileEntitlement(g, true);
    selectMount(g, 'automobile');
    toggleMount(g);
    const s = snapshot(g);
    expect(s.mount).toBe('automobile');
    const loaded = createWorldGame({ save: parseSave(JSON.stringify({ ...s, automobileOwned: true, activeMount: 'automobile' }))! });
    expect(mountAvailable(loaded, 'chariot')).toBe(true);
    expect(loaded.player.mount.selected).toBe('automobile');
    expect(loaded.player.mount.active).toBe(null);
    expect(loaded.player.mount.automobileOwned).toBe(false);
    expect(mountAvailable(loaded, 'automobile')).toBe(false);
    setAutomobileEntitlement(loaded, false);
    expect(loaded.player.mount.selected).toBe('chariot');
    expect(mountAvailable(loaded, 'chariot')).toBe(true);
    delete s.mount;
    expect(parseSave(JSON.stringify(s))).not.toBe(null);
    expect(createWorldGame({ save: s }).player.mount.selected).toBe('chariot');
    expect(parseSave(JSON.stringify({ ...s, mount: 'forged' }))).toBe(null);
  });
});
