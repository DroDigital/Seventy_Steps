/**
 * Round 80, the night's voices: the far sounds of each place, as recipes (no recording: the game has none of a foghorn or a
 * cracked toll, and nothing here is fetched). Each is long, low, soft and a little wrong, nothing like a pickup's cue: the
 * `found` and `place` stingers (data/sounds.ts) are bells that swell on a sub-bass, rising out of the ground; these are
 * a horn that holds, a bell that is cracked, wind that sings, a drum, a drip, heard across a distance by render/audio/placeVoices.ts
 * (which dulls and places them). Peaks sit near -11 dBFS before the placing, so that at the distance they are heard from they
 * stand a little above the beds, not over them: tests/ambienceHours.test.ts renders each and pins its level, length and tone.
 */

import { noise, tone, type Layer, type Sound, type Wave } from './sounds';

export type FarId = 'foghorn' | 'buoy' | 'toll' | 'organ' | 'windpipe' | 'iceBoom' | 'dryChime' | 'drip' | 'templeBell' | 'drum' | 'woodsDrone' | 'deepSwell';

const lp = (hz: number, to?: number): Layer['filter'] => ({ type: 'lowpass', hz, to });

/**
 * A tone that holds. A layer's envelope only rises and then falls away, so a note held for a second or two is several, one
 * taking up where the last gives way, each a hair out of tune with the others so they drift against each other like one
 * breath rather than add in step.
 */
export function held(src: Wave, hz: number, hold: number, gain: number, o: { at?: number; attack?: number; step?: number; filter?: Layer['filter']; vibrato?: Layer['vibrato'] } = {}): Layer[] {
  const step = o.step ?? 0.5;
  const n = Math.max(1, Math.round(hold / step));
  return Array.from({ length: n }, (_, i) =>
    tone(src, hz * (1 + 0.0016 * ((i % 3) - 1)), step * 7, gain * 0.6, { at: (o.at ?? 0) + i * step, attack: i === 0 ? o.attack ?? step : step * 0.8, filter: o.filter, vibrato: o.vibrato }),
  );
}

/** One strike of a bell of `hz`: partials at the ratios given, the high ones dying first. */
const strike = (hz: number, at: number, gain: number, ratios: readonly number[], dur: number): Layer[] =>
  ratios.map((r, i) => tone('sine', hz * r, Math.max(0.3, dur / (1 + i * 0.9)), gain / (1 + i * 0.85), { at, attack: 0.004 + 0.002 * i }));

const RAW: Readonly<Record<FarId, Sound>> = {
  // A foghorn off the reef: two low notes a minor third apart, breathed in over a third of a second, held for two, and let go with a sag.
  foghorn: [
    ...held('triangle', 77.8, 2.2, 0.3, { attack: 0.4 }),
    ...held('triangle', 92.5, 2.0, 0.2, { at: 0.12, attack: 0.5 }),
    ...held('sawtooth', 155.6, 1.8, 0.06, { at: 0.1, attack: 0.5, filter: lp(520) }),
    noise('bandpass', 320, 3, 0.07, { attack: 0.45, q: 0.9 }),
    tone('triangle', 77.8, 0.9, 0.12, { at: 2.2, attack: 0.05, to: 66 }),
  ],
  // The fog-bell buoy: iron, thin, struck by the swell and not by a hand, so the strokes come uneven and each leans on the last.
  buoy: [
    ...strike(310, 0, 0.2, [1, 2.76, 5.4], 1.5),
    ...strike(310, 1.7, 0.13, [1, 2.76, 5.4], 1.3),
    ...strike(306, 2.45, 0.17, [1, 2.76, 5.4], 1.4),
    ...strike(312, 4.15, 0.09, [1, 2.76, 5.4], 1.2),
    ...[0, 1.7, 2.45, 4.15].map((at) => noise('bandpass', 1900, 0.05, 0.05, { at, q: 2 })),
  ],
  // A bell cracked down its side: two near pitches that beat, a minor third in it, and a second stroke, softer, a long breath later.
  toll: [
    ...[[196, 0.16, 4.6], [199.6, 0.14, 4.4], [235, 0.09, 3.6], [294, 0.07, 3], [392, 0.04, 2.2], [503, 0.025, 1.4]].map(([hz, gain, dur]) => tone('sine', hz, dur, gain, { attack: 0.006 })),
    noise('bandpass', 1500, 0.08, 0.1, { q: 2 }),
    ...[[196, 0.1, 3.4], [199.6, 0.09, 3.2], [235, 0.05, 2.6], [294, 0.03, 2]].map(([hz, gain, dur]) => tone('sine', hz * 0.99, dur, gain, { at: 3.3, attack: 0.008 })),
  ],
  // An organ in a closed church, one chord and no tune: a minor third with the root below, three saws a little apart, breathed through stone.
  organ: [
    ...[55, 110, 130.8, 164.8].flatMap((hz, i) => [1, 1.0035].map((d) => tone('sawtooth', hz * d, 8, i === 0 ? 0.05 : 0.04, { attack: 1.5, filter: lp(620, 380) }))),
    noise('lowpass', 300, 6, 0.05, { attack: 1.8 }),
  ],
  // Wind through the Elder Things' honeycombed peaks: two thin whistles sliding past each other and a hiss under them. (At the Mountains of Madness: "a shrill, musical piping".)
  windpipe: [
    tone('sine', 1046, 6, 0.09, { attack: 1.4, to: 1175, vibrato: [0.6, 35] }),
    tone('sine', 1568, 5.4, 0.06, { attack: 1.8, to: 1318, vibrato: [0.8, 28], at: 0.5 }),
    tone('triangle', 784, 5, 0.05, { attack: 1.6, to: 880, at: 0.9, vibrato: [0.5, 40] }),
    noise('bandpass', 1300, 6, 0.1, { attack: 1.4, to: 1700, q: 8 }),
  ],
  // Ice booming: a crack run along the field, the boom that follows, and its echo off the cliff.
  iceBoom: [
    noise('lowpass', 1100, 0.7, 0.5, { to: 110, attack: 0.01 }),
    tone('sine', 72, 2.2, 0.5, { to: 30, attack: 0.02 }),
    noise('bandpass', 2400, 0.45, 0.12, { to: 600, q: 1.4, at: 0.02 }),
    noise('lowpass', 500, 1.4, 0.16, { to: 80, at: 1, attack: 0.05 }),
    tone('sine', 60, 1.8, 0.2, { to: 28, at: 1, attack: 0.05 }),
  ],
  // Wooden and glass things moved by a wind that is not there: three notes, far apart in time and in pitch, none of them a scale.
  dryChime: [
    ...[[0, 1318.5, 0.14], [1.15, 1568, 0.11], [2.9, 1046.5, 0.12]].flatMap(([at, hz, gain]) => [tone('sine', hz, 1.1, gain, { at, attack: 0.003 }), tone('sine', hz * 2.71, 0.4, gain * 0.4, { at, attack: 0.003 })]),
    ...[0, 1.15, 2.9].map((at) => noise('bandpass', 3200, 0.04, 0.08, { at, q: 3 })),
  ],
  // K'n-yan: a drop falling a long way into water that does not look up, and under it the slow throb of something below.
  drip: [
    tone('sine', 520, 0.2, 0.3, { to: 180, attack: 0.002 }),
    noise('bandpass', 900, 0.07, 0.15, { q: 4 }),
    tone('sine', 400, 0.3, 0.1, { to: 150, at: 0.38, attack: 0.002 }),
    tone('sine', 41, 3.4, 0.4, { at: 0.5, attack: 0.6 }),
    tone('sine', 82, 2.6, 0.1, { at: 0.5, attack: 0.7 }),
    tone('sine', 40, 2.6, 0.3, { at: 2.5, attack: 0.5 }),
  ],
  // A temple bell in the Dreamlands, muffled by a wall and a hill: one stroke and its long fall, the high end shut.
  templeBell: [
    ...[[233, 0.2, 5.5], [466, 0.1, 4.6], [699, 0.06, 3.6], [1011, 0.03, 2.4]].map(([hz, gain, dur]) => tone('sine', hz, dur, gain, { attack: 0.03, filter: lp(900, 320) })),
    tone('sine', 116.5, 3.5, 0.06, { attack: 0.5 }),
  ],
  // A drum in Leng, once, twice, and then a long wait before the third: a skin over something big, struck by something that does not hurry.
  drum: [
    ...[[0, 0.42], [1.5, 0.3], [2.15, 0.36], [4.4, 0.26]].flatMap(([at, gain]) => [
      tone('sine', 82, 0.55, gain, { at, to: 46, attack: 0.004 }),
      noise('lowpass', 260, 0.3, gain * 0.5, { at, to: 90, attack: 0.004 }),
    ]),
  ],
  // A drone from the woods above Akeley's farm: two saws a few cycles apart, through a wall of leaves, with something thin and quick on top that is never one note.
  woodsDrone: [
    tone('sawtooth', 57, 8, 0.1, { attack: 2.5, filter: lp(240, 180), vibrato: [4.6, 14] }),
    tone('sawtooth', 60.2, 8, 0.1, { attack: 2.8, filter: lp(240, 180), vibrato: [5.2, 14] }),
    tone('sawtooth', 118.5, 7, 0.04, { attack: 3, filter: lp(320, 220), vibrato: [6.3, 24] }),
    noise('bandpass', 700, 7, 0.04, { attack: 3, q: 3, to: 640 }),
  ],
  // R'lyeh: the swell of something enormous breathing far under the water, mostly below the ear, and the moan it makes in the stone.
  deepSwell: [
    tone('sine', 34, 8, 0.5, { attack: 2.6, to: 26 }),
    tone('sine', 51, 7, 0.25, { attack: 2.8, to: 38, at: 0.3 }),
    tone('triangle', 140, 6, 0.06, { attack: 2.6, to: 96, at: 0.6, filter: lp(300) }),
    noise('lowpass', 140, 6, 0.18, { attack: 2.6, to: 70 }),
  ],
};

/** How much each is lifted or let down against its recipe as written, so that all sit alike in the mix (rms about -21 dBFS before the placing; tests/ambienceHours.test.ts renders them). */
export const FAR_MIX: Readonly<Record<FarId, number>> = { foghorn: 1.2, buoy: 1.6, toll: 1.4, organ: 2.4, windpipe: 2.2, iceBoom: 0.6, dryChime: 1.6, drip: 0.8, templeBell: 1.4, drum: 1, woodsDrone: 1.8, deepSwell: 0.55 };

const level = (sound: Sound, k: number): Sound => sound.map((l): Layer => ({ ...l, gain: Math.min(1, l.gain * k) }));

export const FAR: Readonly<Record<FarId, Sound>> = Object.fromEntries((Object.keys(RAW) as FarId[]).map((id) => [id, level(RAW[id], FAR_MIX[id])])) as Record<FarId, Sound>;
