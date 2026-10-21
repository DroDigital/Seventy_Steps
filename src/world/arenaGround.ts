/**
 * The floor of an arena's set (round 61; data/arenaSets.ts `ground`): inside its ring, and a way out beyond it, the land is another
 * ground: its own texture over the land's (the road's slot of the ground shader, render/terrainMesh.ts), its own colour, and bands and
 * rays of dark and light across it, a share of the radius and a turn from the way in. What each vertex of the terrain takes is
 * `groundMark`. Pure.
 */

import type { XZ } from '../core/geom';
import type { GroundSpec } from '../data/arenaSets';
import type { Vec3 } from '../data/tuning';
import { smoothstep } from './land';

export interface ArenaGround {
  x: number;
  z: number;
  radius: number;
  front: XZ;
  spec: GroundSpec;
}

export interface GroundMark {
  share: number; // how much of the arena's ground this is, 0 beyond its reach, 1 within its ring
  k: number; // × the brightness
  tint: Vec3 | null; // the colour it leans to
}

const REACH = 10;

/** What the ground at (x, z) takes from the arena (null where it has none). */
export function groundMark(a: ArenaGround, x: number, z: number): GroundMark | null {
  const [dx, dz] = [x - a.x, z - a.z];
  const dist = Math.hypot(dx, dz);
  const reach = a.spec.reach ?? REACH;
  if (dist > a.radius + reach) return null;
  const share = 1 - smoothstep(a.radius * 0.96, a.radius + reach, dist);
  const rho = dist / a.radius;
  let k = a.spec.gain ?? 1;
  let tint = a.spec.tint ?? null;
  for (const b of a.spec.bands ?? []) {
    if (rho < b.r0 || rho > b.r1) continue;
    const edge = Math.min(rho - b.r0, b.r1 - rho) / Math.max(1e-3, (b.r1 - b.r0) / 2); // soft at both its edges
    const f = smoothstep(0, 0.6, edge);
    k *= 1 + (b.k - 1) * f;
    if (b.tint) tint = tint ? ([tint[0] + (b.tint[0] - tint[0]) * f, tint[1] + (b.tint[1] - tint[1]) * f, tint[2] + (b.tint[2] - tint[2]) * f] as const) : b.tint;
  }
  const sp = a.spec.spokes;
  if (sp && rho >= (sp.r0 ?? 0) && rho <= (sp.r1 ?? 1.1)) {
    const turn = Math.atan2(dz, dx) - Math.atan2(a.front.z, a.front.x) + ((sp.twist ?? 0) * Math.PI * rho) / 180;
    const step = (Math.PI * 2) / sp.n;
    const off = Math.abs(((turn % step) + step * 1.5) % step - step / 2) / step; // 0 on a ray, 0.5 between
    const half = (sp.width * Math.PI) / 180 / step / 2;
    k *= 1 + (sp.k - 1) * (1 - smoothstep(half * 0.5, half + 0.06, off));
  }
  return { share, k, tint };
}
