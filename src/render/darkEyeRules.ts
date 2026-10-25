/**
 * Eyes beyond the lantern (round 80): the pure rules of render/darkEyes.ts: where a pair may hang, how long, when it blinks and what makes it go.
 * They do nothing, and they make the dark feel inhabited; so they are put only where it is dark and open, never near a light or a town, never in a
 * fight or a talk, and a pair is gone the moment it is looked at squarely, comes near, or has had its time. No Three.js.
 */

import { EYES } from '../data/dreadPicture';

const between = (range: readonly [number, number], r: number): number => range[0] + (range[1] - range[0]) * r;

/** The look of the eyes in `region`, or null where none hang (the towns of the heath are shut out by the light, not here). */
export const eyesIn = (region: string | null): { rgb: readonly [number, number, number]; blinks: boolean } | null => (region ? (EYES.regions[region] ?? null) : null);

/** How many pairs a mind at `sanity` may have out: one more below EYES.uneasy. */
export const pairsFor = (sanity: number): number => EYES.max + (sanity < EYES.uneasy ? 1 : 0);

export interface Spot {
  distance: number; // metres from the lens
  offset: number; // radians from the middle of the picture
  lit: number; // how well lit the ground there is, and about it (the greatest of the points looked at)
  sea: boolean; // under or at the sea
  roofed: boolean; // under a roof
  wood: number; // 0..1: how wooded the land is there (they like cover)
  roll: number; // 0..1: a roll against the cover
}

/** Whether a pair may hang at a spot: far enough, out of the middle of the picture, dark about it, open to the sky and dry; more readily among trees. */
export function maySettle(s: Spot): boolean {
  if (s.distance < EYES.from || s.distance > EYES.far || Math.abs(s.offset) < EYES.stare || s.lit > EYES.litAt || s.sea || s.roofed) return false;
  return s.roll < 0.35 + 0.65 * s.wood;
}

export interface Pair {
  age: number; // seconds since it was put
  life: number; // seconds it was given
  stared: number; // seconds looked at squarely
  distance: number; // metres from the lens
  lit: number; // how well lit the ground at it is now
}

export interface World {
  calm: boolean; // no fight, no talk, no cutscene
  hidden: boolean; // under a roof or out of the open world
}

/** Whether a pair goes now: stared at, come near, lit, its time up, or the moment is not for it. */
export const vanishes = (p: Pair, w: World): boolean => w.hidden || !w.calm || p.stared > EYES.stareFor || p.distance < EYES.near || p.lit > EYES.litAt * 4 || p.age > p.life;

/** How a pair stands in the picture at `age` of its `life`: 0..1, rising over EYES.fadeIn. */
export const risen = (age: number): number => Math.min(1, Math.max(0, age / EYES.fadeIn));

/** Seconds a pair hangs, `r` in 0..1. */
export const lifeOf = (r: number): number => between(EYES.life, r);
/** Seconds a slot rests after a pair, `r` in 0..1. */
export const restOf = (r: number): number => between(EYES.rest, r);
/** Seconds to a pair's next blink, `r` in 0..1. */
export const blinkIn = (r: number): number => between(EYES.blinkEvery, r);

/** Whether an eye is shut at `time`: its blink began at `from` and lasts EYES.blink; `late`: the other eye shuts this much after (a mind that is fraying). */
export const shut = (time: number, from: number, late = 0): boolean => time >= from + late && time < from + late + EYES.blink;

/** The eyes' height over the ground for a roll `r`, fixed for a pair's life. */
export const heightOf = (r: number): number => between(EYES.height, r);
