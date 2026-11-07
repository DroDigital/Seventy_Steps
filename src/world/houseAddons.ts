/**
 * The parts a town house has beyond its walls (round 110): a lower wing built onto one side, a bay window standing out of the front and,
 * on some clapboard houses, the two posts of the porch. They are drawn (render/houseMesh.ts) and walled (`houseSolids`, read by
 * props.ts's colliders) from the one plan made here, on a stream of the house's own seed: a foe is never placed in one (planSpawns) nor
 * walks through one. Before round 110 they were drawn without colliders and placed without a check. Pure: no Three.js.
 */

import { createRng, type Rng } from '../core/rng';
import type { Collider } from './colliders';
import type { Prop } from './props';

/** The salt of a house's addon stream, apart from the stream its walls and roof are drawn on. */
const SALT = 0x3c6ef372;
/** Metres the wing's back face sits inside the house's back wall. Its gables overhang 0.3 m behind the back face, so the back face is set in by half a metre: the gables then stand inside the wall, not fighting it (round 110: the ray audit, tests/objectView.test.ts). */
const WING_BACK = 0.5;

export interface HouseAddons {
  /** A wing in the house's frame (front toward +z): its middle at x `at`, z `z0`; half breadths `ww` (along x) and `wwd` (along z); walls `hw` high. */
  wing: { side: -1 | 1; ww: number; wwd: number; hw: number; at: number; z0: number } | null;
  /** A bay window: its middle at x `x`, its sill `by` above the ground. */
  bay: { x: number; by: number } | null;
  /** Two porch posts a metre and a half out from the front, at x ±1.15. */
  porch: boolean;
  /** The stream after the parts' draws: the renderer draws the wing's windows and the bay's glass from it. */
  rng: Rng;
}

/** A house's parts, the same for the renderer and the colliders. A hovel and a stone house take no wing, bay or porch; a house whose wing would shut a yard in has none (`noWing`, sealWings.ts). */
export function houseAddons(p: Prop): HouseAddons {
  const style = p.style ?? 'clapboard';
  const solid = style !== 'hovel' && style !== 'stone';
  const h = style === 'brick' ? p.h + 1.5 : p.h; // (the walls' height, as the renderer has it)
  const rng = createRng((p.seed ^ SALT) >>> 0);
  // The draws come in this order whatever is taken, so each part's size is the same for every reader.
  const wingOn = rng() < 0.5;
  const side: -1 | 1 = rng() < 0.5 ? -1 : 1;
  const ww = p.w * (0.45 + 0.2 * rng());
  const wwd = p.d * (0.6 + 0.15 * rng());
  const bayOn = rng() < 0.35;
  const bx = (rng() < 0.5 ? -1 : 1) * p.w * 0.5;
  const porchOn = rng() < 0.45;
  return {
    wing: solid && wingOn && !p.noWing ? { side, ww, wwd, hw: Math.max(2.6, h * 0.72), at: side * (p.w + ww - 0.35), z0: -(p.d - wwd) + WING_BACK } : null,
    bay: solid && bayOn ? { x: bx, by: 0.4 + h * 0.3 } : null,
    porch: style === 'clapboard' && porchOn,
    rng,
  };
}

/** A house's solid parts beyond its walls, as colliders in the world: a wing's walls, a bay's box, a porch's posts. */
export function houseSolids(p: Prop): Collider[] {
  const a = houseAddons(p);
  const [s, k] = [Math.sin(p.yaw), Math.cos(p.yaw)];
  const at = (lx: number, lz: number): { x: number; z: number } => ({ x: p.x + lx * k + lz * s, z: p.z - lx * s + lz * k }); // turned as the model is (rotateY)
  const out: Collider[] = [];
  if (a.wing) {
    const c = at(a.wing.at, a.wing.z0);
    out.push({ kind: 'obox', x: c.x, z: c.z, hx: a.wing.ww, hz: a.wing.wwd, yaw: p.yaw, y0: p.y - 0.5, y1: p.y + 0.4 + a.wing.hw });
  }
  if (a.bay) {
    const c = at(a.bay.x, p.d + 0.3);
    out.push({ kind: 'obox', x: c.x, z: c.z, hx: 0.95, hz: 0.35, yaw: p.yaw, y0: p.y + a.bay.by - 0.7, y1: p.y + a.bay.by + 1 });
  }
  if (a.porch) {
    for (const sx of [-1, 1]) {
      const c = at(sx * 1.15, p.d + 1.5);
      out.push({ kind: 'cylinder', x: c.x, z: c.z, radius: 0.1, y0: p.y - 0.5, y1: p.y + 3.1 });
    }
  }
  return out;
}
