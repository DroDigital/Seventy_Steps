/**
 * A blow from no one that falls on a ring of ground (round 62; the sky's bolts, systems/skyStrikes.ts, and the wards, vents and waves of
 * the ways, systems/ways.ts): everything with a body in it is struck, the investigator for a fixed measure and the rest for a base and a
 * share of their own health, and staggered. A guard is no use; a roll's i-frames are. Roofed ground and a dungeon's floor are spared, as
 * stepping under a roof is as good as leaving the ring. Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { roofedAt, inDungeon } from '../world/terrain';
import { strike } from './combat';
import { isAbsent, type Game } from './components';

export interface BlastWeight {
  player: number; // damage to the investigator
  foe: readonly [base: number, share: number, cap: number]; // to anything else: a base, and a share of its health, to a cap
  poise: number;
  hitstop?: number;
}

/** Strikes every body in the ring of `radius` about `at`. */
export function blast(g: Game, at: V3, radius: number, w: BlastWeight): void {
  const c = g.ecs.c;
  const sky = g.ecs.spawn(); // a body of no kind that the blow comes from: it is gone with the blow
  c.transform.set(sky, { pos: { ...at }, prev: { ...at }, yaw: 0, prevYaw: 0 });
  const victims: Entity[] = [];
  for (const [id] of c.combatant) {
    const pos = c.transform.get(id)?.pos;
    const body = c.body.get(id);
    if (!pos || !c.health.has(id) || !c.actor.has(id) || c.dead.has(id) || isAbsent(g, id)) continue;
    if (Math.hypot(pos.x - at.x, pos.z - at.z) > radius + (body?.radius ?? 0.4) * 0.5 || Math.abs(pos.y - at.y) > 4) continue;
    if (roofedAt(pos.x, pos.z) || inDungeon(pos.x, pos.z)) continue;
    victims.push(id);
  }
  for (const id of victims) {
    const [base, share, cap] = w.foe;
    const damage = id === g.player.id ? w.player : Math.min(cap, base + share * (c.health.get(id)?.max ?? 0));
    strike(g, sky, id, { damage, poise: w.poise, guard: 0, hitstop: w.hitstop ?? 6, parryable: false, interrupts: false, unblockable: true }, at);
  }
  g.ecs.despawn(sky);
}
