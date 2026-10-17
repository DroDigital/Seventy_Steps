/** Who can be struck (spec §3B): the bodies a blow, a shot or a pool from one side may touch. Pure: no Three.js. */

import type { Entity } from '../core/ecs';
import { isAbsent, isConcealed, type Combatant, type Game } from './components';
import { awaitsIntroduction } from './npcIntroduction';

/** Who a blow from `faction` can touch: living, present, unconcealed combatants of the other side with a body. Hallucinations and the investigator touch only each other. */
export function hostiles(g: Game, faction: Combatant['faction'] | undefined, conjured: boolean, byPlayer: boolean): Entity[] {
  const { combatant, health, body, phantom } = g.ecs.c;
  const out: Entity[] = [];
  for (const [t, c] of combatant) {
    if ((t === g.player.id && (g.cutscene || g.player.falling)) || awaitsIntroduction(g, t)) continue; // (nothing in the room can reach a body that has gone over an edge, round 54)
    if (c.faction === faction || isAbsent(g, t) || !body.has(t) || isConcealed(g, t)) continue;
    if (phantom.has(t) ? !byPlayer : conjured && t !== g.player.id) continue;
    if ((health.get(t)?.hp ?? 0) > 0) out.push(t);
  }
  return out;
}

export const targetsOf = (g: Game, id: Entity): Entity[] => hostiles(g, g.ecs.c.combatant.get(id)?.faction, g.ecs.c.phantom.has(id), id === g.player.id);

/**
 * `list` walked one by one, skipping whoever has gone by the time their turn comes (playtest round 24): a blow
 * that kills a boss clears its decoys and summons at once (bossFight.ts), and a loop that strikes
 * several bodies in a step came to one of them with no body left to read. A joining boss may also
 * have died with its leader since this list was built; it must not be struck and paid for twice.
 */
export function* live(g: Game, list: readonly Entity[]): Generator<Entity, void, undefined> {
  const { transform, body, health } = g.ecs.c;
  for (const t of list) if (transform.has(t) && body.has(t) && (health.get(t)?.hp ?? 0) > 0) yield t;
}
