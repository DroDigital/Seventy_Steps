/**
 * The dungeons' traps heard (2026-11-27; systems/dungeonTraps.ts, render/audio/trapAudio.ts): each mechanism's warning, so it is heard
 * before it strikes (a plate's click, a tile's rattle, a nozzle's hiss, a slab's grinding, a far wall's rumble, the roar before a tide),
 * and its stroke (darts loosed, spikes up, a blade's pass, a jet, a slab down, a boulder breaking, a puff). Made in code, as the doors'
 * are (data/doorSounds.ts). The watcher's ring and burst are the ways' (audio/wayAudio.ts). Data only.
 */

import type { TrapKind } from './dungeonTraps';
import { noise, tone, type Sound } from './sounds';

export const TRAP_WARN: Readonly<Partial<Record<TrapKind, Sound>>> = {
  spikes: [noise('bandpass', 3200, 0.05, 0.5, { q: 6 }), noise('bandpass', 2800, 0.05, 0.45, { q: 6, at: 0.09 }), noise('bandpass', 3400, 0.05, 0.4, { q: 6, at: 0.18 }), noise('bandpass', 3000, 0.05, 0.35, { q: 6, at: 0.27 })], // iron rattling in its grate
  darts: [tone('square', 1700, 0.025, 0.25, { filter: { type: 'bandpass', hz: 1700, q: 4 } }), noise('lowpass', 900, 0.08, 0.5), tone('triangle', 420, 0.12, 0.25, { at: 0.12, to: 380 })], // the plate's click, and a catch released in the wall
  boulder: [noise('lowpass', 110, 1.3, 0.9, { attack: 0.5, to: 160 }), tone('sine', 38, 1.2, 0.5, { attack: 0.4 })], // the far wall rumbles
  flames: [noise('highpass', 3200, 0.8, 0.35, { attack: 0.6, to: 4200 })], // the nozzle's hiss
  crusher: [noise('lowpass', 240, 0.9, 0.6, { attack: 0.2 }), tone('sawtooth', 52, 0.9, 0.12, { filter: { type: 'lowpass', hz: 160 } })], // stone grinding on its chains, dust shed
  gas: [noise('highpass', 2400, 0.6, 0.3, { attack: 0.4 })],
  tide: [noise('lowpass', 320, 1.1, 0.85, { attack: 0.8, to: 700 })], // the roar before the wave
};

export const TRAP_SPRUNG: Readonly<Partial<Record<TrapKind, Sound>>> = {
  spikes: [noise('highpass', 2200, 0.25, 0.7, { to: 5200 }), tone('triangle', 1250, 0.3, 0.2, { to: 1180 }), noise('lowpass', 380, 0.12, 0.5)], // steel through wood: the shing
  darts: [noise('bandpass', 2400, 0.16, 0.6, { to: 700, q: 3 })], // a dart loosed: thwip
  blades: [noise('bandpass', 420, 0.45, 0.45, { to: 1300, q: 2, attack: 0.18 })], // its pass: a whoosh
  flames: [noise('lowpass', 520, 1, 0.85, { attack: 0.05, to: 900 }), noise('bandpass', 1600, 1, 0.25, { q: 1 })], // the jet's roar
  crusher: [tone('sine', 46, 0.45, 0.9, { to: 30 }), noise('lowpass', 320, 0.4, 0.9)], // the slab down
  boulder: [noise('lowpass', 420, 0.7, 0.9), tone('sine', 55, 0.5, 0.6, { to: 34 })], // breaking on the wall
  gas: [noise('lowpass', 900, 0.6, 0.55, { attack: 0.05, to: 400 })], // a puff
};

/** How loud each is played, and how far it is heard. */
export const TRAP_MIX = { gain: 0.8, range: 40, blades: 0.45 } as const;
