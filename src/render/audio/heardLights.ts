/**
 * The lights in earshot (round 80): render/worldLights.ts sets this list each frame, from the lights it already ranks about the
 * investigator, and render/audio/hearth.ts reads it. A module's own list (as LIGHT_NERVES is) so the sound needs no wire through
 * the game's main loop. The nearest first; windows are mute and are not listed.
 */

import { HEARTH } from '../../data/lightSounds';
import type { LightKind } from '../../data/tuning';

export interface HeardLight {
  x: number;
  y: number;
  z: number;
  kind: LightKind;
  d: number; // metres from the investigator's chest
  v: number; // the share of the light the eye can see (lightSight.ts): a torch round a corner is at 0
  flicker: number; // its waver now (about 1; a failing mind's flames gutter toward 0): the crackle swells in step with it
}

export const HEARD_LIGHTS: HeardLight[] = [];

const pool: HeardLight[] = Array.from({ length: HEARTH.listed }, () => ({ x: 0, y: 0, z: 0, kind: 'torch', d: 0, v: 1, flicker: 1 }));

/** Empties the list for a new frame. */
export function beginHeard(): void {
  HEARD_LIGHTS.length = 0;
}

/** Adds a light to the list (nearest first); false when the list is full. */
export function pushHeard(s: { x: number; y: number; z: number; kind: LightKind }, d: number, v: number, flicker: number): boolean {
  const n = HEARD_LIGHTS.length;
  if (n >= pool.length) return false;
  const h = pool[n]!;
  [h.x, h.y, h.z, h.kind, h.d, h.v, h.flicker] = [s.x, s.y, s.z, s.kind, d, v, flicker];
  HEARD_LIGHTS.push(h);
  return true;
}
