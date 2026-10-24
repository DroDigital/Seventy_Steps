/**
 * The approach to an open arena's gate laid on the land (round 62's trail, round 63's court; data/arenaWays.ts says what it holds): a
 * straight court out from the house's gate, in which the horror's own things are stood: waymarks that grow thicker and stranger toward the
 * gate, hazards of the horror's kind, a rite of lights. It is no road (a house has its one gate, and the court leads to it, so there is no
 * other way in to be taken). Everything on it is placed by distance from the gate (`d`) and the side it is walked on, so a hazard, a mark
 * and an omen share one frame (`pointAt`), and `courtPoint` gives the same frame from a house alone, for the pages and altars of a
 * discovery (world/discoveryPlan.ts), which are placed before the regions are. Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { createRng, hash2, type Rng } from '../core/rng';
import type { Mark, Way } from '../data/arenaWays';
import { WORLD } from '../data/tuning';
import { reach } from './arenaDecor';
import type { Enclosure } from './enclosure';
import { setPiece } from './arenaSet';
import type { ArenaPlace } from './placements';
import type { Prop } from './props';
import { segmentDistance } from './roads';
import { padDistance, type Pad } from './sitePads';
import { surface } from './terrain';

export const WAY = {
  out: 3.6, // metres from the gate's middle that the court's `d = 0` stands: clear of the wall's outer face
  length: 150, // metres of the court (what is stood past it is not made)
  width: 2.6, // metres kept clear down its middle (the gate's way in; nothing is stood on it)
} as const;

export interface WayPlan {
  boss: string;
  region: string;
  way: Way;
  path: XZ[]; // from the gate straight out, two points
  cum: number[]; // metres along the path at each of its points
  length: number;
  width: number;
  pad?: Pad; // the ground the house is levelled on (round 71: a place's goes far past its wall, and what is stood in the court keeps off it)
}

const starts = new WeakMap<object, number>();

/** Metres from the gate's middle that the court's `d = 0` stands: clear of the wall's outer face, and (round 71) of the ground a place is levelled on, which goes further out than a ring's. */
function courtStart(h: Pick<Enclosure, 'gate' | 'front'> & Partial<Pick<Enclosure, 'kind' | 'pad'>>): number {
  if (h.kind !== 'place' || !h.pad) return WAY.out;
  let t = starts.get(h);
  if (t === undefined) {
    const pad = h.pad(0, 0);
    for (t = WAY.out; t < WAY.out + 60 && padDistance(pad, h.gate.x + h.front.x * t, h.gate.z + h.front.z * t) < 0.05; t += 0.5);
    starts.set(h, t);
  }
  return t;
}

/** The place `d` metres out from the gate and `side` metres to the left of the court as it is walked in (negative: the right), and the way it faces (toward the gate). */
export function courtPoint(h: Pick<Enclosure, 'gate' | 'front'> & Partial<Pick<Enclosure, 'kind' | 'pad'>>, d: number, side = 0): XZ & { yaw: number } {
  const t = courtStart(h) + d;
  return { x: h.gate.x + h.front.x * t - h.front.z * side, z: h.gate.z + h.front.z * t + h.front.x * side, yaw: Math.atan2(-h.front.x, -h.front.z) };
}

/** The court of an arena's house. */
export function planWay(a: ArenaPlace, way: Way): WayPlan {
  const house = a.house!;
  const path = [courtPoint(house, 0), courtPoint(house, WAY.length)].map(({ x, z }) => ({ x, z }));
  return { boss: a.bosses[0]!, region: a.region, way, path, cum: [0, WAY.length], length: WAY.length, width: way.width ?? WAY.width, pad: house.kind === 'place' ? house.pad(a.y, 0) : undefined };
}

/** The place `d` metres from the gate along the court, `side` metres to the left of it (as it is walked toward the gate), and the way it runs there (toward the gate). */
export function pointAt(plan: WayPlan, d: number, side = 0): XZ & { yaw: number } {
  const [a, b] = plan.path;
  const dd = Math.min(plan.length, Math.max(0, d));
  const [wx, wz] = [(a.x - b.x) / plan.length, (a.z - b.z) / plan.length]; // toward the gate
  const at = { x: a.x + (b.x - a.x) * (dd / plan.length), z: a.z + (b.z - a.z) * (dd / plan.length) };
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
      if (plan.pad && padDistance(plan.pad, p.x, p.z) < 0) continue; // nor on a place's ground (the pace-by-pace shift above has not been enough)
      if (p.y < WORLD.seaLevel + 0.6) continue; // not in the water
      if (along(plan, p.x, p.z).dist < plan.width / 2 + reach(p) + 0.3) continue; // nor over another reach of the path, where it bends back on itself
      out.push(p);
    }
  }
  return out;
}

/** Every piece of a court: its marks. */
export function wayProps(plan: WayPlan): Prop[] {
  const rng = createRng(hash2(Math.round(plan.path[0].x), Math.round(plan.path[0].z), WORLD.seed + 63) * 4294967296 >>> 0);
  return plan.way.marks.flatMap((m) => markProps(plan, m, rng));
}

/** A rite's lights need room for a body to reach them from the court, including where they stand off its central way. */
export function clearsRite(plan: WayPlan, p: Prop): boolean {
  const r = reach(p);
  return (plan.way.rite?.at ?? []).some((s) => {
    const light = pointAt(plan, s.d, s.side);
    const lane = pointAt(plan, s.d, 0);
    return Math.hypot(p.x - light.x, p.z - light.z) < r + 2.4 || segmentDistance(p.x, p.z, lane, light) < r + 1.2;
  });
}

/** Whether a prop stands in the way's corridor or a rite's approach and is to be cleared for it. A required light takes precedence over a scattered house too. */
export const clearsFor = (plan: WayPlan, p: Prop): boolean => (p.kind !== 'house' && nearPath(plan, p.x, p.z, plan.width / 2 + 0.8 + reach(p))) || clearsRite(plan, p);
