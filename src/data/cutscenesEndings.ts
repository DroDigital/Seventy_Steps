/**
 * The three endings' cutscenes (round 55; they had been nine seconds of a caption or two): each is some forty seconds under the Archivist's voice, the same who
 * read the opening's notebook (data/endingNarration.ts: three lines, recorded in his voice). The camera is cut to the words, a shot to a thought, and the beats
 * are laid on the places in each line where something happens in it; the times are the recordings' (`seconds` there), so a line that is made again has its scene
 * checked against it (tests/endingNarration.test.ts). Each ends on black (`shut`): the card comes up out of it (ui/endingCard.ts).
 * - seal (at the Court's Elder Sign): out of the dark, the quiet after the piping; the key let go; the Gate; a clock striking, and the light.
 * - silver_key (the Guide is the camera's other party): behind the investigator, round the Guide, away from the arena, through the Gate.
 * - herald (at the Court's Elder Sign): embers and red; the tall man waited; the knee bends; the flutes begin; and the dark comes in.
 * Data only; render/cinemaPlan.ts reads it.
 */

import type { EndingId } from './endings';
import { ENDING_NARRATION } from './endingNarration';
import { NARRATOR } from './intro';
import { shown } from './speech';
import { shot, to, type Beat, type Scene } from './cutscenes';

const FADE_OUT = 0.5; // seconds before a line is done that its words begin to go

/** An ending's narrated lines laid over its scene: each begins at `starts[i]` seconds in; its words low on the screen, its recording said, held as long as it runs. */
function narrate(id: EndingId, starts: readonly number[]): Beat[] {
  return ENDING_NARRATION[id].map((line, i): Beat => {
    const text = shown(line.say);
    return { at: starts[i]!, caption: text, hold: Math.max(1.2, line.seconds - FADE_OUT), voice: { by: NARRATOR, text } };
  });
}

/** Where each ending's lines begin, in seconds into its scene. */
export const NARRATION_AT: Readonly<Record<EndingId, readonly number[]>> = {
  seal: [1.8, 13.4, 28],
  silver_key: [1.6, 12.2, 24],
  herald: [2, 12, 21],
};

export const ENDING_SCENES: Readonly<Record<string, Scene>> = {
  seal: {
    id: 'ending:seal',
    sim: 'frozen',
    shut: true,
    dark: true,
    blend: [0.8, 0],
    shots: [
      // from behind the investigator, the Court wide before them and the sign glowing in it: drawn nearer under "the piping has stopped"
      shot({ dur: 6.4, on: 'player', yaw: to(185, 178), dist: to(8, 5.5), up: to(2.6, 2.1), look: to(0.9, 0.85), fov: to(60, 54), ease: 'glide', sway: 0.25 }),
      // the face, lit by the lantern, as they ask for nothing
      shot({ dur: 6.6, on: 'player', yaw: to(48, 14), dist: to(3.2, 2.5), up: to(1.7, 1.55), look: to(0.9, 0.86), fov: to(46, 40), roll: to(1.5, 0), ease: 'glide', sway: 0.35 }),
      // closer, as the hand closes on the key
      shot({ dur: 8.2, on: 'player', yaw: to(14, -12), dist: to(2.5, 1.95), up: to(1.55, 1.5), look: to(0.86, 0.84), fov: to(40, 34), roll: to(0, -2), ease: 'glide', sway: 0.25 }),
      // it lets go: cut to behind them, and the camera rises from them, the ash coming up
      shot({ dur: 7.2, on: 'player', yaw: to(180, 196), dist: to(3, 12), up: to(1.8, 7), look: to(0.9, 0.45), fov: to(46, 62), ease: 'inout', sway: 0.2 }),
      // down and in again toward the sign as a clock strikes and the sleepers breathe: the first shot's place, and the Court as it was, but for the light
      shot({ dur: 8.4, on: 'player', yaw: to(196, 184), dist: to(12, 5), up: to(7, 1.6), look: to(0.45, 0.85), fov: to(62, 52), ease: 'glide', sway: 0.2 }),
      // and the sky tilts up toward the morning
      shot({ dur: 6.4, on: 'player', yaw: to(184, 184), dist: to(5, 5), up: to(1.6, 1.6), look: to(0.85, 6), fov: to(52, 70), ease: 'in', sway: 0.1 }),
    ],
    beats: [
      { at: 0.4, fade: 'clear', over: 3.2 },
      ...narrate('seal', NARRATION_AT.seal),
      { at: 16.6, burst: { kind: 'motes', on: 'player', count: 12 } }, // "you close your hand around the key": a glint of it
      { at: 21.2, burst: { kind: 'ash', on: 'player', count: 40 }, sound: 'release', gain: 0.8 }, // "it lets go of the Gate"
      { at: 24.1, fade: 'white', over: 0.1, shake: 0.14, hold: 1.6, set: 'boom', gain: 0.55, pitch: 0.55 }, // "and the Gate lets go of you": it is shut
      { at: 24.25, fade: 'clear', over: 1.5 },
      { at: 28.6, burst: { kind: 'motes', on: 'sign', count: 30 } },
      { at: 29.2, set: 'bell', gain: 0.5, pitch: 0.7 }, // the clock, slow
      { at: 31.8, set: 'bell', gain: 0.45, pitch: 0.7 },
      { at: 34.4, set: 'bell', gain: 0.4, pitch: 0.7, burst: { kind: 'motes', on: 'sign', count: 24 } },
      { at: 34.6, set: 'whisper', gain: 0.3, pitch: 0.9 }, // "sleepers... breathing"
      { at: 36.8, fade: 'white', over: 3.6 }, // "wake"
      { at: 42.4, fade: 'black', over: 0.8 },
    ],
  },
  silver_key: {
    id: 'ending:silver_key',
    sim: 'frozen',
    shut: true,
    blend: [0.8, 0],
    shots: [
      // behind the investigator, the Guide before them, who does not look back
      shot({ dur: 6, on: 'player', aim: 'other', yaw: to(180, 172), dist: to(3, 3.9), up: to(1.75, 1.9), look: to(0.75, 0.75), fov: to(56, 61), sway: 0.5 }),
      // round the Guide, from the face to the back it turns on them
      shot({ dur: 6, on: 'target', yaw: to(20, 160), dist: to(2.2, 3), up: to(0.6, 0.9), look: to(0.8, 0.85), fov: to(48, 56), body: true, ease: 'glide', sway: 0.3 }),
      // up and away, the arena small beneath, the stars coming
      shot({ dur: 10.4, on: 'player', yaw: to(175, 200), dist: to(4, 11), up: to(1.8, 6), look: to(0.8, 0.55), fov: to(56, 74), ease: 'inout', sway: 0.2 }),
      // into the Gate: the lens drawn out and turned
      shot({ dur: 7.6, on: 'player', yaw: to(176, 180), dist: to(2.4, 0.8), up: to(1.7, 1.6), look: to(0.78, 0.67), fov: to(84, 118), roll: to(0, 14), ease: 'in' }),
      // through, and the light
      shot({ dur: 8.4, on: 'player', yaw: to(180, 180), dist: to(0.8, 0.5), up: to(1.6, 1.6), look: to(0.67, 0.67), fov: to(118, 122), roll: to(14, 22), ease: 'in' }),
    ],
    beats: [
      { at: 0, fade: 'violet', over: 0.01, sound: 'teleport', gain: 0.9 },
      { at: 0.1, fade: 'clear', over: 1.8, burst: { kind: 'stars', on: 'player', count: 40 } },
      ...narrate('silver_key', NARRATION_AT.silver_key),
      { at: 9, set: 'choral', gain: 0.55 },
      { at: 15, burst: { kind: 'stars', on: 'player', count: 50 } }, // "the place where the dream runs out of road"
      { at: 19.2, burst: { kind: 'stars', on: 'player', count: 60 }, sound: 'rise', gain: 0.9 }, // "wider than any stair"
      { at: 24, fade: 'violet', over: 0.15, sound: 'teleport', gain: 0.7 }, // "you leave the town behind": the Gate takes them, in a pulse and not a veil (a tint fades to full, and would hide the whole passage)
      { at: 24.2, fade: 'clear', over: 1.6, burst: { kind: 'stars', on: 'player', count: 60 } },
      { at: 27.5, burst: { kind: 'stars', on: 'player', count: 80 } },
      { at: 29.5, set: 'choral', gain: 0.5, pitch: 0.85 },
      { at: 33.4, fade: 'white', over: 2.4, sound: 'levelUp', gain: 0.6 },
      { at: 37.6, fade: 'black', over: 0.8 },
    ],
  },
  herald: {
    id: 'ending:herald',
    sim: 'frozen',
    shut: true,
    blend: [0.8, 0],
    shots: [
      // low behind the investigator, looking up the length of the way to the sign, the embers rising from it
      shot({ dur: 6.6, on: 'player', yaw: to(185, 178), dist: to(6, 4.2), up: to(0.9, 1.2), look: to(0.95, 1.1), fov: to(58, 54), ease: 'glide', sway: 0.3 }),
      // the face, waiting
      shot({ dur: 5.4, on: 'player', yaw: to(30, 12), dist: to(2.6, 2.1), up: to(1.5, 1.5), look: to(0.88, 0.88), fov: to(42, 38), roll: to(2, -1), sway: 0.3 }),
      // the lens goes down with the knee
      shot({ dur: 7.5, on: 'player', yaw: to(14, -18), dist: to(2.1, 2.7), up: to(1.5, 0.75), look: to(0.88, 0.55), fov: to(40, 36), ease: 'glide', sway: 0.3 }),
      // from behind the bowed figure, up at the sign
      shot({ dur: 7, on: 'sign', aim: 'sign', yaw: to(8, 14), dist: to(6.8, 7.6), up: to(1, 1.3), look: to(0.55, 1.3), fov: to(52, 62), ease: 'glide', sway: 0.2 }),
      // away and up, the red coming in
      shot({ dur: 10.9, on: 'player', yaw: to(185, 200), dist: to(4, 14), up: to(1.2, 8), look: to(0.9, 0.3), fov: to(54, 70), ease: 'inout', sway: 0.15 }),
    ],
    beats: [
      { at: 0, fade: 'red', over: 0.01, sound: 'darkness', gain: 0.9 },
      { at: 0.1, fade: 'clear', over: 3, burst: { kind: 'embers', on: 'sign', count: 26 } },
      ...narrate('herald', NARRATION_AT.herald),
      { at: 6.5, set: 'whisper', gain: 0.7, pitch: 0.8 },
      { at: 16, kneel: true }, // "and the knee bends"
      { at: 18.6, burst: { kind: 'embers', on: 'sign', count: 40 }, set: 'laugh', gain: 0.5, pitch: 0.6, shake: 0.06 },
      { at: 22.5, set: 'choral', gain: 0.3, pitch: 0.6 }, // the flutes, far off
      { at: 30, fade: 'red', over: 3 },
      { at: 36.6, fade: 'black', over: 0.8 },
    ],
  },
};
