/**
 * What a horror's blows sound like, by what they are made of (round 51). The attack library's sounds
 * (`creatureSounds`: a whoosh, a boom, a whip) are the blow's motion; these are its matter. Each of the
 * twelve elements (the mark its ground wears, `render/aoeLook`) has a timbre: the sea splashes and drips,
 * stone cracks and grinds, fire crackles, frost chimes and shatters, ink slaps wet, spores sigh, stars and
 * eyes ring. The same five things are made of any timbre (a bolt leaving, a bolt or a burst landing, a
 * summoning, an arrival, the gathering before a blow) and a sixth, the hum of what is kept up (a beam,
 * a vortex, a gaze). Procedural recipes (data/sounds.ts); levels in `ATTACK_MIX`, held by tests/attackSounds.test.ts
 * to a landed blow's (-22 to -10 dBFS rms) so a fight is heard and nothing is a nuisance.
 */

import type { AoeMotif } from '../render/aoeLook';
import { noise, tone, type FilterType, type Layer, type Sound, type Wave } from './sounds';

export interface Timbre {
  body: number; // Hz of the low thud under a landing
  grit: { type: FilterType; hz: number; to: number; q?: number }; // the noise of its matter
  tone?: { src: Wave; hz: number; to: number }; // a pitched part: a drip, a ring, a scrape
  chime?: readonly number[]; // bright partials that ring after it
  crackle?: number; // how many small ticks it scatters
  wet?: boolean; // a squelch under it
}

export const TIMBRE: Readonly<Record<AoeMotif, Timbre>> = {
  plain: { body: 90, grit: { type: 'bandpass', hz: 1400, to: 400, q: 1 } },
  tide: { body: 80, grit: { type: 'bandpass', hz: 1100, to: 260, q: 0.8 }, tone: { src: 'sine', hz: 820, to: 260 }, wet: true },
  glyph: { body: 110, grit: { type: 'highpass', hz: 4200, to: 3000 }, tone: { src: 'triangle', hz: 740, to: 700 }, chime: [880, 1320, 1760] },
  crack: { body: 62, grit: { type: 'lowpass', hz: 1500, to: 160, q: 1 }, tone: { src: 'sawtooth', hz: 130, to: 50 }, crackle: 3 },
  flame: { body: 100, grit: { type: 'highpass', hz: 2400, to: 900 }, crackle: 9 },
  spore: { body: 120, grit: { type: 'bandpass', hz: 620, to: 360, q: 0.6 }, tone: { src: 'sine', hz: 210, to: 150 }, wet: true },
  coil: { body: 130, grit: { type: 'bandpass', hz: 2600, to: 5200, q: 2 }, tone: { src: 'sawtooth', hz: 170, to: 260 } },
  eye: { body: 96, grit: { type: 'bandpass', hz: 1900, to: 1500, q: 3 }, tone: { src: 'sine', hz: 1320, to: 1250 }, chime: [660, 990] },
  root: { body: 70, grit: { type: 'lowpass', hz: 700, to: 120, q: 1 }, tone: { src: 'triangle', hz: 170, to: 70 }, wet: true, crackle: 2 },
  star: { body: 140, grit: { type: 'highpass', hz: 5000, to: 3500 }, tone: { src: 'sine', hz: 1760, to: 2200 }, chime: [1046, 1568, 2093, 2637] },
  frost: { body: 110, grit: { type: 'highpass', hz: 3600, to: 2400 }, tone: { src: 'triangle', hz: 2300, to: 1700 }, chime: [1568, 2093], crackle: 4 },
  ash: { body: 85, grit: { type: 'lowpass', hz: 900, to: 220, q: 0.7 } },
  stain: { body: 70, grit: { type: 'bandpass', hz: 520, to: 140, q: 1.2 }, tone: { src: 'sine', hz: 190, to: 70 }, wet: true },
};

/** Where each sound sits, as the gain it is played at: a landing as present as a blow, the rest in proportion. */
export const ATTACK_MIX = {
  loosed: 1.1,
  landed: 0.85,
  burst: 1,
  summon: 0.95,
  arrive: 0.95,
  depart: 0.95,
  gather: 0.7,
  phase: 0.9,
  gaze: 0.85,
  gazeBurst: 0.9,
  hum: 0.65,
  dark: 0.9,
  swing: 0.8,
} as const;

const trim = (sound: Sound, k: number): Sound => sound.map((l): Layer => ({ ...l, gain: l.gain * k }));

const ticks = (n: number, hz: number, within: number, gain: number): Layer[] =>
  Array.from({ length: n }, (_, i) => noise('highpass', hz * (0.8 + 0.5 * ((i * 7) % 5) / 5), 0.025, gain * (0.5 + 0.5 * (((i * 3) % 4) / 3)), { at: (within * (i + 0.5)) / n + 0.012 * ((i * 5) % 3) }));

/** A bolt leaving its caster: a rush of the element's matter, pitched up as it goes. */
export function loosed(t: Timbre): Sound {
  const up = t.grit.to > t.grit.hz;
  return [
    noise(t.grit.type === 'lowpass' ? 'bandpass' : t.grit.type, Math.max(500, t.grit.hz * 0.8), 0.2, 0.4, { to: up ? t.grit.to : t.grit.hz * 2.2, q: 1.5, attack: 0.02 }),
    tone(t.tone?.src ?? 'sine', (t.tone?.hz ?? 300) * 0.8, 0.22, 0.2, { to: (t.tone?.hz ?? 300) * 1.7, attack: 0.02 }),
    ...(t.chime ? [tone('triangle', t.chime[0]!, 0.28, 0.1, { attack: 0.01 })] : []),
    ...ticks(t.crackle ? 3 : 0, 3200, 0.14, 0.2),
  ];
}

/** A bolt landing (`size` 0..1: a dart to a colossus's blast): thud, matter, ring and scatter. */
export function landed(t: Timbre, size = 0.4): Sound {
  const long = 0.12 + 0.3 * size;
  return [
    tone('sine', t.body * (1.3 - 0.4 * size), long + 0.08, 0.55, { to: t.body * 0.38 }),
    noise(t.grit.type, t.grit.hz, long, 0.55, { to: t.grit.to, q: t.grit.q }),
    ...(t.tone ? [tone(t.tone.src, t.tone.hz, long + 0.06, 0.22, { to: t.tone.to, filter: { type: 'lowpass', hz: 3200 } })] : []),
    ...(t.wet ? [noise('bandpass', 420, 0.12, 0.3, { to: 150, q: 1.4, at: 0.015 })] : []),
    ...(t.chime ? t.chime.map((hz, i) => tone('triangle', hz, 0.3 + 0.3 * size, 0.1 / (1 + i * 0.4), { at: 0.01 * i, attack: 0.004 })) : []),
    ...ticks(t.crackle ?? 0, 3400, 0.12 + 0.2 * size, 0.28),
  ];
}

/** A burst (an eruption, a slam, a ring): landed, much larger, with the floor's boom and the rumble after. */
export function burst(t: Timbre, size = 0.7): Sound {
  return [
    ...trim(landed(t, Math.min(1, size + 0.2)), 0.72),
    tone('sine', 55, 0.5 + 0.5 * size, 0.42, { to: 28, attack: 0.008 }),
    noise('lowpass', 420, 0.5 + 0.7 * size, 0.24, { to: 70, at: 0.03 }),
  ];
}

/** A summoning: a rising gather of the element's ring and a low swell, resolving on a stroke. */
export function summon(t: Timbre): Sound {
  return [
    tone('sine', t.body * 1.6, 0.9, 0.3, { to: t.body * 3.6, attack: 0.45, vibrato: [5, 30] }),
    tone('triangle', (t.chime?.[0] ?? t.tone?.hz ?? 440) * 0.5, 0.9, 0.16, { to: (t.chime?.[1] ?? 880) * 0.5, attack: 0.5 }),
    noise('bandpass', t.grit.hz, 0.8, 0.22, { to: Math.max(500, t.grit.to) * 2, attack: 0.5, q: 1.2 }),
    tone('sine', t.body * 0.6, 0.5, 0.5, { at: 0.6, to: t.body * 0.3 }),
    noise(t.grit.type, t.grit.hz, 0.25, 0.4, { at: 0.6, to: t.grit.to }),
  ];
}

/** An arrival (a teleport's far end): a short in-rush and a stroke. */
export function arrive(t: Timbre): Sound {
  return [
    noise('bandpass', 600, 0.16, 0.45, { to: 4200, q: 1.4, attack: 0.04 }),
    tone('sine', t.body * 3, 0.16, 0.3, { to: t.body * 8, attack: 0.04 }),
    tone('sine', t.body, 0.3, 0.55, { at: 0.16, to: t.body * 0.35 }),
    noise(t.grit.type, t.grit.hz, 0.2, 0.4, { at: 0.16, to: t.grit.to }),
  ];
}

/** A departure (a teleport's near end): the air drawn in. */
export function depart(t: Timbre): Sound {
  return [noise('bandpass', 3800, 0.24, 0.4, { to: 500, q: 1.4 }), tone('sine', t.body * 6, 0.24, 0.22, { to: t.body * 1.5 })];
}

/** The gathering before a blow, `grow` seconds of it: a thin whine climbing, a breath drawn. */
export function gather(t: Timbre, grow = 0.45): Sound {
  return [
    tone(t.tone?.src === 'sawtooth' ? 'triangle' : t.tone?.src ?? 'sine', (t.tone?.hz ?? 320) * 0.7, grow, 0.28, { to: (t.tone?.hz ?? 320) * 2.2, attack: grow * 0.8 }),
    noise('bandpass', 900, grow, 0.26, { to: 3600, q: 1.5, attack: grow * 0.85 }),
  ];
}

/** A phase change: the horror shakes the arena. */
export function phase(t: Timbre): Sound {
  return [...burst(t, 1), tone('sawtooth', 48, 1.6, 0.22, { to: 30, attack: 0.05, filter: { type: 'lowpass', hz: 300 } }), ...(t.chime ? t.chime.map((hz, i) => tone('sine', hz * 0.5, 1.4, 0.07, { at: 0.2 + 0.05 * i, attack: 0.1 })) : [])];
}

/** One breath of a hum kept up: a beam's, a vortex's: `period` seconds long, laid end to end with overlap. */
export function hum(t: Timbre, kind: 'beam' | 'vortex', period = 0.3): Sound {
  const hz = kind === 'beam' ? 120 : 62;
  return [
    tone(kind === 'beam' ? 'sawtooth' : 'sine', hz, period * 1.4, 0.28, { vibrato: [kind === 'beam' ? 31 : 4, 40], attack: 0.04, filter: { type: 'lowpass', hz: kind === 'beam' ? 900 : 260 } }),
    noise(kind === 'beam' ? 'bandpass' : 'lowpass', kind === 'beam' ? Math.max(1200, t.grit.hz) : 380, period * 1.4, kind === 'beam' ? 0.2 : 0.3, { attack: 0.05, q: 1.5 }),
  ];
}

/** The mind giving way under a gaze, at `level` 0..1: a thin ringing that rises. */
export function gazeTone(level: number): Sound {
  return [tone('sine', 1100 + 1500 * level, 0.3, 0.2, { to: 1200 + 1700 * level, attack: 0.05, vibrato: [7, 25] }), tone('sine', 1650 + 2200 * level, 0.3, 0.08, { attack: 0.08 })];
}

/** The gaze lands. */
export const GAZE_BURST: Sound = [
  tone('sine', 1760, 0.9, 0.3, { to: 880, vibrato: [6, 40] }),
  noise('bandpass', 3200, 0.5, 0.35, { to: 400, q: 2 }),
  tone('sine', 70, 0.7, 0.55, { to: 30 }),
];

/** Darkness poured over the place. */
export const DARKNESS: Sound = [
  tone('sine', 82, 1.6, 0.5, { to: 38, attack: 0.3 }),
  noise('lowpass', 700, 1.4, 0.34, { to: 90, attack: 0.5 }),
  tone('sawtooth', 55, 1.4, 0.1, { to: 41, attack: 0.4, filter: { type: 'lowpass', hz: 220 } }),
];

/** The swing's own matter, lightly (a blow that opens): `size` 0..1. */
export function swing(t: Timbre, size = 0.5): Sound {
  return [
    noise('bandpass', 700 + 1200 * (1 - size), 0.12 + 0.14 * size, 0.45, { to: 300, q: 1.2 }),
    tone('sine', t.body * (1.1 - 0.3 * size), 0.1 + 0.2 * size, 0.5, { to: t.body * 0.4 }),
    ...(t.crackle ? ticks(Math.min(3, t.crackle), 3000, 0.1, 0.22) : []),
  ];
}
