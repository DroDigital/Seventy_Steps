/**
 * A piece hung on a dungeon wall, set against it (2026-11-26; asked, of the Library's bookcases and shelves standing off their walls:
 * "they are not attached to anything properly"). A room's set lays its wall rows at a share of the room's radius (data/roomSets.ts,
 * data/hallSets*.ts, world/arenaSet.ts `wall`), which left a case's back most of a metre short of the stone, and further before a
 * cross-shaped hall's recess. Here each is carried back along its own facing until it meets what is behind it. A piece whose breadth
 * finds nothing even behind it (a buttress at one end and a recess at the other, a pillar, the reveal of a doorway), or nothing within
 * reach, is not stood; a drapery broad enough to span the bays hangs from the piers it touches. Pure.
 */

import type { Part } from './dungeonParts';
import type { Prop } from './props';

export const FLUSH = {
  reach: 2.5, // metres back a hung piece is carried, at most, to find its wall
  even: 0.12, // how much nearer one end of its back may find the wall than the other, and it still hangs there...
  drape: 2, // ...unless it is broader than this either side of its middle: a drapery hangs from the piers it spans, across the bays between
  out: 0.5, // metres a piece whose back is sunk in the stone is brought forward, at most, to stand clear of it
  slide: 0.1, // metres at a time a piece with no even wall behind it is slid along the wall, up to its own breadth, to find one
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

/** The gaps behind a hung piece's back, at its middle and near either end (it faces along its yaw: yaw 0 faces +z; its `w` and `d` are half extents). */
export function gapsBehind(p: Prop, parts: readonly Part[]): number[] {
  const [fx, fz] = [Math.sin(p.yaw), Math.cos(p.yaw)];
  const [ax, az] = [Math.cos(p.yaw), -Math.sin(p.yaw)];
  const [bx, bz] = [p.x - fx * p.d, p.z - fz * p.d]; // (`w` and `d` are half extents, world/props.ts)
  const [y0, y1] = [p.y + 0.1, p.y + Math.max(0.3, Math.min(p.h, 1.2))];
  const half = Math.max(0, p.w - 0.05);
  return [-half, 0, half].map((s) => rayToSolid(parts, bx + ax * s, bz + az * s, -fx, -fz, y0, y1));
}

/** Whether a point at heights y0..y1 lies inside a solid part. */
function sunk(parts: readonly Part[], x: number, z: number, y0: number, y1: number): boolean {
  return parts.some((q) => q.solid && (q.shape === 'box' ? q.max.y > y0 && q.min.y < y1 && x > q.min.x + 1e-6 && x < q.max.x - 1e-6 && z > q.min.z + 1e-6 && z < q.max.z - 1e-6 : q.y1 > y0 && q.y0 < y1 && Math.hypot(x - q.x, z - q.z) < q.radius - 1e-6));
}

/** The piece brought forward, a centimetre at a time, until no point of its back is sunk in the stone (round 79's rows stood some a few centimetres into a hall's corner blocks). */
function unsunk(p: Prop, parts: readonly Part[]): Prop {
  const [fx, fz, ax, az] = [Math.sin(p.yaw), Math.cos(p.yaw), Math.cos(p.yaw), -Math.sin(p.yaw)];
  const [y0, y1] = [p.y + 0.1, p.y + Math.max(0.3, Math.min(p.h, 1.2))];
  const half = Math.max(0, p.w - 0.05);
  for (let k = 0; k <= FLUSH.out * 100; k++) {
    const [x, z] = [p.x + fx * k * 0.01, p.z + fz * k * 0.01];
    if (![-half, -half / 2, 0, half / 2, half].some((s) => sunk(parts, x - fx * (p.d - 0.005) + ax * s, z - fz * (p.d - 0.005) + az * s, y0, y1))) return { ...p, x, z };
  }
  return p;
}

/** The hung piece set back against its wall, or null where it has no wall to hang on. */
export function flushToWall(hung: Prop, parts: readonly Part[]): Prop | null {
  const p = unsunk(hung, parts);
  const gaps = gapsBehind(p, parts);
  const [near, far] = [Math.min(...gaps), Math.max(...gaps)];
  if (!(near <= FLUSH.reach) || (far - near > FLUSH.even && p.w < FLUSH.drape)) return null;
  const move = Math.max(0, near - FLUSH.gap);
  return { ...p, x: p.x - Math.sin(p.yaw) * move, z: p.z - Math.cos(p.yaw) * move };
}

/** A hung piece on its wall: where it is, or else slid along the wall (both ways, nearest first) to the first place where the wall behind it is even and `ok` lets it stand; null where there is none. */
export function hangOnWall(p: Prop, parts: readonly Part[], ok: (p: Prop) => boolean): Prop | null {
  const here = flushToWall(p, parts);
  if (here) return here;
  const [ax, az] = [Math.cos(p.yaw), -Math.sin(p.yaw)];
  for (let s = FLUSH.slide; s <= p.w * 2 + 1e-6; s += FLUSH.slide) {
    for (const e of [-1, 1]) {
      const c = { ...p, x: p.x + ax * s * e, z: p.z + az * s * e };
      if (!ok(c)) continue;
      const hung = flushToWall(c, parts);
      if (hung) return hung;
    }
  }
  return null;
}

/** Whether `p` would stand along the same wall as one of `others` and overlap it. */
export function besideAnother(p: Prop, others: readonly Prop[]): boolean {
  const [ax, az, fx, fz] = [Math.cos(p.yaw), -Math.sin(p.yaw), Math.sin(p.yaw), Math.cos(p.yaw)];
  return others.some((o) => {
    if (!o.set?.hung || Math.abs(Math.sin(o.yaw - p.yaw)) > 0.01 || Math.cos(o.yaw - p.yaw) < 0) return false;
    const [dx, dz] = [o.x - p.x, o.z - p.z];
    return Math.abs(dx * fx + dz * fz) < 1.5 && Math.abs(dx * ax + dz * az) < o.w + p.w - 0.01 && Math.abs(o.y - p.y) < Math.max(o.h, p.h);
  });
}
