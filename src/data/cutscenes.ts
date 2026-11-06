/**
 * The cutscenes (playtest round 20): the wake that opens a new game, a horror's arrival and fall, and
 * (the endings' are in data/cutscenesEndings.ts). A scene is a run of shots (a camera that circles someone, or something, moving
 * from one stand to another) with beats laid over them (a line said, a fade, a sound, a burst of
 * motes). The simulation stands still through it (`frozen`) or runs slowed (`slow`), and the scene
 * blends in from the follow camera and out to it again. Data only; render/cinemaPlan.ts reads it.
 */

import type { SampleSetId } from './samples';
import type { StingerId } from './sounds';

export type Subject = 'target' | 'player' | 'sign'; // the horror, the investigator, the Elder Sign the scene is at
export type Ease = 'linear' | 'in' | 'out' | 'inout' | 'glide'; // glide: slow out of rest and slow into it, with no jolt at either end
export type Tint = 'black' | 'white' | 'red' | 'violet' | 'gold' | 'green' | 'cold' | 'clear'; // what the screen goes to (round 61: a sickly green, a pale frost); clear lifts it

/** A camera that stands `dist` from `on` at `yaw` from the line between it and the other party (0 between them, 180 behind `on`), and looks. Pairs run from the shot's first frame to its last. */
export interface Shot {
  dur: number; // seconds
  on: Subject;
  yaw: readonly [number, number]; // degrees
  dist: readonly [number, number]; // metres from it (of its height, with `body`)
  up: readonly [number, number]; // above its feet
  look: readonly [number, number]; // the height it aims at, of the aimed body's height (of the subject's, or of the other party's with aim: 'other')
  aim?: 'on' | 'other' | 'sign'; // at the subject (the default), at the other party, or at the Elder Sign the scene is at (round 55: from the investigator's side, or from a stand of its own about the sign, with it in view)
  fov: readonly [number, number]; // degrees
  roll?: readonly [number, number]; // degrees
  ease?: Ease; // default inout
  body?: boolean; // dist, up and look are of the subject's (or, aimed at the other, its) height
  sway?: number; // hand-held drift, 0..1
}

/** What a beat lets loose about someone (render/cinemaBursts.ts); round 61 added frost, brine, spores, smoke, runes, notes and eyes, for the entrances of the horrors that had none of their own. */
export type BurstKind = 'ash' | 'motes' | 'embers' | 'stars' | 'frost' | 'brine' | 'spores' | 'smoke' | 'runes' | 'notes' | 'eyes';

/** A moment: whatever is set here happens together. */
export interface Beat {
  at: number; // seconds into the scene
  caption?: string; // a line said low on the screen
  title?: readonly [string, string?]; // the great words, and a line beneath them
  hold?: number; // seconds the caption or title stays (default 3)
  fade?: Tint; // the screen goes to this...
  over?: number; // ...over this many seconds (default 1)
  sound?: StingerId;
  set?: SampleSetId; // a recording, heard whole
  gain?: number;
  pitch?: number;
  burst?: { kind: BurstKind; on: Subject; count: number };
  shake?: number; // the camera trembles this hard (metres) for `hold` seconds
  rise?: number; // the investigator gets up from the knee, over this many seconds (0: as fast as they would in play)
  kneel?: boolean; // the investigator goes down on one knee before the Elder Sign the scene is at; the scene's end has them up again (round 55: the herald's)
  act?: string; // the scene waits here until E (or the pad's A) does this; the beat itself plays as the word resumes (round 98)
  hand?: 'close' | 'open'; // the investigator's right hand, on the silver key
  voice?: { by: string; text: string }; // a line said aloud by `boss:<id>` (data/speechLines.ts; the voices): its recording plays
}

export interface Scene {
  id: string;
  sim: 'frozen' | 'slow'; // the world stands still, or runs at `slow` of its speed
  slow?: number;
  shots: readonly Shot[];
  beats: readonly Beat[];
  blend?: readonly [number, number]; // seconds to come in from the follow camera and to go back to it (default 0.7, 0.9; 0 for a scene that opens and closes on black)
  dark?: boolean; // it opens on black
  shut?: boolean; // it ends on black: the card that follows comes up out of it
}

export const shot = (s: Partial<Shot> & Pick<Shot, 'dur'>): Shot => ({ on: 'target', yaw: [0, 0], dist: [3, 3], up: [1, 1], look: [1, 1], fov: [56, 56], body: false, ...s });
export const to = (a: number, b: number): readonly [number, number] => [a, b];

export type Scale = 'person' | 'large' | 'giant' | 'colossal';

/** The size class of a horror by its height (metres). */
export const scaleOf = (height: number): Scale => (height < 3.2 ? 'person' : height < 8 ? 'large' : height < 18 ? 'giant' : 'colossal');

/** From the investigator's flank, a step inside the fog, the lens low and lifting: the horror rising in the picture as it rises from the ground (round 68: it stood behind them, outside the wall, and showed the fog). */
const flank = (dur: number, yaw: readonly [number, number], dist: readonly [number, number], up: readonly [number, number], look: readonly [number, number], fov: readonly [number, number]): Shot =>
  shot({ dur, on: 'player', aim: 'other', yaw, dist, up, look, fov, sway: 0.25 });

/** Beside the investigator and a little behind, looking at the horror that stands before them: close enough to the wall at their back to stay inside it. */
const overShoulder = (dur: number, up: readonly [number, number], look: number, roll = to(0, 0)): Shot =>
  shot({ dur, on: 'player', aim: 'other', yaw: to(106, 96), dist: to(2.4, 3), up, look: to(look, look), fov: to(56, 51), roll, body: false, sway: 0.5 });

/** Round the horror's far side and high, the investigator small beyond its shoulder: its size against theirs. */
const beyond = (dur: number, yaw: readonly [number, number], dist: readonly [number, number], up: readonly [number, number], fov: readonly [number, number]): Shot =>
  shot({ dur, on: 'target', aim: 'other', yaw, dist, up, look: to(0.5, 0.6), fov, body: true, sway: 0.3 });

/**
 * How each size of horror arrives (round 68: the three shots of a small one are a stand off its line to the investigator, closing in on
 * the face, and the view from their side; a giant's and a colossus's are the reveal from the investigator's flank, a push in on the face,
 * and the view from beyond its shoulder, which shows what it is against what stands before it). Distances of a body's height where `body`.
 */
export const ARRIVAL: Readonly<Record<Scale, readonly Shot[]>> = {
  person: [
    shot({ dur: 2.4, yaw: to(24, 10), dist: to(3.6, 2.4), up: to(0.5, 0.75), look: to(0.85, 0.9), fov: to(54, 48), body: true, sway: 0.4 }),
    shot({ dur: 2, yaw: to(-34, -22), dist: to(1.7, 1.3), up: to(0.82, 0.86), look: to(0.9, 0.92), fov: to(42, 38), roll: to(-1.5, 1.5), body: true, sway: 0.5 }),
    overShoulder(2.6, to(1.75, 1.9), 0.75),
  ],
  large: [
    shot({ dur: 2.8, yaw: to(40, 15), dist: to(2.6, 2), up: to(0.12, 0.3), look: to(0.3, 0.75), fov: to(58, 52), body: true, sway: 0.3 }),
    shot({ dur: 2.2, yaw: to(-20, -8), dist: to(1.9, 1.5), up: to(0.65, 0.7), look: to(0.8, 0.8), fov: to(46, 40), roll: to(1.5, -1), body: true, sway: 0.5 }),
    overShoulder(2.6, to(1.9, 2.3), 0.65),
  ],
  giant: [
    flank(3.2, to(94, 78), to(3.4, 4.6), to(0.35, 1.1), to(0.05, 0.8), to(72, 62)),
    shot({ dur: 2.4, yaw: to(-18, -8), dist: to(1.5, 1.2), up: to(0.7, 0.78), look: to(0.82, 0.86), fov: to(48, 42), roll: to(1.2, -0.8), body: true, sway: 0.3 }),
    beyond(2.4, to(126, 140), to(0.7, 0.55), to(0.45, 0.5), to(58, 54)),
  ],
  colossal: [
    flank(4, to(90, 68), to(3.4, 5.2), to(0.4, 1.7), to(0.04, 0.88), to(76, 62)),
    shot({ dur: 3, yaw: to(34, 16), dist: to(0.62, 0.5), up: to(0.36, 0.56), look: to(0.78, 0.86), fov: to(58, 50), roll: to(-1, 1), body: true, sway: 0.2 }),
    beyond(2.6, to(124, 138), to(0.55, 0.42), to(0.3, 0.38), to(62, 56)),
  ],
};

/** A horror's fall, slowed: the camera circles the body as it goes. */
export const FALL: Readonly<Record<Scale, Shot>> = {
  person: shot({ dur: 3.4, yaw: to(95, 150), dist: to(2.6, 3.2), up: to(0.55, 0.8), look: to(0.6, 0.45), fov: to(50, 46), body: true, sway: 0.3 }),
  large: shot({ dur: 3.6, yaw: to(90, 145), dist: to(2.3, 2.9), up: to(0.3, 0.55), look: to(0.6, 0.5), fov: to(54, 50), body: true, sway: 0.3 }),
  giant: shot({ dur: 4, yaw: to(80, 130), dist: to(1.8, 2.3), up: to(0.08, 0.3), look: to(0.7, 0.5), fov: to(60, 54), body: true, sway: 0.2 }),
  colossal: shot({ dur: 4.4, yaw: to(75, 115), dist: to(1.5, 2), up: to(0.05, 0.25), look: to(0.75, 0.5), fov: to(62, 56), body: true, sway: 0.15 }),
};

/** How hard the ground is struck as a horror arrives, by its size (none for a person). */
const BOOM: Readonly<Partial<Record<Scale, number>>> = { large: 0.45, giant: 0.8, colossal: 1 };

/** A horror comes: its name, a beat after the close-up begins; then the scene lets go. */
export function arrival(scale: Scale, name: string, epithet: string | undefined): Scene {
  const shots = ARRIVAL[scale];
  const at = shots[0].dur + 0.3;
  return {
    id: `arrival:${scale}`,
    sim: 'frozen',
    shots,
    beats: [
      { at: 0.4, shake: scale === 'colossal' ? 0.35 : 0.12, hold: 1.4, ...(BOOM[scale] && { set: 'boom' as const, gain: BOOM[scale], pitch: scale === 'colossal' ? 0.55 : 0.75 }) }, // round 26: the ground takes it
      { at, title: [name.toUpperCase(), epithet], hold: 3.2, ...(scale === 'colossal' && { set: 'whale' as const, gain: 0.85, pitch: 0.6 }) }, // and something vast is heard calling
    ],
  };
}

/** A horror falls: a flash, the world slowed, and the camera about the body. */
export function fall(scale: Scale): Scene {
  return {
    id: `fall:${scale}`,
    sim: 'slow',
    slow: 0.28,
    shots: [FALL[scale]],
    beats: [
      { at: 0, fade: 'white', over: 0.06, shake: 0.4, hold: 1.2 },
      { at: 0.08, fade: 'clear', over: 0.9 },
    ],
    blend: [0.35, 1.1],
  };
}

/** Seconds the wake's investigator takes to get up from the knee (round 22: it was a second, and read as a snap). */
export const WAKE_RISE = 3.4;

/**
 * A new game's wake (playtest round 20; round 22: the rise is slow, the camera cranes up with it, and
 * no title follows): out of black, a bell, the investigator getting up from the knee in a strange town.
 */
export const WAKE: Scene = {
  id: 'wake',
  sim: 'frozen',
  blend: [0, 1.6],
  shots: [
    // One move from first frame to last (round 39: three shots, each easing to a stop and away again, made the crane halt twice on its way up)
    shot({ dur: 8.8, on: 'player', yaw: to(206, 176), dist: to(3, 4.3), up: to(0.2, 2.1), look: to(0.3, 0.89), fov: to(46, 60), body: false, ease: 'glide', sway: 0.3 }),
  ],
  beats: [
    { at: 0.3, sound: 'found', gain: 0.85 },
    { at: 0.6, burst: { kind: 'motes', on: 'player', count: 14 } },
    { at: 1, caption: 'A stair going down.', hold: 2.4 },
    { at: 2.7, rise: WAKE_RISE },
    { at: 3.9, caption: 'A key. A tall man in a good coat.', hold: 2.8 },
  ],
};
