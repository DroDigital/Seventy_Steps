/**
 * Round 80, atmosphere: what is under the foot, and the body that walks on it. One of the atmosphere audio hub's parts (render/audio/atmosphereAudio.ts):
 * made once with the game's audio and updated each frame, read-only on the simulation. The ground's character laid over each recorded footfall,
 * coat, satchel and lantern as the body moves, its breath, and in a failing mind a step that is not one's own (render/audio/bodyFoley.ts). It also
 * tells the picture the stress the FX setting allows (render/footfalls.ts), so the second set of prints keeps to it.
 */

import { FOOT_MIND } from '../../footfalls';
import { createBodyFoley } from '../bodyFoley';
import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';

export function createFooting(ctx: AtmAudioContext): AtmAudioPart {
  const body = createBodyFoley(ctx.g, ctx.recipe, ctx.sampler);
  return {
    update(fx, seconds, _camera, paused) {
      FOOT_MIND.stress = fx.stress;
      if (!paused) body.update(seconds, fx.stress); // (the foley, whose stride this keeps, stands still when the world does)
    },
  };
}
