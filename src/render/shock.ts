/**
 * The shock (round 80): the narrators' swoons and ringing ears on glimpsing the unthinkable. A sudden large loss of the mind (a first sight, a
 * horror's roar: `SanityLost` of SHOCK.from or more) dulls the world's high end, lets the bed give way and sends a thin tone ringing in the head
 * that thins over several seconds, and the sounds creep back; the picture's own part is a ring across it (fxController.ts). The sound keeps to the
 * FX intensity setting, so none of it at intensity 0. `DREAD_AIR` is what the picture's dread asks of the sound: audio/gameAudio.ts and
 * audio/dread.ts read it as they read `HEART`. Presentation only; no Three.js.
 */

import { RING } from '../data/dreadSounds';
import { SHOCK } from '../data/dreadPicture';
import type { Game } from '../systems/components';
import type { GameAudio } from './audio/gameAudio';

/** What the picture's dread asks of the sound, written each frame by atm/dread.ts and fxController.ts. */
export const DREAD_AIR = {
  muffle: 0, // 0..1: how far the world's high end is closed (audio/gameAudio.ts: setMuffle)
  hush: 0, // 0..1: how far the bed gives way (audio/dread.ts: setHush)
  cap: 1, // the FX intensity setting, 0..1 (fxController.ts)
};

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** How hard a loss of `amount` at once is a shock, 0..1: none below SHOCK.from. */
export const shockOf = (amount: number): number => (amount < SHOCK.from ? 0 : clamp01(amount / SHOCK.full));

/** A shock of `level` after `dt` seconds. */
export const shockAfter = (level: number, dt: number): number => (level < 0.002 ? 0 : level * Math.exp(-dt / SHOCK.seconds));

export interface Shock {
  /** Each drawn frame (`time` seconds of render time): lets the sound back in. Returns the shock now, 0..1. */
  update(time: number): number;
}

export function createShock(g: Game, audio: Pick<GameAudio, 'recipe'>): Shock {
  let level = 0;
  let last = Number.NaN;
  g.events.on('SanityLost', ({ amount }) => {
    const k = shockOf(amount);
    if (k <= 0 || DREAD_AIR.cap <= 0) return;
    level = Math.max(level, k);
    audio.recipe('shock:ring', RING, { at: null, gain: SHOCK.tone.gain * k * DREAD_AIR.cap, vary: 1 });
  });
  return {
    update(time) {
      const dt = Number.isFinite(last) ? Math.min(0.25, Math.max(0, time - last)) : 0;
      last = time;
      level = shockAfter(level, dt);
      return level;
    },
  };
}
