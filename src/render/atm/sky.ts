/**
 * Round 80, atmosphere: the sky answers the weather and the hours: overcast, the moon behind cloud, dusk, false dawn, wheeling stars, heat lightning, the wrong moon. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 * It runs after the lightning has added its flash and the night its moon, and dims what they have lit (render/overcast.ts); the debug handle is `window.sky.mesh.userData.atm`.
 */

import type { AtmContext, AtmPart } from '../atmosphere';
import { createHeatLightning } from '../heatLightning';
import { createOvercast } from '../overcast';
import { createSkyHours } from '../skyHours';
import { newAtm } from '../skyForce';
import { createSkyOmen } from '../skyOmen';

export function createSkyPass({ g, parts }: AtmContext): AtmPart {
  const { sky, post } = parts;
  const atm = newAtm();
  sky.userData.atm = atm; // (the debug handle: force, and what the parts now show)
  const overcast = createOvercast(g, sky, post, atm);
  const hours = createSkyHours(g, sky, post, atm);
  const heat = createHeatLightning(g, sky, atm);
  const omen = createSkyOmen(g, sky, atm);
  return {
    update(camera, time, enclosed) {
      const region = g.overworld?.region ?? null;
      overcast.update(time, enclosed);
      hours.update(time, region, enclosed);
      heat.update(camera, time, region, enclosed);
      omen.update(camera, time, enclosed);
    },
  };
}
