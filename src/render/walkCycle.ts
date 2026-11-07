/**
 * A walk kept to the ground (round 113; render only): a creature's walk frames step with the ground it covers, not with the clock, so its
 * feet plant and do not slide when it creeps or races. One cycle of a drawn walk (both feet) carries a body `WALK.cycle` of its height,
 * a little more as it goes faster, as a stride lengthens with pace.
 */

import type { Entity } from '../core/ecs';

export const WALK = {
  cycle: 1.15, // body heights one walk cycle covers at a walk...
  pace: 0.12, // ...and this many more for every body height a second it goes
  most: 2.2, // never more than this many body heights a cycle
  jump: 4, // metres in one frame that is a move to another place, not a step
} as const;

/** Body heights one cycle covers at `speed` m/s, for a body `height` metres tall. */
export const cycleLength = (height: number, speed: number): number => Math.min(WALK.most, WALK.cycle + WALK.pace * (speed / Math.max(0.2, height))) * Math.max(0.2, height);

export interface WalkCycles {
  /** The cycles creature `id` has walked, having come to (x, z) after `dt` seconds. */
  at(id: Entity, x: number, z: number, height: number, dt: number): number;
  forget(live: ReadonlySet<Entity>): void;
}

export function createWalkCycles(): WalkCycles {
  const walked = new Map<Entity, { x: number; z: number; cycles: number }>();
  return {
    at(id, x, z, height, dt) {
      const w = walked.get(id);
      if (!w) {
        walked.set(id, { x, z, cycles: ((id * 0.6180339887) % 1) }); // (each starts at a step of its own: a pack does not step as one)
        return ((id * 0.6180339887) % 1);
      }
      const d = Math.hypot(x - w.x, z - w.z);
      if (d < WALK.jump) w.cycles += d / cycleLength(height, dt > 0 ? d / dt : 0);
      [w.x, w.z] = [x, z];
      return w.cycles;
    },
    forget(live) {
      for (const id of walked.keys()) if (!live.has(id)) walked.delete(id);
    },
  };
}
