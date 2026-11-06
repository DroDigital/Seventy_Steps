/**
 * Where a call of marked ground lays its spots (round 70). The eruption's ring about the target is the old way; the new ones are
 * a shower over the ground about the target (the falling stars), lines run out from the attacker (the conflagration), and spots that
 * start about the target and creep in on it (the tentacles). Each spot has an order: the one it bursts in is the delay plus order
 * times the stagger. Pure: no Three.js; every random number comes from `rng`.
 */

import type { XZ } from '../core/geom';
import type { MarksDef } from '../data/moves';

export interface Spot {
  at: XZ;
  order: number;
}

const TAU = Math.PI * 2;

/**
 * The spots for `m`, about `centre` (the target) or out from `from` (the attacker, whose body reaches `body` metres). The patterns of a blind horror (2026-10-29: `beats`,
 * `spiral` and `scatter`) are laid about the attacker alone, whoever stands where; `reach` is the farthest from it a spot may lie (its court's wall), which `scatter` keeps to.
 */
export function planSpots(m: MarksDef, centre: XZ, from: XZ, body: number, rng: () => number, reach = Infinity): Spot[] {
  const [lo, hi] = m.ring;
  const spots: Spot[] = [];
  if (m.pattern === 'beats') { // rings out from the body, each bursting a beat after the one within it
    const rings = Math.max(1, m.rings ?? 2);
    const near = body + lo;
    const turn = rng() * TAU;
    for (let i = 0; i < rings; i++) {
      const d = near + (rings > 1 ? ((hi - lo) * i) / (rings - 1) : 0);
      const n = Math.max(3, Math.round((m.count * d) / near)); // the wider rings hold more, so the spots stand as far apart on every ring
      for (let j = 0; j < n; j++) {
        const a = turn + ((j + 0.5 * (i % 2)) / n) * TAU; // every other ring between the one within it
        spots.push({ at: { x: from.x + Math.sin(a) * d, z: from.z + Math.cos(a) * d }, order: i });
      }
    }
    return spots;
  }
  if (m.pattern === 'spiral') { // one spot after another winding out from the body, the first burst the nearest
    const turn = rng() * TAU;
    const way = rng() < 0.5 ? -1 : 1;
    for (let k = 0; k < m.count; k++) {
      const a = turn + way * (k / m.count) * (m.turns ?? 1) * TAU;
      const d = body + lo + (m.count > 1 ? ((hi - lo) * k) / (m.count - 1) : 0);
      spots.push({ at: { x: from.x + Math.sin(a) * d, z: from.z + Math.cos(a) * d }, order: k });
    }
    return spots;
  }
  if (m.pattern === 'scatter') { // anywhere on the ground about the body, as far apart as it can be, in no order
    const apart = m.radius * 2.2;
    const [r0, r1] = [body + lo, Math.max(body + lo, Math.min(body + hi, reach))];
    for (let i = 0; i < m.count; i++) {
      let at = from;
      for (let tries = 0; tries < 16; tries++) {
        const [a, d] = [rng() * TAU, Math.sqrt(r0 * r0 + rng() * (r1 * r1 - r0 * r0))]; // even over the ground, not over the radius
        at = { x: from.x + Math.sin(a) * d, z: from.z + Math.cos(a) * d };
        if (spots.every((s) => Math.hypot(s.at.x - at.x, s.at.z - at.z) >= apart)) break;
      }
      spots.push({ at, order: i });
    }
    return spots;
  }
  if (m.pattern === 'spokes') {
    const lines = Math.max(1, m.spokes ?? 3);
    const per = Math.max(1, Math.ceil(m.count / lines));
    const base = Math.atan2(centre.x - from.x, centre.z - from.z);
    for (let k = 0; k < per; k++) {
      for (let s = 0; s < lines && s * per + k < m.count; s++) {
        const a = base + (s / lines) * TAU;
        const d = body + lo + (per > 1 ? ((hi - lo) * k) / (per - 1) : 0);
        spots.push({ at: { x: from.x + Math.sin(a) * d, z: from.z + Math.cos(a) * d }, order: k });
      }
    }
    return spots;
  }
  if (m.pattern === 'rain') {
    const apart = m.radius * 1.4;
    for (let i = 0; i < m.count; i++) {
      let at = centre;
      for (let tries = 0; i > 0 && tries < 12; tries++) {
        const [a, d] = [rng() * TAU, Math.sqrt(rng()) * hi];
        at = { x: centre.x + Math.sin(a) * d, z: centre.z + Math.cos(a) * d };
        if (spots.every((s) => Math.hypot(s.at.x - at.x, s.at.z - at.z) >= apart)) break;
      }
      spots.push({ at, order: i });
    }
    return spots;
  }
  const turn = rng() * TAU; // the ring (the eruption's, and the tentacles' start): the first spot under the target, the rest about it
  for (let i = 0; i < m.count; i++) {
    const a = turn + ((i - 1) / Math.max(1, m.count - 1)) * TAU;
    const d = lo + (hi - lo) * rng();
    spots.push({ at: i === 0 ? centre : { x: centre.x + Math.sin(a) * d, z: centre.z + Math.cos(a) * d }, order: i });
  }
  return spots;
}
