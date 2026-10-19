/**
 * The draft horse's pawing at the ground while it stands (round 57: the picture and the ear share one clock). Now and then, by the
 * nine-second period it is drawn on, a fore hoof is lifted and put down twice; `landed` says whether one came down between two moments,
 * so the sound is the hoof's own (render/audio/mountAudio.ts) and render/draftHorse.ts draws the stroke. No Three.js.
 */
import { hash2 } from '../core/rng';

export const PAW = Object.freeze({ period: 9, from: 2, span: 1.6, landings: Object.freeze([1 / 3, 1] as const) });

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));

/** 0 when the hoof is not pawing; otherwise 0 to 1 through the stroke (the picture lifts the hoof by the sine of 3 pi times it). */
export function pawAt(time: number): number {
  return hash2(Math.floor(time / PAW.period), 3, 17) > 0.45 ? clamp(((time % PAW.period) - PAW.from) / PAW.span) : 0;
}

/** How many times the hoof came down on the ground in the span from `from` to `to` seconds (a landing at the end of each lobe of the stroke). */
export function pawLanded(from: number, to: number): number {
  if (!(to > from) || to - from > PAW.period) return 0;
  let count = 0;
  for (const start of [Math.floor(from / PAW.period), Math.floor(to / PAW.period)].filter((v, i, all) => all.indexOf(v) === i)) {
    if (!(hash2(start, 3, 17) > 0.45)) continue;
    for (const share of PAW.landings) {
      const at = start * PAW.period + PAW.from + PAW.span * share;
      if (at > from && at <= to) count++;
    }
  }
  return count;
}
