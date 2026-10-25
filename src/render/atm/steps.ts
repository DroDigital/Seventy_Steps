/**
 * Round 78, atmosphere: the ground keeps the steps: footprints, trail puffs, a following set. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';

export function createFootsteps(_ctx: AtmContext): AtmPart {
  return { update() {} };
}
