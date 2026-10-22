/**
 * Which way an open arena faces (round 61): toward the nearest Elder Sign of its realm, the way a person comes; the candle burns
 * there before its fog (world/gatePlan.ts), and its set is composed about that bearing (world/arenaSet.ts). Pure.
 */

import type { XZ } from '../core/geom';

/**
 * The unit vector from an arena at (x, z) toward the nearest of `signs` of its region (north, were there none), turned to the nearest of the
 * four ways along an axis (round 63: its house's gate is a wall's opening, and a wall's opening runs along an axis). `ok` says whether a way
 * will do (its court has land to lie on): the nearest that does is taken, and the nearest of all when none does.
 */
export function frontOf(signs: readonly (XZ & { region: string })[], region: string, x: number, z: number, ok: (front: XZ) => boolean = () => true): XZ {
  const sign = signs.filter((s) => s.region === region).sort((p, q) => Math.hypot(p.x - x, p.z - z) - Math.hypot(q.x - x, q.z - z))[0] ?? signs[0];
  const [dx, dz] = sign ? [sign.x - x, sign.z - z] : [0, -1];
  const ways: XZ[] = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }].sort((p, q) => q.x * dx + q.z * dz - (p.x * dx + p.z * dz)); // nearest the sign's bearing first (a tie keeps x first: the sort is stable)
  return ways.find(ok) ?? ways[0]!;
}
