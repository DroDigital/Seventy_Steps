/**
 * When a caster's wind-up ends (round 51): the frame its bolt leaves, its beam opens, its ground is
 * marked, its summoning or gaze begins. The particles that gather before it (`attackFx`) and the sound
 * that gathers (`attackAudio`) both keep to it. Pure: no Three.js.
 */

import type { MoveDef } from '../data/moves';

/** Frames of gathering before the release. */
export const GATHER = 28;

/** The frame `def` looses what it winds up toward, or undefined for a move that winds up toward nothing (a melee blow, a teleport). */
export function releaseFrame(def: MoveDef): number | undefined {
  if (def.volley) return def.volley.frame;
  if (def.shot) return def.shot.frame;
  if (def.sweep) return def.sweep.window[0];
  if (def.barrage) return def.barrage.window[0];
  if (def.marks) return def.marks.frame;
  if (def.pool) return def.pool.frame;
  if (def.wave) return def.wave.frame;
  if (def.effect && def.effect.kind !== 'teleport') return def.effect.window[0];
  return undefined;
}
