/** Places the Three.js camera from the simulated third-person rig, interpolated between the last two steps. */

import type { PerspectiveCamera } from 'three';
import { wrapAngle } from '../core/geom';
import { CAMERA } from '../data/tuning';
import { QUIET } from '../data/uiMood';
import { boomDir, followY, hangPoint, lensPosition } from '../systems/camera';
import type { Game } from '../systems/components';
import { raycast } from '../world/colliders';
import { roofedAt } from '../world/terrain';

/**
 * `calm` (0..1, ui/calm.ts, round 78): the quiet walk draws the boom back a little and lifts the view a hair. The extra length is read
 * against the walls like the rig's own, and is not asked for under a roof, mounted, or over an edge.
 */
export function placeCamera(camera: PerspectiveCamera, g: Game, alpha: number, calm = 0): void {
  const tr = g.ecs.c.transform.get(g.player.id)!;
  const rig = g.camera;
  const lerp = (p: number, q: number): number => p + (q - p) * alpha;
  const pivot = {
    x: lerp(tr.prev.x, tr.pos.x),
    y: followY(g.player.falling, lerp(tr.prev.y, tr.pos.y)) + CAMERA.pivotHeight + lerp(rig.prevMountLift, rig.mountLift),
    z: lerp(tr.prev.z, tr.pos.z),
  };
  const yaw = rig.prevYaw + wrapAngle(rig.yaw - rig.prevYaw) * alpha;
  const { base } = hangPoint(g.world, pivot, yaw, g.player.falling ? g.player.falling.lip.y + CAMERA.pivotHeight : undefined);
  let pitch = lerp(rig.prevPitch, rig.pitch);
  let dist = lerp(rig.prevDist, rig.dist);
  if (calm > 0.001 && !g.player.falling && !g.player.mount.active && !roofedAt(pivot.x, pivot.z)) {
    pitch = Math.min(CAMERA.pitchMax, pitch + QUIET.lift * calm);
    const want = dist * (1 + (QUIET.back - 1) * calm);
    const d = boomDir(yaw, pitch);
    const reach = want + CAMERA.margin;
    const end = { x: base.x + d.x * reach, y: base.y + d.y * reach, z: base.z + d.z * reach };
    dist = Math.max(dist, Math.min(want, raycast(g.world, base, end) * reach - CAMERA.margin)); // never through a wall the rig's own boom stopped short of
  }
  const lens = lensPosition(g.world, base, yaw, pitch, dist);
  camera.position.set(lens.x, lens.y, lens.z);
  camera.lookAt(base.x, base.y, base.z);
}
