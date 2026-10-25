/**
 * Round 78, the places' voices: now and then, far off, a sound that is only that place's (render/audio/placeVoices.ts plays them).
 * Each realm has two or three, from its own tale: the fog-bell and the horn off Devil Reef, a church organ in Arkham and a cracked toll
 * on Federal Hill, the hills of Dunwich rumbling among the whippoorwills, wind piping through the peaks of the Mountains of Madness, a
 * drum in Leng. Rare (a voice's own gap is minutes, and the realm's never two within `GAP`), always far (`far`: metres), quiet, and
 * apart from the cues the game answers events with: none rises like a bell, and none is ever near. The hours weight them (their wait
 * is divided by the hour's weight; 0: never then); nothing sounds in a fight, a cutscene, a storm or under a roof. The recipes are in
 * data/ambienceSounds.ts, the recordings (`set`) are data/samples.ts's, shut in by a low-pass.
 */

import type { Hour } from '../systems/clock';
import type { FarId } from './ambienceSounds';
import type { SampleSetId } from './samples';

export interface PlaceVoice {
  id: string; // a voice is never heard twice running
  recipe?: FarId; // a recipe of ambienceSounds.ts...
  set?: SampleSetId; // ...or a recording of a set, dulled by `lowpass`
  every: readonly [min: number, max: number]; // seconds between its turns at the best of the hours
  gain: number;
  far: readonly [min: number, max: number]; // metres, where it seems to come from
  hours: Readonly<Partial<Record<Hour, number>>>; // how likely it is in each: absent, never
  seaward?: boolean; // from the water's side, and only where there is water within reach
  lowpass?: number; // Hz: the top shut off a recording (a recipe is dulled by the distance alone)
  pitch?: readonly [number, number];
  still?: boolean; // may sound in the Still (none does but the dog at its end)
}

/** Seconds a realm is quiet after any of its voices, and the worst of the weather for them (the wind and the thunder cover them). */
export const GAP = 60;
/** How patient the places are: every voice's wait is its own interval times this, the one knob for them all (1.4: about a voice in three or four minutes in a realm that has the hour for it). */
export const PACE = 1.4;
export const MASKED: ReadonlySet<string> = new Set(['storm', 'gale']);
/** A voice's range, in times its farthest (render/audio/cues.ts `placeSound`: whole within 3 m, fading squared to nothing at the range): at its farthest it is heard at about a third of the level it would be at the door. */
export const REACH = 2.5;
/** The most of the hush (the ground going quiet before a horror: AudioEngine.hushed) in which a voice may begin. */
export const HUSH_MOST = 0.12;

const night = { gloaming: 1, deep: 1, waning: 0.6 } as const;
const crows = (realm: string): PlaceVoice => ({ id: `${realm}-crows`, set: 'raven', every: [110, 220], gain: 0.62, far: [90, 170], hours: { waning: 1.6 }, lowpass: 2400, pitch: [0.82, 0.95] }); // the waning's grey: they stir though no dawn comes

export const PLACE_VOICES: Readonly<Record<string, readonly PlaceVoice[]>> = {
  hub: [
    { id: 'hub-toll', recipe: 'toll', every: [200, 340], gain: 0.8, far: [110, 170], hours: { gloaming: 1.5, deep: 0.6 } }, // a bell on the campus, cracked
    crows('hub'),
  ],
  arkham: [
    { id: 'arkham-organ', recipe: 'organ', every: [180, 330], gain: 0.9, far: [120, 190], hours: { gloaming: 0.5, deep: 1 } }, // a church with no one in it
    crows('arkham'),
  ],
  dunwich: [
    { id: 'dunwich-hill', set: 'rumble', every: [110, 200], gain: 0.8, far: [150, 260], hours: { gloaming: 0.4, deep: 1, waning: 0.5 }, lowpass: 340, pitch: [0.8, 0.95] }, // Sentinel Hill, among the whippoorwills
  ],
  innsmouth: [
    { id: 'innsmouth-horn', recipe: 'foghorn', every: [95, 170], gain: 0.9, far: [150, 260], hours: { gloaming: 1, deep: 1, waning: 1.4 }, seaward: true },
    { id: 'innsmouth-buoy', recipe: 'buoy', every: [90, 160], gain: 0.8, far: [120, 220], hours: night, seaward: true },
    { id: 'innsmouth-chant', set: 'chant', every: [120, 220], gain: 0.55, far: [160, 260], hours: { gloaming: 0.3, deep: 1, waning: 0.3 }, lowpass: 560, pitch: [0.8, 0.92], seaward: true }, // the Order of Dagon, over the water
  ],
  providence: [
    { id: 'providence-toll', recipe: 'toll', every: [150, 260], gain: 0.85, far: [120, 190], hours: { gloaming: 1.4, deep: 0.8 } }, // Federal Hill's church
    { id: 'providence-organ', recipe: 'organ', every: [200, 340], gain: 0.8, far: [130, 200], hours: { deep: 1 } },
    crows('providence'),
  ],
  vermont: [
    { id: 'vermont-drone', recipe: 'woodsDrone', every: [130, 230], gain: 0.9, far: [150, 250], hours: { gloaming: 0.4, deep: 1, waning: 0.7 } },
    crows('vermont'),
  ],
  mountains: [
    { id: 'mountains-ice', recipe: 'iceBoom', every: [100, 190], gain: 0.85, far: [160, 300], hours: night },
    { id: 'mountains-pipe', recipe: 'windpipe', every: [70, 140], gain: 0.9, far: [140, 240], hours: { gloaming: 0.8, deep: 1, waning: 1.5 } },
  ],
  pnakotus: [{ id: 'pnakotus-chime', recipe: 'dryChime', every: [80, 160], gain: 0.9, far: [100, 180], hours: { gloaming: 0.8, deep: 1, waning: 0.8 } }],
  kn_yan: [{ id: 'knyan-drip', recipe: 'drip', every: [90, 170], gain: 0.9, far: [60, 140], hours: { gloaming: 1, deep: 1, waning: 1 } }],
  dreamlands: [
    { id: 'dream-bell', recipe: 'templeBell', every: [110, 200], gain: 0.9, far: [130, 220], hours: { gloaming: 1, deep: 1.3, waning: 0.6 } },
    { id: 'leng-drum', recipe: 'drum', every: [150, 260], gain: 0.9, far: [160, 280], hours: { gloaming: 0.5, deep: 1, waning: 0.5 } },
  ],
  rlyeh: [{ id: 'rlyeh-swell', recipe: 'deepSwell', every: [120, 220], gain: 0.9, far: [100, 200], hours: { gloaming: 1, deep: 1, waning: 1 } }],
};
