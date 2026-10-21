/**
 * The way to an open arena laid on the land (round 62; data/arenaWays.ts says what it is): a path from the arena's fog, straight down
 * its way in for a few paces (where the candle burns and the set's lane runs), then wandering to the nearest road it can join, and the
 * pieces stood along it. Everything on the way is placed by distance from the fog (`d`) and the side it is walked on, so a hazard, a
 * mark and an omen share one frame (`pointAt`). The trail is a road of its own, narrower than the region's, drawn in the road's texture.
 * Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { createRng, hash2, type Rng } from '../core/rng';
import type { Mark, Way } from '../data/arenaWays';
import { WORLD } from '../data/tuning';
import { reach } from './arenaDecor';
import { setPiece } from './arenaSet';
import type { ArenaPlace } from './placements';
import type { Prop } from './props';
import { segmentDistance, wander, type Road } from './roads';
import { surface } from './terrain';

export const WAY = {
  lane: 26, // metres from the fog the way runs straight down the arena's way in before it bends to the road
  least: 120, // the shortest a way is made to be
  fog: 1.5, // the fog's ring stands this far past the arena's radius (gatePlan.ts)
  width: 2.6,
  near: 8, // metres from the trailhead it is found
} as const;

export interface WayPlan {
  boss: string;
  region: string;
  way: Way;
  path: XZ[]; // from the fog's outer edge out to the road it joins
  cum: number[]; // metres along the path at each of its points
  length: number;
  width: number;
}

const seedOf = (a: ArenaPlace): number => (hash2(Math.round(a.x), Math.round(a.z), WORLD.seed + 62) * 4294967296) >>> 0;

/** The nearest point of `roads` to `p`. */
function nearestRoadPoint(roads: readonly Road[], p: XZ): { at: XZ; dist: number } | null {
  let best: { at: XZ; dist: number } | null = null;
  for (const r of roads) {
    for (let i = 1; i < r.pts.length; i++) {
      const [a, b] = [r.pts[i - 1], r.pts[i]];
      const [dx, dz] = [b.x - a.x, b.z - a.z];
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
      const at = { x: a.x + dx * t, z: a.z + dz * t };
      const dist = Math.hypot(p.x - at.x, p.z - at.z);
      if (!best || dist < best.dist) best = { at, dist };
    }
  }
  return best;
}

/** The path of an arena's way, from its fog to the nearest road. */
export function planWay(a: ArenaPlace, way: Way, roads: readonly Road[]): WayPlan {
  const rng = createRng(seedOf(a));
  const out = a.radius + WAY.fog;
  const start = { x: a.x + a.front.x * out, z: a.z + a.front.z * out };
  const bend = { x: start.x + a.front.x * WAY.lane, z: start.z + a.front.z * WAY.lane };
  const join = nearestRoadPoint(roads, bend)?.at ?? { x: bend.x + a.front.x * 60, z: bend.z + a.front.z * 60 }; // (a region with no road: a way to nowhere in particular)
  const direct = Math.hypot(join.x - bend.x, join.z - bend.z);
  const middle = (WAY.least - WAY.lane) / 2; // a way is walked, not glanced at: one that would be shorter than `least` bends away from the straight line and back
  let path: XZ[];
  if (direct < WAY.least - WAY.lane) {
    const bow = Math.sqrt(Math.max(0, middle * middle - (direct / 2) * (direct / 2))) * (rng() < 0.5 ? 1 : -1);
    const [nx, nz] = [-(join.z - bend.z) / (direct || 1), (join.x - bend.x) / (direct || 1)];
    const mid = { x: (bend.x + join.x) / 2 + nx * bow, z: (bend.z + join.z) / 2 + nz * bow };
    path = [start, ...wander(bend, mid, rng, 0.06), ...wander(mid, join, rng, 0.06).slice(1)];
  } else path = [start, ...wander(bend, join, rng, 0.05)];
  const cum = path.map((_, i) => path.slice(1, i + 1).reduce((n, p, k) => n + Math.hypot(p.x - path[k].x, p.z - path[k].z), 0));
  return { boss: a.bosses[0], region: a.region, way, path, cum, length: cum[cum.length - 1], width: way.width ?? WAY.width };
}

/** The place `d` metres from the fog along the way, `side` metres to the left of it (as it is walked toward the fog), and the way it runs there (toward the fog). */
export function pointAt(plan: WayPlan, d: number, side = 0): XZ & { yaw: number } {
  const { path, cum } = plan;
  const dd = Math.min(plan.length, Math.max(0, d));
  let i = 1;
  while (i < path.length - 1 && cum[i] < dd) i++;
  const [a, b] = [path[i - 1], path[i]];
  const seg = cum[i] - cum[i - 1] || 1;
  const t = (dd - cum[i - 1]) / seg;
  const [wx, wz] = [(a.x - b.x) / seg, (a.z - b.z) / seg]; // toward the fog
  const at = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
  return { x: at.x + wz * side, z: at.z - wx * side, yaw: Math.atan2(wx, wz) };
}

/** How far along the way (`d`), how far to its left (`off`) and how far from it (`dist`) a point is: the nearest point of its path. */
export function along(plan: WayPlan, x: number, z: number): { d: number; off: number; dist: number } {
  let best = { d: 0, off: 0, dist: Infinity };
  for (let i = 1; i < plan.path.length; i++) {
    const [a, b] = [plan.path[i - 1], plan.path[i]];
    const [dx, dz] = [b.x - a.x, b.z - a.z];
    const len2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2));
    const dist = Math.hypot(x - (a.x + dx * t), z - (a.z + dz * t));
    if (dist >= best.dist) continue;
    const seg = Math.sqrt(len2);
    const [wx, wz] = [-dx / seg, -dz / seg]; // toward the fog
    const off = (x - (a.x + dx * t)) * wz - (z - (a.z + dz * t)) * wx;
    best = { d: plan.cum[i - 1] + seg * t, off, dist };
  }
  return best;
}

/** Whether a point is within `m` metres of the path (its corridor). */
export const nearPath = (plan: WayPlan, x: number, z: number, m: number): boolean => plan.path.some((p, i) => i > 0 && segmentDistance(x, z, plan.path[i - 1], p) < m);

/** The pieces a mark stands, down the way. */
function markProps(plan: WayPlan, m: Mark, rng: Rng): Prop[] {
  const out: Prop[] = [];
  const [lo, hi] = Array.isArray(m.side) ? (m.side as readonly [number, number]) : [m.side as number, m.side as number];
  for (let d = m.from; d <= Math.min(m.to, plan.length - 1); d += m.every) {
    if (m.chance !== undefined && rng() > m.chance) continue;
    for (const sign of m.mirror ? [1, -1] : [rng() < 0.5 ? 1 : -1]) {
      let side = (lo + (hi - lo) * rng()) * sign;
      const dd = d + (rng() - 0.5) * (m.jitter ?? 0);
      let at = pointAt(plan, dd, side);
      const centre = pointAt(plan, dd, 0);
      const face = m.face ?? 'in';
      const yaw = face === 'in' ? Math.atan2(centre.x - at.x, centre.z - at.z) : face === 'out' ? Math.atan2(at.x - centre.x, at.z - centre.z) : face === 'front' ? at.yaw : typeof face === 'number' ? Math.atan2(centre.x - at.x, centre.z - at.z) + (face * Math.PI) / 180 : rng() * Math.PI * 2;
      const p = setPiece(m.piece, at.x, at.z, surface(at.x, at.z), yaw, rng);
      if (!p) continue;
      const need = plan.width / 2 + reach(p) + 0.5; // clear of the trail by its own breadth
      if (Math.abs(side) < need) {
        side = Math.sign(side || 1) * need;
        at = pointAt(plan, dd, side);
        p.x = at.x;
        p.z = at.z;
        p.y = surface(at.x, at.z);
      }
      if (p.y < WORLD.seaLevel + 0.6) continue; // not in the water
      if (along(plan, p.x, p.z).dist < plan.width / 2 + reach(p) + 0.3) continue; // nor over another reach of the path, where it bends back on itself
      out.push(p);
    }
  }
  return out;
}

/** Every piece of a way: its marks, and the trailhead where it leaves the road. */
export function wayProps(plan: WayPlan): Prop[] {
  const rng = createRng(hash2(Math.round(plan.path[0].x), Math.round(plan.path[0].z), WORLD.seed + 63) * 4294967296 >>> 0);
  const out = plan.way.marks.flatMap((m) => markProps(plan, m, rng));
  const side = (plan.way.headSide ?? 3.4) + plan.width / 2;
  const at = pointAt(plan, plan.length - 1.5, side);
  const head = setPiece(plan.way.head, at.x, at.z, surface(at.x, at.z), at.yaw + Math.PI, rng);
  if (head && head.y >= WORLD.seaLevel + 0.6) out.push(head);
  return out;
}

/** The trail as a road: the region's road texture, narrower. */
export const trailRoad = (plan: WayPlan): Road => ({ pts: plan.path, width: plan.width, street: false });

/** Whether a prop stands in the way's corridor and is to be cleared for it (not a house, which has its own place). */
export const clearsFor = (plan: WayPlan, p: Prop): boolean => p.kind !== 'house' && nearPath(plan, p.x, p.z, plan.width / 2 + 0.8 + reach(p));
