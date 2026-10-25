/**
 * The three hours of the night, seen in the sky (round 80: they changed only its brightness, and its hue was one all night): at the turn a low
 * afterglow lies along the horizon opposite where the moon rose, thinning over the gloaming; the deep is the plain dark it was; in the waning hour a
 * pale false dawn leans up from the far side of where the moon sets, and sinks back at the turn. Far hills and roofs stand against these as black
 * cut-outs. And the stars wheel about the pole, steadily, so a vigil's called hour (ninety times as fast) turns them in sight. Each realm's glow has its
 * own colour (data/hours.ts); the grade and the palette are not shifted. Render only; a hint of the glow warms the ambient light and the mist.
 */

import type * as THREE from 'three';
import { cosmosOf } from '../data/cosmos';
import { HOURS, HOUR_COLOURS } from '../data/hours';
import type { Game } from '../systems/components';
import { afterglowOf, falseDawnOf, phaseOf, skyTurnOf } from '../systems/clock';
import { moonDir } from './nightFx';
import type { PostPass } from './postPass';
import type { SkyAtm } from './skyForce';
import { worldUniforms } from './worldMaterial';

/** The bearing opposite where the moon is at `phase`, as the sky measures it (atan2 of x over z): the dusk lies away from where the moon rose, the false dawn away from where it sets. */
export const oppositeOf = (phase: number): number => {
  const m = moonDir(phase);
  return Math.atan2(m.x, m.z) + Math.PI;
};

export interface SkyHours {
  update(time: number, region: string | null, enclosed: boolean): void;
}

export function createSkyHours(g: Game, sky: THREE.Mesh, post: PostPass, atm: SkyAtm): SkyHours {
  const u = (sky.material as THREE.ShaderMaterial).uniforms;
  const [azDusk, azDawn] = [oppositeOf(0), oppositeOf(1)];
  let [last, lastTurn, held, still] = [-1, NaN, 0, 0]; // `held`: the radians of wheeling the Pale Lattice, where time is stopped, did not let the stars make
  return {
    update(time, region) {
      const dt = last < 0 ? 1 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const k = atm.force.snap ? 1 : Math.min(1, dt / HOURS.ease);
      const colours = g.overworld ? HOUR_COLOURS[region ?? ''] : undefined; // the realms that have a night of the common kind
      const phase = atm.force.phase ?? phaseOf(time);
      const open = u.uOpen.value as number;
      const [glow, dawn] = colours ? [afterglowOf(phase) * open, falseDawnOf(phase) * open] : [0, 0];
      atm.afterglow += (glow - atm.afterglow) * k;
      atm.dawn += (dawn - atm.dawn) * k;
      if (colours) { // (a realm without them fades out in the colours it had)
        const [cg, cd] = [u.uHourGlow.value as THREE.Vector3, u.uHourDawn.value as THREE.Vector3];
        cg.set(cg.x + (colours.glow[0] * HOURS.band - cg.x) * k, cg.y + (colours.glow[1] * HOURS.band - cg.y) * k, cg.z + (colours.glow[2] * HOURS.band - cg.z) * k);
        cd.set(cd.x + (colours.dawn[0] * HOURS.cone.band - cd.x) * k, cd.y + (colours.dawn[1] * HOURS.cone.band - cd.y) * k, cd.z + (colours.dawn[2] * HOURS.cone.band - cd.z) * k);
      }
      u.uHour.value.set(atm.afterglow, atm.dawn, azDusk, azDawn);
      const turn = g.overworld ? skyTurnOf(time) : 0;
      still += ((cosmosOf(region).still) - still) * k;
      if (!Number.isNaN(lastTurn)) held += ((((turn - lastTurn + 3 * Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI) * still; // (the short way round)
      lastTurn = turn;
      u.uTurn.value = (((turn - held) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (atm.afterglow > 0.01) {
        const c = u.uHourGlow.value as THREE.Vector3;
        const w = (HOURS.tint * atm.afterglow) / HOURS.band;
        worldUniforms.uAmbient.value.set(worldUniforms.uAmbient.value.x + c.x * w, worldUniforms.uAmbient.value.y + c.y * w, worldUniforms.uAmbient.value.z + c.z * w); // a warm cast on the nearest ground
      }
      if (atm.dawn > 0.01) {
        const c = u.uHourDawn.value as THREE.Vector3;
        const w = (HOURS.tint * 1.5 * atm.dawn) / HOURS.cone.band;
        const m = post.uniforms.uFogColor.value;
        m.set(m.x + c.x * w, m.y + c.y * w, m.z + c.z * w); // and a pallor in the mist
      }
    },
  };
}
