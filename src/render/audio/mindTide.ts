/**
 * The tide (round 78, atmosphere): Unmoored, the world's high end breathes, closing and opening again as a slow swell of the mind's own, not
 * louder and not a sound: only how much of the top of the world is let through. It is the engine's muffle (engine.ts `setMuffle`, which
 * near death the heart keeps closed, audio/gameAudio.ts), asked for more by up to `MIND_EARS.tide.depth` of its range, in a swell with a
 * period of seven seconds; the larger of the two wins, so a body near death is never made to hear it open. Follows `fx.stress` (the
 * Accessibility cap's), and is nothing in a menu or a cutscene. Read by gameAudio's one line; written by audio/mindEars.ts.
 */

import { MIND_EARS } from '../../data/mindSounds';

/** What the tide asks of the muffle now (0..depth): written each frame by the mind's ears, read by gameAudio. */
export const MIND_TIDE = { muffle: 0 };

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** How far the tide closes the high end at `seconds`, for a mind at `stress` (0..1 of the stress the effects keep to): none before the Unmoored line, then in over a stretch of it. */
export function tideOf(seconds: number, stress: number): number {
  const T = MIND_EARS.tide;
  return T.depth * smooth(T.from, T.full, stress) * (0.5 + 0.5 * Math.sin(seconds * T.rate));
}
