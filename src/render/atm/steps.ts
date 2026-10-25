/**
 * Round 80, atmosphere: the ground keeps the steps. One of the atmosphere hub's parts (render/atmosphere.ts): made once with the world's
 * life and updated each drawn frame, outside the simulation and read-only on it. Each footfall (render/footfalls.ts, counted as the foley
 * counts them) leaves a print on the ground that takes one (snow, mud, sand, flesh; ground the rain has soaked; any ground for ten seconds
 * after the sea), kicks up the ground's own dust at a run, and, when the mind is Fractured or Unmoored, now and then a second, bare, larger
 * print appears a stride behind and to one side (render/footprintPlan.ts).
 */

import { STEPS } from '../../data/bodyTuning';
import { fighting } from '../../systems/sanity';
import type { AtmContext, AtmPart } from '../atmosphere';
import { createStrideClock, followed, FOOT_MIND } from '../footfalls';
import { laid, printOn } from '../footprintPlan';
import { createFootprints } from '../footprints';
import { puffsOf } from '../footPuffs';
import { wetness } from '../wetness';

export function createFootsteps(ctx: AtmContext): AtmPart {
  const { scene, g, parts } = ctx;
  const prints = createFootprints(scene, (x, z) => g.world.ground(x, z));
  const clock = createStrideClock(g);
  let [n, dripUntil, tokens, last, splashed] = [0, -1, STEPS.puffs.perSecond as number, -1, false];
  g.events.on('Splash', ({ at }) => {
    const me = g.ecs.c.transform.get(g.player.id)?.pos;
    if (me && Math.hypot(me.x - at.x, me.z - at.z) < 3) splashed = true; // (in the sea: whatever it was, the investigator is wet)
  });

  return {
    update(_camera, time) {
      const dt = last < 0 ? 0 : Math.min(0.25, Math.max(0, time - last));
      last = time;
      tokens = Math.min(STEPS.puffs.perSecond, tokens + dt * STEPS.puffs.perSecond);
      if (splashed) [dripUntil, splashed] = [time + STEPS.afterWater.seconds, false];
      const f = clock.step(time);
      if (f) {
        if (f.ground === 'water') dripUntil = time + STEPS.afterWater.seconds; // wading: boots and coat run with it
        n++;
        const print = printOn(f.ground, wetness.value, Math.max(0, Math.min(1, (dripUntil - time) / STEPS.afterWater.seconds)));
        if (print) for (const l of laid(f, print, followed(g.mind.band, FOOT_MIND.stress) && !fighting(g), n, Math.sin(n * 12.9898))) prints.lay(l, time);
        for (const s of puffsOf(f, wetness.value, Math.random)) {
          if (tokens < 1) break;
          tokens--;
          parts.particles.spawn(s);
        }
      }
      prints.update(time);
    },
  };
}
