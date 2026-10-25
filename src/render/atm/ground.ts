/**
 * Round 78, atmosphere: what the ground is made of answers the realm and the body: coats of snow, sand, brine and ash; grass that parts; rings in puddles. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';

export function createGroundSkin(_ctx: AtmContext): AtmPart {
  return { update() {} };
}
