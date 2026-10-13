/**
 * Arrivals of their own (round 34, and seven more after): the great horrors of the story each come in a way the others do not,
 * where the rest arrive by their size alone (data/cutscenes.ts `arrival`): the witch by a corner of the
 * room that tilts, the Haunter as the lamps go out one by one, Cthulhu as the great door opens, the tall
 * man as himself, polite, with the key on its chain; and, after them, Ghatanothoa as the mountain looks
 * at you, Mother Hydra singing, the Colossus hands first in the dark, Tsathoggua opening one eye, Yig as the
 * grass moves, Wilbur with the whippoorwills and the book, Curwen by his candle. Each is a scene like any other (shots, then beats)
 * and the director lays the horror's own line over it as it does over the rest (render/cinemaDirector.ts).
 * Data only.
 */

import { shot, to, type Beat, type Scene } from './cutscenes';

type Maker = (name: string, epithet: string | undefined) => Scene;

const named = (at: number, name: string, epithet: string | undefined, hold = 3.4): Beat => ({ at, title: [name.toUpperCase(), epithet], hold });
const scene = (id: string, shots: Scene['shots'], beats: Beat[], extra: Partial<Scene> = {}): Scene => ({ id: `arrival:${id}`, sim: 'frozen', shots, beats, ...extra });

/** Over the investigator's shoulder at the horror, closing in or drawing back. */
const behind = (dur: number, yaw: readonly [number, number], dist: readonly [number, number], up: readonly [number, number], look: readonly [number, number], fov: readonly [number, number], extra = {}) =>
  shot({ dur, on: 'player', aim: 'other', yaw, dist, up, look, fov, sway: 0.5, ...extra });

export const BESPOKE: Readonly<Record<string, Maker>> = {
  // The corners of the room do not agree: the world tilts as she is seen, and again as she is.
  keziah_mason: (name, epithet) =>
    scene('keziah_mason', [
      behind(2.8, to(180, 170), to(3.2, 2.4), to(0.6, 1.5), to(0.55, 0.8), to(64, 54), { roll: to(-9, 8), sway: 0.6 }),
      shot({ dur: 2.2, yaw: to(24, 10), dist: to(1.5, 1.05), up: to(0.82, 0.86), look: to(0.9, 0.92), fov: to(38, 32), roll: to(5, -4), body: true, sway: 0.4 }),
      behind(2.6, to(172, 180), to(2.6, 3.8), to(1.8, 2.1), to(0.7, 0.8), to(54, 60), { roll: to(6, 0) }),
    ], [
      { at: 0.3, sound: 'darkness', gain: 0.5, shake: 0.1, hold: 1.2 },
      { at: 1.1, caption: 'The corners of the room do not agree.', hold: 2.4 },
      { at: 3, burst: { kind: 'motes', on: 'target', count: 16 } },
      named(4.3, name, epithet),
    ]),

  // The lamps go out one by one, and the picture with them; it is in the dark that is left.
  haunter_of_the_dark: (name, epithet) =>
    scene('haunter_of_the_dark', [
      shot({ dur: 2.2, yaw: to(20, 10), dist: to(1.9, 1.5), up: to(0.2, 0.35), look: to(0.5, 0.8), fov: to(58, 50), body: true, sway: 0.3 }),
      behind(2.6, to(180, 176), to(2.2, 3), to(0.9, 1.6), to(0.4, 0.7), to(60, 66), { sway: 0.7 }),
      shot({ dur: 2.6, yaw: to(-30, -10), dist: to(1.4, 1.1), up: to(0.5, 0.6), look: to(0.85, 0.9), fov: to(46, 38), body: true, sway: 0.5 }),
    ], [
      { at: 0.4, caption: 'The lamps are going out, one by one.', hold: 2.2 },
      { at: 0.9, fade: 'black', over: 0.12, sound: 'darkness', gain: 0.6 },
      { at: 1.15, fade: 'clear', over: 0.3 },
      { at: 2.7, fade: 'black', over: 0.1 },
      { at: 2.95, fade: 'clear', over: 0.25, shake: 0.14, hold: 1 },
      named(4.6, name, epithet),
    ]),

  // A colour, and then the world's colours drained toward it.
  colour_out_of_space: (name, epithet) =>
    scene('colour_out_of_space', [
      shot({ dur: 3, on: 'target', yaw: to(50, 25), dist: to(2.6, 1.6), up: to(0.3, 0.9), look: to(0.4, 0.8), fov: to(66, 52), body: true, sway: 0.3, roll: to(-3, 3) }),
      behind(3.4, to(180, 168), to(3, 2.4), to(1.4, 1.2), to(0.5, 0.65), to(58, 50), { roll: to(3, -3) }),
    ], [
      { at: 0.2, fade: 'violet', over: 0.4, sound: 'worse', gain: 0.7 },
      { at: 0.7, fade: 'clear', over: 1.6, burst: { kind: 'motes', on: 'target', count: 30 } },
      { at: 1.4, caption: 'It is a colour. It is not any of the colours.', hold: 2.6 },
      named(3.4, name, epithet),
    ]),

  // Low and wide, the great door; the whole of the sky in the frame; it does not so much come as open.
  cthulhu: (name, epithet) =>
    scene('cthulhu', [
      behind(4.2, to(180, 172), to(2.4, 3.2), to(0.5, 0.9), to(0.04, 0.95), to(70, 62), { sway: 0.15 }),
      shot({ dur: 3.4, yaw: to(70, 35), dist: to(1.0, 1.2), up: to(0.5, 0.7), look: to(0.75, 0.9), fov: to(58, 48), body: true, sway: 0.15 }),
      shot({ dur: 3, on: 'player', aim: 'other', yaw: to(135, 160), dist: to(3.6, 5), up: to(2, 3), look: to(0.5, 0.6), fov: to(62, 68), sway: 0.4 }),
    ], [
      { at: 0.3, caption: 'The angles are wrong.', hold: 2, shake: 0.2 },
      { at: 2.1, set: 'boom', gain: 1, pitch: 0.5, shake: 0.5, hold: 2.5, caption: 'The great door opens.' },
      { at: 4.6, set: 'whale', gain: 0.9, pitch: 0.55 },
      named(5.4, name, epithet, 3.8),
    ]),

  // The sea has come to the temple.
  father_dagon: (name, epithet) =>
    scene('father_dagon', [
      shot({ dur: 3.6, yaw: to(60, 35), dist: to(1.1, 1.35), up: to(0.05, 0.15), look: to(0.1, 0.8), fov: to(64, 56), body: true, sway: 0.25 }),
      behind(2.8, to(180, 176), to(3.6, 4.6), to(0.7, 1.4), to(0.5, 0.6), to(62, 66)),
    ], [
      { at: 0.3, set: 'boom', gain: 0.8, pitch: 0.6, shake: 0.35, hold: 1.6 },
      { at: 1.1, caption: 'The sea has come up into the temple.', hold: 2.6 },
      { at: 2.2, burst: { kind: 'motes', on: 'target', count: 24 } },
      named(3.6, name, epithet),
    ]),

  // The yellow sign, and a name that has been said twice.
  hastur: (name, epithet) =>
    scene('hastur', [
      behind(3, to(180, 172), to(2.8, 2.2), to(1.2, 1.7), to(0.6, 0.85), to(60, 52), { roll: to(0, 6) }),
      shot({ dur: 3.6, yaw: to(-10, 12), dist: to(1.3, 1.0), up: to(0.7, 0.75), look: to(0.88, 0.9), fov: to(44, 34), roll: to(-5, 4), body: true, sway: 0.5 }),
    ], [
      { at: 0.2, fade: 'gold', over: 0.3, sound: 'sight', gain: 0.7 },
      { at: 0.55, fade: 'clear', over: 1.4 },
      { at: 1.2, caption: 'You have heard the name. Do not say it again.', hold: 2.6, set: 'whisper', gain: 0.8, pitch: 0.7 },
      named(3.8, name, epithet),
    ]),

  // The gate: the sky fills with its spheres, and past, present and future are one.
  yog_sothoth: (name, epithet) =>
    scene('yog_sothoth', [
      behind(3.6, to(180, 170), to(2.6, 3.4), to(1.1, 1.4), to(0.3, 0.8), to(70, 60), { sway: 0.2 }),
      shot({ dur: 3.2, yaw: to(80, 45), dist: to(1.0, 1.3), up: to(0.4, 0.6), look: to(0.6, 0.85), fov: to(56, 48), body: true, sway: 0.2 }),
    ], [
      { at: 0.1, fade: 'violet', over: 0.2, sound: 'teleport', gain: 0.8 },
      { at: 0.35, fade: 'clear', over: 1.6, burst: { kind: 'stars', on: 'target', count: 50 } },
      { at: 1.3, caption: 'Past, present, future: all are one.', hold: 2.8, set: 'choral', gain: 0.6, pitch: 0.7 },
      named(4.2, name, epithet),
    ]),

  // It does not see you. Over the piping the shot holds, and holds.
  azathoth: (name, epithet) =>
    scene('azathoth', [
      behind(4.4, to(180, 174), to(2.2, 3.4), to(0.6, 1.1), to(0.1, 0.9), to(72, 64), { sway: 0.1 }),
      shot({ dur: 3.6, yaw: to(100, 60), dist: to(0.9, 1.15), up: to(0.2, 0.5), look: to(0.7, 0.9), fov: to(60, 52), body: true, sway: 0.1 }),
    ], [
      { at: 0.4, set: 'choral', gain: 0.8, pitch: 0.5, caption: 'It does not see you. It does not need to.', hold: 3 },
      { at: 3.6, burst: { kind: 'stars', on: 'target', count: 40 }, shake: 0.2, hold: 1.5 },
      named(4.8, name, epithet, 3.8),
    ]),

  // A tall man in a good coat, who thanks you for coming.
  nyarlathotep: (name, epithet) =>
    scene('nyarlathotep', [
      behind(3, to(180, 175), to(2.6, 2.1), to(1.6, 1.7), to(0.7, 0.85), to(54, 46), { sway: 0.4 }),
      shot({ dur: 2.8, yaw: to(14, 4), dist: to(1.6, 1.2), up: to(0.85, 0.85), look: to(0.7, 0.86), fov: to(40, 34), body: true, sway: 0.3 }),
      behind(2.8, to(168, 180), to(2, 3.4), to(1.7, 2.4), to(0.6, 0.7), to(48, 60), { roll: to(0, -4) }),
    ], [
      { at: 0.6, caption: 'A tall man in a good coat.', hold: 2, set: 'whisper', gain: 0.8, pitch: 0.85 },
      { at: 3.3, caption: 'There is a key on his watch chain.', hold: 2.4 },
      { at: 5.6, burst: { kind: 'embers', on: 'target', count: 20 } },
      named(5.8, name, epithet, 3.6),
    ]),

  // The woods answer.
  shub_niggurath: (name, epithet) =>
    scene('shub_niggurath', [
      shot({ dur: 3.4, yaw: to(40, 20), dist: to(1.0, 1.25), up: to(0.1, 0.3), look: to(0.4, 0.8), fov: to(66, 56), body: true, sway: 0.3 }),
      behind(2.8, to(180, 172), to(3, 2.4), to(1.2, 1.5), to(0.5, 0.6), to(60, 52)),
    ], [
      { at: 0.2, set: 'gust', gain: 0.9, pitch: 0.6, shake: 0.2, hold: 1.4 },
      { at: 1, caption: 'The forest is breathing.', hold: 2.4 },
      { at: 2.4, set: 'whale', gain: 0.8, pitch: 0.5, burst: { kind: 'ash', on: 'target', count: 20 } },
      named(3.6, name, epithet),
    ]),

  // The mountain turns its head, and the picture holds still, as a thing does that is being looked at.
  ghatanothoa: (name, epithet) =>
    scene('ghatanothoa', [
      behind(4.2, to(164, 176), to(2.8, 3.6), to(1.6, 2.4), to(0.3, 0.92), to(68, 62), { sway: 0.1 }),
      shot({ dur: 3.2, yaw: to(75, 40), dist: to(1.1, 1.25), up: to(0.55, 0.62), look: to(0.8, 0.84), fov: to(52, 46), body: true, sway: 0.05, ease: 'glide' }),
      // From where it looks: the investigator, small, and quite still.
      shot({ dur: 3.2, on: 'player', yaw: to(8, 2), dist: to(5.5, 3.2), up: to(1.8, 1.7), look: to(0.85, 0.88), fov: to(40, 28), sway: 0, ease: 'in' }),
    ], [
      { at: 0.3, set: 'rumble', gain: 0.8, pitch: 0.5, shake: 0.12, caption: 'The mountain is looking at you.', hold: 2.4 },
      { at: 4.5, caption: 'Keep the stone between you and its eyes.', hold: 2.6 },
      { at: 6.9, fade: 'white', over: 0.15, sound: 'sight', gain: 0.9 },
      { at: 7.1, fade: 'clear', over: 1.4 },
      named(8, name, epithet, 3.6),
    ]),

  // She sings first, out of the water, and her children answer. The camera is gentle with her, as she is not.
  mother_hydra: (name, epithet) =>
    scene('mother_hydra', [
      shot({ dur: 3.4, yaw: to(50, 30), dist: to(1.2, 1.4), up: to(0.05, 0.12), look: to(0.1, 0.78), fov: to(64, 56), roll: to(-3, 3), body: true, sway: 0.35 }),
      shot({ dur: 3, yaw: to(-14, -6), dist: to(1.8, 1.4), up: to(0.7, 0.72), look: to(0.84, 0.86), fov: to(46, 40), roll: to(2, -2), body: true, sway: 0.3 }),
      behind(2.8, to(180, 174), to(3.4, 4.4), to(0.8, 1.5), to(0.5, 0.6), to(62, 66), { roll: to(-2, 2) }),
    ], [
      { at: 0.1, set: 'chant', gain: 0.6, pitch: 0.6 },
      { at: 1.8, set: 'gurgle', gain: 0.6, pitch: 0.7, burst: { kind: 'motes', on: 'target', count: 20 } },
      { at: 4.4, set: 'chant', gain: 0.85, pitch: 0.75, shake: 0.1, hold: 1.4 },
      named(5.8, name, epithet),
    ]),

  // Under the Sphinx, in the dark: the hands first, the rest after, and the mummies only its servants.
  colossus_pyramids: (name, epithet) =>
    scene('colossus_pyramids', [
      shot({ dur: 3.8, yaw: to(40, 25), dist: to(1.2, 1.35), up: to(0.02, 0.06), look: to(0.06, 0.4), fov: to(66, 60), body: true, sway: 0.25, ease: 'glide' }),
      shot({ dur: 3, yaw: to(-25, -10), dist: to(1.1, 1.3), up: to(0.4, 0.75), look: to(0.5, 0.9), fov: to(58, 48), body: true, sway: 0.2 }),
      behind(2.8, to(180, 178), to(3.8, 5), to(0.8, 1.8), to(0.55, 0.62), to(62, 68)),
    ], [
      { at: 0.1, set: 'rumble', gain: 0.8, pitch: 0.45, shake: 0.2, hold: 1.8 },
      { at: 0.2, fade: 'clear', over: 2.4 },
      { at: 1, caption: 'It is the hands you see first.', hold: 2.4 },
      { at: 3.9, caption: 'The mummies are only its servants.', hold: 2.4 },
      { at: 4.6, burst: { kind: 'ash', on: 'target', count: 26 } },
      named(6, name, epithet),
    ], { dark: true, blend: [0, 0.9] }),

  // The old toad opens one eye, out of the black. It is only annoyed.
  tsathoggua: (name, epithet) =>
    scene('tsathoggua', [
      shot({ dur: 3.4, yaw: to(30, 18), dist: to(1.7, 1.4), up: to(0.3, 0.45), look: to(0.45, 0.55), fov: to(54, 46), body: true, sway: 0.15, ease: 'glide' }),
      shot({ dur: 3, yaw: to(-18, -8), dist: to(1.5, 1.25), up: to(0.5, 0.55), look: to(0.6, 0.6), fov: to(46, 40), body: true, sway: 0.1 }),
      behind(2.8, to(180, 176), to(3, 4), to(0.8, 1.4), to(0.4, 0.5), to(60, 64), { sway: 0.2 }),
    ], [
      { at: 0.1, set: 'croak', gain: 0.8, pitch: 0.4 },
      { at: 0.15, fade: 'clear', over: 1.6 },
      { at: 3.4, set: 'groan', gain: 0.7, pitch: 0.5 },
      { at: 3.6, burst: { kind: 'ash', on: 'target', count: 22 } },
      named(5.8, name, epithet),
    ], { dark: true, blend: [0, 0.9] }),

  // The grass is moving before he is seen; the snakes come before the father.
  yig: (name, epithet) =>
    scene('yig', [
      shot({ dur: 3.6, yaw: to(45, 25), dist: to(1.5, 1.2), up: to(0.02, 0.05), look: to(0.1, 0.7), fov: to(70, 60), roll: to(-4, 5), body: true, sway: 0.5 }),
      shot({ dur: 3, yaw: to(-20, -8), dist: to(1.9, 1.5), up: to(0.5, 0.65), look: to(0.7, 0.82), fov: to(46, 40), body: true, sway: 0.35 }),
      behind(2.6, to(180, 172), to(2.6, 3.4), to(0.5, 1.2), to(0.35, 0.5), to(66, 60), { sway: 0.6 }),
    ], [
      { at: 0.2, set: 'rattle', gain: 0.9, pitch: 0.9, caption: 'The grass is moving. It is not the wind.', hold: 2.8 },
      { at: 1.4, set: 'hiss', gain: 0.8, pitch: 0.8, burst: { kind: 'motes', on: 'target', count: 26 } },
      { at: 3.8, set: 'rattle', gain: 0.7, pitch: 0.7, shake: 0.12, caption: 'He forgives nothing done to a snake.', hold: 2.2 },
      named(5.8, name, epithet),
    ]),

  // The whippoorwills know; a book is read aloud in the barn, in a voice that is not his own.
  wilbur_whateley: (name, epithet) =>
    scene('wilbur_whateley', [
      behind(2.8, to(180, 170), to(2.8, 3.4), to(1.9, 2.2), to(0.5, 0.8), to(58, 50), { sway: 0.35 }),
      shot({ dur: 2.8, yaw: to(18, 6), dist: to(1.7, 1.3), up: to(0.8, 0.84), look: to(0.88, 0.9), fov: to(44, 38), roll: to(-3, 4), body: true, sway: 0.4 }),
      shot({ dur: 2.8, yaw: to(-60, -40), dist: to(2.2, 1.7), up: to(0.2, 0.4), look: to(0.55, 0.8), fov: to(58, 50), body: true, sway: 0.3 }),
    ], [
      { at: 0.1, set: 'whippoorwill', gain: 0.8, pitch: 0.9 },
      { at: 0.5, set: 'page', gain: 0.8, pitch: 0.8 },
      { at: 3.2, set: 'whippoorwill', gain: 0.7, pitch: 0.8, shake: 0.1, hold: 1 },
      named(5.2, name, epithet),
    ]),

  // The candle burns the colour of the salts; the dead are consulted at his side, and he does not look round.
  joseph_curwen: (name, epithet) =>
    scene('joseph_curwen', [
      behind(3, to(176, 168), to(2.6, 3.2), to(1.9, 2.1), to(0.6, 0.85), to(54, 46), { sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(-12, 8), dist: to(1.9, 1.5), up: to(0.84, 0.86), look: to(0.88, 0.9), fov: to(42, 36), roll: to(2, -2), body: true, sway: 0.25 }),
      behind(2.6, to(165, 180), to(2, 3.2), to(1.7, 2.3), to(0.6, 0.7), to(48, 58)),
    ], [
      { at: 0.2, set: 'ghost', gain: 0.6, pitch: 0.7 },
      { at: 2.9, fade: 'violet', over: 0.15, sound: 'summon', gain: 0.7 },
      { at: 3.05, fade: 'clear', over: 0.9, burst: { kind: 'embers', on: 'target', count: 22 } },
      { at: 5, set: 'wail', gain: 0.5, pitch: 0.6 },
      named(5.2, name, epithet),
    ]),
};

/** The arrival scene of its own that horror `id` has, if it has one. */
export const bespokeArrival = (id: string, name: string, epithet: string | undefined): Scene | undefined => BESPOKE[id]?.(name, epithet);
