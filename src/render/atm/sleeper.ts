/**
 * Round 78, atmosphere: the Sleeper's breath: the world slowly inhales and exhales about a colossus that has not yet woken. One of
 * the atmosphere hub's parts (render/atmosphere.ts): made once with the world's life and updated each drawn frame, outside the
 * simulation and read-only on it. The breath itself is render/sleeperBreath.ts (and its sound, audio/atm/dread.ts).
 */

import type { AtmContext, AtmPart } from '../atmosphere';
import { createSleeperBreath } from '../sleeperBreath';

export function createSleeper(ctx: AtmContext): AtmPart {
  const breath = createSleeperBreath(ctx.g, ctx.parts.post);
  return {
    update(_camera, time, enclosed) {
      breath.update(time, enclosed);
    },
  };
}
