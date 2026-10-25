/**
 * Not where it was (round 80): the pure rules of the watchers' steps and the darters at the corner of the eye (render/watchers.ts).
 * A watcher that has stood a while and is out of the picture comes a step or two nearer, never while it is seen and never to within
 * STEP.closest metres; a dark upright shape crosses the very edge of the picture while the lens swings, and is gone when it is turned to.
 * No Three.js; the numbers are data/dreadPicture.ts's.
 */

import { DARTER, STEP } from '../data/dreadPicture';

const between = (range: readonly [number, number], r: number): number => range[0] + (range[1] - range[0]) * r;

/** Seconds to a watcher's next step, `r` in 0..1. */
export const stepEvery = (r: number): number => between(STEP.every, r);

/** Whether a watcher may step now: it has stood STEP.after seconds, is out of the picture by STEP.turned past its edge (`offset`, `half`: radians), and its step is due. */
export const mayStep = (age: number, offset: number, half: number, now: number, due: number): boolean => age > STEP.after && Math.abs(offset) > half + STEP.turned && now >= due;

/** The metres a step of the roll `r` takes a watcher `distance` from the lens: its stride, less what would bring it nearer than STEP.closest (0 then). */
export const stepOf = (distance: number, r: number): number => Math.max(0, Math.min(between(STEP.metres, r), distance - STEP.closest));

/** Seconds to the next darter, `r` in 0..1. */
export const darterEvery = (r: number): number => between(DARTER.every, r);

export interface DarterStart {
  offset: number; // radians from the middle of the picture, on the side the lens turns toward
  distance: number; // metres from the lens
  speed: number; // metres a second, sideways and outward
}

/** Where a darter begins while the lens turns at `rate` radians a second (toward its edge) and half the picture is `half` wide; null if the lens is not swinging fast enough. */
export function darterStart(rate: number, half: number, r1: number, r2: number): DarterStart | null {
  if (Math.abs(rate) < DARTER.yawRate) return null;
  return { offset: Math.sign(rate) * half * DARTER.edge, distance: between(DARTER.near, r1), speed: between(DARTER.speed, r2) };
}

/** Whether a darter at `offset` from the middle of the picture is gone: it is not there when turned to. */
export const darterGone = (offset: number): boolean => Math.abs(offset) < DARTER.gone;

/** The hush the bed gives way by while `n` watchers stand (render/audio/dread.ts): STEP.held for each, to STEP.heldMost. */
export const heldBreath = (n: number): number => Math.min(STEP.heldMost, n * STEP.held);
