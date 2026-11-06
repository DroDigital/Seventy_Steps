/**
 * Falls of their own: the seventeen horrors that arrive in their own way (data/cutscenesBoss.ts) fall in
 * their own way too, where the rest fall by their size alone (data/cutscenes.ts `fall`). Each is slowed, as
 * the others are, with the camera about the body as it sinks and fades; what differs is what the story says
 * becomes of it: the lamps coming back for the Haunter, the colour going up out of the well, the gate shutting
 * on Yog-Sothoth, the eye closing on the toad, a door shut on the tall man, the dust that was Curwen. A horror
 * that speaks says its last line over its scene (render/cinemaDirector.ts) and the scene carries no words of
 * its own; the silent six have one. Data only.
 */

import { shot, to, type Beat, type Scene } from './cutscenes';
import { behind } from './cutscenesBoss';

/** The blow that ends it: a flash, and the picture clearing from it. */
const BLOW: readonly Beat[] = [{ at: 0, fade: 'white', over: 0.06, shake: 0.4, hold: 1.2 }, { at: 0.08, fade: 'clear', over: 0.9 }];
const fell = (id: string, slow: number, shots: Scene['shots'], beats: readonly Beat[]): Scene => ({ id: `fall:${id}`, sim: 'slow', slow, shots, beats, blend: [0.35, 1.1] });

/** About the body as it sinks and fades (its death takes 80 frames: 4.4 s at 0.3 of the speed), the aim sliding down with it. */
const over = (dur: number, yaw: readonly [number, number], dist: readonly [number, number], up: readonly [number, number], look: readonly [number, number], fov: readonly [number, number], extra = {}) =>
  shot({ dur, yaw, dist, up, look, fov, body: true, sway: 0.3, ...extra });

/** After it has gone, for a person or a beast: the camera cranes up from the spot it was and turns, the arena opening about it. A horror's last words run on over it. */
const elegy = (dur: number, yaw = to(110, 170), extra = {}) => shot({ dur, yaw, dist: to(2, 3.4), up: to(0.3, 1.2), look: to(0.25, 0.05), fov: to(54, 64), body: true, sway: 0.2, ...extra });

export const FALLS: Readonly<Record<string, Scene>> = {
  // She slips out through the angle she came by, and the room's corners agree again.
  keziah_mason: fell('keziah_mason', 0.3, [
    over(2.4, to(60, 30), to(2.6, 2), to(0.55, 0.4), to(0.7, 0.45), to(46, 40), { roll: to(-7, -2), sway: 0.4 }),
    over(2, to(30, 120), to(2, 2.8), to(0.35, 0.3), to(0.4, 0.25), to(50, 54), { roll: to(-2, 3) }),
    elegy(2.4, to(120, 180), { roll: to(3, 0) }),
  ], [
    ...BLOW,
    { at: 0.8, sound: 'darkness', gain: 0.5 },
    { at: 1.8, burst: { kind: 'motes', on: 'target', count: 14 } },
    { at: 4.2, fade: 'violet', over: 0.12, sound: 'teleport', gain: 0.6 },
    { at: 4.35, fade: 'clear', over: 0.8 },
  ]),

  // The light that was feared is let in, and the lamps come back as they went.
  haunter_of_the_dark: fell('haunter_of_the_dark', 0.3, [
    over(3.6, to(40, 70), to(1.8, 1.6), to(0.15, 0.3), to(0.5, 0.4), to(58, 52), { sway: 0.3 }),
    behind(2.4, to(176, 180), to(2.4, 3.2), to(1, 1.7), to(0.5, 0.75), to(60, 66), { sway: 0.5 }),
  ], [
    { at: 0, fade: 'white', over: 0.05, shake: 0.5, sound: 'sight', gain: 0.9, hold: 1 },
    { at: 0.1, fade: 'clear', over: 0.3 },
    { at: 1.3, fade: 'white', over: 0.05, shake: 0.3 },
    { at: 1.4, fade: 'clear', over: 0.6, burst: { kind: 'embers', on: 'target', count: 30 } },
    { at: 3.6, caption: 'The lamps come back, one by one.', hold: 2.4 },
  ]),

  // It goes up out of the well, and what it leaves is grey.
  colour_out_of_space: fell('colour_out_of_space', 0.3, [
    over(3.4, to(40, 20), to(2.2, 2.4), to(0.3, 0.2), to(0.5, 0.2), to(62, 58), { roll: to(3, -3) }),
    over(1.4, to(20, 10), to(2.4, 2.4), to(0.1, 0), to(0.25, 1.6), to(60, 72), { sway: 0.5 }),
    behind(1.6, to(180, 172), to(2.8, 3.4), to(1.3, 1.5), to(0.4, 0.6), to(58, 54), { roll: to(-2, 2) }),
  ], [
    { at: 0, fade: 'violet', over: 0.3, sound: 'worse', gain: 0.8, shake: 0.2, hold: 1 },
    { at: 0.4, fade: 'clear', over: 1.4, burst: { kind: 'motes', on: 'target', count: 40 } },
    { at: 2.2, caption: 'It goes up out of the well. What is left is grey.', hold: 2.6 },
    { at: 3.4, burst: { kind: 'motes', on: 'target', count: 24 } },
    { at: 4.6, burst: { kind: 'ash', on: 'target', count: 30 } },
  ]),

  // He is not dead; he is dreaming of you again. The long slow sinking, and the dark that follows.
  cthulhu: fell('cthulhu', 0.2, [
    shot({ dur: 5.4, yaw: to(80, 115), dist: to(1.2, 1.7), up: to(0.04, 0.2), look: to(0.8, 0.4), fov: to(64, 58), body: true, sway: 0.1, ease: 'glide' }),
    behind(3.4, to(172, 180), to(3.4, 5.2), to(2.4, 3.4), to(0.5, 0.55), to(62, 68), { sway: 0.15 }),
  ], [
    ...BLOW,
    { at: 0.5, set: 'whale', gain: 0.9, pitch: 0.45 },
    { at: 2.6, set: 'boom', gain: 1, pitch: 0.4, shake: 0.45, hold: 2 },
    { at: 4.6, burst: { kind: 'ash', on: 'target', count: 30 } },
    { at: 6.4, fade: 'black', over: 1.4 },
    { at: 8.2, fade: 'clear', over: 0.6 },
  ]),

  // The Father goes down beneath the reef, and the sea takes back the temple's floor.
  father_dagon: fell('father_dagon', 0.25, [
    shot({ dur: 4, yaw: to(70, 100), dist: to(1.1, 1.5), up: to(0.05, 0.12), look: to(0.7, 0.45), fov: to(64, 58), body: true, sway: 0.25 }),
    behind(2.8, to(176, 180), to(3.6, 5), to(0.7, 1.4), to(0.5, 0.55), to(62, 68)),
  ], [
    ...BLOW,
    { at: 0.6, set: 'gurgle', gain: 0.7, pitch: 0.6 },
    { at: 1.8, set: 'boom', gain: 0.7, pitch: 0.5, shake: 0.3, hold: 1.4 },
    { at: 2.2, burst: { kind: 'motes', on: 'target', count: 30 } },
  ]),

  // The king goes back to Carcosa, in yellow, with the name unsaid.
  hastur: fell('hastur', 0.3, [
    over(3.2, to(40, 15), to(1.7, 1.4), to(0.4, 0.35), to(0.6, 0.4), to(46, 40), { roll: to(4, -4), sway: 0.5 }),
    over(1.4, to(15, 100), to(1.4, 2.2), to(0.3, 0.3), to(0.4, 0.25), to(46, 52), { roll: to(-4, 0) }),
    elegy(2.4, to(110, 170), { roll: to(0, 3) }),
  ], [
    { at: 0, fade: 'gold', over: 0.2, sound: 'sight', gain: 0.8, shake: 0.2, hold: 1 },
    { at: 0.3, fade: 'clear', over: 0.8 },
    { at: 1, set: 'whisper', gain: 0.7, pitch: 0.7 },
    { at: 1.6, burst: { kind: 'motes', on: 'target', count: 24 } },
  ]),

  // The gate shuts, and the sky's spheres go out in the order they came.
  yog_sothoth: fell('yog_sothoth', 0.22, [
    shot({ dur: 3.4, yaw: to(80, 50), dist: to(1, 1.4), up: to(0.3, 0.5), look: to(0.6, 0.8), fov: to(58, 64), body: true, sway: 0.2 }),
    behind(3.2, to(180, 172), to(2.4, 3.6), to(1.2, 1.8), to(0.2, 0.4), to(70, 62), { sway: 0.2 }),
  ], [
    { at: 0, fade: 'violet', over: 0.2, sound: 'teleport', gain: 0.9, shake: 0.3, hold: 1 },
    { at: 0.3, fade: 'clear', over: 1.2, burst: { kind: 'stars', on: 'target', count: 50 } },
    { at: 2.6, set: 'choral', gain: 0.7, pitch: 0.6 },
  ]),

  // It does not feel the blows that bring it down; it slumbers. The piping thins, and the dark takes the flutes one by one.
  azathoth: fell('azathoth', 0.16, [
    shot({ dur: 4.4, yaw: to(100, 70), dist: to(1.3, 1.5), up: to(0.05, 0.12), look: to(0.2, 0.15), fov: to(66, 58), body: true, sway: 0.1 }),
    behind(3.2, to(180, 174), to(2.2, 3.4), to(0.6, 0.9), to(0.1, 0.3), to(72, 64), { sway: 0.1 }),
  ], [
    { at: 0, shake: 0.25, hold: 1.5 },
    { at: 0.6, set: 'choral', gain: 0.6, pitch: 0.4 },
    { at: 1.6, caption: 'The flutes grow thin.', hold: 2.8 },
    { at: 2.4, burst: { kind: 'stars', on: 'target', count: 40 } },
  ]),

  // He is not struck; he smiles, and a door is shut somewhere, softly.
  nyarlathotep: fell('nyarlathotep', 0.3, [
    over(2.6, to(14, 10), to(2.4, 1.8), to(0.5, 0.4), to(0.7, 0.5), to(42, 38), { roll: to(0, 2), sway: 0.3 }),
    over(2, to(20, 110), to(1.8, 2.6), to(0.4, 0.3), to(0.5, 0.3), to(46, 52), { roll: to(2, 0) }),
    elegy(2.8, to(120, 175), { roll: to(0, -3) }),
  ], [
    { at: 0, shake: 0.2, hold: 1, set: 'whisper', gain: 0.7, pitch: 0.85 },
    { at: 1.6, burst: { kind: 'embers', on: 'target', count: 22 } },
    { at: 4.8, fade: 'black', over: 0.25, sound: 'darkness', gain: 0.6 },
    { at: 5.15, fade: 'clear', over: 0.9 },
  ]),

  // The mound lies down among her thousand young, and the wood she woke goes quiet.
  shub_niggurath: fell('shub_niggurath', 0.22, [
    shot({ dur: 4.4, yaw: to(50, 90), dist: to(1, 1.3), up: to(0.05, 0.3), look: to(0.5, 0.35), fov: to(66, 58), body: true, sway: 0.3 }),
    behind(2.4, to(176, 172), to(3, 2.6), to(1, 1.6), to(0.4, 0.5), to(60, 54)),
  ], [
    ...BLOW,
    { at: 0.5, set: 'gust', gain: 0.8, pitch: 0.55 },
    { at: 1.6, set: 'whale', gain: 0.8, pitch: 0.5, burst: { kind: 'ash', on: 'target', count: 26 } },
    { at: 2.8, burst: { kind: 'motes', on: 'target', count: 30 }, shake: 0.15, hold: 1 },
  ]),

  // The mountain's eyes close; whatever it looked at is looked at no longer.
  ghatanothoa: fell('ghatanothoa', 0.22, [
    shot({ dur: 3.8, yaw: to(60, 95), dist: to(1.1, 1.5), up: to(0.4, 0.5), look: to(0.8, 0.8), fov: to(52, 56), body: true, sway: 0.05, ease: 'glide' }),
    behind(3.2, to(172, 180), to(3.2, 4.4), to(1.6, 2.4), to(0.4, 0.6), to(64, 68), { sway: 0.1 }),
  ], [
    ...BLOW,
    { at: 0.4, set: 'rumble', gain: 0.8, pitch: 0.45, shake: 0.2, hold: 1.4 },
    { at: 1.4, caption: 'The mountain’s eyes close.', hold: 2.4 },
    { at: 3, set: 'rumble', gain: 0.7, pitch: 0.4, burst: { kind: 'ash', on: 'target', count: 24 } },
  ]),

  // She goes down in the water she rose from; her brood are let go of, and rise.
  mother_hydra: fell('mother_hydra', 0.25, [
    shot({ dur: 3.6, yaw: to(-30, -10), dist: to(1.7, 1.4), up: to(0.5, 0.45), look: to(0.62, 0.4), fov: to(50, 42), roll: to(2, -2), body: true, sway: 0.3 }),
    shot({ dur: 3, yaw: to(80, 120), dist: to(1.2, 1.8), up: to(0.05, 0.2), look: to(0.7, 0.4), fov: to(62, 58), body: true, sway: 0.25 }),
  ], [
    ...BLOW,
    { at: 0.5, set: 'chant', gain: 0.7, pitch: 0.5 },
    { at: 1.8, set: 'gurgle', gain: 0.6, pitch: 0.6, burst: { kind: 'motes', on: 'target', count: 24 } },
    { at: 3.6, shake: 0.1, hold: 1 },
  ]),

  // Under the Sphinx, it crumbles to the sand it was dug out of, and the dark comes back.
  colossus_pyramids: fell('colossus_pyramids', 0.25, [
    shot({ dur: 3.8, yaw: to(35, 70), dist: to(1.1, 1.5), up: to(0.05, 0.3), look: to(0.15, 0.6), fov: to(62, 58), body: true, sway: 0.2, ease: 'glide' }),
    shot({ dur: 3, yaw: to(100, 130), dist: to(1.5, 2.1), up: to(0.3, 0.9), look: to(0.5, 0.4), fov: to(56, 62), body: true, sway: 0.2 }),
  ], [
    ...BLOW,
    { at: 0.5, set: 'rumble', gain: 0.8, pitch: 0.45, shake: 0.2, hold: 1.8, burst: { kind: 'ash', on: 'target', count: 40 } },
    { at: 1.4, caption: 'It goes back under the sand.', hold: 2.4 },
    { at: 2.4, burst: { kind: 'ash', on: 'target', count: 40 } },
  ]),

  // Sated, he closes the one eye, and the black comes down over it.
  tsathoggua: fell('tsathoggua', 0.28, [
    over(3, to(30, 15), to(2.4, 2), to(0.35, 0.3), to(0.5, 0.35), to(50, 44), { sway: 0.1 }),
    over(2.2, to(80, 140), to(2.6, 3.2), to(0.25, 0.35), to(0.3, 0.15), to(52, 56), { sway: 0.1 }),
    elegy(2, to(140, 190)),
  ], [
    { at: 0, shake: 0.25, hold: 1.2, set: 'groan', gain: 0.8, pitch: 0.45 },
    { at: 1.4, burst: { kind: 'ash', on: 'target', count: 22 } },
    { at: 4.8, fade: 'black', over: 1.4, set: 'croak', gain: 0.6, pitch: 0.35 },
    { at: 6.4, fade: 'clear', over: 0.8 },
  ]),

  // The coils slacken and slide off into the grass, and the grass is still.
  yig: fell('yig', 0.28, [
    shot({ dur: 3.6, yaw: to(55, 85), dist: to(1.4, 1.9), up: to(0.02, 0.06), look: to(0.15, 0.5), fov: to(66, 60), roll: to(-3, 4), body: true, sway: 0.4 }),
    over(2, to(85, 120), to(1.9, 2.4), to(0.1, 0.3), to(0.2, 0.1), to(60, 56), { sway: 0.4 }),
    behind(1.6, to(176, 180), to(2.8, 3.6), to(0.6, 1.4), to(0.2, 0.3), to(66, 60), { sway: 0.5 }),
  ], [
    ...BLOW,
    { at: 0.5, set: 'rattle', gain: 0.8, pitch: 0.7 },
    { at: 1.4, set: 'hiss', gain: 0.6, pitch: 0.7, burst: { kind: 'motes', on: 'target', count: 26 } },
    { at: 3.8, caption: 'The grass goes still.', hold: 2.4 },
  ]),

  // The whippoorwills stop, one by one; what lay on the floor of the library was not wholly a man.
  wilbur_whateley: fell('wilbur_whateley', 0.3, [
    over(2.2, to(60, 30), to(2.4, 1.9), to(0.4, 0.35), to(0.6, 0.4), to(50, 42), { roll: to(-3, 3), sway: 0.4 }),
    over(2.2, to(-40, -110), to(1.8, 2.6), to(0.2, 0.3), to(0.35, 0.2), to(54, 56)),
    elegy(2.4, to(-110, -170)),
  ], [
    { at: 0, fade: 'red', over: 0.08, shake: 0.35, hold: 1 },
    { at: 0.1, fade: 'clear', over: 0.9 },
    { at: 0.4, set: 'whippoorwill', gain: 0.8, pitch: 0.8 },
    { at: 1.8, set: 'gurgle', gain: 0.6, pitch: 0.6, burst: { kind: 'motes', on: 'target', count: 20 } },
  ]),

  // The candle goes out; he is a little blue-grey dust, as he said he was.
  joseph_curwen: fell('joseph_curwen', 0.3, [
    over(2.4, to(30, 10), to(2.2, 1.6), to(0.6, 0.5), to(0.8, 0.5), to(42, 36), { roll: to(2, -2), sway: 0.25 }),
    over(2.2, to(90, 140), to(1.8, 2.6), to(0.25, 0.3), to(0.4, 0.2), to(54, 56)),
    elegy(2.4, to(140, 190)),
  ], [
    { at: 0, fade: 'violet', over: 0.1, sound: 'summon', gain: 0.7, shake: 0.3, hold: 1 },
    { at: 0.15, fade: 'clear', over: 0.8 },
    { at: 0.5, set: 'ghost', gain: 0.6, pitch: 0.7 },
    { at: 0.6, burst: { kind: 'embers', on: 'target', count: 22 } },
    { at: 3.6, burst: { kind: 'ash', on: 'target', count: 30 } },
    { at: 5.2, set: 'wail', gain: 0.5, pitch: 0.55 },
  ]),
};

/** The fall of its own that horror `id` has, if it has one. */
export const bespokeFall = (id: string): Scene | undefined => FALLS[id];
