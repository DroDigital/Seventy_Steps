/**
 * Marked ground laid by the court itself (round 107; asked: the spinning barrage was on almost every horror, "make it more variable between bosses and
 * integrate the full 3D room"). Where strikePlans.ts lays spots about the target or the attacker, these lay them by the court: rows that march out
 * from the attacker across the whole breadth with one gap each (`rows`), the floor split into sectors about the court's middle, half bursting and
 * then the other half (`wedges`), a fuse that runs round the rim by the wall and then round a ring within it (`rim`), and stone falling at the
 * feet of the pillars nearest the target, after a stone on the target itself (`pillars`). Pure: no Three.js; every random number comes from `rng`.
 */

import type { XZ } from '../core/geom';
import type { MarksDef } from '../data/moves';
import type { Spot } from './strikePlans';

const TAU = Math.PI * 2;

/** The ground a call is laid over: its fight's arena, or (with none) a circle about the attacker as wide as the call reaches. */
export interface Court {
  x: number;
  z: number;
  radius: number;
}

/** A pillar standing in the court: its middle and how far its side stands from it. */
export interface Post extends XZ {
  r: number;
}

/** No court call lays more spots than this: a court's worth of marks is read at a glance, not counted. */
export const COURT_MOST = 24;

const at = (o: XZ, a: number, d: number): XZ => ({ x: o.x + Math.sin(a) * d, z: o.z + Math.cos(a) * d });

/** Rows across the line from the attacker to the target, marching out a beat at a time; in each a gap, never where the last row's was. */
function rows(m: MarksDef, centre: XZ, from: XZ, body: number, rng: () => number): Spot[] {
  const n = Math.max(1, m.rings ?? 4);
  const yaw = Math.atan2(centre.x - from.x, centre.z - from.z);
  const [ax, az, sx, sz] = [Math.sin(yaw), Math.cos(yaw), Math.cos(yaw), -Math.sin(yaw)];
  const per = Math.max(3, m.count);
  const step = m.radius * 1.7;
  const [lo, hi] = m.ring;
  const spots: Spot[] = [];
  let last = -9;
  for (let i = 0; i < n; i++) {
    const d = body + lo + (n > 1 ? ((hi - lo) * i) / (n - 1) : 0);
    let gap = Math.floor(rng() * per);
    if (Math.abs(gap - last) <= 1) gap = (gap + Math.floor(per / 2)) % per; // the way through moves: one walking straight on meets the next row
    last = gap;
    for (let j = 0; j < per; j++) {
      if (j === gap) continue;
      const off = (j - (per - 1) / 2) * step;
      spots.push({ at: { x: from.x + ax * d + sx * off, z: from.z + az * d + sz * off }, order: i });
    }
  }
  return spots;
}

/** The court's floor in `spokes` sectors about its middle: every other one bursts, then the rest a beat after; the middle itself is left. */
function wedges(m: MarksDef, court: Court, rng: () => number): Spot[] {
  const n = Math.max(2, m.spokes ?? 4);
  const span = TAU / n;
  const turn = rng() * TAU;
  const gap = m.radius * 2.3;
  const far = Math.min(m.ring[1], court.radius - m.radius * 0.6);
  const spots: Spot[] = [];
  for (let r = Math.max(m.ring[0], m.radius); r <= far + 1e-6; r += gap) {
    const k = Math.max(1, Math.round((r * span) / gap));
    for (let s = 0; s < n; s++) for (let j = 0; j < k; j++) spots.push({ at: at(court, turn + (s + (j + 0.5) / k) * span, r), order: s % 2 });
  }
  return spots;
}

/** A fuse that runs round the court by its wall, a spot after a spot, and (with `rings`) round a ring within it once the first has gone round. */
function rim(m: MarksDef, court: Court, rng: () => number): Spot[] {
  const gap = m.radius * 2.3;
  const turn = rng() * TAU;
  const way = rng() < 0.5 ? -1 : 1;
  const spots: Spot[] = [];
  let order = 0;
  for (let i = 0; i < Math.max(1, m.rings ?? 1); i++) {
    const r = Math.min(m.ring[1], court.radius - m.radius - 0.6) - i * m.radius * 2.2;
    if (r < m.radius * 2) break;
    const k = Math.max(6, Math.round((TAU * r) / gap));
    for (let j = 0; j < k; j++) spots.push({ at: at(court, turn + way * (j / k) * TAU, r), order: order++ });
  }
  return spots;
}

/**
 * Stone falls where the target stands, then about the feet of the `count` pillars within `ring[1]` of it, the nearest first; null (a shower about
 * the target, strikes.ts) where no pillar stands so near.
 */
function pillars(m: MarksDef, centre: XZ, posts: readonly Post[], rng: () => number): Spot[] | null {
  const dist = (p: Post): number => Math.hypot(p.x - centre.x, p.z - centre.z);
  const near = posts.filter((p) => dist(p) - p.r <= m.ring[1]).sort((a, b) => dist(a) - dist(b)).slice(0, Math.max(1, m.count));
  if (!near.length) return null;
  const spots: Spot[] = [{ at: centre, order: 0 }];
  near.forEach((p, i) => {
    const d = p.r + m.radius * 0.8;
    const turn = rng() * TAU;
    for (let j = 0; j < 4; j++) spots.push({ at: at(p, turn + (j / 4) * TAU, d), order: i + 1 });
  });
  return spots;
}

/** The spots of a court pattern, or null when `m`'s pattern is not one (or, for `pillars`, no pillar stands to fall from). */
export function courtSpots(m: MarksDef, centre: XZ, from: XZ, body: number, rng: () => number, court: Court, posts: readonly Post[] = []): Spot[] | null {
  const spots =
    m.pattern === 'rows' ? rows(m, centre, from, body, rng)
    : m.pattern === 'wedges' ? wedges(m, court, rng)
    : m.pattern === 'rim' ? rim(m, court, rng)
    : m.pattern === 'pillars' ? pillars(m, centre, posts, rng)
    : null;
  return spots && spots.slice(0, COURT_MOST);
}
