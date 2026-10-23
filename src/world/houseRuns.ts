/**
 * Walls laid in straight runs (round 68; the bailey's `run` of round 67, taken out so every enclosure of straight edges lays its wall the
 * same way): a run from one point to another is cut into pieces about `HOUSE.segment` long that each overlap the next, and every
 * `tower.every`th piece carries a tower, so a corner where two runs meet, or the bend of a curve cut into short runs, leaves no crack for a body
 * to find. A piece's inward face looks the way the run is told is inward. Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { HOUSE, type House } from '../data/arenaHouses';
import { facing, tower, wall } from './houseParts';
import type { Prop } from './props';

export interface Runner {
  readonly props: Prop[];
  /** A run of wall from `from` to `to`, its inward face toward `inward` (a unit vector). */
  run(from: XZ, to: XZ, inward: XZ): void;
}

/** The unit vector perpendicular to the run from `from` to `to` that points toward `centre`. */
export function inwardOf(from: XZ, to: XZ, centre: XZ): XZ {
  const [dx, dz] = [to.x - from.x, to.z - from.z];
  const k = Math.hypot(dx, dz) || 1;
  const n = { x: -dz / k, z: dx / k };
  const side = (centre.x - from.x) * n.x + (centre.z - from.z) * n.z;
  return side >= 0 ? n : { x: -n.x, z: -n.z };
}

/** A runner laying `h`'s wall on ground at `y`, the wall pieces seeded from 1000 and the towers from 2000. */
export function runner(h: House, y: number): Runner {
  const props: Prop[] = [];
  let [seed, count] = [1000, 0];
  return {
    props,
    run(from, to, inward) {
      const length = Math.hypot(to.x - from.x, to.z - from.z);
      const pieces = Math.max(1, Math.ceil(length / HOUSE.segment));
      const step = length / pieces;
      const len = step + h.thick * 0.5 + 0.5; // the step, and enough over to the next that no corner leaves a crack
      for (let k = 0; k < pieces; k++) {
        const t = (k + 0.5) / pieces;
        const at = { x: from.x + (to.x - from.x) * t, z: from.z + (to.z - from.z) * t };
        props.push(wall(h, y, at.x, at.z, facing(inward), len, seed++));
        if (count++ % h.tower.every === h.tower.every - 1) props.push(tower(h, y, at.x, at.z, facing(inward), h.tower.height, 2000 + count, h.tower.lit));
      }
    },
  };
}
