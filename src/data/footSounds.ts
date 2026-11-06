/**
 * What is under the foot, and what the body carries (round 80). Footfalls had four recordings (the sea, stone, a road, "dirt"), and dirt
 * stood for snow, sand, mud, leaves, grass and the flesh of Yuggoth; boards a library or a townhouse is floored with played the stone's.
 * Each ground now adds a short recipe to the recorded step (the recording carries the weight, the recipe the character), the recorded step
 * itself takes the ground's `FEEL`, and the body has its coat, its satchel and its breath (round 83: and no lantern's bail). Same layers as data/sounds.ts,
 * each under the level of a footfall (tests/footSounds.test.ts keeps them in it). Data only.
 */

import type { GroundKind } from '../world/groundKind';
import { noise, tone, type Layer, type Sound } from './sounds';

/** A recipe at `k` of the level it was written at. */
const trim = (sound: Sound, k: number): Sound => sound.map((l): Layer => ({ ...l, gain: l.gain * k }));

/** How loud each class is played, against the recipes as written (round 83: the ground's recipes 0.5 to 0.42, a little under the recording, which is quieter by pace). */
export const FOOT_GAIN = { steps: 0.42, gear: 0.4, breath: 0.4, phantom: 0.12 } as const; // (round 83: the phantom step 0.22 to 0.12, with the steps it follows)

/**
 * How a footfall is played (round 83: the steps tired the ear on a long walk, four to five of them a second, all alike and the road's
 * bright; the lantern's bail and a buckle rang through them). Quieter at every pace, a lilt between the feet, no two the same, and the
 * bright recordings (the road's, the shallows') dulled, all by `render/audio/footing.ts`. The recordings stay as they are.
 */
export const STEP_VOICE = {
  level: [0.26, 0.58] as const, // the share of a set's own level, at a stand and at a sprint, by the pace between (a walk is 0.47, a guarded walk 0.37; round 80: 0.55 to 1, the walk at 0.85)
  jitter: 0.12, // each step's level drawn this much either way
  offFoot: 0.86, // the second foot of a pair lands this much softer
  /** The brightest, loudest recordings (the road's: centroid 2.4 kHz and 3.5 dB over the dirt's; the shallows') are brought down to sit with the dirt's and the stone's, which are dark already and are left. */
  surface: { road: { gain: 0.8, lowpass: 2000 }, water: { gain: 0.85, lowpass: 2200 } } as Readonly<Partial<Record<'water' | 'stone' | 'road' | 'dirt', { gain: number; lowpass: number }>>>,
  /** Round 86: on a dungeon room's floor (render/audio/foley.ts `indoorsAt`) a step is lifted by this much (+5 dB), against the same step in the open, whose levels are as round 83 left them. Round 83 took 5 dB from every step, and the dungeon's were the quietest already (the stone's dark recording a little under the dirt's, and a timber, mud or flesh floor 4 to 6 dB under that again): with the room to themselves they went almost unheard. 1.8 puts a walk (0.47 x 1.8 = 0.85) back where round 80 had it; the recipe laid over the step, a failing mind's followers and the room's returns, which are a share of the step, ride the same lift. */
  indoors: 1.8,
  splash: 0.2, // a stride on soaked ground splashes this loud at full wet (round 80: 0.32)
  backstep: 0.5, // a backstep's two scuffs (round 80: 0.8)
} as const;

/** The recipe laid over the recorded step on each ground (the others keep the recording as it was: stone, road, slab, the sea). 0.08 to 0.25 s. Round 83: snow, sand, leaves and gravel, whose bright grains were the loudest part of their step, are trimmed to sit under it (0.35, 0.5, 0.45 and 0.9 to 0.22, 0.24, 0.2 and 0.65). */
export const STEP_LAYERS: Partial<Record<GroundKind, Sound>> = {
  // Snow: three grains of crust giving way, a squeak of one grain on another.
  snow: trim([noise('highpass', 2800, 0.06, 0.6, { q: 0.7 }), noise('bandpass', 3700, 0.05, 0.5, { at: 0.04, q: 2 }), noise('highpass', 2300, 0.06, 0.4, { at: 0.085 }), tone('sine', 1900, 0.1, 0.07, { at: 0.02, to: 2450, vibrato: [14, 30] })], 0.22),
  sand: trim([noise('bandpass', 3000, 0.2, 0.38, { to: 2100, q: 0.7, attack: 0.07 }), noise('lowpass', 600, 0.1, 0.25, { attack: 0.02 })], 0.24),
  gravel: trim([...[0, 0.025, 0.052, 0.082, 0.115].map((at, k) => noise('bandpass', 1300 + 560 * ((k * 3) % 5), 0.022, 0.55, { at, q: 3 })), noise('lowpass', 520, 0.1, 0.3)], 0.65),
  leaves: trim([...[0, 0.03, 0.058, 0.1, 0.13, 0.17].map((at, k) => noise('highpass', 3800 + 450 * ((k * 2) % 4), 0.02, 0.45, { at, attack: 0.002 })), noise('bandpass', 2200, 0.2, 0.3, { to: 1400, q: 0.9, attack: 0.05 })], 0.2),
  grass: trim([noise('bandpass', 2400, 0.16, 0.34, { to: 1500, q: 0.8, attack: 0.05 }), tone('sine', 92, 0.1, 0.22, { to: 70, attack: 0.01 })], 0.55),
  mud: trim([tone('sine', 180, 0.12, 0.3, { to: 72, attack: 0.008 }), noise('lowpass', 620, 0.16, 0.45, { to: 260, attack: 0.01 }), tone('sine', 90, 0.1, 0.13, { at: 0.12, to: 210, attack: 0.02 }), noise('bandpass', 700, 0.08, 0.2, { at: 0.12, to: 1400, q: 2 })], 0.6),
  boards: trim([tone('sine', 135, 0.14, 0.4, { to: 92, attack: 0.004 }), noise('bandpass', 900, 0.07, 0.34, { q: 2.2 }), tone('triangle', 610, 0.05, 0.07, { at: 0.01, to: 480 })], 0.5),
  flesh: trim([noise('lowpass', 950, 0.09, 0.55, { to: 380, attack: 0.005 }), tone('sine', 92, 0.16, 0.32, { to: 58, attack: 0.008 }), tone('sine', 70, 0.09, 0.12, { at: 0.14, to: 150, attack: 0.02 })], 0.55),
  rot: trim([tone('sine', 150, 0.12, 0.28, { to: 62, attack: 0.008 }), noise('lowpass', 520, 0.15, 0.4, { to: 220, attack: 0.01 }), noise('bandpass', 600, 0.07, 0.18, { at: 0.11, to: 1200, q: 2 })], 0.65),
};
/** The creak a board gives now and then (one step in seven). */
export const BOARD_CREAK: Sound = [tone('sawtooth', 215, 0.26, 0.3, { to: 190, attack: 0.04, vibrato: [7, 55], filter: { type: 'bandpass', hz: 780, q: 3 } }), noise('bandpass', 1500, 0.2, 0.14, { q: 6, attack: 0.05 })];

/**
 * How the recorded step is taken on each ground: its level against a dirt step's, its pitch, and the high end closed (Hz). Snow and sand are
 * soft and dull under the recipe's grit; boards and flesh are a different body than the stone and the dirt they were recorded on.
 */
export const FEEL: Partial<Record<GroundKind, { gain: number; pitch: number; lowpass?: number }>> = {
  snow: { gain: 0.55, pitch: 0.95, lowpass: 2400 },
  sand: { gain: 0.5, pitch: 0.92, lowpass: 2600 },
  mud: { gain: 0.6, pitch: 0.84, lowpass: 1800 },
  grass: { gain: 0.72, pitch: 0.96, lowpass: 3400 },
  leaves: { gain: 0.5, pitch: 1.04 },
  gravel: { gain: 0.8, pitch: 1.06 },
  boards: { gain: 0.5, pitch: 0.88, lowpass: 3200 },
  flesh: { gain: 0.55, pitch: 0.78, lowpass: 1500 },
  rot: { gain: 0.6, pitch: 0.82, lowpass: 1700 },
};

/**
 * The body: cloth and leather. Quiet; a dungeon's silence has someone in it. Round 83: nothing rings. The lantern's bail against its hook
 * (a 4.3 kHz tick and a ringing 2.9 kHz) and the satchel's buckle (a 2.3 kHz click and a 800 Hz tone) were the metal clatter that went with
 * every walk and run; they are gone, the satchel is the leather alone, and the coat's high tick with them (tests/footing.test.ts keeps all
 * of it under 2 kHz and free of tones).
 */
export const GEAR = {
  coat: [noise('bandpass', 1500, 0.17, 0.3, { to: 880, q: 0.9, attack: 0.05 })], // a coat's skirt swinging as the stride begins
  satchel: [noise('bandpass', 900, 0.06, 0.22, { q: 1.2, attack: 0.012 }), noise('lowpass', 480, 0.07, 0.3, { attack: 0.006 })], // the pack's leather shifting on the back
} satisfies Record<string, Sound>;

/** Breath. */
export const BREATH = {
  exhale: [noise('bandpass', 1100, 0.5, 0.26, { to: 640, q: 1.2, attack: 0.18 }), tone('sine', 120, 0.4, 0.025, { attack: 0.15, to: 100 })], // let out in the cold
  pant: [noise('bandpass', 1350, 0.2, 0.42, { to: 800, q: 1, attack: 0.07 }), noise('bandpass', 1500, 0.15, 0.28, { at: 0.26, to: 900, q: 1, attack: 0.05 })], // hard-won air, out
  gasp: [noise('highpass', 1600, 0.18, 0.2, { to: 2600, attack: 0.1 }), tone('sine', 200, 0.14, 0.02, { attack: 0.06, to: 260 })], // a breath drawn in
  ragged: [noise('lowpass', 700, 0.5, 0.34, { to: 380, attack: 0.14 }), tone('sine', 98, 0.5, 0.05, { attack: 0.14, vibrato: [9, 80] }), noise('bandpass', 1900, 0.12, 0.07, { at: 0.04, q: 3 })], // wet, shallow, near the end
} satisfies Record<string, Sound>;

/** When the body speaks. */
export const BODY = {
  coatAfter: 0.5, // seconds still before a first step swings the coat
  coatEvery: 3, // one sprint stride in this many swings the coat (round 80: every one)
  satchelEvery: 4, // one sprint stride in this many shifts the pack (round 80: three)
  creakEvery: 7,
  sprintBreath: 2, // seconds of sprint before the body pants after
  panting: { from: 0.2, again: 0.35 }, // the stamina share it gasps below, and must climb back over
  nearDeath: 0.3, // HEART.need from which the breath turns ragged
  coldFrom: 0.45, // the cold an exhale is heard in
  coldEvery: [3.8, 6.2] as const,
  phantom: { fractured: 0.12, unmoored: 0.28, delay: [0.45, 0.85] as const, stopAfter: 4, stopChance: 0.25, stopDelay: 0.8, pan: 0.75, pitch: 0.88, lowpass: 900 },
} as const;
