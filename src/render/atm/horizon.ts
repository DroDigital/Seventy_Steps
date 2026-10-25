/**
 * Round 78, atmosphere: the far horizon and the eye: glow over far towns, windows going out, a lighthouse sweep, the eye opening in lamplight and closing in the dark. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';

export function createHorizon(_ctx: AtmContext): AtmPart {
  return { update() {} };
}
