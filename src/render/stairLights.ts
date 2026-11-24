/**
 * The lights of the Stairs of Slumber's descent (round 105): every light of the stairs' dungeon that stands more than a metre below
 * its head (the threshold's torches stay bright) is dimmed, so the stairs are lit by the lantern and the way down is a dim one, and it
 * may gutter now and then, the more so as the mind fails: a rare dip of a fraction of a second, in a window of its own (`stairGutter`).
 * Round 120 (asked: the torches' brightness should diminish progressively with depth): each light keeps the share of its own depth,
 * from SLUMBER.light.top at the head to SLUMBER.light.bottom on the deepest floor, and its flame burns lower the deeper it hangs.
 * Lights off the stairs keep their own waver, and the lantern its own (lanternLife.ts). Pure.
 */

import { hash2 } from '../core/rng';
import { SLUMBER } from '../data/tuning';
import { descentSpan, SLUMBER_ID } from '../world/descent';
import type { DungeonLayout } from '../world/dungeonKit';
import type { LightSpot } from './worldLights';

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/** The height over its floor at which a light is reckoned to stand, for its depth (a wall torch hangs about this high: sconces.ts). */
const HUNG = 2;

/** Marks the lights of the Stairs of Slumber's descent (a light of its dungeon more than a metre below the head) with the share of the descent they stand at. */
export function markStairLights(layout: DungeonLayout, lights: LightSpot[]): void {
  if (layout.def.id !== SLUMBER_ID) return;
  const { top, bottom } = descentSpan(layout);
  for (const l of lights) if (l.y < top + 1) l.stairs = clamp01((top + HUNG - l.y) / (top - bottom));
}

/** The seed of a light, in [0, 1): its own gutter and its own moment (as worldLights' flames seed theirs). */
export const lightSeed = (s: { x: number; y: number; z: number }): number => (Math.abs(Math.sin(s.x * 12.9898 + s.z * 78.233 + s.y * 4.1414)) * 43758.5453) % 1;

/** The share of a light's strength, halo and flame that is left: a stair light's falls by the same ratio with each metre down, from SLUMBER.light.top at the head to SLUMBER.light.bottom on the deepest floor (round 120; it was one share for all, round 105's). */
export function stairDim(s: LightSpot): number {
  if (s.stairs === undefined) return 1;
  const { top, bottom } = SLUMBER.light;
  return top * Math.pow(bottom / top, clamp01(s.stairs));
}

/** How tall a stair light's flame burns, as a share of its own: lower the deeper it hangs (round 120). */
export const stairFlame = (s: LightSpot): number => (s.stairs === undefined ? 1 : 1 - SLUMBER.light.shrink * clamp01(s.stairs));

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
