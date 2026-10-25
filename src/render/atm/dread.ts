/**
 * Round 80, atmosphere: the picture of dread: pressure, the shock, watchers that step nearer unseen, eyes beyond the lantern. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it. Pressure (render/pressure.ts, fx.ts) is the FX controller's and the watchers' steps and
 * darters are render/watchers.ts's, which worldLife already updates; this part holds what is new beside them: the shock's sound (render/shock.ts), the eyes (darkEyes.ts)
 * and the bed that gives way while the watchers stand, all asked of the sound through `DREAD_AIR`.
 */

import { SHOCK } from '../../data/dreadPicture';
import type { AtmContext, AtmPart } from '../atmosphere';
import { createDarkEyes } from '../darkEyes';
import { installDreadDebug } from '../dreadDebug';
import { approach } from '../pressure';
import { createShock, DREAD_AIR } from '../shock';
import { WATCHING } from '../watchers';
import { heldBreath } from '../watcherSteps';

export function createDreadPicture(ctx: AtmContext): AtmPart {
  const { scene, g, audio } = ctx;
  const shock = createShock(g, audio);
  const eyes = createDarkEyes(scene, g);
  let [held, last, hooked] = [0, -1, false];
  return {
    update(camera, time, enclosed) {
      const dt = last < 0 ? 0 : Math.min(0.25, Math.max(0, time - last));
      last = time;
      const hidden = enclosed || !g.overworld;
      const hit = shock.update(time);
      eyes.update(camera, time, hidden);
      held = approach(held, hidden ? 0 : heldBreath(WATCHING.count), dt, 1.4); // the bed gives way while they stand, and swells back when they go
      DREAD_AIR.muffle = hit * SHOCK.muffle * DREAD_AIR.cap;
      DREAD_AIR.hush = Math.min(1, Math.max(hit * SHOCK.hush, held)) * DREAD_AIR.cap;
      if (!hooked) hooked = installDreadDebug(g, eyes);
    },
  };
}
