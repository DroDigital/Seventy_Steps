/**
 * How a horse-drawn rig comes round (round 52; pure). It follows a circle: the faster it goes, the wider the
 * tightest circle (`turnRadius`), so a turn takes it down to a walk and no further (`creep`): it never stops
 * to turn, and it never spins on the spot. A horse stepping round from a standstill (`pivot`) is the one exception to
 * the circle, and it fades out as the pace quickens. The turn takes hold and lets go over a few tenths of a second
 * (`accel`), and the rig's yaw never passes the heading it is coming round to. The car keeps the arcade steering
 * it always had, with the pace it keeps while coming round raised from a stop to a creep.
 */

import { wrapAngle } from '../core/geom';
import { MOUNT_TRAVERSAL as T, type MountTurning } from '../data/mounts';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number): number => {
  const k = clamp((x - a) / (b - a), 0, 1);
  return k * k * (3 - 2 * k);
};

/** The tightest circle (metres) a rig can follow at `speed`. */
export const turnRadius = (speed: number, k: MountTurning): number => k.radius[0] + (k.radius[1] - k.radius[0]) * clamp(speed / T.gallop, 0, 1) ** 1.5;

/** The fastest it may turn (rad/s) at `speed`. */
export const turnCap = (speed: number, k: MountTurning): number => Math.max(speed / turnRadius(speed, k), k.pivot * clamp(1 - speed / 4, 0, 1));

/** The pace it takes a heading `error` radians off: all of what is asked for a small one, a creep for a turn about. */
export function paceFor(target: number, error: number, k: MountTurning): number {
  return target + (Math.min(target, k.creep) - target) * smooth(0.35, 1.9, Math.abs(error));
}

export interface Steered {
  yawRate: number; // rad/s, positive to the left (yaw increasing)
  speed: number; // m/s
}

/**
 * One step of steering toward `face` (null: no heading asked for: it comes to a stop, straight) at up to `target` m/s.
 * `yawRate` and `speed` are the rig's now.
 */
export function steerHorse(k: MountTurning, yawRate: number, speed: number, yaw: number, face: number | null, target: number, dt: number): Steered {
  const error = face === null ? 0 : wrapAngle(face - yaw);
  const goal = face === null ? 0 : paceFor(target, error, k);
  const change = (goal > speed ? T.acceleration : T.braking) * dt;
  const next = speed + clamp(goal - speed, -change, change);
  const cap = turnCap(Math.max(speed, next), k);
  const want = face === null ? 0 : clamp(error * 5, -cap, cap);
  let rate = clamp(yawRate + clamp(want - yawRate, -k.accel * dt, k.accel * dt), -cap, cap);
  if (face !== null && Math.sign(rate) === Math.sign(error) && Math.abs(rate * dt) > Math.abs(error)) rate = error / dt; // never past the heading it is coming round to
  return { yawRate: rate, speed: next };
}

/** The car's steering: a fixed rate, and the pace held down to a creep while it points the wrong way, never to nothing. */
export function steerArcade(k: MountTurning, speed: number, yaw: number, face: number | null, target: number, dt: number, sprinting: boolean): Steered {
  const rate = sprinting ? T.gallopTurnRate : T.turnRate;
  const error = face === null ? 0 : wrapAngle(face - yaw);
  const step = clamp(error, -rate * dt, rate * dt);
  const alignment = face === null ? 1 : Math.max(0, Math.cos(error));
  const goal = face === null ? target : Math.max(target * alignment, Math.min(target, k.creep));
  const change = (goal > speed ? T.acceleration : T.braking) * dt;
  return { yawRate: step / dt, speed: speed + clamp(goal - speed, -change, change) };
}
