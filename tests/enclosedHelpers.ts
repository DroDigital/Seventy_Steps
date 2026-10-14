/** Helpers for the walled-in audits (round 49): whether a body stands clear in the world, and whether it can walk out. */

import { resolveCapsule, type Collider } from '../src/world/colliders';
import { createWorldCollision } from '../src/world/worldCollision';

export const BODY = 0.55; // metres: a foe's or the investigator's width (the capsule is 0.45)

/** Whether a body of radius `r` cannot stand at (x, z) in the open world: a prop, a wall, a house, the edge of the land. */
export function worldBlocked(): (x: number, z: number, r?: number) => boolean {
  const world = createWorldCollision();
  return (x, z, r = BODY) => {
    const pos = { x, y: world.ground(x, z), z };
    resolveCapsule(world, pos, r, 1.8);
    return Math.hypot(pos.x - x, pos.z - z) > 0.02;
  };
}

/** Whether a body of radius `r` cannot stand at (x, z) among these colliders alone (a feature's own props). */
export function amongBlocked(colliders: readonly Collider[], r = BODY): (x: number, z: number) => boolean {
  return (x, z) =>
    colliders.some((c) => {
      if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) < c.radius + r;
      if (c.kind === 'obox') {
        const [s, k] = [Math.sin(c.yaw), Math.cos(c.yaw)];
        const [dx, dz] = [x - c.x, z - c.z];
        return Math.abs(dx * k - dz * s) < c.hx + r && Math.abs(dx * s + dz * k) < c.hz + r;
      }
      return x > c.min.x - r && x < c.max.x + r && z > c.min.z - r && z < c.max.z + r;
    });
}
