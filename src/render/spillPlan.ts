/**
 * Where a lit window lays its light on the ground before it (round 80; windowSpill.ts draws it): out from the glass along the wall's
 * normal, as far as it runs before something stands in its way (a rule like the lights' sight, world/colliders.ts raycast, cast once
 * for each window and kept: the town does not move), on the plane the ground makes there. Pure: no Three.js.
 */

import { SPILL } from '../data/mistLight';
import { raycast, type Collider, type CollisionWorld } from '../world/colliders';

export interface SpillPlan {
  x: number; // where it begins: on the ground, out from the glass
  y: number;
  z: number;
  nx: number; // the way it runs (unit, on the ground)
  nz: number;
  length: number; // metres
  slopeAlong: number; // how much the ground rises for each metre along it, and across it
  slopeAcross: number;
}

/** The part of a window a plan needs. */
export interface Pane {
  x: number; // the light spot, half a metre before the glass (houseMesh.ts)
  z: number;
  glass: { x: number; y: number; z: number };
}

const CLEAR = 0.3; // metres from where a plan begins that the lines to find what stands in its way begin
const opaque = (c: Collider): boolean => !c.lightPass;

/** The plan for the window `s`, or null: no ground before it (a wall, a fence, a tree stands in the way), or it stands too high or too low. */
export function planSpill(s: Pane, world: CollisionWorld): SpillPlan | null {
  const g = s.glass;
  const n = Math.hypot(s.x - g.x, s.z - g.z);
  if (n < 1e-4) return null;
  const [nx, nz] = [(s.x - g.x) / n, (s.z - g.z) / n];
  const [sx, sz] = [-nz, nx]; // across it
  const [ox, oz] = [g.x + nx * SPILL.start, g.z + nz * SPILL.start];
  const y0 = world.ground(ox, oz);
  const high = g.y - y0;
  if (high < 0.3 || high > SPILL.highest) return null;
  let length = SPILL.reach * (0.75 + SPILL.tall * high);
  const [fx, fz] = [ox + nx * CLEAR, oz + nz * CLEAR]; // (the lines begin a little out, clear of the wall's own box)
  const from = { x: fx, y: world.ground(fx, fz) + SPILL.rays, z: fz };
  for (const side of [0, -1, 1]) { // the middle and either edge of its far end
    const ex = ox + nx * length + sx * side * SPILL.far * 0.4;
    const ez = oz + nz * length + sz * side * SPILL.far * 0.4;
    const hit = raycast(world, from, { x: ex, y: world.ground(ex, ez) + SPILL.rays, z: ez }, opaque);
    if (hit < 1) length = Math.min(length, Math.hypot(fx - ox, fz - oz) + hit * Math.hypot(ex - fx, ez - fz) - SPILL.margin);
  }
  if (length < SPILL.least) return null;
  const [ex, ez] = [ox + nx * length, oz + nz * length];
  const wide = (SPILL.near + SPILL.far) * 0.25; // half the width a third of the way out
  const slopeAlong = (world.ground(ex, ez) - y0) / length;
  const slopeAcross = (world.ground(ox + nx * length * 0.35 + sx * wide, oz + nz * length * 0.35 + sz * wide) - world.ground(ox + nx * length * 0.35, oz + nz * length * 0.35)) / wide;
  return { x: ox, y: y0, z: oz, nx, nz, length, slopeAlong, slopeAcross };
}

/** The plans, kept by where the window is. */
export function createSpillPlans(): (s: Pane, world: CollisionWorld) => SpillPlan | null {
  const kept = new Map<number, SpillPlan | null>();
  return (s, world) => {
    const g = s.glass;
    const key = (Math.round(g.x * 10) * 73856093) ^ (Math.round(g.z * 10) * 19349663) ^ (Math.round(g.y * 10) * 83492791);
    let plan = kept.get(key);
    if (plan === undefined) {
      if (kept.size > 800) kept.clear();
      plan = planSpill(s, world);
      kept.set(key, plan);
    }
    return plan;
  };
}
