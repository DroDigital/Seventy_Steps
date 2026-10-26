/**
 * The shape of a body's blob shadow (round 83; render only, pure): its breadth follows how wide the body is painted, and
 * under a moon that casts shadows it is drawn out away from the moon, longer the lower the moon, so the contact shadow lies
 * the way the real one (render/moonShadow.ts, render/creatureCasters.ts) falls and not as a plain disc under the feet.
 */

import { BLOB } from '../data/fxTuning';

export interface Blob {
  /** Half-breadths: across the way it is drawn out, and along it (metres). */
  across: number;
  along: number;
  /** The yaw that turns the plane's +z to the way it is drawn out (rad), and how far its middle is moved that way (metres). */
  yaw: number;
  shift: number;
  /** How dark its heart (0..1). */
  alpha: number;
}

/**
 * A body of capsule radius `radius`, painted `painted` metres across (undefined: as its capsule), hovering `hover` metres;
 * `toMoon` is the unit direction to the moon, or null where the moon casts no shadows (a roof, the setting off, a moon too low).
 */
export function blobShape(radius: number, painted: number | undefined, hover: number, toMoon: { x: number; y: number; z: number } | null, out: Blob = { across: 0, along: 0, yaw: 0, shift: 0, alpha: 0 }): Blob {
  const k = 1 / (1 + hover * 0.5);
  const grow = painted && radius > 0 ? Math.min(BLOB.grow, Math.max(1, painted / (2 * radius))) : 1; // a colossus painted wider than its capsule keeps its shadow out from under its picture
  const r = radius * BLOB.base * k * grow;
  const flat = toMoon ? Math.hypot(toMoon.x, toMoon.z) : 0;
  const long = toMoon && flat > 1e-4 ? Math.min(BLOB.most, 1 + BLOB.draw * (1 - Math.min(1, Math.max(0, toMoon.y)))) : 1;
  out.across = r;
  out.along = r * long;
  out.yaw = long > 1 && toMoon ? Math.atan2(-toMoon.x, -toMoon.z) : 0;
  out.shift = r * (long - 1) * BLOB.shift;
  out.alpha = BLOB.dark * k * (1 - BLOB.thin * (long - 1)); // (a longer blob is lighter, so what it covers is not darker than before)
  return out;
}
