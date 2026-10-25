/**
 * A person's blink (round 83; render only, pure): once in every few seconds, at an instant of its own for each person, the eyes
 * close and open again in a fraction of a second; and one dozing on their feet (the waning hour, at no act) has them nearly shut.
 * It is a function of the time and the person alone, so it needs no clock of its own and two people never blink together.
 */

import { hash2 } from '../core/rng';
import { FIGURE_LIFE } from '../data/fxTuning';

/** How shut the eyes are at `time` (render seconds) for the person `seed`: 0 open .. 1 shut. */
export function blinkAt(time: number, seed: number): number {
  const { cell, shut } = FIGURE_LIFE.blink;
  const k = Math.floor(time / cell);
  const start = k * cell + hash2(k, 11, seed) * (cell - shut);
  const u = (time - start) / shut;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) ** 0.7 : 0;
}

/** How shut they are, given how drowsy the person is (0..1, eased by the caller): a doze holds them nearly shut, and wakes into the blinks. */
export const lidAt = (blink: number, drowsy: number): number => Math.max(blink * (1 - drowsy), drowsy * FIGURE_LIFE.blink.doze);
