/**
 * A body come off a ledge (round 125, asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md): a drop's doorway
 * stands on a ledge over a lower room (world/dungeonLinks.ts), and the ground under a step there falls away by more than a step. The feet
 * used to follow the ground at once; inside a dungeon, a body whose ground falls away by more than `DROP.snap` in a step now keeps its
 * height and falls to it, quickly, and lands (heard and felt from `DROP.land`). The ledge's face stops a body below it (a wall from the
 * lower floor up to the doorway's sill), so the way is one way. Only within a dungeon's rooms, and never across a jump the step itself
 * did not make (a teleport, a rising at a sign: those set the body down where they put it). Pure: no Three.js.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { DROP } from '../data/tuning';
import { inDungeon } from '../world/terrain';
import type { Game } from './components';

interface Fall {
  v: number; // m/s, downward negative
  top: number; // where the fall began
}

const AIR = new WeakMap<Game, Map<Entity, Fall>>();
const airOf = (g: Game): Map<Entity, Fall> => {
  let m = AIR.get(g);
  if (!m) AIR.set(g, (m = new Map()));
  return m;
};

/** Whether a body is in the air, coming down off a ledge. */
export const isFalling = (g: Game, id: Entity): boolean => airOf(g).has(id);

/** Whether the ground under `at` has fallen away from `was` by more than a step, within a dungeon. */
const overEdge = (g: Game, was: number, at: V3): boolean => was - g.world.ground(at.x, at.z) > DROP.snap && inDungeon(at.x, at.z);

/** The height a body is held at while it is pushed out of the walls: where it was if it is in the air or stepping off a ledge, else its ground. */
export function heldAt(g: Game, id: Entity, was: number, at: V3): number {
  const ground = g.world.ground(at.x, at.z);
  return airOf(g).has(id) || overEdge(g, was, at) ? Math.max(ground, was) : ground;
}

/** After the push-out: a body on the ground stands on it; one in the air falls on toward it, and lands. */
export function fallStep(g: Game, id: Entity, was: number, at: V3, dt: number): number {
  const ground = g.world.ground(at.x, at.z);
  const air = airOf(g);
  let f = air.get(id);
  if (!f) {
    if (!overEdge(g, was, at)) return ground;
    f = { v: 0, top: was };
  }
  f.v -= DROP.gravity * dt;
  const y = was + f.v * dt;
  if (y > ground) {
    air.set(id, f);
    return y;
  }
  air.delete(id);
  if (f.top - ground >= DROP.land) g.events.emit('Dropped', { entity: id, at: { x: at.x, y: ground, z: at.z }, height: f.top - ground });
  return ground;
}

/** A body set down somewhere by a jump (a teleport, a rising) is no longer in the air. */
export function grounded(g: Game, id: Entity): void {
  airOf(g).delete(id);
}
