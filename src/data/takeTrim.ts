/**
 * The takes of a set, brought to one level (round 40: the recordings were each cut to the same peak, so one take of a
 * set could be 13 dB louder than another by its crest alone: a boom, a rattle, a beast, the investigator's own stab
 * sounded too loud or too quiet by the luck of the draw). Each take's trim is the set's mean level less its own, a
 * boost no more than 6 dB, a cut no more than 12, and none that would put its peak over -0.5 dBFS with the set's gain.
 * The set's gain keeps the level it was tuned to (the mean of its takes). Pure.
 */

import type { SampleSet } from './samples';
import { SAMPLE_LEVELS, type Level } from './sampleLevels';

export const TRIM = { boost: 6, cut: 12, ceiling: -0.5 } as const; // dB

/**
 * Round 124: a take whose weight lies where the ear hears little is lifted this much (dB) over its set's level (within the boost and the
 * ceiling). The first stone step is a thump under 200 Hz (centroid 160 Hz against its fellows' 320 to 410): at one rms it is about 6 dB
 * quieter to the ear, A-weighted, so one footfall in four on a dungeon's floor all but vanished. Half of that and a little more.
 */
export const TAKE_LIFT: Readonly<Record<string, number>> = { step_stone1: 3.5 };

/** The trim of each take of `set` in dB. A take with no measurement is left as it is. */
export function takeTrims(set: SampleSet, levels: Readonly<Record<string, Level>> = SAMPLE_LEVELS): Record<string, number> {
  const known = set.files.map((f) => levels[`sfx/${f}`]).filter((l): l is Level => !!l);
  if (!known.length) return {};
  const mean = known.reduce((n, l) => n + l.rms, 0) / known.length;
  const gain = 20 * Math.log10(set.gain);
  const out: Record<string, number> = {};
  for (const f of set.files) {
    const l = levels[`sfx/${f}`];
    if (!l) continue;
    const wanted = Math.min(TRIM.boost, Math.max(-TRIM.cut, mean - l.rms) + (TAKE_LIFT[f] ?? 0));
    out[f] = Math.min(wanted, TRIM.ceiling - (l.peak + gain)); // (a take already at the ceiling is not raised; one over it is cut to it)
  }
  return out;
}
