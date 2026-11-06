/** Sconces share their spacing only when their light is not separated by a wall or ceiling. */
import { segmentBox, type V3 } from '../core/geom';
import type { BoxPart } from '../world/dungeonParts';

export const TORCH_SEPARATION = 12;

/** Whether a nearby sconce already lights the same open space. */
export function crowdedTorch(at: V3, placed: readonly V3[], walls: readonly BoxPart[]): boolean {
  return placed.some((other) => {
    const d = { x: at.x - other.x, y: at.y - other.y, z: at.z - other.z };
    if (Math.hypot(d.x, d.y, d.z) >= TORCH_SEPARATION) return false;
    return !walls.some((wall) => segmentBox(other, d, wall.min, wall.max) < 1);
  });
}
