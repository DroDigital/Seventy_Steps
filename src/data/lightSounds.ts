/**
 * Round 78, atmosphere: the small noise of the world's lights (numbers only; render/audio/hearth.ts plays them, hearthTexture.ts
 * draws them, hearthPlan.ts says which are heard and how). A flame's little noise is what makes the silence about it audible, and
 * its stopping is the horror: the torches of the dungeons were mute, the fires too. A torch spits and pops at the investigator's
 * side and swells with its flicker; a brazier crackles broader and deeper; a street lamp hisses thinly; a lit Elder Sign carries a
 * soft shimmering hum, two pairs of tones beating against each other. A light the eye cannot see (lightSight.ts) is heard dulled,
 * not cut. As the mind fails the flames gutter, and the crackle drops out with them. Quiet by design: about -40 dBFS at two
 * metres (SOUND.md's rounds 60 and 61: a sound that is annoying over time is cut).
 */

import type { LightKind } from './tuning';

export type HearthKind = Exclude<LightKind, 'window'>;

export interface HearthSound {
  range: number; // metres it is heard from (no more than 1.6 x the light's own range, data/playTuning.ts LIGHTS)
  gain: number; // its level at two metres, against the bed bus
  cutoff: number; // Hz: its top, in plain sight
}

/** A flame's noise, drawn as a loop that closes (render/audio/hearthTexture.ts). */
export interface FlameSpec {
  body: number; // the low rumble of the burning, against the rest
  rumble: number; // Hz of its top
  flutter: number; // how far the body swells and falls (0..1) in its slow rounds
  hiss: number; // the airy hiss of the flame
  pops: number; // pops a second
  pop: number; // how loud a pop is, against the body
  band: readonly [number, number]; // Hz a pop sounds between
  seed: number;
}

export const HEARTH = {
  voices: 4, // lights heard at once
  reach: 18, // metres: the farthest light listened for (render/worldLights.ts lists the nearest in earshot)
  listed: 6, // lights the list holds
  ease: 0.28, // seconds: a voice's level glides in and out
  flick: 0.04, // seconds: the flame's flicker glides
  release: 1.6, // seconds after a voice is told to fade that it is let go
  floor: 0.38, // the share of a hidden flame's level that stays: heard through the wall, dulled
  dull: 700, // Hz: the top of a flame wholly behind stone
  texture: { rate: 24000, seconds: 3 }, // a loop: seconds long, at this rate (mono, about 290 kB)
  level: 0.1, // the rms every texture is drawn to (the kinds' gains are against it)
  kinds: {
    fire: { range: 14, gain: 0.13, cutoff: 5600 }, // 9 m light x 1.6 = 14.4
    torch: { range: 10, gain: 0.115, cutoff: 6200 }, // 6.5 x 1.6 = 10.4
    lamp: { range: 7, gain: 0.05, cutoff: 7500 }, // 11 x 1.6 = 17.6, but a lamp's hiss is a thin thing
    sigil: { range: 12.5, gain: 0.05, cutoff: 3800 }, // 8 x 1.6 = 12.8
  } satisfies Record<HearthKind, HearthSound>,
  flames: {
    fire: { body: 0.7, rumble: 120, flutter: 0.45, hiss: 0.22, pops: 7, pop: 1.5, band: [700, 2800], seed: 3 },
    torch: { body: 0.45, rumble: 190, flutter: 0.6, hiss: 0.18, pops: 3.4, pop: 1.5, band: [1000, 4000], seed: 5 },
    lamp: { body: 0, rumble: 200, flutter: 0.1, hiss: 1, pops: 0.7, pop: 0.7, band: [2600, 6500], seed: 9 },
  } satisfies Record<'fire' | 'torch' | 'lamp', FlameSpec>,
  sigil: { tones: [[98, 0.5], [98.3, 0.5], [147, 0.3], [147.45, 0.3]] as readonly (readonly [number, number])[], air: 0.07, airHz: 1800, mix: 0.36 }, // the hum: pairs of sines a few tenths of a hertz apart (the shimmer), a breath of air above
};
