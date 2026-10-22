/**
 * A cutscene's lens inside the fog (round 68: "address the initial display of only the boss fog"). The investigator is walked to a step
 * inside the wall before a horror and the horror wakes there; a shot that stands behind them, or a long way off its horror, stood on
 * the far side of the wall, and the opaque fog filled the picture for the first seconds. The lens is kept inside every wall the scene is
 * played in: turned about the investigator to their side, where the shot is theirs, and otherwise drawn in along its line to the head
 * of whoever it circles. Pure: render/cinema.ts asks it for each frame.
 */

import type { V3, XZ } from '../core/geom';
import { insideLine, lensInside } from '../systems/fogGates';
import type { FogWall } from '../world/gatePlan';

const MOST = (Math.PI * 2) / 3; // how far round the investigator the lens may be turned to find the inside (120 degrees)
const BEHIND = Math.PI - 0.1; // within this of straight behind, which side the lens is on is not told by the angle

/** Which way round `on` the lens at `pos` lies from the line to `toward`: the angle from that line to it (radians, -PI..PI). */
const bearing = (on: XZ, toward: XZ, pos: XZ): number => {
  const [bx, bz, ax, az] = [toward.x - on.x, toward.z - on.z, pos.x - on.x, pos.z - on.z];
  return Math.atan2(bx * az - bz * ax, bx * ax + bz * az);
};

export interface FogKeep {
  /** The lens `pos` of a shot on `on`, kept inside `walls`; `head` is what it circles, `toward` the other party (to tell its side), `turn` whether it may swing round `on`. */
  (walls: readonly FogWall[], o: { on: XZ; head: V3; toward: XZ | null; pos: V3; turn: boolean }): V3;
}

/** A keeper that remembers which side of the line it swung to, so that a lens straight behind someone turns the same way frame after frame. */
export function fogKeeper(): FogKeep & { reset(): void } {
  let side = 1;
  const keep: FogKeep = (walls, { on, head, toward, pos, turn }) => {
    if (!walls.length || lensInside(walls, pos)) return pos;
    if (turn && toward) {
      const a = bearing(on, toward, pos);
      if (Math.abs(a) < BEHIND) side = Math.sign(a) || side;
      const swing = (by: number): V3 => { // `pos` swung by `by` round `on`, towards the line to `toward` when positive
        const [c, s, dx, dz] = [Math.cos(-side * by), Math.sin(-side * by), pos.x - on.x, pos.z - on.z];
        return { x: on.x + dx * c - dz * s, y: pos.y, z: on.z + dx * s + dz * c };
      };
      const reach = Math.min(MOST, Math.abs(a)); // swung towards the line to the other party, and not past it
      if (reach > 0 && lensInside(walls, swing(reach))) {
        let [lo, hi] = [0, reach];
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          if (lensInside(walls, swing(mid))) hi = mid;
          else lo = mid;
        }
        return swing(hi);
      }
    }
    const k = insideLine(walls, head, pos);
    return { x: head.x + (pos.x - head.x) * k, y: head.y + (pos.y - head.y) * k, z: head.z + (pos.z - head.z) * k };
  };
  return Object.assign(keep, { reset: () => void (side = 1) });
}
