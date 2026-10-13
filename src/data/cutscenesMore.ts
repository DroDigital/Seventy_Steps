/**
 * Ten more arrivals of their own, for the horrors of the named and the great old ones whose stories give
 * them one before they are fought: the Black Man with the book held open, the Hound heard across the moor,
 * the old man's bottles swinging on their strings, the piping behind the High Priest's mask, the veil lifted
 * from 'Umr at-Tawil, the Outsider climbing up out of the dark, the Gorgon's gaze looked away from, Lilith by
 * candlelight, Rhan-Tegoth on his ivory throne, the window that opens on no street. Made as the others are
 * (data/cutscenesBoss.ts: shots, then beats, the director laying the horror's own line over them); those
 * that speak carry no caption of the scene's own. The rest still arrive by their size alone. Data only.
 */

import { shot, to, type Scene } from './cutscenes';
import { behind, bespokeArrival, named, scene } from './cutscenesBoss';

type Maker = (name: string, epithet: string | undefined) => Scene;

export const MORE: Readonly<Record<string, Maker>> = {
  // The book is offered open, and every corner of the room leans toward it.
  black_man: (name, epithet) =>
    scene('black_man', [
      behind(2.8, to(166, 172), to(3.6, 3), to(2.2, 2.5), to(0.4, 0.7), to(60, 52), { roll: to(-6, 5), sway: 0.5 }),
      shot({ dur: 2.8, yaw: to(18, 6), dist: to(2.6, 2), up: to(0.7, 0.72), look: to(0.78, 0.8), fov: to(46, 38), roll: to(4, -3), body: true, sway: 0.3 }),
      shot({ dur: 2.6, yaw: to(-50, -35), dist: to(2.4, 1.8), up: to(0.1, 0.25), look: to(0.5, 0.7), fov: to(56, 48), roll: to(-3, 3), body: true, sway: 0.4 }),
    ], [
      { at: 0.2, set: 'page', gain: 0.8, pitch: 0.7 },
      { at: 2.6, sound: 'darkness', gain: 0.5, shake: 0.08 },
      { at: 3.4, burst: { kind: 'motes', on: 'target', count: 16 } },
      named(5.4, name, epithet),
    ]),

  // Baying on the moor, first far off and then not.
  the_hound: (name, epithet) =>
    scene('the_hound', [
      behind(3, to(166, 172), to(3.8, 3), to(2.2, 2.4), to(0.25, 0.4), to(64, 54), { sway: 0.6 }),
      shot({ dur: 2.6, yaw: to(50, 25), dist: to(2.4, 1.6), up: to(0.1, 0.3), look: to(0.4, 0.6), fov: to(62, 48), body: true, sway: 0.5 }),
      shot({ dur: 2.4, yaw: to(-20, -8), dist: to(3.2, 2.6), up: to(0.5, 0.55), look: to(0.6, 0.7), fov: to(46, 40), body: true, sway: 0.4 }),
    ], [
      { at: 0.1, set: 'farHowl', gain: 0.8, pitch: 0.8, caption: 'Something is baying on the moor.', hold: 2.4 },
      { at: 3, set: 'howl', gain: 0.8, pitch: 0.7, shake: 0.1, hold: 1 },
      { at: 3.4, caption: 'It has followed you the whole way.', hold: 2.2 },
      named(5.4, name, epithet),
    ]),

  // The bottles on their strings are all swinging, and not from the wind.
  terrible_old_man: (name, epithet) =>
    scene('terrible_old_man', [
      shot({ dur: 2.6, yaw: to(30, 15), dist: to(3, 2.2), up: to(0.5, 0.6), look: to(0.8, 0.85), fov: to(54, 46), roll: to(-3, 3), body: true, sway: 0.5 }),
      shot({ dur: 2.4, yaw: to(-16, -6), dist: to(2.6, 2), up: to(0.7, 0.75), look: to(0.8, 0.82), fov: to(44, 38), roll: to(2, -2), body: true, sway: 0.4 }),
      behind(2.4, to(168, 172), to(2.6, 3.2), to(2.1, 2.3), to(0.6, 0.7), to(54, 60)),
    ], [
      { at: 0.1, set: 'chains', gain: 0.5, pitch: 1.3 },
      { at: 1.4, set: 'cork', gain: 0.7, pitch: 1 },
      { at: 3.4, set: 'creak', gain: 0.6, pitch: 0.8 },
      named(5, name, epithet),
    ]),

  // The piping comes from behind the silk, and the silk does not move.
  high_priest: (name, epithet) =>
    scene('high_priest', [
      behind(3, to(166, 172), to(3.6, 2.8), to(2.2, 2.4), to(0.5, 0.8), to(60, 52), { sway: 0.3 }),
      shot({ dur: 3, yaw: to(14, 4), dist: to(2.6, 2), up: to(0.75, 0.8), look: to(0.8, 0.85), fov: to(44, 36), roll: to(-2, 3), body: true, sway: 0.15, ease: 'glide' }),
      shot({ dur: 2.4, yaw: to(-40, -20), dist: to(2.2, 1.8), up: to(0.3, 0.45), look: to(0.5, 0.7), fov: to(54, 48), body: true, sway: 0.3 }),
    ], [
      { at: 0.2, fade: 'gold', over: 0.4, set: 'chant', gain: 0.5, pitch: 0.6 },
      { at: 0.6, fade: 'clear', over: 1.4, caption: 'The piping comes from behind the mask.', hold: 2.4 },
      { at: 3.6, caption: 'Do not ask what the silk hides.', hold: 2.4, set: 'whisper', gain: 0.7, pitch: 0.7 },
      named(5.6, name, epithet),
    ]),

  // The veil is lifted, and he is there, as he has been for longer than the veil.
  umr_at_tawil: (name, epithet) =>
    scene('umr_at_tawil', [
      behind(3, to(166, 172), to(3.6, 2.8), to(2.2, 2.4), to(0.6, 0.85), to(58, 50), { sway: 0.2 }),
      shot({ dur: 3, yaw: to(20, 6), dist: to(2.4, 1.9), up: to(0.75, 0.8), look: to(0.8, 0.85), fov: to(44, 36), body: true, sway: 0.1, ease: 'glide' }),
      shot({ dur: 2.4, yaw: to(-30, -14), dist: to(2.6, 2), up: to(0.2, 0.4), look: to(0.5, 0.6), fov: to(56, 48), body: true, sway: 0.2 }),
    ], [
      { at: 0.1, fade: 'white', over: 0.5, sound: 'teleport', gain: 0.7 },
      { at: 0.7, fade: 'clear', over: 1.6, set: 'bell', gain: 0.6, pitch: 0.55 },
      { at: 3.2, set: 'choral', gain: 0.5, pitch: 0.7 },
      named(5.6, name, epithet),
    ]),

  // Out of the ground, the hand first.
  the_outsider: (name, epithet) =>
    scene('the_outsider', [
      shot({ dur: 3.2, yaw: to(30, 15), dist: to(2.6, 1.8), up: to(0.02, 0.06), look: to(0.1, 0.6), fov: to(66, 52), roll: to(-3, 3), body: true, sway: 0.5 }),
      shot({ dur: 2.6, yaw: to(-14, -6), dist: to(2.8, 2.2), up: to(0.7, 0.8), look: to(0.8, 0.86), fov: to(46, 40), body: true, sway: 0.4 }),
      behind(2.4, to(168, 172), to(2.8, 3.6), to(2, 2.2), to(0.4, 0.6), to(58, 62)),
    ], [
      { at: 0.1, set: 'crunch', gain: 0.8, pitch: 0.6, caption: 'Something is climbing up out of the dark.', hold: 2.6 },
      { at: 1.6, set: 'creak', gain: 0.7, pitch: 0.7 },
      { at: 3.6, set: 'groan', gain: 0.6, pitch: 0.8, caption: 'It has been alone a very long time.', hold: 2.4 },
      named(5.6, name, epithet),
    ]),

  // Do not look. The picture looks, for a moment, and is let go.
  medusa_gorgon: (name, epithet) =>
    scene('medusa_gorgon', [
      behind(2.6, to(166, 172), to(3.6, 3), to(2.2, 2.4), to(0.5, 0.8), to(58, 50), { sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(-16, -4), dist: to(2.6, 2), up: to(0.75, 0.8), look: to(0.8, 0.85), fov: to(44, 36), roll: to(-2, 3), body: true, sway: 0.2 }),
      behind(2.6, to(168, 180), to(2.6, 3.6), to(2.2, 2.6), to(0.5, 0.6), to(48, 58), { roll: to(0, -3) }),
    ], [
      { at: 0.2, set: 'hiss', gain: 0.7, pitch: 0.8 },
      { at: 2.3, fade: 'gold', over: 0.12, sound: 'sight', gain: 0.8 },
      { at: 2.42, fade: 'clear', over: 0.6, burst: { kind: 'motes', on: 'target', count: 18 } },
      { at: 4.6, set: 'hiss', gain: 0.5, pitch: 0.6 },
      named(5.2, name, epithet),
    ]),

  // A cellar in Red Hook, a match struck, and the candles taking.
  lilith: (name, epithet) =>
    scene('lilith', [
      shot({ dur: 2.8, yaw: to(40, 20), dist: to(3, 2.2), up: to(0.3, 0.5), look: to(0.7, 0.85), fov: to(56, 46), body: true, sway: 0.4 }),
      shot({ dur: 2.8, yaw: to(-18, -6), dist: to(2.6, 2), up: to(0.75, 0.8), look: to(0.8, 0.85), fov: to(44, 36), roll: to(2, -2), body: true, sway: 0.2 }),
      behind(2.4, to(168, 172), to(2.6, 3.4), to(2.1, 2.3), to(0.5, 0.7), to(52, 60)),
    ], [
      { at: 0.1, fade: 'red', over: 0.3, set: 'match', gain: 0.8, pitch: 0.9 },
      { at: 0.4, fade: 'clear', over: 1.8, set: 'chant', gain: 0.5, pitch: 0.8 },
      { at: 3, burst: { kind: 'embers', on: 'target', count: 24 } },
      { at: 3.4, set: 'bell', gain: 0.5, pitch: 0.7 },
      named(5.2, name, epithet),
    ]),

  // The throne first, then what sits on it, then that it is hungry.
  rhan_tegoth: (name, epithet) =>
    scene('rhan_tegoth', [
      shot({ dur: 3.4, yaw: to(40, 25), dist: to(1.5, 1.7), up: to(0.02, 0.5), look: to(0.1, 0.8), fov: to(66, 54), body: true, sway: 0.15, ease: 'glide' }),
      shot({ dur: 2.6, yaw: to(-20, -8), dist: to(2.6, 2), up: to(0.55, 0.6), look: to(0.65, 0.68), fov: to(50, 44), body: true, sway: 0.2 }),
      behind(2.6, to(180, 174), to(3.2, 4.2), to(0.8, 1.6), to(0.5, 0.6), to(62, 66)),
    ], [
      { at: 0.1, set: 'rumble', gain: 0.8, pitch: 0.5, shake: 0.12, caption: 'It has sat on its ivory throne since before the ice.', hold: 2.8 },
      { at: 2.8, set: 'croak', gain: 0.7, pitch: 0.45 },
      { at: 3.9, set: 'groan', gain: 0.7, pitch: 0.5, caption: 'It has waited a long time to be fed.', hold: 2.4 },
      named(6, name, epithet),
    ]),

  // A window that opens on no street, and a viol played too fast to be played.
  zann_window_thing: (name, epithet) =>
    scene('zann_window_thing', [
      behind(3, to(166, 172), to(3.8, 3), to(2.2, 2.3), to(0.3, 0.5), to(64, 54), { roll: to(-3, 4), sway: 0.4 }),
      shot({ dur: 3, yaw: to(30, 8), dist: to(2.8, 2), up: to(0.4, 0.5), look: to(0.55, 0.65), fov: to(56, 44), roll: to(3, -4), body: true, sway: 0.5 }),
      shot({ dur: 2.4, yaw: to(-50, -25), dist: to(2.4, 1.8), up: to(0.2, 0.4), look: to(0.5, 0.65), fov: to(56, 46), roll: to(-2, 2), body: true, sway: 0.4 }),
    ], [
      { at: 0.1, set: 'wail', gain: 0.6, pitch: 1.2, caption: 'A window on no street of this world.', hold: 2.6 },
      { at: 1.2, set: 'gust', gain: 0.7, pitch: 0.7 },
      { at: 3.6, set: 'wail', gain: 0.7, pitch: 1.4, shake: 0.1, caption: 'The viol is playing somewhere, very fast.', hold: 2.4 },
      named(5.8, name, epithet),
    ]),
};

/** The arrival of its own that horror `id` has, from either set of them (render/cinemaDirector.ts). */
export const arrivalOf = (id: string, name: string, epithet: string | undefined): Scene | undefined => bespokeArrival(id, name, epithet) ?? MORE[id]?.(name, epithet);
