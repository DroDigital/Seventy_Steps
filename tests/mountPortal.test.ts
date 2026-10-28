import { describe, expect, it } from 'vitest';
import { emptyInput, type InputFrame } from '../src/core/input';
import { CAMERA_MODES } from '../src/data/cameraModes';
import { MOUNT_IDS, MOUNT_QUEST, MOUNT_TRAVERSAL, type MountId } from '../src/data/mounts';
import { QUESTS } from '../src/data/quests';
import { gatePlace, travel } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { createWorldGame, stepGame } from '../src/systems/game';
import { gateStepSystem } from '../src/systems/gateWalk';
import { PORTAL_RIDE } from '../src/systems/mountPortal';
import { setAutomobileEntitlement, setChariotEntitlement } from '../src/systems/mounts';
import type { GatePlace } from '../src/world/placements';
import { yawOfDir } from '../src/world/worldMap';
import { goTo, run } from './worldHelpers';

const pos = (g: Game) => g.ecs.c.transform.get(g.player.id)!.pos;

function near(t: GatePlace, ahead: number, across: number): { x: number; z: number } {
  const yaw = yawOfDir(t.face);
  return { x: t.x + Math.sin(yaw) * ahead + Math.cos(yaw) * across, z: t.z + Math.cos(yaw) * ahead - Math.sin(yaw) * across };
}

function held(move = true): InputFrame {
  const input = emptyInput();
  if (move) input.moveY = 1;
  return input;
}

/** Unlocks the reins and sits the investigator on `id` at `speed`, just across `gate`'s veil, the walk begun. */
function breach(g: Game, gate: GatePlace, id: MountId, speed: number): void {
  g.overworld!.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length);
  if (id === 'chariot') setChariotEntitlement(g, true);
  if (id === 'automobile') setAutomobileEntitlement(g, true);
  const [a, b] = [near(gate, 1.5, 0), near(gate, 0.3, 0)];
  goTo(g, a.x, a.z);
  run(g, 1);
  Object.assign(g.player.mount, { selected: id, active: id, speed });
  const tr = g.ecs.c.transform.get(g.player.id)!;
  [tr.prev.x, tr.prev.z, tr.pos.x, tr.pos.z] = [a.x, a.z, b.x, b.z];
  gateStepSystem(g);
}

/** Finishes the walk into the veil. The step that arrives is the last of these. */
function arrive(g: Game): void {
  const frames = g.player.gatePass!.frames;
  run(g, frames);
}

describe('a chariot taken through a gate', () => {
  it('comes out mounted, at the pace it went in, and the driver\'s camera', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    const twin = gatePlace(gate.to)!;
    const speed = MOUNT_TRAVERSAL.gallop;
    breach(g, gate, 'grey', speed);
    expect(g.player.mount.speed).toBe(speed); // the walk does not brake it
    arrive(g);
    expect(g.player.gatePass).toBeNull();
    expect(g.player.mount.active).toBe('grey');
    expect(g.player.mount.speed).toBe(speed);
    expect(g.camera.mountLift).toBe(1.05);
    expect(g.camera.dist).toBeGreaterThan(CAMERA_MODES[g.camera.mode].distance);
    const yaw = g.ecs.c.transform.get(g.player.id)!.yaw;
    const along = Math.sin(yaw) * (pos(g).x - twin.arrive.x) + Math.cos(yaw) * (pos(g).z - twin.arrive.z);
    expect(along).toBeGreaterThan(0); // out of the gate, not back through it
    expect(Math.hypot(pos(g).x - gate.x, pos(g).z - gate.z)).toBeGreaterThan(20);
  });

  it('keeps that pace while the stick stays taken, then rides on as an ordinary mount', () => {
    for (const id of MOUNT_IDS) {
      const g = createWorldGame();
      const gate = gatePlace('hub_australia')!;
      const speed = MOUNT_TRAVERSAL.gallop;
      breach(g, gate, id, speed);
      arrive(g);
      stepGame(g, emptyInput()); // the journey's empty step: not a release, and not a brake
      expect(g.player.mount.active).toBe(id);
      expect(g.player.mount.speed).toBe(speed);
      for (let i = 0; i < PORTAL_RIDE.hold; i++) {
        stepGame(g, held());
        expect(g.player.mount.active).toBe(id);
        expect(g.player.mount.speed).toBe(speed); // no drop to a cruise, and no climb from a standstill
      }
      const at = pos(g).z;
      stepGame(g, held()); // the moment is over: still riding, the stick still taken
      expect(g.player.mount.active).toBe(id);
      expect(g.player.mount.speed).toBeGreaterThan(MOUNT_TRAVERSAL.cruise);
      expect(Math.abs(pos(g).z)).not.toBe(at);
    }
  });

  it('gives the pace back if the stick is taken again before the moment ends', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    const speed = MOUNT_TRAVERSAL.gallop;
    breach(g, gate, 'grey', speed);
    arrive(g);
    stepGame(g, emptyInput());
    for (let i = 0; i < 8; i++) stepGame(g, emptyInput());
    expect(g.player.mount.active).toBe('grey');
    expect(g.player.mount.speed).toBeLessThan(speed); // letting go brakes, the ride itself stays for the moment
    stepGame(g, held());
    expect(g.player.mount.speed).toBe(speed);
  });

  it('sets them down when the moment ends without the stick', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    breach(g, gate, 'grey', MOUNT_TRAVERSAL.cruise);
    arrive(g);
    stepGame(g, emptyInput());
    for (let i = 0; i < PORTAL_RIDE.hold; i++) {
      stepGame(g, emptyInput());
      expect(g.player.mount.active).toBe('grey');
    }
    stepGame(g, emptyInput());
    expect(g.player.mount.active).toBeNull();
    expect(g.player.mount.speed).toBe(0);
  });

  it('a blow on the way through, and a fast travel, still set them down', () => {
    const g = createWorldGame();
    const gate = gatePlace('hub_australia')!;
    breach(g, gate, 'grey', MOUNT_TRAVERSAL.gallop);
    run(g, 3);
    // The walk is out of reach, so a blow cannot land on its own; one that does (the Hit the mount already listens for) ends the carried ride, and they come through on foot.
    g.events.emit('Hit', { attacker: g.ecs.spawn(), target: g.player.id, outcome: 'hit', damage: 10 });
    expect(g.player.mount.active).toBeNull();
    arrive(g);
    expect(g.player.mount.active).toBeNull();
    expect(pos(g)).toMatchObject({ x: gatePlace(gate.to)!.arrive.x, z: gatePlace(gate.to)!.arrive.z });

    const h = createWorldGame();
    breach(h, gate, 'grey', MOUNT_TRAVERSAL.cruise);
    h.overworld!.discovered.add('hub_quad');
    expect(travel(h, 'hub_quad')).toBe(true); // a jump that is not the gate, even mid-crossing, still sets them down
    expect(h.player.mount.active).toBeNull();
    expect(h.player.gatePass).toBeNull();
    const at = { ...pos(h) };
    run(h, 30); // the abandoned walk does not pull them through the gate afterwards
    expect(pos(h)).toMatchObject({ x: at.x, z: at.z });
  });
});
