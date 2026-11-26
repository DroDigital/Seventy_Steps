/**
 * Round 125, the wind's gusts on the CPU: the very field shaders/wind.ts bends the trees and the grass by (data/windTuning.ts), so a
 * leaf let go lifts as the boughs bow (render/ambientAir.ts) and a coat's tails blow when the grass about it does (render/personLife.ts).
 * Its bearing is the realm's own wind (data/fogs.ts), turned to slowly as the investigator crosses into a realm, and kept in the
 * world's uniforms for the shader. Render only.
 */

import { FOGS } from '../data/fogs';
import { WIND } from '../data/windTuning';

/** Where the wind blows to now, along the ground (a unit vector). Shared with the world shader's uWindDir. */
export const windDir = { x: 0.89, z: 0.45 };

/** The gust (0..1) at a point of the land at a time: fronts rolling down the wind, bent across it, with smaller gusts in them. */
export function gustAt(time: number, x: number, z: number): number {
  const { front, ripple, swell, mix } = WIND;
  const along = x * windDir.x + z * windDir.z;
  const across = -x * windDir.z + z * windDir.x;
  const f = Math.sin(along * front.k - time * front.speed + Math.sin(across * front.bend + time * front.bendSpeed) * front.wander);
  const r = Math.sin(along * ripple.k - time * ripple.speed + across * ripple.across);
  const s = 0.5 + 0.5 * Math.sin(time * swell.speed + along * swell.k);
  return Math.min(1, Math.max(0, 0.5 + mix.front * f + mix.ripple * r)) * (0.55 + 0.45 * s);
}

/** The bearing a realm's wind blows to (its mist's drift; a still realm keeps the last). */
export function bearingOf(region: string | undefined): [number, number] | null {
  const w = FOGS[region ?? '']?.wind ?? FOGS.hub!.wind;
  const len = Math.hypot(w[0], w[1]);
  return len > 1e-3 ? [w[0] / len, w[1] / len] : null;
}

/** Turns the wind toward the realm's bearing by `dt` seconds' worth, into `out` (the world uniform) as well. */
export function turnWind(region: string | undefined, dt: number, out?: { set(x: number, y: number): unknown }): void {
  const to = bearingOf(region);
  if (to) {
    const k = Math.min(1, Math.max(0, dt * WIND.ease));
    const [x, z] = [windDir.x + (to[0] - windDir.x) * k, windDir.z + (to[1] - windDir.z) * k];
    const len = Math.hypot(x, z) || 1;
    [windDir.x, windDir.z] = [x / len, z / len];
  }
  out?.set(windDir.x, windDir.z);
}
