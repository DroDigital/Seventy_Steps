/**
 * A chariot taken through a realm's gate (asked: seamless transition portals for chariot travel). The walk into the
 * veil and the teleport beyond it used to set the rider down and zero the pace, so the far side was always begun from
 * a standstill. The mount, its gait and its pace now stay through the crossing. The veil's walk owns the body (the
 * stick is emptied while it does), and the step after is the journey's one empty step, so neither is read as the
 * reins being given up. For a moment after that the ride is kept: while the stick stays taken the pace cannot fall
 * below what it was at the veil, and when the moment ends a held stick leaves an ordinary ride at that pace. Letting
 * the stick go ends the ride. A blow, a rest, a fast travel and a gate that does not open still dismiss, as before.
 * Every appearance, not only the plain chariot: the three share one traversal, and a paid one is not a worse gate.
 * Pure: no Three.js.
 */

import type { InputFrame } from '../core/input';
import { CAMERA_MODES } from '../data/cameraModes';
import type { Game } from './components';

/** The moment the ride is kept after the crossing, once the stick is the rider's again. */
export const PORTAL_RIDE = {
  hold: 36, // frames, 0.6 s: long enough to still be holding the stick they rode in with, short of a ride they have let go
};

interface Carry {
  speed: number; // m/s at the veil: the floor while the stick is held
  mode: 'veil' | 'hold';
  left: number; // hold frames still to come
  pin: boolean; // this step the pace is kept
  closing: boolean; // the hold has been read; the next step leaves it
}

const rides = new WeakMap<Game, Carry>();

/** The crossing is under way: the gate's teleport and its Travelled must not set the rider down. */
export const portalVeil = (g: Game): boolean => rides.get(g)?.mode === 'veil';

/** True while a carried ride should keep the driver's camera (the boom the teleport would otherwise put on foot). */
export const portalCamera = (g: Game): boolean => rides.has(g) && !!g.player.mount.active;

/** Steps into a gate's veil. A rider is noted and kept; one on foot leaves nothing to carry. */
export function notePortalRide(g: Game): void {
  const m = g.player.mount;
  if (!m.active) {
    rides.delete(g);
    return;
  }
  rides.set(g, { speed: m.speed, mode: 'veil', left: 0, pin: true, closing: false });
}

/** The gate did not open: nothing is owed on the far side. */
export function clearPortalRide(g: Game): void {
  rides.delete(g);
}

/**
 * One step, before the mount is moved. Returns true when the momentary ride is over and the stick was not held:
 * the caller sets them down. The veil and the journey's empty step pin the pace and do not read the stick.
 */
export function stepPortalRide(g: Game, input: InputFrame): boolean {
  const carry = rides.get(g);
  if (!carry) return false;
  if (!g.player.mount.active) {
    rides.delete(g);
    return false;
  }
  if (carry.closing) {
    const drop = !carry.pin;
    rides.delete(g);
    return drop;
  }
  if (carry.mode === 'veil') {
    carry.pin = true;
    if (g.player.gatePass) return false;
    carry.mode = 'hold';
    carry.left = PORTAL_RIDE.hold;
    return false; // the journey's empty step, or the first step a test takes after the teleport: not yet the rider's hand
  }
  carry.pin = Math.hypot(input.moveX, input.moveY) > 0.1;
  if (--carry.left <= 0) carry.closing = true;
  return false;
}

/** The pace a carried ride may not fall below this step, or null when the stick is free or the ride is ordinary again. */
export function portalSpeedFloor(g: Game): number | null {
  const carry = rides.get(g);
  return carry?.pin && g.player.mount.active ? carry.speed : null;
}

/** Puts the driver's boom back after the gate's teleport has set a boom for someone on foot. */
export function keepPortalCamera(g: Game): void {
  if (!portalCamera(g)) return;
  const tune = CAMERA_MODES[g.camera.mode];
  g.camera.mountLift = g.camera.prevMountLift = 1.05;
  g.camera.dist = g.camera.prevDist = g.camera.reach = tune.mountDistance;
}
