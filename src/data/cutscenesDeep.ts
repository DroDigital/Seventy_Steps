/**
 * Nine more arrivals of their own (round 61; data/cutscenesRest.ts is the waking world's): the horrors of the Dreamlands and the Beyond that
 * came in by their size alone. The Mound breathing and its twin answering from the far side of it, the lake of Ib gone still, the cloud on
 * Hatheg-Kla dancing, the carved faces of Kadath turning, Hypnos's long slow blink, Zkauba's borrowed body, the piping that keeps the
 * dance going, the Gate that stands open and nothing comes through it. Made as the others are (data/cutscenesBoss.ts); a horror that speaks
 * has its own line laid over its scene, so carries no caption of the scene's own. Data only.
 */

import { shot, to, type Scene } from './cutscenes';
import { behind, named, scene } from './cutscenesBoss';

type Maker = (name: string, epithet: string | undefined) => Scene;

export const DEEP: Readonly<Record<string, Maker>> = {
  // The mound breathes, and the dark in its mouth is red; the ground opens as one half of a pair comes up.
  nug: (name, epithet) =>
    scene('nug', [
      shot({ dur: 3.2, yaw: to(40, 20), dist: to(1.6, 1.8), up: to(0.02, 0.3), look: to(0.15, 0.7), fov: to(66, 54), body: true, sway: 0.15, ease: 'glide' }),
      behind(2.8, to(176, 172), to(3.4, 4), to(0.9, 1.6), to(0.3, 0.55), to(64, 68), { sway: 0.3 }),
      shot({ dur: 2.4, yaw: to(-30, -12), dist: to(2.6, 2), up: to(0.5, 0.6), look: to(0.6, 0.7), fov: to(52, 46), body: true, sway: 0.2 }),
    ], [
      { at: 0.1, set: 'rumble', gain: 0.8, pitch: 0.4, shake: 0.2, caption: 'The mound is breathing.', hold: 2.6 },
      { at: 1.2, sound: 'erupted', gain: 0.6, burst: { kind: 'embers', on: 'target', count: 36 } },
      { at: 1.8, set: 'croak', gain: 0.6, pitch: 0.45, burst: { kind: 'smoke', on: 'target', count: 24 } },
      { at: 3.5, caption: 'There are two of them.', hold: 2.4, set: 'groan', gain: 0.6, pitch: 0.5 },
      named(5.8, name, epithet),
    ]),

  // The other half of the pair: the answer from the far side of the mound.
  yeb: (name, epithet) =>
    scene('yeb', [
      shot({ dur: 3.2, yaw: to(-40, -20), dist: to(1.6, 1.8), up: to(0.02, 0.3), look: to(0.15, 0.7), fov: to(66, 54), body: true, sway: 0.15, ease: 'glide' }),
      behind(2.8, to(176, 172), to(3.4, 4), to(0.9, 1.6), to(0.3, 0.55), to(64, 68), { sway: 0.3 }),
      shot({ dur: 2.4, yaw: to(30, 12), dist: to(2.6, 2), up: to(0.5, 0.6), look: to(0.6, 0.7), fov: to(52, 46), body: true, sway: 0.2 }),
    ], [
      { at: 0.1, sound: 'quaked', gain: 0.6, set: 'rumble', pitch: 0.45, shake: 0.2, caption: 'Something answers from the far side of the mound.', hold: 2.8 },
      { at: 1.4, set: 'bellow', gain: 0.6, pitch: 0.5, burst: { kind: 'smoke', on: 'target', count: 26 } },
      { at: 2, burst: { kind: 'embers', on: 'target', count: 30 } },
      { at: 3.6, caption: 'It has always had a twin.', hold: 2.4, set: 'groan', gain: 0.6, pitch: 0.55 },
      named(5.8, name, epithet),
    ]),

  // The lake of Ib goes perfectly still; then the green stone of the idol is no longer the only thing that watches.
  bokrug: (name, epithet) =>
    scene('bokrug', [
      behind(3.2, to(166, 172), to(3.8, 3), to(2.2, 2.4), to(0.05, 0.4), to(66, 56), { roll: to(-2, 3), sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(40, 18), dist: to(2.4, 1.7), up: to(0.02, 0.2), look: to(0.35, 0.65), fov: to(62, 50), body: true, sway: 0.35 }),
      shot({ dur: 2.4, yaw: to(-30, -12), dist: to(2.8, 2.2), up: to(0.55, 0.65), look: to(0.65, 0.75), fov: to(48, 42), roll: to(2, -2), body: true, sway: 0.3 }),
    ], [
      { at: 0.1, fade: 'green', over: 0.3, caption: 'The lake of Ib has gone perfectly still.', hold: 2.8, set: 'gurgle', gain: 0.5, pitch: 0.6 },
      { at: 0.4, fade: 'clear', over: 1.8, burst: { kind: 'brine', on: 'target', count: 34 } },
      { at: 1.9, set: 'croak', gain: 0.7, pitch: 0.4, sound: 'splash', burst: { kind: 'spores', on: 'target', count: 24 } },
      { at: 3.3, caption: 'Something very old is coming up through the green.', hold: 2.6, set: 'whale', gain: 0.6, pitch: 0.55, shake: 0.12 },
      named(5.7, name, epithet),
    ]),

  // The cloud on Hatheg-Kla is dancing; no god of earth dances to that pipe.
  other_gods: (name, epithet) =>
    scene('other_gods', [
      behind(3.2, to(170, 174), to(3.4, 4), to(1.2, 2), to(0.5, 0.8), to(64, 70), { sway: 0.6 }),
      shot({ dur: 2.8, yaw: to(30, 12), dist: to(1.8, 1.4), up: to(0.5, 0.7), look: to(0.7, 0.8), fov: to(54, 46), roll: to(-3, 3), body: true, sway: 0.5 }),
      shot({ dur: 2.4, yaw: to(-40, -18), dist: to(2.4, 1.9), up: to(0.2, 0.5), look: to(0.5, 0.7), fov: to(58, 50), roll: to(3, -2), body: true, sway: 0.5 }),
    ], [
      { at: 0.1, fade: 'violet', over: 0.4, set: 'chant', gain: 0.5, pitch: 0.5, caption: 'The cloud on Hatheg-Kla is dancing.', hold: 2.6 },
      { at: 0.5, fade: 'clear', over: 1.8, burst: { kind: 'stars', on: 'target', count: 36 } },
      { at: 1.8, set: 'thunder', gain: 0.6, pitch: 0.6, sound: 'sight', shake: 0.15, burst: { kind: 'runes', on: 'target', count: 16 } },
      { at: 3.4, caption: 'Pipes, very far off, and out of time.', hold: 2.4, set: 'choral', gain: 0.5, pitch: 0.6 },
      named(5.7, name, epithet),
    ]),

  // The carved faces of Kadath turn, and dawn comes up the onyx the wrong way.
  great_ones: (name, epithet) =>
    scene('great_ones', [
      shot({ dur: 3.2, yaw: to(30, 14), dist: to(1.4, 1.7), up: to(0.02, 0.3), look: to(0.2, 0.85), fov: to(66, 56), body: true, sway: 0.1, ease: 'glide' }),
      behind(2.8, to(172, 176), to(3.2, 4.2), to(1.3, 2), to(0.5, 0.8), to(60, 66), { sway: 0.2 }),
      shot({ dur: 2.4, yaw: to(-30, -12), dist: to(2, 1.7), up: to(0.5, 0.7), look: to(0.75, 0.85), fov: to(50, 42), body: true, sway: 0.15 }),
    ], [
      { at: 0.1, fade: 'gold', over: 0.5, set: 'choral', gain: 0.6, pitch: 0.6 },
      { at: 0.6, fade: 'clear', over: 2, set: 'bell', gain: 0.5, pitch: 0.5, burst: { kind: 'motes', on: 'target', count: 32 } },
      { at: 3.2, sound: 'sight', gain: 0.5, shake: 0.12 },
      named(5.7, name, epithet),
    ]),

  // A long slow blink: the lids come down over the picture, and the sleepers open their eyes about him.
  hypnos: (name, epithet) =>
    scene('hypnos', [
      behind(3.2, to(166, 172), to(3.4, 2.8), to(2.2, 2.4), to(0.5, 0.8), to(58, 50), { sway: 0.2, ease: 'glide' }),
      shot({ dur: 2.8, yaw: to(16, 4), dist: to(2.2, 1.6), up: to(0.78, 0.84), look: to(0.84, 0.9), fov: to(42, 34), roll: to(-2, 2), body: true, sway: 0.1, ease: 'glide' }),
      shot({ dur: 2.4, yaw: to(-34, -16), dist: to(2.6, 2), up: to(0.3, 0.5), look: to(0.55, 0.7), fov: to(54, 46), body: true, sway: 0.2 }),
    ], [
      { at: 0.2, fade: 'black', over: 1.3, set: 'whisper', gain: 0.5, pitch: 0.55 },
      { at: 1.6, fade: 'clear', over: 1.6, set: 'bell', gain: 0.5, pitch: 0.45, burst: { kind: 'eyes', on: 'target', count: 18 } },
      { at: 3.6, burst: { kind: 'motes', on: 'target', count: 14 } },
      named(5.7, name, epithet),
    ]),

  // A borrowed body, and what looks out of it: the picture flickers between a man and the shape of Yaddith.
  zkauba: (name, epithet) =>
    scene('zkauba', [
      behind(2.8, to(166, 172), to(3.4, 2.8), to(2.2, 2.4), to(0.6, 0.85), to(58, 50), { sway: 0.3 }),
      shot({ dur: 2.8, yaw: to(-20, -8), dist: to(2.2, 1.7), up: to(0.7, 0.76), look: to(0.8, 0.86), fov: to(44, 36), roll: to(2, -3), body: true, sway: 0.25 }),
      shot({ dur: 2.6, yaw: to(36, 16), dist: to(2.4, 1.9), up: to(0.3, 0.5), look: to(0.6, 0.75), fov: to(54, 46), body: true, sway: 0.4 }),
    ], [
      { at: 1.4, fade: 'white', over: 0.1, sound: 'teleport', gain: 0.6 },
      { at: 1.6, fade: 'clear', over: 0.3, burst: { kind: 'runes', on: 'target', count: 18 } },
      { at: 3.4, fade: 'white', over: 0.1, sound: 'teleport', gain: 0.6, set: 'wail', pitch: 0.7 },
      { at: 3.65, fade: 'clear', over: 0.6, burst: { kind: 'stars', on: 'target', count: 20 } },
      named(5.5, name, epithet),
    ]),

  // Thin, monotonous piping from nowhere, and then the notes themselves, turning about the dance.
  daemon_pipers: (name, epithet) =>
    scene('daemon_pipers', [
      behind(3, to(166, 172), to(3.8, 3), to(2.2, 2.4), to(0.3, 0.6), to(64, 54), { roll: to(-6, 6), sway: 0.5 }),
      shot({ dur: 2.8, yaw: to(60, 100), dist: to(2.4, 2), up: to(0.4, 0.6), look: to(0.55, 0.7), fov: to(56, 48), roll: to(4, -4), body: true, sway: 0.4 }),
      shot({ dur: 2.6, yaw: to(-70, -30), dist: to(2.8, 2.2), up: to(0.5, 0.65), look: to(0.6, 0.72), fov: to(50, 44), roll: to(-4, 4), body: true, sway: 0.4 }),
    ], [
      { at: 0.1, set: 'wail', gain: 0.5, pitch: 1.7, caption: 'Thin, monotonous piping, from nowhere.', hold: 2.6 },
      { at: 1, fade: 'violet', over: 0.15, set: 'chant', gain: 0.4, pitch: 1.2, burst: { kind: 'notes', on: 'target', count: 30 } },
      { at: 1.2, fade: 'clear', over: 0.7 },
      { at: 3.2, caption: 'The dance has not stopped. It is not going to.', hold: 2.6, set: 'wail', gain: 0.5, pitch: 1.9, shake: 0.1, burst: { kind: 'notes', on: 'target', count: 24 } },
      named(5.7, name, epithet),
    ]),

  // The Gate stands open and nothing comes through it; what waits on the far side has always been waiting.
  ancient_ones: (name, epithet) =>
    scene('ancient_ones', [
      behind(3.4, to(176, 172), to(3.6, 4), to(0.9, 1.8), to(0.5, 0.8), to(64, 70), { sway: 0.1, ease: 'glide' }),
      shot({ dur: 2.8, yaw: to(24, 10), dist: to(1.6, 1.3), up: to(0.5, 0.7), look: to(0.75, 0.85), fov: to(48, 40), body: true, sway: 0.1, ease: 'glide' }),
      shot({ dur: 2.4, yaw: to(-30, -14), dist: to(2.2, 1.8), up: to(0.3, 0.5), look: to(0.6, 0.75), fov: to(54, 48), body: true, sway: 0.15 }),
    ], [
      { at: 0.1, fade: 'white', over: 0.6, set: 'choral', gain: 0.6, pitch: 0.5, caption: 'The Gate stands open, and nothing comes through it.', hold: 2.8 },
      { at: 0.7, fade: 'clear', over: 2.2, set: 'bell', gain: 0.5, pitch: 0.5, burst: { kind: 'stars', on: 'target', count: 40 } },
      { at: 3.6, caption: 'What waits on the far side has always waited.', hold: 2.6, sound: 'revealed', gain: 0.5, shake: 0.08 },
      named(5.9, name, epithet),
    ]),
};
