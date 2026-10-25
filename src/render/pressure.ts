/**
 * Pressure (round 80): dread is weather that arrives, not a bar that happens to be low. The picture's failing-mind effects were a pure
 * function of the sanity level, so a mind at 100 that walked toward a great horror's ring saw nothing change. Pressure is a 0..1 term
 * read from the simulation without re-implementing it: the smoothed rate at which sanity is being lost (auras, roars, clouds and a
 * place's dread all take it the same way, and a swallow of Laudanum that stops the drain clears the head at once), and the jolt of a
 * sudden loss (`SanityLost`: a first sight, a blow of the mind). In a horror's fight it is halved (the approach, the ring and the
 * first sight carry the most). computeFx (fx.ts) leans the picture's edges and the whispers toward madness by it; no sanity number is
 * changed. Pure: no Three.js.
 */

import { PRESSURE } from '../data/dreadPicture';
import type { Game } from '../systems/components';
import { fightEngaged } from './dreadCalm';

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Debug (`window.dread.pressure(n)`): holds the pressure at `force` (0..1) in place of what the game makes of it; negative: not held. */
export const PRESSURE_DEBUG = { force: -1 };

/** The pressure a loss of `perSecond` sanity a second gives: whole at PRESSURE.rate. */
export const rateDread = (perSecond: number): number => clamp01(perSecond / PRESSURE.rate);

/** The jolt of a sudden loss of `amount`, 0..1. */
export const jolt = (amount: number): number => clamp01(amount / PRESSURE.shock);

/** `from` moved toward `to` by `dt` seconds of an exponential approach of time constant `tau`. */
export const approach = (from: number, to: number, dt: number, tau: number): number => to + (from - to) * Math.exp(-dt / tau);

/** The pressure of a slow term and a jolt, `fight` (0..1) of the way into a horror's fight. */
export const pressureOf = (slow: number, hit: number, fight: number): number => clamp01(slow + hit) * (1 - (1 - PRESSURE.fight) * clamp01(fight));

export interface Pressure {
  /** Takes up the mind of this frame (`seconds` of render time) and gives the pressure on it, 0..1. */
  update(seconds: number): number;
}

export function createPressure(g: Game): Pressure {
  let last = g.mind.sanity; // sanity at the last look
  let at = Number.NaN; // seconds of the last look
  let slow = 0; // the smoothed rate's pressure
  let hit = 0; // the jolts, fading
  let burst = 0; // sanity lost in sudden losses since the last look: counted by the jolts, not by the rate
  let fight = 0; // how far in a horror's fight (eased)
  g.events.on('SanityLost', ({ amount }) => {
    hit = Math.max(hit, jolt(amount));
    burst += amount;
  });
  return {
    update(seconds) {
      const span = Number.isFinite(at) ? seconds - at : 0;
      const dt = Math.min(PRESSURE.maxStep, span);
      at = seconds;
      const now = g.mind.sanity;
      if (span <= 0) { // a world standing still (a menu, a cutscene's hold): nothing passes, and what was lost meanwhile is not dread
        [last, burst] = [now, 0];
        return PRESSURE_DEBUG.force >= 0 ? clamp01(PRESSURE_DEBUG.force) : pressureOf(slow, hit, fight);
      }
      const lost = Math.max(0, last - now - burst);
      [last, burst] = [now, 0];
      const quiet = g.cutscene; // a cutscene is not washed by the picture's dread
      const want = quiet ? 0 : rateDread(lost / span);
      slow = approach(slow, want, dt, want > slow ? PRESSURE.attack : PRESSURE.release);
      hit = quiet ? 0 : hit * Math.exp(-dt / PRESSURE.shockSeconds);
      fight = approach(fight, fightEngaged(g) ? 1 : 0, dt, PRESSURE.fightEase);
      return PRESSURE_DEBUG.force >= 0 ? clamp01(PRESSURE_DEBUG.force) : pressureOf(slow, hit, fight);
    },
  };
}
