/**
 * The failing mind heard (round 78, atmosphere): the numbers and the recipes of what a mind that is going hears that nobody else does.
 * A thin ringing that comes in with the stress, and rings a moment after a heavy blow (render/audio/mindEars.ts); the world's high end
 * breathing in and out, Unmoored (audio/mindTide.ts); the lantern spitting, dying with a hiss and catching with a whump (mindEars.ts); and
 * something that walks behind, a half-stride off, and takes one step more when the investigator stops (audio/follower.ts). Round 5
 * (sound that grew louder with madness was disliked) and round 60 (a sound repeated was "annoying over time") are the precedents, so
 * every one of these is hard-capped, rare, drawn anew each time and silent in a fight, a cutscene and a menu. All of them follow
 * `fx.stress` (so the Accessibility cap that scales every sanity effect scales them), never a louder world: none is as loud as a whisper.
 * Presentation only: nothing here is read by the simulation.
 */

import type { SampleSetId } from './samples';
import { noise, tone, type Sound } from './sounds';

const db = (v: number): number => 10 ** (v / 20);

export const MIND_EARS = Object.freeze({
  /** The ringing: two sines a few Hz apart (a throb) from `from` of the stress, creeping in to `ceiling` (peak, as a share of full scale), and a ring after a blow. */
  ring: {
    from: 0.3, // stress: sanity 70, the Uneasy line
    ceiling: db(-46), // the most it is, at the end of madness (a whisper's take peaks twenty dB over it)
    hz: 4150,
    beat: 3, // Hz: the second sine is this far above
    mix: [0.67, 0.33] as readonly [number, number], // the two sines' shares of it (they sum to one: it never passes the ceiling)
    rise: 3, // seconds it takes to creep in, ...
    fall: 0.5, // ...and to leave (a menu, a cutscene)
    /** A blow taken, by its share of the investigator's greatest health, rings the ears: `add` more than the ceiling, dying away over `decay` seconds, never more than once in `gap`. */
    struck: { from: 0.06, full: 0.3, add: db(-42), attack: 0.03, decay: 1.5, gap: 4 },
  },
  /** The tide: Unmoored, the world's high end (the muffle's low-pass, engine.ts) closes by up to `depth` of its range and opens again, at `rate` radians a second. */
  tide: { from: 0.85, full: 0.97, depth: 0.28, rate: 0.9 },
  /** The lantern at the hip: the flame's dips counted as the picture draws them (render/lanternLife.ts), and where it is heard. */
  lantern: { high: 0.6, low: 0.3, out: 0.01, catches: 0.35, pan: -0.4, spit: 0.45, died: 0.5, kindled: 0.18 },
  /** Something that walks behind (audio/follower.ts), Fractured on: an episode every `every` seconds (at the line, and at the end of madness; drawn 0.6 to 1.4 times over). */
  tread: {
    from: 0.6, // stress: the whispers' line, sanity 40
    every: [110, 50] as readonly [number, number],
    steps: [6, 14] as readonly [number, number], // footfalls it shadows
    gain: [0.28, 0.4] as readonly [number, number], // by the stress; the set's own level beneath (the investigator's own steps are 0.55 to 1)
    pitch: [0.82, 0.9] as readonly [number, number], // heavier
    lowpass: 1100, // duller
    pan: 0.25, // alternately to either side
    delay: [0.45, 0.55] as readonly [number, number], // the share of the investigator's own stride it is behind
    stop: 0.45, // seconds without a footfall of the investigator's (or this many times the last stride's own, if that is longer: a walk's are half a second apart) that end it...
    stopBy: 1.6,
    last: { wait: [0.4, 0.7] as readonly [number, number], gain: 0.45, lowpass: 2600, pitch: 0.8 }, // ...and the one step more, nearer, a moment after
    /** Stood still, the same moment instead: `steps` slow steps from behind the listener, closing from `from` to `to` metres, `gap` seconds apart, the first after `lead`. */
    approach: { still: 1.5, steps: [4, 7] as readonly [number, number], from: 6, to: 3.5, gap: [0.6, 0.75] as readonly [number, number], lead: 1.2, gain: [0.12, 0.3] as readonly [number, number], lowpass: [1400, 2400] as readonly [number, number], turned: Math.cos(0.87), breath: 0.5 },
    gap: 40, // seconds at the least between one episode and the next
  },
});

/** What is heard of the step on each of the ground's kinds (foley.ts's own sets). */
export const TREAD_SETS: Readonly<Record<'water' | 'stone' | 'road' | 'dirt', SampleSetId>> = { water: 'stepWater', stone: 'stepStone', road: 'stepRoad', dirt: 'stepDirt' };

export const MIND_SOUNDS = Object.freeze({
  /** The flame spits: a pop, and a short hiss it leaves. */
  lanternSpit: [noise('bandpass', 1900, 0.035, 0.55, { q: 1.4 }), noise('highpass', 3200, 0.14, 0.2, { at: 0.015, attack: 0.008 }), tone('triangle', 410, 0.03, 0.06, { to: 220, at: 0.005 })] as Sound,
  /** It dies: the last spit, and a hiss that falls as the flame goes, with a breath of the oil. */
  lanternOut: [noise('bandpass', 1700, 0.04, 0.5, { q: 1.4 }), noise('bandpass', 3400, 0.9, 0.22, { to: 1000, q: 1.1, at: 0.02, attack: 0.03 }), noise('lowpass', 500, 0.5, 0.1, { to: 120, at: 0.05 })] as Sound,
  /** It catches: a soft whump of the gas taking, and a hiss that rises as the flame climbs. */
  lanternKindle: [tone('sine', 82, 0.4, 0.4, { to: 42, attack: 0.02 }), tone('triangle', 164, 0.3, 0.22, { to: 84, attack: 0.02 }), noise('lowpass', 420, 0.35, 0.34, { to: 140, attack: 0.015 }), noise('bandpass', 800, 0.9, 0.14, { to: 3000, q: 1.2, at: 0.1, attack: 0.4 })] as Sound,
  /** A breath at the ear, once, where the steps stopped: nobody is there. */
  breath: [noise('bandpass', 850, 0.8, 0.12, { to: 520, q: 1.6, attack: 0.3 }), noise('bandpass', 2400, 0.6, 0.03, { at: 0.1, q: 2, attack: 0.25 })] as Sound,
});
