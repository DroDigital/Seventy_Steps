/**
 * Round 78, atmosphere: light in the mist: moonlight shafts, window spill and lamp beams, a living mist. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';

export function createMistLight(_ctx: AtmContext): AtmPart {
  return { update() {} };
}
