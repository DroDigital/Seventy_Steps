/** The shared mount footprint cannot enter buildings, dungeon doors, boss grounds or water. */
import type { V3 } from '../core/geom';
import { MOUNT_TRAVERSAL } from '../data/mounts';
import { WORLD } from '../data/tuning';
import { resolveCapsule } from '../world/colliders';
import { worldLayout } from '../world/placements';
import { inDungeon } from '../world/terrain';
import { regionAt } from '../world/worldMap';
import { engagedFights } from './bossFight';
import { isAbsent, type Game } from './components';

export function mountGroundAllowed(g: Game, at: V3): boolean {
  if (!g.overworld || !regionAt(at.x, at.z) || inDungeon(at.x, at.z) || at.y <= WORLD.seaLevel + 0.4 || g.reality.flood > 0.05 || engagedFights(g).length) return false;
  const r = MOUNT_TRAVERSAL.radius;
  return !worldLayout().arenas.some((a) => Math.hypot(at.x - a.x, at.z - a.z) < a.radius + r);
}

/** Past the region's edge the ground is the fall, not a wall. Water and slopes still refuse. */
function overVoid(at: V3): boolean {
  return !regionAt(at.x, at.z);
}

function circleClear(g: Game, sample: V3, atY: number, reach: number, edge: boolean): boolean {
  if (edge && overVoid(sample)) return true;
  if (!mountGroundAllowed(g, sample) || Math.abs(sample.y - atY) > reach) return false;
  const t = MOUNT_TRAVERSAL;
  const resolved = { ...sample };
  resolveCapsule(g.world, resolved, t.radius, t.height);
  if (Math.hypot(resolved.x - sample.x, resolved.z - sample.z) > 0.001) return false;
  for (const [id, body] of g.ecs.c.body) {
    if (id === g.player.id || isAbsent(g, id)) continue;
    const pos = g.ecs.c.transform.get(id)?.pos;
    if (pos && Math.hypot(pos.x - sample.x, pos.z - sample.z) < t.radius + body.radius) return false;
  }
  return true;
}

/**
 * Every circle must remain where requested; summoning and turning never push the rider through a wall.
 * `edge` is a ride already under way: the nose may overhang the void, and the step off it is the fall.
 */
export function footprintClear(g: Game, at: V3, yaw: number, edge = false): boolean {
  const t = MOUNT_TRAVERSAL;
  const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
  for (const offset of t.offsets) {
    const sample = { x: at.x + s * offset, y: at.y, z: at.z + c * offset };
    sample.y = g.world.ground(sample.x, sample.z);
    if (!circleClear(g, sample, at.y, Math.abs(offset) * t.maxSlope + t.maxStep, edge)) return false;
    // A broad axle cannot perch on a steep edge that happens to miss its centreline.
    for (const side of [-1, 1]) {
      const x = sample.x + c * t.radius * side;
      const z = sample.z - s * t.radius * side;
      const y = g.world.ground(x, z);
      const at = { x, y, z };
      if (edge && overVoid(at)) continue;
      if (!mountGroundAllowed(g, at) || Math.abs(y - sample.y) > t.maxSlope * t.radius) return false;
    }
  }
  return true;
}
