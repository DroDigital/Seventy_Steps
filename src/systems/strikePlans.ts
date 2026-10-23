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

/** The spots for `m`, about `centre` (the target) or out from `from` (the attacker, whose body reaches `body` metres). */
export function planSpots(m: MarksDef, centre: XZ, from: XZ, body: number, rng: () => number): Spot[] {
  const [lo, hi] = m.ring;
  const spots: Spot[] = [];
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
