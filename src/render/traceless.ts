/**
 * Which bodies leave no mark on the world about them (round 83; render only, read-only on the simulation): no wake in the mist
 * (mistWakes.ts), no print in soft ground (creatureTracks.ts), no breath or dust (creatureAir.ts). One that is not there or not
 * seen, hidden, dead, a thing of the effects' own (`fx:`), a flyer (it is not on the ground it would mark), a spectre, or a form
 * drawn outside the world. The investigator is not asked about: round 80 lays theirs.
 */

import type { Entity } from '../core/ecs';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { defOf } from '../systems/creatures';

export function leavesNone(g: Game, id: Entity): boolean {
  const c = g.ecs.c;
  const model = c.model.get(id);
  if (!model || model.startsWith('fx:') || isAbsent(g, id) || isUnseen(g, id) || c.dead.has(id) || c.brain.get(id)?.state === 'hidden') return true;
  const def = defOf(g, id);
  return (c.brain.get(id)?.def.params.hover ?? 0) > 0 || def?.sprite?.silhouette === 'spectre' || !!def?.sprite?.outside;
}
