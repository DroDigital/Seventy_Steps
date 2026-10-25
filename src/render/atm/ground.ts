/**
 * Round 78, atmosphere: what the ground is made of answers the realm and the body: coats of snow, sand, brine and ash (data/coats.ts, laid by
 * render/realmLook.ts into the world shader); grass that parts and lies down behind whoever goes through it, and rings in puddles (render/bodyPush.ts).
 * One of the atmosphere hub's parts (render/atmosphere.ts): made once with the world's life and updated each drawn frame, outside the simulation
 * and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';
import { createBodyPush } from '../bodyPush';

export function createGroundSkin(ctx: AtmContext): AtmPart {
  const push = createBodyPush(ctx.g);
  return {
    update(camera, time, enclosed, alpha) {
      push.update(camera.position, time, enclosed, alpha);
    },
  };
}
