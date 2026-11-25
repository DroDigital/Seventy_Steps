/**
 * Fits an open arena's boss fog wall cleanly into its surrounding gate piers, flanking walls and overhead lintel (2026-11-24).
 * Previously gatePlan.ts placed every arena fog at `door.thick / 2 - 0.25` with width `door.width + 0.4`, which left thin-walled
 * places (Gorgon, Martin's Beach, Nug, Hastur, Bokrug, Ancient Ones, Azathoth, Nyarlathotep) floating behind their walls or gapped
 * at the jambs. Inspecting the actual placed flanking solids keeps every fog plane embedded inside its masonry on both sides and
 * tucked under any lintel above. Pure: no Three.js.
 */

import type { HiddenPieceDef } from '../data/arena';
import { toBoxFrame, type Collider } from './colliders';
import type { Enclosure } from './enclosure';
import { propColliders } from './props';

export interface GateFogFit {
  x: number;
  z: number;
  width: number;
  height: number;
  depth: number; // half-thickness of the 3-layer volumetric mist curtain (metres)
  capped: boolean; // true when an overhead lintel or stone arch closes the top of the opening
}

const TUCK = 0.6; // metres the fog embeds into each flanking solid so curved/tapered piers leave no slit
const MAX_SCAN = 16; // metres outward from gate centre to look for flanking solids
const STEP_U = 0.1;
const MIN_DEPTH = 0.2;
const MAX_DEPTH = 0.4;

/** Whether world point (x, y, z) lies inside collider `c`, padded by `pad` metres. */
function inside(c: Collider, x: number, y: number, z: number, pad = 0): boolean {
  if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) <= c.radius + pad && y >= c.y0 - pad && y <= c.y1 + pad;
  if (c.kind === 'box') return x >= c.min.x - pad && x <= c.max.x + pad && z >= c.min.z - pad && z <= c.max.z + pad && y >= c.min.y - pad && y <= c.max.y + pad;
  const p = toBoxFrame(c, x, z);
  return Math.abs(p.x) <= c.hx + pad && Math.abs(p.z) <= c.hz + pad && y >= c.y0 - pad && y <= c.y1 + pad;
}

/** Collects solid colliders near the gate that belong to walls, piers or lintels (skipping tiny low props). */
function gateSolids(house: Enclosure, door: NonNullable<HiddenPieceDef['door']>): Collider[] {
  const reach = door.width + 14;
  const out: Collider[] = [];
  for (const p of house.props) {
    if (Math.abs(p.x - house.gate.x) > reach + Math.max(p.w, p.d) || Math.abs(p.z - house.gate.z) > reach + Math.max(p.w, p.d)) continue;
    for (const c of propColliders(p)) {
      const top = c.kind === 'box' ? c.max.y : c.y1;
      if (top - door.y >= 2.2) out.push(c);
    }
  }
  return out;
}

/** Computes the connected placement, span and depth of an open arena's boss fog wall inside its gate opening. */
export function fitGateFog(house: Enclosure, door: NonNullable<HiddenPieceDef['door']>, yaw: number): GateFogFit {
  const [vx, vz] = [Math.sin(yaw), Math.cos(yaw)]; // +v: into the court
  const [ux, uz] = [Math.cos(yaw), -Math.sin(yaw)]; // +u: along the wall
  const cols = gateSolids(house, door);
  const hit = (u: number, y: number, v: number, pad = 0.02): boolean => {
    const [wx, wy, wz] = [house.gate.x + ux * u + vx * v, door.y + y, house.gate.z + uz * u + vz * v];
    return cols.some((c) => inside(c, wx, wy, wz, pad));
  };
  const scan = (sign: -1 | 1, y: number, v: number): number => {
    const start = Math.max(0.5, door.width * 0.28);
    for (let u = start; u <= MAX_SCAN; u += STEP_U) if (hit(sign * u, y, v)) return u;
    return Infinity;
  };
  const maxBehind = Math.max(0.2, Math.min(1.25, door.thick / 2 - 0.25));
  const topProbe = Math.max(2.0, door.height - 0.65);
  const limit = door.width / 2 + 2.4;

  // Walk inward from the preferred depth until the plane sits firmly inside both flanking piers at mid and upper height.
  let [bestV, bestL, bestR] = [Math.min(0.45, maxBehind), door.width / 2, door.width / 2];
  for (let v = maxBehind; v >= 0.2 - 1e-6; v -= 0.05) {
    const [lMid, rMid] = [scan(-1, 1.5, v), scan(1, 1.5, v)];
    const [lTop, rTop] = [scan(-1, topProbe, v), scan(1, topProbe, v)];
    const [l, r] = [Math.max(lMid, lTop), Math.max(rMid, rTop)];
    if (l <= limit && r <= limit) {
      // Ensure the flanking solid also covers a margin behind `v` at both mid and upper height so the layered curtain stays enclosed.
      const backed = v <= 0.35 || (
        hit(-(l + 0.3), 1.5, v + 0.25) && hit(r + 0.3, 1.5, v + 0.25)
        && hit(-(l + 0.3), topProbe, v + 0.25) && hit(r + 0.3, topProbe, v + 0.25)
      );
      if (backed) {
        [bestV, bestL, bestR] = [v, l, r];
        break;
      }
    }
  }
  // Fallback if one flank narrows near the very top (e.g. sloped masonry): anchor at mid-height instead of failing wide.
  if (bestL === door.width / 2 && bestR === door.width / 2) {
    for (let v = maxBehind; v >= 0.2 - 1e-6; v -= 0.05) {
      const [l, r] = [scan(-1, 1.5, v), scan(1, 1.5, v)];
      if (l <= limit && r <= limit) { [bestV, bestL, bestR] = [v, l, r]; break; }
    }
  }

  // Span embeds TUCK metres into both left and right flanking solids, staying at least `door.width` wide.
  const tuck = Math.min(TUCK, Math.max(0.4, (door.width + 2.9 - (bestL + bestR)) * 0.5));
  const uLeft = -bestL - tuck;
  const uRight = bestR + tuck;
  const width = Math.max(door.width + 0.4, uRight - uLeft);
  const uCenter = (uLeft + uRight) / 2;

  // Detect any solid overhead lintel, gatehouse wall span, or monumental overarching pylon closing the top of the opening.
  // Use visual prop bottom `p.y` (since propColliders extend 0.5 m below visual base) so the mist seals right into the stone.
  let lintelY = Infinity;
  let spansArch = false;
  const minLintel = Math.max(2.5, door.height - 0.5);
  const maxLintel = door.height + 2.4;
  for (const p of house.props) {
    if (p.set?.walk) continue;
    const dx = p.x - house.gate.x, dz = p.z - house.gate.z;
    const u = dx * ux + dz * uz, v = dx * vx + dz * vz;
    const span = Math.max(p.w, p.d);
    if (Math.abs(v) <= span + 1.0 && Math.abs(u) <= span * 0.65 + 0.4) {
      const relY = p.y - door.y;
      if (relY >= minLintel && relY <= maxLintel) lintelY = Math.min(lintelY, relY);
    }
    if (p.y + p.h >= door.height + 1 && Math.abs(v) < span + 1 && Math.abs(u) < door.width * 0.25 && span > door.width * 0.6) {
      spansArch = true;
    }
  }
  const capped = isFinite(lintelY) || spansArch;
  const height = isFinite(lintelY) ? Math.max(door.height + 0.1, lintelY + 0.35) : door.height + (capped ? 0.2 : 0.08);

  // Choose curtain half-thickness that stays comfortably within the flanking masonry's depth at both mid and upper height.
  let backClear = 0;
  for (let dv = 0.05; dv <= MAX_DEPTH; dv += 0.05) {
    if (hit(-(bestL + 0.25), 1.5, bestV + dv) && hit(bestR + 0.25, 1.5, bestV + dv)
      && hit(-(bestL + 0.25), topProbe, bestV + dv) && hit(bestR + 0.25, topProbe, bestV + dv)) backClear = dv;
    else break;
  }
  const depth = Math.max(MIN_DEPTH, Math.min(MAX_DEPTH, Math.max(backClear, MIN_DEPTH)));

  return {
    x: house.gate.x + ux * uCenter + vx * bestV,
    z: house.gate.z + uz * uCenter + vz * bestV,
    width,
    height,
    depth,
    capped,
  };
}
