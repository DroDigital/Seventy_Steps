/**
 * Round 80, atmosphere: what the ground is made of answers the realm and the body: coats of snow, sand, brine and ash (data/coats.ts, laid by
 * render/realmLook.ts into the world shader); grass that parts and lies down behind whoever goes through it, and rings in puddles (render/bodyPush.ts).
 * Round 116: a blast's wave runs out through it (render/blastWaves.ts), and the grass stands thick at the investigator's feet (render/nearGrass.ts).
 * One of the atmosphere hub's parts (render/atmosphere.ts): made once with the world's life and updated each drawn frame, outside the simulation
 * and read-only on it.
 */

import type { AtmContext, AtmPart } from '../atmosphere';
import { createBlastWaves } from '../blastWaves';
import { createBodyPush } from '../bodyPush';
import { createNearGrass } from '../nearGrass';

export function createGroundSkin(ctx: AtmContext): AtmPart {
  const push = createBodyPush(ctx.g);
  const blasts = createBlastWaves(ctx.g); // round 116: a blast's wave bends the grass and boughs, throws the mist, gutters the flames and carries the air off
  const near = createNearGrass(ctx.scene, ctx.g); // round 116: the grass at the investigator's feet, as thick as the realm grows it
  return {
    update(camera, time, enclosed, alpha) {
      blasts.update(time); // (first: a strong one lays the grass at its heart down, which the push's upload carries)
      push.update(camera.position, time, enclosed, alpha);
      near.update(enclosed);
    },
  };
}
