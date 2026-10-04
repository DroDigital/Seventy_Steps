/**
 * Where each person does what they do (round 39): where they rose by their sign, a little turned from it,
 * each their own way. Pure: no Three.js.
 */

import { hash2 } from '../core/rng';
import type { XZ } from '../core/geom';
import { ACTS, type ActKind } from '../data/npcActs';
import { raycast } from '../world/colliders';
import type { Game } from './components';

export interface Spot extends XZ {
  yaw: number;
}

/** Whether a step from one place to another is clear: no wall (at the height of a man's waist and knee), no more than a step up or down. */
export function clearStep(g: Game, a: XZ, b: XZ): boolean {
  const [ya, yb] = [g.world.ground(a.x, a.z), g.world.ground(b.x, b.z)];
  if (Math.abs(yb - ya) > 0.7) return false;
  return [0.4, 1.1].every((h) => raycast(g.world, { x: a.x, y: ya + h, z: a.z }, { x: b.x, y: yb + h, z: b.z }) >= 1);
}

/** What `id` does here, and where. */
export function placeFor(id: string, home: Spot): { kind: ActKind; spot: Spot } | null {
  const act = ACTS[id];
  if (!act) return null;
  if (act.post) return { kind: act.kind, spot: { x: act.post.x, z: act.post.z, yaw: act.post.yaw } }; // exactly where they are put
  const turn = (hash2(id.length, [...id].reduce((h, c) => h + c.charCodeAt(0), 0), 3) - 0.5) * 1.1; // a little turned from the sign, each their own way
  return { kind: act.kind, spot: { x: home.x, z: home.z, yaw: home.yaw + turn } };
}
