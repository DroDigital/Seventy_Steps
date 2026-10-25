/**
 * Round 78, atmosphere: the sky answers the weather and the hours: overcast, the moon behind cloud, dusk, false dawn, wheeling stars, heat lightning, the wrong moon. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';

export function createSkyPass(_ctx: AtmContext): AtmPart {
  return { update() {} };
}
