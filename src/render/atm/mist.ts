/**
 * Round 80, atmosphere: light in the mist: moonlight shafts, window spill and lamp beams, a living mist. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it. The moon's shafts are the post pass's
 * (moonShafts.ts, shaders/fogShaft.ts), each light's aim for the mist's glow (lampAim.ts) and the windows' light on the ground (windowSpill.ts) follow the lights the
 * world chose this frame (worldLights.ts LIGHT_VIEW), and the mist's own life (a sheared fine layer, rolling banks, the gale's drift, the rise after rain) is
 * in volumetricFog.ts, which reads the weather itself.
 */

import type { AtmContext, AtmPart } from '../atmosphere';
import { createLampAim } from '../lampAim';
import { createMoonShafts } from '../moonShafts';
import { MIST } from '../volumetricFog';
import { createWindowSpill } from '../windowSpill';
import { worldUniforms } from '../worldMaterial';

export function createMistLight(ctx: AtmContext): AtmPart {
  const shafts = createMoonShafts(ctx.parts.post);
  const aims = createLampAim(ctx.parts.post);
  const spill = createWindowSpill(ctx.g);
  return {
    update(_camera, time, enclosed) {
      const open = !enclosed && !!ctx.g.overworld; // a roof, a dungeon or the arena keeps its own light
      shafts.update(time, worldUniforms.uLightDir.value.y, MIST.thickness, ctx.g.overworld?.weather, open);
      aims.update(open);
      spill.update(time, open);
    },
  };
}
