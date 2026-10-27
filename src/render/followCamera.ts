/** Places the Three.js camera from the simulated third-person rig, interpolated between the last two steps. */

import { Vector3, type PerspectiveCamera } from 'three';
import { wrapAngle } from '../core/geom';
import { CAMERA_MODES } from '../data/cameraModes';
import { CAMERA } from '../data/tuning';
import { QUIET } from '../data/uiMood';
import { anchorPoint, boomDir, followY, hangPoint, lensPosition } from '../systems/camera';
import type { Game } from '../systems/components';
import { raycast } from '../world/colliders';
import { roofedAt } from '../world/terrain';

/**
 * `calm` (0..1, ui/calm.ts, round 80): the quiet walk draws the boom back a little and lifts the view a hair. The extra length is read
 * against the walls like the rig's own, and is not asked for under a roof, mounted, or over an edge.
 */
export function placeCamera(camera: PerspectiveCamera, g: Game, alpha: number, calm = 0): void {
  const tr = g.ecs.c.transform.get(g.player.id)!;
  const rig = g.camera;
  const tune = CAMERA_MODES[rig.mode];
  const lerp = (p: number, q: number): number => p + (q - p) * alpha;
  const pivot = {
    x: lerp(tr.prev.x, tr.pos.x),
    y: followY(g.player.falling, lerp(tr.prev.y, tr.pos.y)) + tune.pivotHeight + lerp(rig.prevMountLift, rig.mountLift),
    z: lerp(tr.prev.z, tr.pos.z),
  };
  const yaw = rig.prevYaw + wrapAngle(rig.yaw - rig.prevYaw) * alpha;
  const anchor = anchorPoint(pivot, yaw, lerp(rig.prevLead, rig.lead), lerp(rig.prevRise, rig.rise));
  const { base } = hangPoint(g.world, anchor, yaw, g.player.falling ? g.player.falling.lip.y + tune.pivotHeight : undefined, tune.shoulder);
  let pitch = lerp(rig.prevPitch, rig.pitch);
  let dist = lerp(rig.prevDist, rig.dist);
  if (calm > 0.001 && !g.player.falling && !g.player.mount.active && !roofedAt(pivot.x, pivot.z)) {
    pitch = Math.min(tune.pitchMax, pitch + QUIET.lift * calm);
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

/** The lens's vertical field of view as the rig has it while framing a tall foe, before the mind's breathing of it (render/fx.ts). */
export function fovOf(g: Game, alpha: number): number {
  return g.camera.prevFov + (g.camera.fov - g.camera.prevFov) * alpha;
}

/**
 * Where the world's distortion is centred and the sounds are heard from: the lens, or, when the boom runs long (a lock framing a tall foe),
 * the point `CAMERA.near` metres from the investigator along it, so that what is fought keeps the clear zone and the volume the classic boom gave it.
 */
export function nearLens(camera: PerspectiveCamera, g: Game): Vector3 {
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  const [dx, dy, dz] = [camera.position.x - me.x, camera.position.y - me.y, camera.position.z - me.z];
  const d = Math.hypot(dx, dz);
  if (d <= CAMERA.near) return camera.position;
  const k = CAMERA.near / d;
  return near.set(me.x + dx * k, me.y + dy * k, me.z + dz * k);
}

const near = new Vector3(); // scratch, so a frame allocates nothing
