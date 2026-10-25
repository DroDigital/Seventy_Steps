/**
 * Which lights are heard, and how (round 78). Pure: the nearest lights in earshot (render/audio/heardLights.ts) become at most
 * HEARTH.voices voices, each with its level (the sound's own law of distance: whole within AUDIO.near, fading squared to its
 * range), its top (a flame the eye cannot see is dulled toward HEARTH.dull, and heard at a share of its level: through the wall,
 * not cut), its place between the ears and its flicker. render/audio/hearth.ts plays the plan.
 */

import type { V3 } from '../../core/geom';
import { HEARTH, type HearthKind } from '../../data/lightSounds';
import { AUDIO } from '../../data/tuning';
import type { HeardLight } from './heardLights';

export interface Voicing {
  key: number; // the light's identity (its place): a voice follows the same light from frame to frame
  kind: HearthKind;
  level: number; // 0..1 of the bus, before the flicker
  cutoff: number; // Hz
  pan: number;
  flick: number; // the flame's flicker now (0 out .. 1.6)
}

/** The level of a sound `d` metres off that carries `range`: the game's own law (cues.ts placeSound), whole within AUDIO.near and squared to nothing at its range. */
export function lawOf(d: number, range: number): number {
  const k = 1 - Math.max(0, d - AUDIO.near) / Math.max(1e-6, range - AUDIO.near);
  return k > 0 ? k * k : 0;
}

/** A light's identity: its place, to a centimetre. */
export const keyOf = (h: { x: number; y: number; z: number }): number => (Math.round(h.x * 100) * 73856093) ^ (Math.round(h.y * 100) * 19349663) ^ (Math.round(h.z * 100) * 83492791) || 1;

const plan: Voicing[] = [];

/**
 * The voices to sound for `heard`, loudest first. `open`: how much of the light is in the open to the ear, 0 (stone between) to 1 (the
 * eye sees it); the lights the eye is not asked about (lamps, Signs) are asked of the occlusion instead. `lamps` (0..1): how far the street lamps are
 * lit (they burn in the picture at every hour but are only seen at dusk; they hiss only as they are seen). The array is reused.
 */
export function hearthPlan(heard: readonly HeardLight[], listener: V3, right: V3, open: (h: HeardLight) => number, lamps = 1): readonly Voicing[] {
  plan.length = 0;
  for (const h of heard) {
    if (h.kind === 'window') continue;
    const k = HEARTH.kinds[h.kind];
    if (h.d >= k.range || (h.kind === 'lamp' && lamps <= 0.02)) continue;
    const hidden = 1 - Math.min(1, Math.max(0, open(h)));
    const law = lawOf(h.d, k.range);
    if (law <= 0) continue;
    const dx = h.x - listener.x;
    const dz = h.z - listener.z;
    const flat = Math.hypot(dx, dz);
    const v: Voicing = {
      key: keyOf(h),
      kind: h.kind,
      level: k.gain * law * (HEARTH.floor + (1 - HEARTH.floor) * (1 - hidden)) * (h.kind === 'lamp' ? lamps : 1),
      cutoff: HEARTH.dull + (k.cutoff - HEARTH.dull) * (1 - hidden) * (0.45 + 0.55 * (1 - h.d / k.range)),
      pan: flat < 1e-3 ? 0 : (AUDIO.pan * (dx * right.x + dz * right.z)) / flat,
      flick: Math.min(1.6, Math.max(0, h.flicker)),
    };
    let at = plan.length; // insertion by level, loudest first
    plan.push(v);
    while (at > 0 && plan[at - 1]!.level < v.level) [plan[at], at] = [plan[at - 1]!, at - 1];
    plan[at] = v;
  }
  plan.length = Math.min(plan.length, HEARTH.voices);
  return plan;
}
