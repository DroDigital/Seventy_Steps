/**
 * What a thunderstorm sounds like (round 52). Thunder was one recording, the same crack and roll at any distance: now the recording has beneath it
 * a recipe made to the strike's distance, a crack and a sharp tearing of the air near, a long rolling that gathers, breaks and goes
 * round the sky far off, with a mutter about the horizon. And the bolt that falls on the ground has a sound before it falls, a
 * rising crackle and whine in the air about the ring that matches its fill, and a sharp crack as it falls, with the sizzle after.
 * Procedural recipes (data/sounds.ts); tests/stormSounds.test.ts holds their levels.
 */

import { noise, tone, type Sound } from './sounds';

export const STORM_MIX = {
  thunder: 0.4, // the recipe beneath the recordings (round 66: it was 1.1, the whole of it, and was heard as made)
  warn: 0.9, // the ring's crackle, made (until the recording has loaded)
  charge: 0.9, // the ring's hum, recorded (round 66)
  zap: 0.8, // the snap of a bolt on the ground, recorded (round 66)
  crack: 1, // the bolt on the ground, made (until the recording has loaded)
  strike: 1, // the bolt on the ground, recorded (round 59)
} as const;

/** Thunder `far` (0 overhead .. 1 on the horizon) away: near, a crack and a tear and a boom; far, only the rolling and a mutter. */
export function thunderRoll(far: number): Sound {
  const f = Math.min(1, Math.max(0, far));
  const near = 1 - f;
  const long = 2 + 2 * f;
  return [
    ...(near > 0.2 ? [noise('highpass', 1600, 0.07, 0.7 * near), noise('bandpass', 1100, 0.3 + 0.2 * near, 0.45 * near, { to: 260, q: 0.7 })] : []),
    tone('sine', 62 - 8 * f, 0.7 + 1.1 * f, 0.55 * (0.4 + 0.6 * near), { to: 30, attack: 0.02 + 0.1 * f }),
    noise('lowpass', 230 - 60 * f, long, 0.5, { to: 70, attack: 0.15 + 0.35 * f }),
    noise('lowpass', 190 - 50 * f, long * 0.8, 0.34, { at: 0.5 + 0.5 * f, to: 60, attack: 0.2 }),
    noise('lowpass', 160 - 40 * f, long * 0.7, 0.24, { at: 1.2 + 0.8 * f, to: 55, attack: 0.25 }),
    noise('bandpass', 420, 1.3 + f, 0.16 * (0.4 + 0.6 * f), { at: 0.3, to: 220, q: 0.7, attack: 0.3 }),
  ];
}

/** The ring of light before a bolt falls on the ground, 1.5 s: a crackle that thickens, a thin whine that rises, a hum underneath. */
export const STRIKE_WARN: Sound = [
  tone('sine', 640, 1.5, 0.16, { to: 2600, attack: 1.1, vibrato: [9, 60] }),
  tone('sine', 120, 1.5, 0.22, { attack: 1.2 }),
  noise('highpass', 3200, 1.5, 0.12, { attack: 1.2 }),
  ...[0.05, 0.28, 0.5, 0.68, 0.84, 0.97, 1.08, 1.17, 1.25, 1.32, 1.38, 1.43].map((at, i) => noise('highpass', 2600 + 220 * (i % 4), 0.025, 0.2 + 0.03 * i, { at })),
];

/** The bolt on the ground: a crack of the air, a boom through it, and the sizzle that is left. */
export const STRIKE_CRACK: Sound = [
  noise('highpass', 1400, 0.06, 0.7),
  noise('lowpass', 2400, 0.5, 0.5, { to: 260 }),
  tone('sine', 74, 0.7, 0.5, { to: 32 }),
  noise('highpass', 4200, 0.45, 0.16, { at: 0.08, attack: 0.04 }),
  tone('sine', 3000, 0.2, 0.06, { at: 0.04, to: 1100 }),
];
