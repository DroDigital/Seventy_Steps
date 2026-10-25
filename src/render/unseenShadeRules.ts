/**
 * A shadow with no one (round 78): the pure rules of render/unseenShade.ts. The moon casts a tall figure's shadow on the grass from something that
 * is not there; it lies out at the edge of sight, moves only while the lens is turned from it, and is gone when approached, in a fight, or when
 * the mind steadies. No Three.js.
 */

import { SHADE } from '../data/dreadPicture';

const between = (range: readonly [number, number], r: number): number => range[0] + (range[1] - range[0]) * r;

/** Seconds to the next episode, `r` in 0..1. */
export const shadeEvery = (r: number): number => between(SHADE.every, r);
/** Seconds one episode lasts. */
export const shadeLasts = (r: number): number => between(SHADE.lasts, r);
/** Seconds to its next slide. */
export const slideEvery = (r: number): number => between(SHADE.slideEvery, r);

export interface Ground {
  shadows: boolean; // the moon's shadows are on and the moon is up (the world shader's uShadow)
  hidden: boolean; // under a roof, or not in the open world
  mind: boolean; // the mind has failed far enough (watchersFor >= 1)
  cap: number; // the FX intensity setting
  calm: boolean; // no fight, no talk, no cutscene
}

/** Whether an episode may begin or go on now. */
export const mayLie = (c: Ground): boolean => c.shadows && !c.hidden && c.mind && c.cap > 0 && c.calm;

/** Whether the lens is turned far enough from the shade (`offset` radians from the middle of the picture) that it may move. */
export const mayMove = (offset: number): boolean => Math.abs(offset) > SHADE.turnedAway;

/** Whether the investigator, `distance` metres off, has come near enough that it is gone. */
export const tooNear = (distance: number): boolean => distance < SHADE.gone;

/** Where it lies for a roll: `r1` the distance, `r2` the angle off the heading (the side is `left`): radians from the heading and metres from the lens. */
export function placeOf(r1: number, r2: number, left: boolean): { distance: number; angle: number } {
  return { distance: between(SHADE.near, r1), angle: (left ? -1 : 1) * between(SHADE.side, r2) };
}

/**
 * The way the figure faces so that its broad side is to the moon (a shadow is read by its shoulders, not by its thickness) and as much to the
 * investigator as that allows: a yaw, given the moon's horizontal direction (mx, mz) and the way to the lens (cx, cz).
 */
export function facing(mx: number, mz: number, cx: number, cz: number): number {
  const [px, pz] = [-mz, mx]; // perpendicular to the light: the two ways the chest may face
  return (px * cx + pz * cz >= 0 ? Math.atan2(px, pz) : Math.atan2(-px, -pz));
}

/** A step of its growth or going toward `want` (0 or 1) over `dt` seconds. */
export const grown = (k: number, want: number, dt: number): number => (want > k ? Math.min(want, k + dt / SHADE.grow) : Math.max(want, k - dt / SHADE.fade));

/** How tall the figure is made for a moon `up` (the height of its unit direction, 0..1): tall enough that its shadow is `SHADE.reach` long, within `SHADE.height` and `SHADE.mostHeight`. */
export function heightFor(up: number): number {
  const y = Math.min(0.999, Math.max(0.01, up));
  return Math.min(SHADE.mostHeight, Math.max(SHADE.height, (SHADE.reach * y) / Math.sqrt(1 - y * y)));
}
