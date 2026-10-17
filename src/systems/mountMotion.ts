/** Swept, substepped locomotion for every mount appearance. The investigator keeps their ordinary hurtbox. */
import { wrapAngle, type V3 } from '../core/geom';
import { MOUNT_TRAVERSAL, MOUNT_TURNING } from '../data/mounts';
import { WORLD } from '../data/tuning';
import { inDungeon } from '../world/terrain';
import { regionAt } from '../world/worldMap';
import { cyclesFor } from './mountGait';
import { steerArcade, steerHorse } from './mountSteer';
import type { Game } from './components';
import { footprintClear, mountFootprintForbidden, mountPlaceForbidden } from './mountGround';

/** The coast, the sea or the abyss, where nothing stops the mount first: one step is taken, then the fall kills. (In play the world's containing wall stops the ride a rider's length short of the land's edge: it is on foot that the edge is walked off.) */
function environmentalDrop(g: Game, at: V3): boolean {
  if (!g.overworld || inDungeon(at.x, at.z)) return false;
  return !regionAt(at.x, at.z) || at.y <= WORLD.seaLevel + 0.4;
}

/** `idle` is on foot. `rode` kept the saddle. `drop` reached a dungeon or a boss arena. */
export type MountMove = 'idle' | 'rode' | 'drop';

const JAM_FRAMES = 6; // frames wanting to turn and unable to, before the rig is backed off what it is against
const NUDGE = 0.1; // radians a rig may swing from its heading to scrape past a corner, in a step
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * A turn of `dyaw` radians about the rig's seat, as much of it as the world allows: all of it, half, a quarter, none. The footprint is
 * the whole length of the rig, which swings out as it comes round; where it cannot, it does not.
 */
function turnBy(g: Game, tr: { pos: V3; yaw: number }, dyaw: number): number {
  for (const share of [1, 0.5, 0.25]) {
    if (footprintClear(g, tr.pos, tr.yaw + dyaw * share, true)) {
      tr.yaw = wrapAngle(tr.yaw + dyaw * share);
      return dyaw * share;
    }
  }
  return 0;
}

/**
 * A rig that wants to come round and can neither turn nor go on is against something that its swing would hit: it is
 * backed off, a handful of centimetres at a time, in whatever direction is clear (behind first), turning as it goes.
 */
function backOff(g: Game, tr: { pos: V3; yaw: number }, want: number): boolean {
  const behind = tr.yaw + Math.PI;
  for (const dist of [0.2, 0.45]) {
    for (const k of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) {
      const a = behind + (k * Math.PI) / 6;
      const at = { x: tr.pos.x + Math.sin(a) * dist, y: 0, z: tr.pos.z + Math.cos(a) * dist };
      at.y = g.world.ground(at.x, at.z);
      for (const share of [1, 0.5, 0]) {
        if (!footprintClear(g, at, tr.yaw + want * share, true)) continue;
        Object.assign(tr.pos, at);
        tr.yaw = wrapAngle(tr.yaw + want * share);
        return true;
      }
    }
  }
  return false;
}

export function moveMounted(g: Game, dt: number): MountMove {
  const p = g.player;
  const mount = p.mount;
  if (!mount.active) return 'idle';
  const tr = g.ecs.c.transform.get(p.id)!;
  if (mountPlaceForbidden(tr.pos.x, tr.pos.z)) return 'drop';
  const m = g.ecs.c.mover.get(p.id)!;
  const t = MOUNT_TRAVERSAL;
  const k = MOUNT_TURNING[mount.active];
  const target = Math.hypot(m.vx, m.vz);
  const steered = k.arcade ? steerArcade(k, mount.speed, tr.yaw, m.face, target, dt, p.sprinting) : steerHorse(k, mount.yawRate, mount.speed, tr.yaw, m.face, target, dt);
  mount.speed = steered.speed;
  // The rig comes round about its seat, as much as the world lets it; the horse and the carriage never strafe.
  const asked = steered.yawRate * dt;
  const turned = asked === 0 ? 0 : turnBy(g, tr, asked);
  mount.yawRate = turned / dt;
  const wanting = m.face !== null && Math.abs(wrapAngle(m.face - tr.yaw)) > 0.12 && Math.abs(asked) > 1e-4 && Math.abs(turned) < Math.abs(asked) * 0.5;
  const distance = mount.speed * dt;
  const n = Math.max(1, Math.ceil(distance / t.substep));
  const step = distance / n;
  let blocked = false;
  for (let i = 0; i < n; i++) {
    const [sx, sz] = [Math.sin(tr.yaw) * step, Math.cos(tr.yaw) * step];
    const next = { x: tr.pos.x + sx, y: tr.pos.y, z: tr.pos.z + sz };
    next.y = g.world.ground(next.x, next.z);
    if (environmentalDrop(g, next)) {
      Object.assign(tr.pos, next);
      mount.speed = 0;
      p.sprinting = false;
      break;
    }
    const climb = Math.max(t.maxStep, step * t.maxSlope);
    if (Math.abs(next.y - tr.pos.y) <= climb && footprintClear(g, next, tr.yaw, true)) {
      Object.assign(tr.pos, next);
      mount.phase += cyclesFor(step, mount.speed);
      continue;
    }
    // Something in the way. A rider steering round it scrapes past, swung a little toward where they want to go; one driving straight at it stops.
    const error = m.face === null ? 0 : wrapAngle(m.face - tr.yaw);
    let slid = false;
    for (const swing of Math.abs(error) > 0.12 ? [Math.sign(error) * NUDGE] : []) {
      const yaw = wrapAngle(tr.yaw + swing);
      const slide = { x: tr.pos.x + Math.sin(yaw) * step, y: tr.pos.y, z: tr.pos.z + Math.cos(yaw) * step };
      slide.y = g.world.ground(slide.x, slide.z);
      if (Math.abs(slide.y - tr.pos.y) > climb || !footprintClear(g, slide, yaw, true)) continue;
      Object.assign(tr.pos, slide);
      tr.yaw = yaw;
      mount.phase += cyclesFor(step, mount.speed);
      slid = true;
      break;
    }
    if (slid) continue;
    blocked = true;
    mount.speed = 0;
    p.sprinting = false;
    if (mountFootprintForbidden(next, tr.yaw)) return 'drop';
    break;
  }
  // Wanting to come round, unable to, and unable to go on: against something its swing would hit. It is backed off it.
  mount.jam = wanting && (blocked || mount.speed < 0.3) ? mount.jam + 1 : 0;
  if (mount.jam >= JAM_FRAMES && mount.jam % 2 === 0 && m.face !== null) {
    const error = wrapAngle(m.face - tr.yaw);
    if (backOff(g, tr, clamp(error, -0.03, 0.03))) mount.speed = Math.max(mount.speed, k.creep * 0.5);
  }
  return 'rode';
}
