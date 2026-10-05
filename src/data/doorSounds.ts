/**
 * How a door sounds as it moves (round 40: every door, of every kit, played one thud as it began to open, whatever its
 * weight, at no place, for as long as the sample ran, and none as it closed). A door's sound is made for the swing it
 * sounds with, so it lasts as long as the swing does: the unlatching as the leaf begins to move, the movement itself
 * (a creak, a squeal, a grinding, a wet drawing, a rustle) following the leaf's speed, which eases in and out, and the
 * stop as it comes to rest, or to its latch when it shuts. By the door's material (from its look), and by whether it
 * opens or closes (a door closing is let go of and heavier at its end). Each play draws its own pitch, its own creak and
 * its own beats from `rand`, so no two doors, and no door twice, sound the same. Pure data: render/doorViews.ts plays it.
 */

import type { DoorLook } from './doors';
import { noise, tone, type Layer, type Sound } from './sounds';
import type { SampleSetId } from './samples';

export type DoorMaterial = 'oak' | 'lacquer' | 'bronze' | 'iron' | 'timber' | 'stone' | 'grind' | 'flesh' | 'cloth';

/** What a door is made of, to the ear (render/doorShapes.ts draws the same look). */
export function materialOf(look: DoorLook): DoorMaterial {
  switch (look.kind) {
    case 'grille':
      return look.tone[0] > look.tone[2] + 0.05 ? 'timber' : 'iron'; // a timber-and-strap gate, or rusted bars
    case 'slab':
      return look.slide ? 'grind' : 'stone';
    case 'membrane':
      return 'flesh';
    case 'curtain':
      return 'cloth';
    default:
      return look.tone[0] > 0.8 ? 'lacquer' : look.glow ? 'bronze' : 'oak'; // white-lacquered and gilt, bronze with its green serpent, or oak
  }
}

/** A recording laid under a door's sound at `at` seconds, as loud as `gain` (of its set's own level), its pitch drawn about `pitch`. */
export interface Under {
  set: SampleSetId;
  at: number;
  gain: number;
  pitch: number;
}

export interface DoorSound {
  sound: Sound;
  under: Under[];
  /** Seconds the sound sounds on after the swing's end (a ring, a settling). */
  tail: number;
}

/**
 * How loud each material's door is played (the recipes are made at one scale; a slab of stone is the heaviest thing in a
 * room, a drape the lightest): measured, tests/soundMix.test.ts keeps each in its window. The recordings laid under share it.
 */
export const DOOR_GAIN: Readonly<Record<DoorMaterial, number>> = { oak: 1.9, lacquer: 1.9, bronze: 1.9, iron: 2.2, timber: 2, stone: 0.47, grind: 0.47, flesh: 1.25, cloth: 2 };

const between = (rand: () => number, lo: number, hi: number): number => lo + (hi - lo) * rand();

/**
 * The leaf's speed over the swing, 0 to 1: it eases in and out (render/doorViews.ts moves `open` linearly: the ear
 * hears a door that starts and stops, so the creak swells and sinks over the swing's middle).
 */
const speedAt = (u: number): number => Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 1.4;

/** A creak: a few short voices of a hinge or a board, each a glide drawn at random, shaped by the swing: louder where the leaf is quicker. `n` steps of the swing. */
function creak(rand: () => number, seconds: number, o: { hz: [number, number]; gain: number; wave: 'sawtooth' | 'square' | 'triangle'; q: number; from?: number; to?: number }): Layer[] {
  const [from, to] = [o.from ?? 0.06, o.to ?? 0.94];
  const n = Math.max(2, Math.round(seconds * 3.2));
  const out: Layer[] = [];
  for (let k = 0; k < n; k++) {
    const u = from + ((k + rand() * 0.7) / n) * (to - from);
    const dur = Math.min(seconds * 0.4, between(rand, 0.09, 0.3) * (0.6 + seconds * 0.4));
    const hz = between(rand, o.hz[0], o.hz[1]);
    const glide = hz * between(rand, 0.74, 1.3);
    out.push(
      tone(o.wave, hz, dur, o.gain * speedAt(u) * between(rand, 0.55, 1), {
        at: u * seconds,
        to: glide,
        attack: dur * 0.3,
        vibrato: [between(rand, 14, 38), between(rand, 20, 70)],
        filter: { type: 'bandpass', hz: hz * between(rand, 2.2, 3.6), q: o.q },
      }),
    );
  }
  return out;
}

/** The sound of `look` opening or closing over `seconds`: the swing's own. */
export function doorSound(look: DoorLook, seconds: number, closing: boolean, rand: () => number): DoorSound {
  const m = materialOf(look);
  const p = between(rand, 0.93, 1.07); // this door, this time
  const end = seconds; // the stop lands as the swing ends
  const hard = closing ? 1 : 0.62; // a door let go of strikes harder than one that is let swing to
  const under: Under[] = [];
  let sound: Layer[] = [];
  let tail = 0.5;
  const move = (hz: number, gain: number, wave: 'sawtooth' | 'square' | 'triangle', q: number): Layer[] => creak(rand, seconds, { hz: [hz * 0.8 * p, hz * 1.3 * p], gain, wave, q });
  switch (m) {
    case 'oak':
    case 'lacquer':
    case 'bronze': {
      const [low, body] = m === 'oak' ? [190, 0.05] : m === 'lacquer' ? [330, 0.03] : [250, 0.04]; // a light door's hinge sings higher; oak is dark
      sound = [
        ...(closing ? [] : [noise('bandpass', 1500 * p, 0.04, 0.16, { q: 4 }), noise('bandpass', 2300 * p, 0.03, 0.12, { at: 0.035, q: 5 }), tone('triangle', 900 * p, 0.05, 0.03, { at: 0.02, to: 600 * p })]), // the latch lifted: a click, a clack
        ...move(low, body, 'sawtooth', 5),
        noise('bandpass', 520 * p, seconds * 0.85, 0.05, { at: seconds * 0.08, attack: seconds * 0.35, to: 380 * p, q: 1.3 }), // the boards' breath: a leaf pushing the air
        tone('sine', 62 * p, 0.3, 0.2 * hard, { at: end - 0.04, to: 44 * p, attack: 0.012 }), // the stop: a knock in the frame...
        noise('lowpass', 700 * p, 0.12, 0.2 * hard, { at: end - 0.03 }), // ...the wood against the wood...
        ...(closing ? [noise('bandpass', 1900 * p, 0.03, 0.2, { at: end + 0.05, q: 5 }), tone('triangle', 1100 * p, 0.06, 0.04, { at: end + 0.06, to: 800 * p })] : []), // ...and the latch drops
      ];
      under.push({ set: 'thud', at: end - 0.05, gain: closing ? 0.55 : 0.3, pitch: (m === 'oak' ? 0.95 : 1.15) * p });
      tail = 0.4;
      break;
    }
    case 'iron':
    case 'timber': {
      const iron = m === 'iron';
      sound = [
        noise('bandpass', iron ? 2600 : 1800, 0.05, 0.2, { q: 6 }), // the bolt drawn
        ...(iron ? [tone('sine', 1540 * p, 0.5, 0.025, { at: 0.04, to: 1500 * p }), tone('sine', 2300 * p, 0.35, 0.015, { at: 0.04 })] : []), // iron rings
        ...move(iron ? 620 : 300, iron ? 0.04 : 0.05, iron ? 'square' : 'sawtooth', iron ? 9 : 6), // a squeal, or a groan
        noise('bandpass', iron ? 3300 : 1400, seconds * 0.7, iron ? 0.03 : 0.04, { at: seconds * 0.1, attack: seconds * 0.3, q: 2 }), // rust grinding in the hinge
        noise('bandpass', 900 * p, 0.14, 0.3 * hard, { at: end - 0.03, q: 1.1 }), // the bars meeting the stop
        ...(iron ? [tone('sine', 400 * p, 0.7 * hard + 0.2, 0.06 * hard, { at: end - 0.03, to: 395 * p }), tone('sine', 997 * p, 0.5, 0.03 * hard, { at: end - 0.03 }), tone('sine', 1480 * p, 0.4, 0.02 * hard, { at: end - 0.03 })] : []), // the gate rings
        tone('sine', 70 * p, 0.25, 0.14 * hard, { at: end - 0.03, to: 48 * p }),
      ];
      under.push({ set: iron ? 'clang' : 'thud', at: end - 0.04, gain: iron ? (closing ? 0.5 : 0.22) : closing ? 0.45 : 0.25, pitch: (iron ? 0.8 : 1) * p });
      tail = iron ? 0.8 : 0.4;
      break;
    }
    case 'stone':
    case 'grind': {
      const heavy = seconds / 1.5; // a slab as long in the swing as it is heavy
      sound = [
        noise('lowpass', 520, 0.18, 0.2, { q: 2 }), // the seal broken: dust and a crack
        noise('bandpass', 2600 * p, 0.04, 0.12, { at: 0.02, q: 3 }),
        noise('bandpass', m === 'grind' ? 640 * p : 380 * p, seconds * 0.95, 0.2 * speedAt(0.5) + 0.06, { at: 0.04, attack: seconds * 0.4, to: m === 'grind' ? 360 * p : 250 * p, q: 1.6 }), // stone drawn over stone: its grain follows the speed
        noise('highpass', 3500, seconds * 0.6, 0.025, { at: seconds * 0.15, attack: seconds * 0.3 }), // grit
        tone('sine', 41 * p, seconds * 0.95, 0.28, { at: 0.05, attack: seconds * 0.45, to: 33 * p }), // the weight, felt
        tone('sawtooth', 58 * p, seconds * 0.8, 0.05, { at: 0.1, attack: seconds * 0.4, to: 50 * p, vibrato: [7, 25], filter: { type: 'lowpass', hz: 220 } }), // and the shudder of it
        tone('sine', 52 * p, 0.7 * heavy + 0.2, 0.55 * hard, { at: end - 0.03, to: 28 * p, attack: 0.01 }), // the stop: a blow into the floor...
        noise('lowpass', 400 * p, 0.5 * heavy + 0.15, 0.4 * hard, { at: end - 0.03, to: 90 }), // ...dust shaken from the lintel...
        noise('bandpass', 1500 * p, 0.05, 0.14 * hard, { at: end - 0.02, q: 2 }), // ...a grain of stone skipping
      ];
      under.push({ set: 'boom', at: end - 0.04, gain: closing ? 0.18 : 0.08, pitch: 0.8 * p });
      tail = 0.9 * heavy + 0.3;
      break;
    }
    case 'flesh': {
      sound = [
        noise('bandpass', 700 * p, 0.06, 0.28, { q: 3 }), // the lips of it parted: a wet pop
        tone('sine', 190 * p, 0.12, 0.1, { to: 110 * p, attack: 0.01 }),
        noise('bandpass', 380 * p, seconds * 0.9, 0.16, { at: 0.03, attack: seconds * 0.3, to: 700 * p, q: 3.5, }), // a wet drawing
        ...Array.from({ length: Math.max(3, Math.round(seconds * 6)) }, (_, k) => {
          const u = 0.1 + (k + rand()) / Math.max(3, Math.round(seconds * 6)) * 0.8;
          return noise('bandpass', between(rand, 260, 620) * p, between(rand, 0.05, 0.12), 0.2 * speedAt(u), { at: u * seconds, q: between(rand, 4, 8), to: between(rand, 200, 900) });
        }), // squelches, thicker where it draws quicker
        tone('sine', 64 * p, seconds * 0.9, 0.1, { attack: seconds * 0.4, to: 48 * p, vibrato: [4, 40] }), // a pulse in it
        noise('lowpass', 420 * p, 0.2, 0.3 * hard, { at: end - 0.03, to: 130 }), // the slap as it meets
        tone('sine', 78 * p, 0.2, 0.2 * hard, { at: end - 0.03, to: 50 }),
      ];
      under.push({ set: 'flesh', at: end - 0.05, gain: closing ? 0.28 : 0.16, pitch: 0.75 * p });
      tail = 0.35;
      break;
    }
    case 'cloth': {
      sound = [
        noise('bandpass', 1800 * p, seconds * 0.9, 0.11, { at: 0.02, attack: seconds * 0.25, to: 1100 * p, q: 0.9 }), // a drape drawn on its rings
        ...Array.from({ length: Math.max(3, Math.round(seconds * 9)) }, () => noise('bandpass', between(rand, 2800, 5200) * p, between(rand, 0.02, 0.05), 0.07, { at: between(rand, 0.05, seconds * 0.95), q: 5 })), // the rings along their rod
        noise('lowpass', 600 * p, 0.25, 0.07 * hard, { at: end - 0.1, attack: 0.1 }), // the folds falling still
      ];
      tail = 0.3;
      break;
    }
  }
  return { sound, under, tail };
}
