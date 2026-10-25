/**
 * Round 80, the night's hours heard (systems/clock.ts gave the picture three hours and the sound none: a bed played at one
 * level from the first minute to the last). In the gloaming the insects are full and the windows lit; they thin through the
 * deep of the night, owls and whippoorwills take the hours; at the moon's height the world holds its breath for about a minute
 * and a half, the Still, until one far dog howls and it begins again; in the waning the wind lifts and the crows stir in a grey
 * that never becomes day. Data and its pure functions: render/audio/ambience.ts reads them for the beds and the spots,
 * render/audio/placeVoices.ts for the Still's end, tests/ambienceHours.test.ts pins them. Under a roof the hour does not apply
 * (as the sky's grey does not: render/nightFx.ts).
 */

import { CLOCK } from './tuning';
import { dawnOf, type Hour } from '../systems/clock';
import type { SampleSetId } from './samples';

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Where the night holds its breath (the phase, 0..1: the moon is highest at about 0.49), about 86 seconds, eased in and out over `ease`. */
export const STILL = { from: 0.46, to: 0.54, ease: 0.02 } as const;

/** How far the Still holds at `phase`: 0 outside it, 1 within, eased at its edges. */
export const stillOf = (phase: number): number => smooth(STILL.from - STILL.ease, STILL.from, phase) * (1 - smooth(STILL.to, STILL.to + STILL.ease, phase));

/** Seconds from `phase` to the Still's end, 0 outside it. */
export const stillLeft = (phase: number): number => (phase >= STILL.from - STILL.ease && phase < STILL.to + STILL.ease ? Math.max(0, STILL.to + STILL.ease - phase) * CLOCK.night : 0);

type Keys = readonly (readonly [phase: number, level: number])[];

const along = (keys: Keys, phase: number): number => {
  let k = 1;
  while (k < keys.length - 1 && phase > keys[k][0]) k++;
  const [[p0, v0], [p1, v1]] = [keys[k - 1], keys[k]];
  return v0 + (v1 - v0) * smooth(p0, p1, phase);
};

/** A bed a little quieter as the night turns, and at the gloaming it opens on (the same at both ends of the night, so it turns without a step). */
const lull = (depth: number, p: number): number => 1 - depth * (1 - smooth(0, 0.14, p)) - depth * smooth(0.96, 1, p);

/** The insects: full at the gloaming, thinning through the night to a few at its last hour, and back with the lamps as it turns. */
const INSECTS: Keys = [[0, 1], [0.09, 1], [0.3, 0.55], [0.58, 0.45], [0.7, 0.34], [0.88, 0.2], [0.94, 0.24], [1, 1]];

/**
 * The share of a bed's level at each phase of the night, by the bed's file (data/samples.ts): the insects as above, the wind
 * lifting by the grey of the last hour (`dawnOf`: a quarter more at its height), the rest flat but for the Still. A bed not named plays as it was.
 */
const HOUR_BEDS: Readonly<Record<string, (phase: number) => number>> = {
  crickets: (p) => along(INSECTS, p),
  frogs: (p) => along(INSECTS, p),
  wind: (p) => lull(0.1, p) * (1 + 0.25 * dawnOf(p)),
  wind_cold: (p) => lull(0.08, p) * (1 + 0.2 * dawnOf(p)),
  wind_ghost: (p) => 1 + 0.1 * dawnOf(p),
};

/** How far each bed sinks in the Still (the share of its level it gives up): the insects nearly all, the leaves half, the wind some, the sea and the cave none. */
export const STILL_DEPTH: Readonly<Record<string, number>> = { crickets: 0.8, frogs: 0.8, leaves: 0.5, wind: 0.4, wind_cold: 0.35, wind_ghost: 0.3 };

/** The share of a bed's listed level the hour leaves it, by its file (without the extension) at `phase`. */
export const hourBed = (file: string, phase: number): number => (HOUR_BEDS[file]?.(phase) ?? 1) * (1 - (STILL_DEPTH[file] ?? 0) * stillOf(phase));

/** How much more or less often a spot sounds in each hour (its wait is divided by this): the owls take the deep of the night, the dogs the evening; absent: as before. */
export const SPOT_HOURS: Readonly<Partial<Record<SampleSetId, Readonly<Record<Hour, number>>>>> = {
  owl: { gloaming: 0.8, deep: 1.5, waning: 0.9 },
  whippoorwill: { gloaming: 1.3, deep: 1.5, waning: 0.4 },
  farHowl: { gloaming: 1.2, deep: 1.1, waning: 0.7 },
};

/** The weight of a spot's set in an hour. */
export const spotHour = (set: SampleSetId, hour: Hour): number => SPOT_HOURS[set]?.[hour] ?? 1;

/** After the Still the world takes a breath before the dog: seconds from its end to the howl, and the howl's own numbers (the set, its gain and the low-pass it is heard through, and the waking world's realms, where there are dogs to howl). */
export const STILL_HOWL = { after: 2.5, set: 'farHowl', gain: 0.85, lowpass: 1900, pitch: [0.9, 0.97] as const, realms: ['hub', 'arkham', 'dunwich', 'innsmouth', 'providence', 'vermont'] as readonly string[] } as const;
