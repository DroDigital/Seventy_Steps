/**
 * Whether a wall stands between a blow and the body it would strike (round 66: the investigator cannot cut through a wall, nor can a
 * foe; asked for). A line is drawn at the height of the blow from the one who swings to the near side of the target's body, and a
 * collider that crosses it, a pillar, a closed door or a house's wall, stops the blow; a low fence or a sill under the line does not.
 * A horror's own blows are not tested: its sweeps, quakes and bursts are the "boss attacks" that pass walls (and the arena it fights in is
 * its own). Shots and beams already stop at walls (projectiles.ts, strikes.ts). Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import { hasLineOfSight } from '../world/colliders';
import type { Game } from './components';

const CHEST = [0.5, 1.5] as const; // metres above the swinger's feet that the line may be drawn at: where a blow is struck
const SPARE = 0.05; // nearer than this to the body's near side, nothing can stand between

export function walled(g: Game, attacker: Entity, target: Entity, y: number): boolean {
  const c = g.ecs.c;
  if (c.fight.has(attacker)) return false; // a horror's blows pass walls
  const [a, t, body] = [c.transform.get(attacker)?.pos, c.transform.get(target)?.pos, c.body.get(target)];
  if (!a || !t || !body) return false;
  const [dx, dz] = [a.x - t.x, a.z - t.z];
  const d = Math.hypot(dx, dz);
  const reach = Math.min(body.radius, d); // the target's near side, toward the swinger
  if (d - reach < SPARE) return false;
  const level = Math.min(a.y + CHEST[1], Math.max(a.y + CHEST[0], y));
  const to = { x: t.x + (dx / d) * reach, y: Math.min(t.y + body.height - 0.1, Math.max(t.y + 0.3, level)), z: t.z + (dz / d) * reach };
  return !hasLineOfSight(g.world, { x: a.x, y: level, z: a.z }, to);
}
