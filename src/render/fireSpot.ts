/**
 * Where a built fire's light stands (round 84): a fire, torch or lamp is the pixel flame's picture alone (flames.ts, drawn at every light spot of
 * those kinds), with no cone of embers built beneath it, so a piece that holds one is a light and nothing else, set so that the flame's foot
 * rests where the piece says: the flame stands `LIGHTS.flames[kind].base` under its light, as tall as its kind and `size` times that.
 */

import { LIGHTS, type LightKind } from '../data/tuning';

/** The light of a fire whose flame stands on `foot` (in the piece's frame), for a piece with no geometry of its own. */
export function fireSpot(kind: LightKind, foot: readonly [number, number, number], size = 1): { light: LightKind; at: [number, number, number]; flame: number } {
  const base = LIGHTS.flames[kind]?.base ?? 0;
  return { light: kind, at: [foot[0], foot[1] - base * size, foot[2]], flame: size };
}

/** A set's `flame` (the width of the cone this replaced, metres; 0.3 by default) as the pixel flame's size, as a multiple of its kind's: between half and twice. */
export const flameSize = (flame = 0.3): number => Math.min(2, Math.max(0.5, flame / 0.3));
