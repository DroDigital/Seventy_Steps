/**
 * Which way an open arena faces (round 61): toward the nearest Elder Sign of its realm, the way a person comes; the candle burns
 * there before its fog (world/gatePlan.ts), and its set is composed about that bearing (world/arenaSet.ts). Pure.
 */

import type { XZ } from '../core/geom';

/** The unit vector from an arena at (x, z) toward the nearest of `signs` of its region (north, were there none). */
export function frontOf(signs: readonly (XZ & { region: string })[], region: string, x: number, z: number): XZ {
  const sign = signs.filter((s) => s.region === region).sort((p, q) => Math.hypot(p.x - x, p.z - z) - Math.hypot(q.x - x, q.z - z))[0] ?? signs[0];
  const [dx, dz] = sign ? [sign.x - x, sign.z - z] : [0, -1];
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
}
