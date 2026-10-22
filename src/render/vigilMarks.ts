/**
 * A vigil kept, drawn (round 64; systems/discovery.ts keeps it): about the mark of a vigil whose turn has come, a ring on the ground
 * the breadth of where it is kept, cold while the hour, the sky or the mind it asks for is not here and warm while it is, and inside
 * it a circle drawn in from its middle as the vigil is kept and drawn back as it ebbs. Before, how far a vigil had come was said and
 * heard but not seen. Render only.
 */

import { FOUND } from '../data/discoveries';
import type { Game } from '../systems/components';
import { vigilsNear } from '../systems/discovery';
import type { GroundFx } from './groundFx';
import type { Rgb } from './palette';

const SEEN = 36; // metres from the mark within which it is drawn
const COLD: Rgb = [0.5, 0.55, 0.75]; // (as a way's lights that wait: render/wayViews.ts)
const FLAME: Rgb = [1, 0.8, 0.45];

/** Lays the marks of the vigils near the investigator on the ground's steady decals. */
export function createVigilMarks(g: Game, ground: GroundFx): void {
  ground.steady((decals, time) => {
    for (const v of vigilsNear(g, SEEN)) {
      const y = g.world.ground(v.x, v.z);
      const pulse = 0.5 + 0.5 * Math.sin(time * (v.holds ? 3 : 1.4));
      decals.ring(v.x, y, v.z, FOUND.vigil, 0.16, v.holds ? FLAME : COLD, v.holds ? 0.7 + 0.25 * pulse : 0.35 + 0.15 * pulse);
      if (v.share > 0) decals.sigil(v.x, y, v.z, FOUND.vigil - 0.35, v.share, FLAME, 0.85);
    }
  });
}
