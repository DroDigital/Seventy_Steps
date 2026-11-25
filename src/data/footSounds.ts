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

/** How loud each class is played, against the recipes as written (round 83: the ground's recipes 0.5 to 0.42, a little under the recording, which rides the pace curve). */
export const FOOT_GAIN = { steps: 0.42, gear: 0.4, breath: 0.4, phantom: 0.2 } as const; // (the phantom step: round 80 0.22, round 83 0.12 with the steps it follows, round 121 back beside them)

/**
 * How a footfall is played (round 83: the steps tired the ear on a long walk, four to five of them a second, all alike and the road's
 * bright; the lantern's bail and a buckle rang through them). Round 121: round 83 took them 5 dB down at every pace and they went all
 * but unheard, which took the walk out of the world: they are back at round 80's level, and the long walk is eased otherwise. The feet
 * keep their lilt and their twelve per cent, and each now lands a little to its own side; the ear settles into a long walk (`settle`:
 * after a while the steps give a couple of decibels, and come back when the walk stops or the ground changes); a walk that ends draws
 * the trailing foot up (`plant`); and the bright recordings are softened less (the road's 2 kHz was a blanket). `render/audio/footing.ts`
 * reads all of it. The recordings stay as they are.
 */
export const STEP_VOICE = {
  level: [0.55, 1] as const, // the share of a set's own level, at a stand and at a sprint, by the pace between (a walk is 0.84; round 80 the same; round 83 0.26 to 0.58, the walk at 0.47)
  jitter: 0.12, // each step's level drawn this much either way
  offFoot: 0.86, // the second foot of a pair lands this much softer
  spread: 0.08, // round 121: how far to its own side each foot is heard (the right a little right, the left a little left: not one point drumming)
  /** The brightest, loudest recordings (the road's: centroid 2.4 kHz and 3.5 dB over the dirt's; the shallows') are brought a little down to sit with the dirt's and the stone's, which are dark already and are left (round 83: 0.8 under 2 kHz and 0.85 under 2.2 kHz, which dulled the commonest walk to a thud). */
  surface: { road: { gain: 0.9, lowpass: 3200 }, water: { gain: 0.9, lowpass: 3000 } } as Readonly<Partial<Record<'water' | 'stone' | 'road' | 'dirt', { gain: number; lowpass: number }>>>,
  /** On a dungeon room's floor (render/audio/foley.ts `indoorsAt`) a step is lifted by this much against the same step in the open: a closed hall carries a footfall. Round 86 made it 1.8 to undo round 83's cut indoors; with the open air's level restored, a little is left (+1 dB): the stone's dark recording is a little under the dirt's. The recipe laid over the step, a failing mind's followers and the room's returns ride the same lift. */
  indoors: 1.12,
  /** Round 121: the ear settles into a long walk. After `after` seconds of steady walking the steps ease toward `floor` of their level over `over` seconds more (-2 dB at the most: never down where round 83 had them), and come back `recover` times as fast as they went once the walk stops; new ground underfoot is heard whole again. */
  settle: { after: 8, over: 25, floor: 0.8, recover: 4, gap: 0.7 },
  /** Round 121: a walk of `after` seconds or more that stops draws the trailing foot up: one soft scuff, `gain` of the last step's level, duller (`lowpass`), a moment after the last footfall (`wait`), at most once in `every` seconds. */
  plant: { after: 1.2, gain: 0.45, lowpass: 2400, wait: 0.2, every: 1.6 },
  splash: 0.28, // a stride on soaked ground splashes this loud at full wet (round 80: 0.32; round 83: 0.2)
  backstep: 0.75, // a backstep's two scuffs (round 80: 0.8; round 83: 0.5)
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
  rustle: [noise('bandpass', 1150, 0.22, 0.24, { to: 720, q: 0.8, attack: 0.08 }), noise('lowpass', 420, 0.16, 0.2, { attack: 0.05 })], // round 121: the coat brushing as he walks, now and then (a walk had no cloth in it but its first step)
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
  /** Round 121: the cloth comes after a number of strides drawn afresh each time (round 83's every third and fourth sprint stride was a rhythm the ear caught): the coat at a sprint, the pack at a sprint, the brush of the coat at a walk (quieter: `rustle`). */
  coatEvery: [2, 4] as const, // (round 80: every sprint stride; round 83: every third)
  satchelEvery: [3, 5] as const, // (round 80: every third; round 83: every fourth)
  rustleEvery: [6, 10] as const,
  rustle: 0.5, // its level against the coat's swing
  creakEvery: 7,
  sprintBreath: 2, // seconds of sprint before the body pants after
  panting: { from: 0.2, again: 0.35 }, // the stamina share it gasps below, and must climb back over
  nearDeath: 0.3, // HEART.need from which the breath turns ragged
  coldFrom: 0.45, // the cold an exhale is heard in
  coldEvery: [3.8, 6.2] as const,
  phantom: { fractured: 0.12, unmoored: 0.28, delay: [0.45, 0.85] as const, stopAfter: 4, stopChance: 0.25, stopDelay: 0.8, pan: 0.75, pitch: 0.88, lowpass: 900 },
} as const;
