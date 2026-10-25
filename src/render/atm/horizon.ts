/**
 * Round 80, atmosphere: the far horizon and the eye: glow over far towns, windows going out, a lighthouse sweep, the eye opening in lamplight and closing in the dark. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it. The far towns and their lamps live in the skyline's own shader
 * (render/skyline.ts, horizonGlow.ts: this tells it what the air is doing); the eye is render/eyeAdapt.ts.
 */

import type { AtmContext, AtmPart } from '../atmosphere';
import { createEyeAdapt } from '../eyeAdapt';
import { overcastOf } from '../horizonGlow';
import { LIGHT_NERVES } from '../worldLights';

export function createHorizon(ctx: AtmContext): AtmPart {
  const { g, parts } = ctx;
  const eye = createEyeAdapt(parts.post, g);
  return {
    update(_camera, time, enclosed, alpha) {
      parts.skyline.air(overcastOf(g.overworld?.weather), LIGHT_NERVES.madness); // the glow lies on the cloud; a failing mind sees the far lights flicker
      eye.update(time, enclosed, alpha);
    },
  };
}
