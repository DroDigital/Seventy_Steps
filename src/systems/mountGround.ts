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

/** Every circle must remain where requested; summoning and turning never push the rider through a wall. */
export function footprintClear(g: Game, at: V3, yaw: number): boolean {
  const t = MOUNT_TRAVERSAL;
  const [s, c] = [Math.sin(yaw), Math.cos(yaw)];
  for (const offset of t.offsets) {
    const sample = { x: at.x + s * offset, y: at.y, z: at.z + c * offset };
    sample.y = g.world.ground(sample.x, sample.z);
    if (!mountGroundAllowed(g, sample) || Math.abs(sample.y - at.y) > Math.abs(offset) * t.maxSlope + t.maxStep) return false;
    const resolved = { ...sample };
    resolveCapsule(g.world, resolved, t.radius, t.height);
    if (Math.hypot(resolved.x - sample.x, resolved.z - sample.z) > 0.001) return false;
    for (const [id, body] of g.ecs.c.body) {
      if (id === g.player.id || isAbsent(g, id)) continue;
      const pos = g.ecs.c.transform.get(id)?.pos;
      if (pos && Math.hypot(pos.x - sample.x, pos.z - sample.z) < t.radius + body.radius) return false;
    }
    // A broad axle cannot perch on a steep edge that happens to miss its centreline.
    for (const side of [-1, 1]) {
      const x = sample.x + c * t.radius * side;
      const z = sample.z - s * t.radius * side;
      const y = g.world.ground(x, z);
      if (!mountGroundAllowed(g, { x, y, z }) || Math.abs(y - sample.y) > t.maxSlope * t.radius) return false;
    }
  }
  return true;
}
