/**
 * Where a candle stands (round 62, asked: "visually understated and contextually appropriate, in a fitting place near the intended
 * area rather than centrally on the stairs"): the stake before a fog is where the fallen wake, on the way in; the candle itself is set
 * aside it, at the way's edge, against what is there to set it on: before a ring the way's side clear of the set's pieces, in a hall's
 * approach the foot of a wall or a pillar. It is never further than `ASIDE.far` from the stake, so passing the stake still takes its flame.
 * Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { hash2 } from '../core/rng';
import type { CandleLook } from '../data/arenaSets';
import { reach } from './arenaDecor';
import { roomAt, type DungeonLayout, type RoomLayout } from './dungeonKit';
import type { Part } from './dungeonParts';
import type { ArenaPlace } from './placements';

export interface CandleSpot extends XZ {
  look: CandleLook;
}

export const ASIDE = { far: 4.6, ring: 3.4, clear: 1.2 } as const; // metres: the most it stands from the stake, how far to the way's side before a ring, and from a piece

/** The nearest a point is to a solid part that stands at its height (a pace of 0 inside it), or Infinity. */
export function solidGap(parts: readonly Part[], x: number, z: number, y: number): number {
  let best = Infinity;
  for (const p of parts) {
    if (!p.solid) continue;
    if (p.shape === 'box') {
      if (p.max.y <= y + 0.3 || p.min.y >= y + 1.2) continue;
      best = Math.min(best, Math.hypot(Math.max(p.min.x - x, 0, x - p.max.x), Math.max(p.min.z - z, 0, z - p.max.z)));
    } else {
      if (p.y1 <= y + 0.3 || p.y0 >= y + 1.2) continue;
      best = Math.min(best, Math.max(0, Math.hypot(x - p.x, z - p.z) - p.radius));
    }
  }
  return best;
}

/** A candle before a ring: to the way's side, a few paces from the stake, clear of the set's pieces and the ring's stones. */
export function ringCandle(a: ArenaPlace, stake: XZ, front: XZ): CandleSpot {
  const look = a.candle ?? 'cairn';
  const lean = hash2(Math.round(a.x), Math.round(a.z), 62) < 0.5 ? 1 : -1; // which side, as the place has it
  const [px, pz] = [-front.z, front.x];
  const solids = a.decor.filter((p) => reach(p) > 0);
  for (const along of [0, 1.4, -1.4, 2.6]) {
    for (const aside of [ASIDE.ring, ASIDE.ring + 1, ASIDE.ring - 0.8]) {
      for (const s of [lean, -lean]) {
        const x = stake.x + front.x * along + px * s * aside;
        const z = stake.z + front.z * along + pz * s * aside;
        if (Math.hypot(x - stake.x, z - stake.z) > ASIDE.far) continue;
        if (solids.every((p) => Math.hypot(p.x - x, p.z - z) - reach(p) >= ASIDE.clear) && a.stones.every((q) => Math.hypot(q.x - x, q.z - z) - q.radius >= ASIDE.clear)) return { x, z, look };
      }
    }
  }
  return { x: stake.x, z: stake.z, look }; // no room to either side (none has been found): where it stood
}

/** A candle in a hall's approach: at the foot of a wall or a pillar a few paces from the stake, never in the middle of the way (a span too narrow for it keeps the least step to a side). */
export function hallCandle(L: DungeonLayout, parts: readonly Part[], boss: RoomLayout, door: XZ, u: XZ, y: number, stake: XZ): CandleSpot {
  let best: { x: number; z: number; score: number } | null = null;
  const t0 = (stake.x - door.x) * u.x + (stake.z - door.z) * u.z; // how far back the stake stands
  for (const dt of [0, -1.2, 1.2, -2.4, 2.4]) {
    for (let s = 0.5; s <= 4.1; s += 0.3) {
      for (const side of [1, -1]) {
        const t = t0 + dt;
        const x = door.x + u.x * t - u.z * s * side;
        const z = door.z + u.z * t + u.x * s * side;
        const room = roomAt(L, x, z);
        if (!room || room === boss || Math.hypot(x - stake.x, z - stake.z) > ASIDE.far) continue;
        const gap = solidGap(parts, x, z, y);
        if (gap < 0.3) continue; // not in it
        const score = (gap <= 1.4 ? Math.abs(gap - 0.55) : 4) - 0.12 * s + 0.12 * Math.abs(dt); // against a wall's foot, well aside, near where the stake is
        if (!best || score < best.score) best = { x, z, score };
      }
    }
  }
  return { x: best?.x ?? stake.x, z: best?.z ?? stake.z, look: 'votive' };
}
