/**
 * Round 78, atmosphere: each realm's own air: ambient particle fields, weather skins by realm, breath in the cold, motes in the lantern's light. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';

export function createRealmAir(_ctx: AtmContext): AtmPart {
  return { update() {} };
}
