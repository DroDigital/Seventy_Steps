/**
 * A piece hung on a dungeon wall, set against it (2026-11-26; asked, of the Library's bookcases and shelves standing off their walls:
 * "they are not attached to anything properly"). A room's set lays its wall rows at a share of the room's radius (data/roomSets.ts,
 * data/hallSets*.ts, world/arenaSet.ts `wall`), which left a case's back most of a metre short of the stone, and further before a
 * cross-shaped hall's recess. Here each is carried back along its own facing until it meets what is behind it. A piece whose breadth
 * finds nothing even behind it (a buttress at one end and a recess at the other, a pillar, the reveal of a doorway), or nothing within
 * reach, is not stood. Pure.
 */

import type { Part } from './dungeonParts';
import type { Prop } from './props';

export const FLUSH = {
  reach: 2.5, // metres back a hung piece is carried, at most, to find its wall
  even: 0.12, // how much nearer one end of its back may find the wall than the other, and it still hangs there
  gap: 0.02, // left between its back and the stone, so the two faces do not fight
} as const;

/** How far a ray from (x, z) along (dx, dz) goes before it meets a solid part standing between heights y0 and y1 (Infinity: nothing; 0: it starts in one). */
export function rayToSolid(parts: readonly Part[], x: number, z: number, dx: number, dz: number, y0: number, y1: number): number {
  let best = Infinity;
  for (const p of parts) {
    if (!p.solid) continue;
    if (p.shape === 'box') {
      if (p.max.y <= y0 || p.min.y >= y1) continue;
      let [t0, t1] = [-Infinity, Infinity];
      for (const [o, d, lo, hi] of [[x, dx, p.min.x, p.max.x], [z, dz, p.min.z, p.max.z]] as const) {
        if (Math.abs(d) < 1e-9) {
          if (o < lo || o > hi) [t0, t1] = [Infinity, -Infinity];
          continue;
        }
        const [a, b] = [(lo - o) / d, (hi - o) / d];
        [t0, t1] = [Math.max(t0, Math.min(a, b)), Math.min(t1, Math.max(a, b))];
      }
      if (t0 <= t1 && t1 >= 0) best = Math.min(best, Math.max(0, t0));
    } else {
      if (p.y1 <= y0 || p.y0 >= y1) continue;
      const [ox, oz] = [x - p.x, z - p.z];
      const b = ox * dx + oz * dz;
      const c = ox * ox + oz * oz - p.radius * p.radius;
      if (c <= 0) return 0;
      const disc = b * b - c;
      if (disc >= 0 && -b - Math.sqrt(disc) >= 0) best = Math.min(best, -b - Math.sqrt(disc));
    }
  }
  return best;
}

/** The gaps behind a hung piece's back, at its middle and near either end (it faces along its yaw: yaw 0 faces +z). */
export function gapsBehind(p: Prop, parts: readonly Part[]): number[] {
  const [fx, fz] = [Math.sin(p.yaw), Math.cos(p.yaw)];
  const [ax, az] = [Math.cos(p.yaw), -Math.sin(p.yaw)];
  const [bx, bz] = [p.x - (fx * p.d) / 2, p.z - (fz * p.d) / 2];
  const [y0, y1] = [p.y + 0.1, p.y + Math.max(0.3, Math.min(p.h, 1.2))];
  const half = Math.max(0, p.w / 2 - 0.05);
  return [-half, 0, half].map((s) => rayToSolid(parts, bx + ax * s, bz + az * s, -fx, -fz, y0, y1));
}

/** The hung piece set back against its wall, or null where it has no wall to hang on. */
export function flushToWall(p: Prop, parts: readonly Part[]): Prop | null {
  const gaps = gapsBehind(p, parts);
  const [near, far] = [Math.min(...gaps), Math.max(...gaps)];
  if (!(far <= FLUSH.reach) || far - near > FLUSH.even) return null;
  const move = Math.max(0, near - FLUSH.gap);
  return { ...p, x: p.x - Math.sin(p.yaw) * move, z: p.z - Math.cos(p.yaw) * move };
}
