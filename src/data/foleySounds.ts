/**
 * The game's small sounds (round 40: the menus clicked one triangle tone for everything, and a draught, a needle, a
 * thrown flask, a drawn blade, a coin, a mist wall, a page, a pipe and a knife had no sound of their own, or the one of
 * something else). Recipes of the same layers as data/sounds.ts, each made to the length of the motion it sounds with
 * (data/moves.ts frames, data/npcActs.ts beats, the mist wall's walk): tests/soundSync.test.ts says which, and
 * tests/soundMix.test.ts keeps each in the loudness of its class. They are played with a little variation drawn each
 * time (render/audio/vary.ts), so none sounds twice the same. Data only.
 */

import { noise, tone, type Sound, type StingerId } from './sounds';

/** How loud each class of these is played, against the recipes as written (tests/soundMix.test.ts keeps every sound in its class's window). */
export const CLASS_GAIN = { ui: 0.4, hands: 1, impact: 1, acts: 0.5, mist: 0.4 } as const;

/**
 * The frame of a move at which each of the investigator's hand sounds begins (frames: data/moves.ts). Each is placed so its
 * own length ends within the move: tests/soundSync.test.ts checks it, so a move changed will say so.
 */
export const HAND_FRAMES = {
  parry: { guard: 0 },
  drink: { swallow: 30 }, // the cork is at 10 (render/audio/foley.ts); the item on 34; the bottle set down as the move ends
  inject: { needle: 14, plunger: 34 }, // the item on 36
  throw: { glug: 2, lob: 6 }, // the volley on 16
} as const;

/** The menus: wood, paper and the dark, never a bell or a beep. Each a few milliseconds long and low in level, for they come in runs. */
export const UI = {
  move: [noise('bandpass', 1700, 0.04, 0.5, { q: 3 }), tone('sine', 330, 0.05, 0.1, { to: 270, attack: 0.002 })], // the focus steps: a fingertip on a table
  choose: [noise('bandpass', 1000, 0.06, 0.55, { q: 2 }), tone('triangle', 196, 0.26, 0.2, { attack: 0.003, to: 190 }), tone('sine', 392, 0.2, 0.06, { at: 0.012, attack: 0.003 }), noise('highpass', 3200, 0.07, 0.1, { at: 0.02 })], // a seal pressed in wax: a low knock, a small bloom
  back: [tone('triangle', 174, 0.2, 0.2, { to: 128, attack: 0.003 }), noise('lowpass', 800, 0.1, 0.5, { q: 1 })], // set down, lower than it was taken up
  tab: [noise('bandpass', 2600, 0.07, 0.4, { q: 2.5 }), noise('bandpass', 1900, 0.06, 0.3, { at: 0.05, q: 2.5 })], // a card flicked over, two edges of it
  open: [noise('bandpass', 420, 0.5, 0.45, { to: 900, q: 1.4, attack: 0.25 }), tone('sine', 98, 0.6, 0.18, { attack: 0.2, to: 104 }), noise('bandpass', 2300, 0.14, 0.22, { at: 0.1, q: 1.6 })], // a book drawn open in the dark
  close: [noise('bandpass', 900, 0.34, 0.4, { to: 300, q: 1.2 }), tone('sine', 82, 0.4, 0.2, { to: 60, attack: 0.01 }), noise('bandpass', 1400, 0.06, 0.3, { at: 0.26, q: 2 })], // and shut
  tick: [noise('bandpass', 3000, 0.025, 0.4, { q: 5 })], // a slider's step, a thread of a nail on a ridge
} satisfies Record<string, Sound>;

/** What the investigator's hands do (frames: data/moves.ts). */
export const HANDS = {
  // The cane lifted to a guard (parry, 36 frames): steel whispering on its sheath, a breath of air.
  guard: [noise('bandpass', 1700, 0.13, 0.5, { to: 3400, q: 1.5, attack: 0.03 }), tone('triangle', 1150, 0.1, 0.05, { to: 1550, attack: 0.02 }), noise('lowpass', 500, 0.1, 0.25, { attack: 0.03 })],
  // A draught (drink, 60 frames, the item on frame 34): two swallows, a glass set back.
  swallow: [
    noise('bandpass', 520, 0.11, 0.55, { q: 3, attack: 0.02 }), tone('sine', 150, 0.13, 0.2, { to: 92, attack: 0.02 }),
    noise('bandpass', 480, 0.12, 0.45, { at: 0.2, q: 3, attack: 0.02 }), tone('sine', 140, 0.14, 0.17, { at: 0.2, to: 88, attack: 0.02 }),
    noise('bandpass', 3400, 0.04, 0.2, { at: 0.46, q: 5 }), tone('sine', 2700, 0.18, 0.03, { at: 0.46 }), // the bottle's foot on the stone
  ],
  // The Reagent (inject, 64 frames, the item on frame 36): the needle's click, the skin, the plunger's hiss, and out again.
  needle: [noise('bandpass', 4200, 0.02, 0.5, { q: 6 }), noise('lowpass', 1500, 0.09, 0.4, { at: 0.03 }), tone('sine', 110, 0.1, 0.2, { at: 0.03, to: 70 })],
  plunger: [noise('highpass', 3500, 0.4, 0.16, { attack: 0.06 }), tone('sine', 62, 0.35, 0.1, { attack: 0.1, to: 80 }), noise('bandpass', 2800, 0.05, 0.22, { at: 0.42, q: 5 })],
  // A flask of oil lobbed (throw, 40 frames, the volley on frame 16): the arm's whoosh, the glug of the oil in it.
  lob: [noise('bandpass', 700, 0.22, 0.55, { to: 2200, q: 1.2, attack: 0.06 }), noise('lowpass', 600, 0.2, 0.3, { to: 150, attack: 0.04 })],
  glug: [tone('sine', 220, 0.07, 0.1, { to: 320 }), tone('sine', 180, 0.08, 0.09, { at: 0.09, to: 290 }), tone('sine', 160, 0.09, 0.08, { at: 0.2, to: 250 })],
  // A flask lands (the pool: data/moves.ts): glass bursts, the oil takes with a whump, flame climbs and crackles.
  burst: [
    noise('highpass', 3000, 0.28, 0.5, { q: 1 }), ...[0.02, 0.06, 0.1, 0.17, 0.24].map((at, k) => tone('sine', 3200 + 520 * k, 0.12, 0.05, { at, to: 3000 + 400 * k })), // the tinkling shards
    noise('lowpass', 420, 0.5, 0.7, { at: 0.04, to: 90, q: 1 }), tone('sine', 72, 0.5, 0.45, { at: 0.04, to: 38, attack: 0.01 }), // the whump of it catching
    noise('bandpass', 1800, 1.3, 0.3, { at: 0.12, attack: 0.3, to: 1100, q: 0.8 }), noise('highpass', 5000, 0.9, 0.09, { at: 0.2, attack: 0.2 }), // flame, and its crackle
  ],
  // An arm taken up (the weapon in hand changed): leather and cloth, a blade slid in its fitting.
  equip: [noise('bandpass', 1200, 0.18, 0.5, { to: 700, q: 1, attack: 0.03 }), noise('bandpass', 3300, 0.05, 0.3, { at: 0.12, q: 6 }), tone('triangle', 820, 0.1, 0.05, { at: 0.12, to: 640 })],
  // A weapon reinforced: three blows on an anvil, each one ringing a moment, the last longest.
  anvil: [0, 0.42, 0.9].flatMap((at, k) => [
    noise('bandpass', 2400, 0.04, 0.5, { at, q: 3 }), tone('sine', 520, 0.45 + 0.4 * (k === 2 ? 1 : 0), 0.18, { at, to: 515 }), tone('sine', 1330, 0.3, 0.08, { at }), tone('sine', 2240, 0.2, 0.04, { at }), tone('sine', 90, 0.14, 0.3, { at, to: 60 }),
  ]),
  // A coin counted into a palm, one by one.
  coins: [0, 0.09, 0.16, 0.3].flatMap((at, k) => [noise('bandpass', 5200 + 300 * k, 0.03, 0.3, { at, q: 7 }), tone('sine', 3100 + 260 * k, 0.28, 0.06, { at, to: 3050 + 260 * k }), tone('sine', 4700 + 190 * k, 0.16, 0.03, { at })]),
  // The stone's breath: kneeling at a sign (rest, 'kneeling': eased in over about a third of a second) cloth and leather, a hand set on stone.
  kneel: [noise('bandpass', 700, 0.4, 0.45, { q: 0.9, attack: 0.1, to: 450 }), noise('bandpass', 1800, 0.12, 0.25, { at: 0.08, q: 1.5 }), tone('sine', 70, 0.18, 0.14, { at: 0.34, to: 52, attack: 0.02 }), noise('lowpass', 500, 0.1, 0.25, { at: 0.34 })],
  rise: [noise('bandpass', 600, 0.45, 0.4, { q: 0.9, attack: 0.15, to: 1000 }), noise('bandpass', 2100, 0.1, 0.2, { at: 0.2, q: 1.5 })],
} satisfies Record<string, Sound>;

/** The mist wall (data/fogThemes.ts; systems/fogGates.ts): its sound is the walk through it, whatever its length. `seconds`: the pass. */
export function mistPass(seconds: number): Sound {
  return [
    noise('bandpass', 320, seconds, 0.55, { attack: seconds * 0.45, to: 900, q: 1.1 }), // the air parting, swelling as the wall is met
    noise('highpass', 2600, seconds * 0.8, 0.12, { at: seconds * 0.1, attack: seconds * 0.4 }), // the cold grain in it
    tone('sine', 58, seconds, 0.3, { attack: seconds * 0.5, to: 74 }), // and a low note, rising, felt before it is heard
    tone('sine', 88, seconds * 0.9, 0.08, { at: seconds * 0.1, attack: seconds * 0.5, to: 120, vibrato: [3, 35] }),
  ];
}
/** The wall closes behind them: an exhale and a settling. */
export const MIST_CLOSE: Sound = [noise('lowpass', 900, 1.0, 0.5, { to: 180, attack: 0.08 }), tone('sine', 52, 1.3, 0.4, { to: 34, attack: 0.05 }), noise('bandpass', 1500, 0.5, 0.16, { to: 600, q: 1, at: 0.05 })];

/** What the people do at their acts (beats: data/npcActs.ts ACT_BEATS), each sound as long as the motion it goes with. */
export const ACTS = {
  page: [noise('bandpass', 2300, 0.2, 0.45, { to: 1500, q: 1.2, attack: 0.03 }), noise('bandpass', 3200, 0.07, 0.25, { at: 0.13, q: 2.5 }), noise('lowpass', 900, 0.15, 0.15, { at: 0.04 })], // a leaf turned over
  inhale: [noise('bandpass', 950, 0.55, 0.22, { to: 1500, q: 1.3, attack: 0.3 }), ...[0.05, 0.14, 0.26, 0.41].map((at) => noise('highpass', 3600, 0.025, 0.14, { at, attack: 0.002 }))], // a draw on a pipe: air through a stem, an ember's ticks
  exhale: [noise('bandpass', 1050, 1.0, 0.2, { to: 650, q: 1.2, attack: 0.25 }), tone('sine', 130, 0.7, 0.03, { attack: 0.2, to: 110 })], // the breath let out
  scrape: [noise('bandpass', 2600, 0.16, 0.4, { to: 3300, q: 2.2, attack: 0.03 }), noise('highpass', 4800, 0.05, 0.18, { at: 0.12 })], // a knife drawn down a stick
  scratch: [noise('highpass', 3300, 0.06, 0.3, { attack: 0.005 }), noise('bandpass', 4200, 0.05, 0.25, { at: 0.04, q: 3 })], // a nib on paper
  gulp: [noise('bandpass', 480, 0.12, 0.45, { q: 3, attack: 0.02 }), tone('sine', 140, 0.14, 0.18, { to: 88, attack: 0.02 }), noise('bandpass', 3000, 0.04, 0.2, { at: 0.2, q: 5 })], // a mouthful, a bottle's lip on a tooth
  unfold: [noise('bandpass', 2000, 0.5, 0.35, { to: 1200, q: 1, attack: 0.15 }), noise('bandpass', 3000, 0.1, 0.2, { at: 0.2, q: 2 }), noise('bandpass', 2400, 0.08, 0.2, { at: 0.38, q: 2 })], // a chart opened or lowered
  rub: [noise('bandpass', 1400, 0.4, 0.3, { to: 2100, q: 0.9, attack: 0.15 })], // a cloth drawn the length of a blade (one stroke: the act's rub is 2.6 s a stroke)
  rope: [noise('bandpass', 1200, 0.22, 0.4, { q: 1.2, attack: 0.04 }), noise('lowpass', 500, 0.1, 0.2, { at: 0.12 })], // a coil pulled taut
  keys: [0, 0.07, 0.13].flatMap((at, k) => [noise('bandpass', 4500 + 500 * k, 0.03, 0.3, { at, q: 6 }), tone('sine', 2600 + 400 * k, 0.15, 0.04, { at })]), // a key turning in the light: a chiming of its ward
  glass: [noise('bandpass', 5000, 0.03, 0.3, { q: 7 }), tone('sine', 3300, 0.3, 0.06, { to: 3270 }), tone('sine', 4900, 0.2, 0.03)], // a vial against the lamp
  tick: [noise('bandpass', 3800, 0.012, 0.4, { q: 6 }), tone('sine', 2200, 0.03, 0.05)], // a watch at the ear
  tap: [tone('sine', 170, 0.07, 0.3, { to: 120, attack: 0.002 }), noise('lowpass', 900, 0.05, 0.3)], // a cane's foot on stone
  shake: [0, 0.07, 0.14, 0.21].map((at, k) => noise('bandpass', 2200 + 200 * k, 0.05, 0.3, { at, q: 3 })), // a vial shaken
} satisfies Record<string, Sound>;

/**
 * How far each stinger is drawn anew each time it plays (render/audio/vary.ts; 1 is the usual): a blow a good deal, for a
 * fight plays it a hundred times; the sounds that are notes or a bell's stroke hardly at all, for they are tuned to one another.
 */
export const STINGER_VARY: Partial<Record<StingerId, number>> = {
  hit: 1.5, blocked: 1.4, parried: 1.1, guardBreak: 1.3, riposte: 1.3, kill: 1.2, dodged: 1.5, shot: 0.8, beam: 1, cylinder: 1.2, dry: 1.3, reload: 0.5, lock: 1.2, page: 1.4, lampLit: 1, lampOut: 1,
  heartbeat: 0.2, unmade: 0.25, death: 0.35, title: 0.2, ending: 0.2, levelUp: 0.3, found: 0.3, place: 0.3, rested: 0.3, vanquished: 0.3, healed: 0.4, insight: 0.4, quest: 0.4, better: 0.5, worse: 0.5, boss: 0.5, phase: 0.5,
};
