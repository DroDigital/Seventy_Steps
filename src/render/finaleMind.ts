/**
 * The failing mind through an ending (round 98). The picture takes up a mind going — the warp, the
 * colour, the whispers, the wrong stars — from whatever sanity the investigator brought, harder as
 * the scene goes, and holds that picture from halfway through the last fade. A wait holds it too,
 * because the scene's clock does. Presentation only: nothing is written to the save, and the
 * accessibility cap still bounds every effect (fx.ts `sanityStress`).
 */

import { ENDING_SCENES } from '../data/cutscenesEndings';
import { sceneLength } from './cinemaPlan';

/** Share of a scene by which the picture has gone as far as it will, and stays there. */
const FULL_AT = 0.5;

const lengths = new Map<string, number>(Object.values(ENDING_SCENES).map((s) => [s.id, sceneLength(s)]));

/** 0 at the open, 1 from `FULL_AT` of `length` on. Climbs hard, then holds. */
export function endingMind(time: number, length: number): number {
  if (!(length > 0)) return 1;
  const u = Math.min(1, Math.max(0, time / (length * FULL_AT)));
  return 1 - (1 - u) ** 3;
}

/**
 * The sanity the picture is drawn at during an ending scene, or null when `scene` is not one.
 * Never above `mind` (what they came in with is kept), and none of it from halfway through the end.
 */
export function endingSanity(scene: string, time: number, mind: number): number | null {
  const length = lengths.get(scene);
  if (length === undefined) return null;
  return Math.min(mind, (1 - endingMind(time, length)) * 100);
}
