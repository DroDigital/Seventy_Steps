/**
 * The picture's quality set for the computer it runs on (round 46). The first time the game is played, with no settings kept
 * yet, the frames of its first seconds are measured; if they are slow, the picture steps down a rung of this ladder (the shadows
 * first: two more passes over the scene; then the sharpness, the fog) and is measured again, until it holds a smooth rate or the
 * ladder is spent. What was chosen is in Settings › Display, to change; a player who has settings is never touched. Pure.
 */

import type { FrameSummary } from '../core/frameStats';

export interface Rung {
  resolution: number;
  fog: number;
  shadows: number;
}

/** From the sharpest the game draws to the plainest it can. */
export const LADDER: readonly Rung[] = [
  { resolution: 2, fog: 1, shadows: 1 },
  { resolution: 2, fog: 1, shadows: 0 },
  { resolution: 1.5, fog: 0.75, shadows: 0 },
  { resolution: 1, fog: 0.5, shadows: 0 },
  { resolution: 0.75, fog: 0.25, shadows: 0 },
  { resolution: 0.5, fog: 0, shadows: 0 },
];

export const QUALITY = {
  warm: 4, // seconds after the first frame before measuring (the world is still being made, shaders compiled)
  measure: 5, // seconds measured at each rung
  smooth: 50, // frames a second below which a rung is too much
  poor: 28, // and below which two are
};

/** The rung the settings stand on now: the highest whose numbers the settings do not exceed. */
export function rungOf(s: Rung): number {
  const i = LADDER.findIndex((r) => r.resolution <= s.resolution && r.fog <= s.fog && r.shadows <= s.shadows);
  return i < 0 ? LADDER.length - 1 : i;
}

/** The rung to try next after measuring `at`: the same when it was smooth, or the last when there is no lower. */
export function nextRung(at: number, got: FrameSummary): number {
  if (got.frames < 3 || got.fps >= QUALITY.smooth) return at;
  return Math.min(LADDER.length - 1, at + (got.fps < QUALITY.poor ? 2 : 1));
}
