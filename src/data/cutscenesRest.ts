/**
 * Eleven more arrivals of their own (round 61, asked: "ensure that all bosses currently lacking a dedicated entrance sequence or animation
 * manifest in a manner consistent with the established lore, utilizing visually compelling and thematically fitting effects"): the horrors
 * of the waking world that came in by their size alone. The cold of Dr. Muñoz's room, the alchemist's fumes, the Unnamable's old
 * beams, the tide drawn out for the thing at Martin's Beach, Ephraim's mind changing eyes, Simon Orne's three names, Hutchinson gathered
 * out of his salts by a bolt, the pale mould of the Shunned House taking a man's shape, the Whisperer's buzzing in the chair, the
 * Shoggoth's cry down the tunnel, the Flying Polyp heard as a wind. Made as the others are (data/cutscenesBoss.ts: shots, then beats; the
 * director lays a speaking horror's own line over them, so those carry no caption of the scene's own). Data only.
 */

import { shot, to, type Scene } from './cutscenes';
import { behind, named, scene } from './cutscenesBoss';

type Maker = (name: string, epithet: string | undefined) => Scene;

export const REST: Readonly<Record<string, Maker>> = {
  // The cold comes first, and the hum of the pump that keeps it; then the voice, too polite for the room.
  dr_munoz: (name, epithet) =>
    scene('dr_munoz', [
      behind(3, to(166, 172), to(3.4, 2.8), to(2.2, 2.4), to(0.55, 0.8), to(58, 50), { sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(22, 8), dist: to(2.4, 1.8), up: to(0.7, 0.76), look: to(0.8, 0.84), fov: to(44, 36), roll: to(-2, 2), body: true, sway: 0.15, ease: 'glide' }),
      shot({ dur: 2.4, yaw: to(-40, -22), dist: to(2.2, 1.7), up: to(0.3, 0.5), look: to(0.55, 0.7), fov: to(54, 46), body: true, sway: 0.3 }),
    ], [
      { at: 0.1, fade: 'cold', over: 0.3, set: 'gust', gain: 0.5, pitch: 0.6 },
      { at: 0.4, fade: 'clear', over: 1.8, set: 'rumble', gain: 0.45, pitch: 1.5, burst: { kind: 'frost', on: 'target', count: 44 } },
      { at: 3.2, set: 'creak', gain: 0.5, pitch: 1.6, burst: { kind: 'frost', on: 'target', count: 24 } },
      named(5.5, name, epithet),
    ]),

  // The vault is warm with something that is not a fire; the fumes rise first, and then the one who has breathed them for six hundred years.
  charles_le_sorcier: (name, epithet) =>
    scene('charles_le_sorcier', [
      shot({ dur: 3, yaw: to(40, 20), dist: to(3, 2.2), up: to(0.3, 0.5), look: to(0.7, 0.85), fov: to(56, 46), body: true, sway: 0.4 }),
      shot({ dur: 2.8, yaw: to(-18, -6), dist: to(2.6, 2), up: to(0.75, 0.8), look: to(0.8, 0.85), fov: to(44, 36), roll: to(2, -2), body: true, sway: 0.2 }),
      behind(2.4, to(168, 172), to(2.6, 3.4), to(2.1, 2.3), to(0.5, 0.7), to(52, 60)),
    ], [
      { at: 0.1, fade: 'gold', over: 0.3, set: 'bell', gain: 0.5, pitch: 0.55 },
      { at: 0.4, fade: 'clear', over: 1.8, burst: { kind: 'smoke', on: 'target', count: 26 } },
      { at: 1.4, set: 'chant', gain: 0.4, pitch: 0.7, burst: { kind: 'embers', on: 'target', count: 20 } },
      { at: 3.6, set: 'cork', gain: 0.6, pitch: 0.8 },
      named(5.6, name, epithet),
    ]),

  // It was never given a name, and the old beams of the attic know it; the dark takes the picture twice as it comes.
  the_unnamable: (name, epithet) =>
    scene('the_unnamable', [
      behind(3, to(166, 172), to(3.8, 3), to(2.2, 2.4), to(0.3, 0.5), to(64, 54), { roll: to(-3, 4), sway: 0.5 }),
      shot({ dur: 2.8, yaw: to(34, 14), dist: to(2.6, 1.8), up: to(0.2, 0.4), look: to(0.5, 0.7), fov: to(58, 46), body: true, sway: 0.5 }),
      shot({ dur: 2.6, yaw: to(-30, -12), dist: to(2.8, 2.1), up: to(0.6, 0.7), look: to(0.7, 0.8), fov: to(46, 40), roll: to(2, -3), body: true, sway: 0.4 }),
    ], [
      { at: 0.2, set: 'timber', gain: 0.6, pitch: 0.6, caption: 'It was never given a name.', hold: 2.6 },
      { at: 1.3, fade: 'black', over: 0.1, sound: 'darkness', gain: 0.6 },
      { at: 1.55, fade: 'clear', over: 0.4, set: 'whisper', gain: 0.6, pitch: 0.5, burst: { kind: 'smoke', on: 'target', count: 24 } },
      { at: 3.1, caption: 'The attic has been holding its breath.', hold: 2.6, set: 'creak', gain: 0.6, pitch: 0.7, shake: 0.1 },
      { at: 4.4, fade: 'black', over: 0.1 },
      { at: 4.65, fade: 'clear', over: 0.35 },
      named(5.8, name, epithet),
    ]),

  // The tide has gone out further than it should; the sea is giving something up, and not gently.
  martins_beach_horror: (name, epithet) =>
    scene('martins_beach_horror', [
      behind(3.2, to(166, 172), to(4, 3.2), to(2.2, 2.4), to(0.15, 0.5), to(66, 56), { roll: to(-2, 3), sway: 0.5 }),
      shot({ dur: 2.8, yaw: to(44, 20), dist: to(2.8, 1.9), up: to(0.05, 0.25), look: to(0.4, 0.65), fov: to(62, 50), body: true, sway: 0.5 }),
      shot({ dur: 2.4, yaw: to(-34, -14), dist: to(3, 2.3), up: to(0.6, 0.7), look: to(0.65, 0.75), fov: to(46, 40), body: true, sway: 0.4 }),
    ], [
      { at: 0.1, set: 'gust', gain: 0.6, pitch: 0.7, caption: 'The tide has gone out further than it should.', hold: 2.6 },
      { at: 1.6, set: 'gurgle', gain: 0.7, pitch: 0.7, sound: 'splash', burst: { kind: 'brine', on: 'target', count: 34 } },
      { at: 2.4, set: 'whale', gain: 0.8, pitch: 0.5, shake: 0.18, hold: 1.2 },
      { at: 3.2, caption: 'Something is coming in with it.', hold: 2.4, burst: { kind: 'brine', on: 'target', count: 26 } },
      named(5.6, name, epithet),
    ]),

  // The mind changes eyes: the picture flickers between the face that was Asenath's and what looks out of it.
  ephraim_waite: (name, epithet) =>
    scene('ephraim_waite', [
      behind(2.8, to(166, 172), to(3.4, 2.8), to(2.2, 2.4), to(0.6, 0.85), to(58, 50), { sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(18, 6), dist: to(2, 1.5), up: to(0.8, 0.84), look: to(0.86, 0.9), fov: to(40, 32), roll: to(2, -3), body: true, sway: 0.2, ease: 'glide' }),
      shot({ dur: 2.6, yaw: to(-34, -16), dist: to(2.4, 1.9), up: to(0.5, 0.65), look: to(0.7, 0.8), fov: to(52, 46), body: true, sway: 0.4 }),
    ], [
      { at: 1.5, fade: 'violet', over: 0.1, sound: 'worse', gain: 0.6, set: 'whisper', pitch: 0.8 },
      { at: 1.72, fade: 'clear', over: 0.3 },
      { at: 3.3, fade: 'violet', over: 0.1, sound: 'rewired', gain: 0.6 },
      { at: 3.55, fade: 'clear', over: 0.6, burst: { kind: 'runes', on: 'target', count: 14 } },
      named(5.4, name, epithet),
    ]),

  // Three names for one man, and each cut brings another: the name hardly matters.
  simon_orne: (name, epithet) =>
    scene('simon_orne', [
      behind(2.8, to(166, 172), to(3.4, 2.8), to(2.2, 2.4), to(0.6, 0.8), to(58, 50), { sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(-26, -12), dist: to(2.4, 1.8), up: to(0.75, 0.8), look: to(0.8, 0.85), fov: to(46, 38), roll: to(-2, 2), body: true, sway: 0.2 }),
      shot({ dur: 2.6, yaw: to(32, 14), dist: to(1.8, 1.4), up: to(0.8, 0.84), look: to(0.86, 0.9), fov: to(40, 32), roll: to(2, -2), body: true, sway: 0.2 }),
    ], [
      { at: 0.2, set: 'page', gain: 0.6, pitch: 0.7 },
      { at: 2.7, fade: 'black', over: 0.08, sound: 'vanish', gain: 0.6 },
      { at: 2.9, fade: 'clear', over: 0.3, burst: { kind: 'runes', on: 'target', count: 10 } },
      { at: 5.4, fade: 'black', over: 0.08, sound: 'vanish', gain: 0.6 },
      { at: 5.6, fade: 'clear', over: 0.3, burst: { kind: 'runes', on: 'target', count: 10 } },
      named(5.7, name, epithet),
    ]),

  // A glass of grey salts, and a bolt; what was left of him gathers up out of the dust and is a man.
  edward_hutchinson: (name, epithet) =>
    scene('edward_hutchinson', [
      shot({ dur: 2.6, yaw: to(30, 14), dist: to(2.4, 1.8), up: to(0.1, 0.3), look: to(0.4, 0.7), fov: to(60, 50), body: true, sway: 0.4 }),
      shot({ dur: 2.8, yaw: to(-20, -8), dist: to(2.6, 2), up: to(0.7, 0.76), look: to(0.8, 0.84), fov: to(46, 38), roll: to(2, -2), body: true, sway: 0.25 }),
      behind(2.8, to(168, 172), to(2.8, 3.4), to(2.1, 2.3), to(0.5, 0.7), to(52, 60)),
    ], [
      { at: 0.1, burst: { kind: 'ash', on: 'target', count: 44 }, set: 'gust', gain: 0.4, pitch: 0.8 },
      { at: 1.2, set: 'thunder', gain: 0.8, pitch: 0.9, fade: 'white', over: 0.08 },
      { at: 1.3, fade: 'clear', over: 0.9, set: 'strike', gain: 0.7, shake: 0.2, hold: 1, burst: { kind: 'ash', on: 'target', count: 28 } },
      { at: 3.4, burst: { kind: 'embers', on: 'target', count: 16 } },
      named(5.6, name, epithet),
    ]),

  // The pale mould on the cellar floor, and its warmth; it has been the shape of a man for a long time.
  shunned_house_entity: (name, epithet) =>
    scene('shunned_house_entity', [
      behind(3.2, to(180, 172), to(3.4, 2.8), to(0.9, 1.6), to(0.1, 0.4), to(64, 56), { roll: to(-2, 2), sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(40, 18), dist: to(2.2, 1.6), up: to(0.08, 0.3), look: to(0.35, 0.65), fov: to(60, 48), body: true, sway: 0.35 }),
      shot({ dur: 2.4, yaw: to(-30, -12), dist: to(2.8, 2.2), up: to(0.6, 0.7), look: to(0.7, 0.8), fov: to(46, 40), body: true, sway: 0.3 }),
    ], [
      { at: 0.1, fade: 'green', over: 0.35, set: 'gurgle', gain: 0.6, pitch: 0.6, caption: 'The mould on the cellar floor is the shape of a man.', hold: 2.8 },
      { at: 0.4, fade: 'clear', over: 1.8, burst: { kind: 'spores', on: 'target', count: 32 } },
      { at: 1.8, set: 'slime', gain: 0.6, pitch: 0.7 },
      { at: 3.2, caption: 'It is warm in here. Nothing here should be warm.', hold: 2.6, set: 'creak', gain: 0.5, pitch: 0.6, burst: { kind: 'spores', on: 'target', count: 20 } },
      named(5.6, name, epithet),
    ]),

  // A buzzing voice from a chair, and the stars it offers to show.
  whisperer: (name, epithet) =>
    scene('whisperer', [
      behind(3.2, to(168, 172), to(3.8, 2.6), to(2.1, 2.2), to(0.45, 0.75), to(60, 46), { sway: 0.2, ease: 'glide' }),
      shot({ dur: 2.8, yaw: to(16, 4), dist: to(2.2, 1.6), up: to(0.62, 0.7), look: to(0.7, 0.76), fov: to(42, 34), roll: to(-3, 2), body: true, sway: 0.15 }),
      shot({ dur: 2.4, yaw: to(-40, -20), dist: to(2.4, 1.8), up: to(0.3, 0.5), look: to(0.5, 0.65), fov: to(54, 46), body: true, sway: 0.3 }),
    ], [
      { at: 0.1, set: 'buzz', gain: 0.6, pitch: 0.8 },
      { at: 0.9, set: 'whisper', gain: 0.5, pitch: 0.7 },
      { at: 3.4, fade: 'cold', over: 0.3, burst: { kind: 'stars', on: 'target', count: 28 }, set: 'wail', gain: 0.4, pitch: 0.6 },
      { at: 3.7, fade: 'clear', over: 1.4 },
      named(5.7, name, epithet),
    ]),

  // Tekeli-li! down the tunnel before anything can be seen; and then the tunnel moves.
  shoggoth: (name, epithet) =>
    scene('shoggoth', [
      behind(3.2, to(170, 174), to(3, 3.6), to(1.4, 1.6), to(0.2, 0.5), to(68, 62), { sway: 0.5 }),
      shot({ dur: 2.8, yaw: to(40, 18), dist: to(1.6, 1.3), up: to(0.2, 0.4), look: to(0.5, 0.7), fov: to(60, 50), body: true, sway: 0.4 }),
      shot({ dur: 2.4, yaw: to(-34, -14), dist: to(2.2, 1.7), up: to(0.5, 0.6), look: to(0.6, 0.7), fov: to(52, 46), roll: to(-3, 3), body: true, sway: 0.5 }),
    ], [
      { at: 0.1, set: 'wail', gain: 0.6, pitch: 1.5, caption: 'Tekeli-li! Tekeli-li!', hold: 2.4 },
      { at: 0.9, fade: 'black', over: 0.1, sound: 'darkness', gain: 0.6 },
      { at: 1.15, fade: 'clear', over: 0.5, set: 'slime', gain: 0.7, pitch: 0.6, burst: { kind: 'eyes', on: 'target', count: 16 } },
      { at: 2.1, set: 'gurgle', gain: 0.7, pitch: 0.5, shake: 0.15, burst: { kind: 'smoke', on: 'target', count: 24 } },
      { at: 3.4, caption: 'The tunnel is moving.', hold: 2.4, set: 'wail', gain: 0.6, pitch: 1.7 },
      named(5.8, name, epithet),
    ]),

  // A wind where no wind can be; every flame leans away; then the lamps go, and what blew them out is overhead.
  flying_polyp: (name, epithet) =>
    scene('flying_polyp', [
      behind(3, to(166, 172), to(3.6, 3), to(2.2, 2.4), to(0.5, 0.8), to(62, 54), { roll: to(-3, 4), sway: 0.7 }),
      shot({ dur: 2.8, yaw: to(30, 12), dist: to(2.8, 2), up: to(0.4, 0.7), look: to(0.5, 0.8), fov: to(58, 48), roll: to(3, -2), body: true, sway: 0.7 }),
      shot({ dur: 2.4, yaw: to(-30, -10), dist: to(2.6, 2), up: to(0.2, 0.4), look: to(0.5, 0.7), fov: to(54, 46), roll: to(-2, 2), body: true, sway: 0.6 }),
    ], [
      { at: 0.1, set: 'gust', gain: 0.8, pitch: 0.7, caption: 'The air is whistling. There is nothing there to whistle.', hold: 2.8, burst: { kind: 'ash', on: 'target', count: 36 } },
      { at: 2.2, fade: 'black', over: 0.1, sound: 'lampOut', gain: 0.7 },
      { at: 2.45, fade: 'clear', over: 0.4, set: 'shriek', gain: 0.6, pitch: 0.7, shake: 0.2 },
      { at: 3.2, caption: 'Every flame in the room leans away.', hold: 2.4, sound: 'swept', gain: 0.6, burst: { kind: 'ash', on: 'target', count: 28 } },
      named(5.6, name, epithet),
    ]),
};
