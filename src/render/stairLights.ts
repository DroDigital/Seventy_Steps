/**
 * The lights of the Stairs of Slumber's descent (round 105): every light of the stairs' dungeon that stands more than a metre below
 * its head (the threshold's torches stay bright) is dimmed to SLUMBER.light.dim, so the stairs are lit by the lantern and the way
 * down is a dim one, and it may gutter now and then, the more so as the mind fails: a rare dip of a fraction of a second, in a window
 * of its own (`stairGutter`). Lights off the stairs keep their own waver, and the lantern its own (lanternLife.ts). Pure.
 */

import { hash2 } from '../core/rng';
import { SLUMBER } from '../data/tuning';
import { descentSpan, SLUMBER_ID } from '../world/descent';
import type { DungeonLayout } from '../world/dungeonKit';
import type { LightSpot } from './worldLights';

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** Marks the lights of the Stairs of Slumber's descent: a light of its dungeon more than a metre below the head. */
export function markStairLights(layout: DungeonLayout, lights: LightSpot[]): void {
  if (layout.def.id !== SLUMBER_ID) return;
  const { top } = descentSpan(layout);
  for (const l of lights) if (l.y < top + 1) l.stairs = true;
}

/** The seed of a light, in [0, 1): its own gutter and its own moment (as worldLights' flames seed theirs). */
export const lightSeed = (s: { x: number; y: number; z: number }): number => (Math.abs(Math.sin(s.x * 12.9898 + s.z * 78.233 + s.y * 4.1414)) * 43758.5453) % 1;

/** The share of a light's strength, halo and flame that is left: a stair light's is dimmed (round 105). */
export const stairDim = (s: LightSpot): number => (s.stairs ? SLUMBER.light.dim : 1);

/**
 * A stair light's gutter now (round 105): 1, or a dip while it sputters. It may gutter at all only if its seed is within the share of
 * stair lights that may now (the share grows with the madness). Then, in each window of SLUMBER.flicker.window seconds, with a chance
 * that grows the same way, it dips once at a moment of its own: down at once, a slow recovery.
 */
export function stairGutter(seed: number, time: number, madness: number): number {
  const F = SLUMBER.flicker;
  const m = clamp01(madness);
  if (seed >= lerp(F.share[0], F.share[1], m)) return 1;
  const w = Math.floor(time / F.window);
  const key = Math.floor(seed * 1e6);
  if (hash2(key, w, 23) >= lerp(F.chance[0], F.chance[1], m)) return 1;
  const start = w * F.window + hash2(key, w, 29) * (F.window - F.dip);
  const u = (time - start) / F.dip;
  if (u < 0 || u >= 1) return 1;
  const sag = u < 0.3 ? u / 0.3 : (1 - u) / 0.7;
  return 1 - F.depth * sag;
}

/** A stair light's waver (round 105): its own steady wobble, as its kind's, and `stairGutter`'s rare dips in place of the mind's own. */
export function stairWaver(s: LightSpot, amount: number, time: number, madness: number): number {
  const phase = Math.abs(Math.sin(s.x * 12.9898 + s.z * 78.233)) * 40;
  const wobble = amount <= 0 ? 1 : 1 + amount * (0.6 * Math.sin(time * 7.3 + phase) + 0.4 * Math.sin(time * 13.1 + phase * 0.37));
  return wobble * stairGutter(lightSeed(s), time, madness);
}
