/**
 * Round 78, atmosphere: the Sleeper's breath: the world slowly inhales and exhales about a colossus that has not yet woken. One of
 * the atmosphere hub's parts (render/atmosphere.ts): made once with the world's life and updated each drawn frame, outside the
 * simulation and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';

export function createSleeper(_ctx: AtmContext): AtmPart {
  return { update() {} };
}
