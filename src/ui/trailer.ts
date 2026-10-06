/**
 * The trailer's tour (round 46; `?trailer`, docs/PRESS_KIT.md): the picture alone, no HUD, no hints, the camera swaying slowly
 * about one place after another, for a screen recorder to take (OBS, the Steam recorder) as footage for a trailer or the store's
 * pictures. It goes on until stopped: each place is held for SPAN seconds, in the night or the day it has. `?trailer&hold=<n>` holds
 * the n-th place for ever. Called once a picture.
 */

import { signPlace, travel } from '../systems/checkpoints';
import type { Game } from '../systems/components';

/** The places that show the dream best, from the town where it begins to the court at its heart. */
export const SCENES: readonly string[] = ['hub_quad', 'arkham_heath', 'innsmouth_reef', 'mountains_city', 'dream_zin', 'rlyeh_door', 'yuggoth_cities', 'beyond_court'];
const SPAN = 14; // seconds a place is held

export interface Trailer {
  tick(now: number): void;
}

export function startTrailer(g: Game, hold?: number): Trailer {
  let at = -1;
  let from = 0;
  let toward = 0; // the way the camera looks: at the Elder Sign, which is lit, and what lies beyond it
  const go = (now: number): void => {
    at = hold !== undefined ? Math.min(SCENES.length - 1, Math.max(0, hold)) : (at + 1) % SCENES.length;
    from = now;
    g.overworld?.discovered.add(SCENES[at]); // (travel goes only to a sign found)
    travel(g, SCENES[at]);
    const sign = signPlace(SCENES[at]);
    if (sign) toward = Math.atan2(sign.x - sign.rest.x, sign.z - sign.rest.z);
  };
  go(performance.now());
  return {
    tick(now) {
      g.camera.yaw = toward + 0.5 * Math.sin(((now - from) / 1000) * 0.22); // a slow sway about the sign, to one side and the other
      if (hold === undefined && (now - from) / 1000 >= SPAN) go(now);
    },
  };
}
