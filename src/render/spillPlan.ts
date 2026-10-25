/** A pane's projection geometry, shared by ground and raised receivers. Pure: no Three.js. */

import { SPILL } from '../data/mistLight';
import type { CollisionWorld } from '../world/colliders';

export interface SpillPlan {
  nx: number;
  nz: number;
  offset: number; // distance from glass to the light spot
  height: number; // glass above the ground outside its wall
}

export interface Pane {
  x: number;
  z: number;
  glass: { x: number; y: number; z: number };
}

export function planSpill(s: Pane, world: CollisionWorld): SpillPlan | null {
  const g = s.glass;
  const offset = Math.hypot(s.x - g.x, s.z - g.z);
  if (offset < 1e-4) return null;
  const height = g.y - world.ground(s.x, s.z);
  if (height < 0.3 || height > SPILL.highest) return null;
  // Do not stop the light before an obstacle: the obstacle itself must receive it.
  return { nx: (s.x - g.x) / offset, nz: (s.z - g.z) / offset, offset, height };
}

/** Weak keys follow chunk lifetimes and keep a new world's ground out of a previous world's plans. */
export function createSpillPlans(): (s: Pane, world: CollisionWorld) => SpillPlan | null {
  const worlds = new WeakMap<CollisionWorld, WeakMap<Pane, SpillPlan | null>>();
  return (s, world) => {
    let kept = worlds.get(world);
    if (!kept) worlds.set(world, (kept = new WeakMap()));
    let p = kept.get(s);
    if (p === undefined) {
      p = planSpill(s, world);
      kept.set(s, p);
    }
    return p;
  };
}
