/**
 * Third-person camera (spec §3B), simulated at 60 Hz: orbits a pivot above the player from look
 * input, swings toward the lock-on target, and pulls in when the boom hits a collider or the
 * ground (then eases back out). The boom hangs slightly over the right shoulder. Pure: the renderer
 * applies it to a Three.js camera.
 *
 * Four looks (data/cameraModes.ts). The rig keeps the mode's numbers; Classic, Low hero and Long lens frame a locked-on foe: the point the boom
 * hangs from (the anchor) moves toward the foe and up to the height worth looking at, and the boom lengthens with the foe's height, so
 * the lens stays on the line `yaw` looks along (the sticks, the lock and the minimap read it) but stands back far enough to see the whole.
 */

import { clamp, wrapAngle, yawOf, type V3 } from '../core/geom';
import { CAMERA_MODES, type CameraMode, type FrameTuning, type CameraTuning } from '../data/cameraModes';
import { CAMERA, FALL, WATER } from '../data/tuning';
import { raycast, type CollisionWorld } from '../world/colliders';

export interface CameraRig {
  mode: CameraMode;
  yaw: number; // the direction the camera looks (0 = +z)
  pitch: number; // positive looks down from above
  dist: number; // boom length after collision
  prevYaw: number;
  prevPitch: number;
  prevDist: number;
  pos: V3; // lens position after the last step
  recenter: number; // frames left swinging behind the player
  mountLift: number; // eased vehicle perspective above the ordinary pivot
  prevMountLift: number;
  lead: number; // metres the anchor stands ahead of the pivot, along `yaw` (framing a foe)
  prevLead: number;
  rise: number; // metres the anchor stands above the pivot
  prevRise: number;
  reach: number; // the boom length asked of the walls: the mode's, or a framed foe's
  fov: number; // the lens, vertical degrees
  prevFov: number;
}

/** The foe a lock holds, as the camera frames it: where it stands and how tall it is. */
export interface Frame {
  feet: V3;
  height: number;
}

export interface CameraInput {
  lookX: number;
  lookY: number;
  pivot: V3;
  focus: V3 | null; // lock-on aim point
  frame?: Frame | null; // the locked foe, when it is to be framed (not while talking or driving)
  behind: number; // the player's yaw, for recentring
  distance?: number; // a vehicle needs a longer boom; collision still shortens it
  probe?: number; // over an edge: the height the boom's walls are read at (hangPoint)
  sea?: boolean; // the fall is into the sea: the camera follows the body down and looks down at it, not straight down (round 55)
}

export function createCameraRig(yaw: number, mode: CameraMode = 'classic'): CameraRig {
  const { pitch, distance, fov } = CAMERA_MODES[mode];
  return { mode, yaw, pitch, dist: distance, prevYaw: yaw, prevPitch: pitch, prevDist: distance, pos: { x: 0, y: 0, z: 0 }, recenter: 0, mountLift: 0, prevMountLift: 0, lead: 0, prevLead: 0, rise: 0, prevRise: 0, reach: distance, fov, prevFov: fov };
}

/** Takes up a look (the setting), setting down the boom of the one before: its pitch and length are not the new one's. */
export function setCameraMode(rig: CameraRig, mode: CameraMode): void {
  if (rig.mode === mode) return;
  rig.mode = mode;
  resetAim(rig, rig.yaw);
  resetBoom(rig);
}

/** The boom as it hangs at rest: the mode's length, no framing, no driver's lift (a rise from a fall, a candle or a journey). */
export function resetBoom(rig: CameraRig): void {
  const { distance, fov } = CAMERA_MODES[rig.mode];
  Object.assign(rig, { mountLift: 0, prevMountLift: 0, dist: distance, prevDist: distance, reach: distance, lead: 0, prevLead: 0, rise: 0, prevRise: 0, fov, prevFov: fov });
}

/** The camera turned to `yaw`, at its mode's resting pitch. */
export function resetAim(rig: CameraRig, yaw: number): void {
  const { pitch } = CAMERA_MODES[rig.mode];
  Object.assign(rig, { yaw, prevYaw: yaw, pitch, prevPitch: pitch });
}

/** Unit vector from the pivot toward the lens. */
export function boomDir(yaw: number, pitch: number): V3 {
  return { x: -Math.sin(yaw) * Math.cos(pitch), y: Math.sin(pitch), z: -Math.cos(yaw) * Math.cos(pitch) };
}

/** The point the boom hangs from, before the shoulder: the pivot, moved `lead` metres along `yaw` and `rise` up (framing a foe). */
export function anchorPoint(pivot: V3, yaw: number, lead: number, rise: number): V3 {
  return { x: pivot.x + Math.sin(yaw) * lead, y: pivot.y + rise, z: pivot.z + Math.cos(yaw) * lead };
}

/** The point the boom hangs from: the pivot moved over the player's right shoulder, short of any wall. */
export function shoulderPoint(w: CollisionWorld, pivot: V3, yaw: number, shoulder = CAMERA.shoulder): V3 {
  const rx = -Math.cos(yaw);
  const rz = Math.sin(yaw);
  const reach = shoulder + CAMERA.margin;
  const end = { x: pivot.x + rx * reach, y: pivot.y, z: pivot.z + rz * reach };
  const k = clamp(raycast(w, pivot, end) * reach - CAMERA.margin, 0, shoulder);
  return { x: pivot.x + rx * k, y: pivot.y, z: pivot.z + rz * k };
}

/** The height the camera follows the investigator at: over an edge it follows only part of the way down, and looks down after them (round 54). */
export function followY(f: { lip: V3; water?: unknown } | null, y: number): number {
  return f ? f.lip.y + (y - f.lip.y) * (f.water ? WATER.follow : FALL.follow) : y;
}

/**
 * Where the boom hangs from, and the point its walls are read at. Over an edge the body is below the ground the world reads (a pit's floor
 * is the room's), so the ground and walls are read from the lip's height, `probe`, and only the hanging point drops: the camera stays at the
 * rim and looks down after the fall, rather than being shut in against the floor the body has gone through (round 54).
 */
export function hangPoint(w: CollisionWorld, pivot: V3, yaw: number, probe?: number, shoulder = CAMERA.shoulder): { read: V3; base: V3 } {
  if (probe === undefined) {
    const base = shoulderPoint(w, pivot, yaw, shoulder);
    return { read: base, base };
  }
  const read = shoulderPoint(w, { ...pivot, y: probe }, yaw, shoulder);
  return { read, base: { ...read, y: pivot.y } };
}

/** Lens position for a boom hanging from `base`, kept above the ground. */
export function lensPosition(w: CollisionWorld, base: V3, yaw: number, pitch: number, dist: number): V3 {
  const d = boomDir(yaw, pitch);
  const p = { x: base.x + d.x * dist, y: base.y + d.y * dist, z: base.z + d.z * dist };
  p.y = Math.max(p.y, w.ground(p.x, p.z) + CAMERA.clearance);
  return p;
}

const smooth = (t: number): number => t * t * (3 - 2 * t);
const RAD = Math.PI / 180;
const FIT = 1.15; // the room left about a foe the lens widens to fit
const FOV_FOLLOW = 6; // 1/s: how fast the lens widens where a wall cuts the boom short, and narrows again

/** What a lock on `foe` asks of the camera, in the looks that frame one: where the anchor stands, how long the boom, how wide the lens, and the pitch that puts the lens at a low height below what it looks at. */
export function framing(f: FrameTuning, tune: CameraTuning, foe: Frame, pivot: V3): { lead: number; rise: number; reach: number; fov: number; pitch: number } {
  const h = clamp(foe.height, f.height[0], f.height[1]);
  const lead = Math.min(f.leadMax, Math.hypot(foe.feet.x - pivot.x, foe.feet.z - pivot.z) * f.lead);
  const back = clamp(f.back[0] + f.back[1] * h, f.back[2], f.back[3]);
  const aimY = foe.feet.y + clamp(f.aim[0] * h, f.aim[1], f.aim[2]);
  const reach = Math.max(tune.distance, back) + lead;
  const lensY = pivot.y + clamp(f.lensUp[0] + f.lensUp[1] * h, f.lensUp[2], f.lensUp[3]);
  const sin = Math.sin(f.pitchMost);
  return {
    lead,
    rise: aimY - pivot.y,
    reach,
    fov: tune.fov + (f.fovTall - tune.fov) * smooth(clamp((h - f.tall[0]) / (f.tall[1] - f.tall[0]), 0, 1)),
    pitch: Math.asin(clamp((lensY - aimY) / reach, -sin, sin)),
  };
}

/** The vertical field of view (degrees) in which a lens at `lens`, looking at `base`, holds a foe from its feet to `height` metres above them, with a little to spare. */
export function fitFov(lens: V3, base: V3, feet: V3, height: number): number {
  const across = Math.max(1, Math.hypot(feet.x - lens.x, feet.z - lens.z));
  const look = Math.atan2(base.y - lens.y, Math.max(1, Math.hypot(base.x - lens.x, base.z - lens.z)));
  const off = (y: number): number => Math.abs(Math.atan2(y - lens.y, across) - look);
  return (2 * Math.max(off(feet.y), off(feet.y + height)) * FIT) / RAD;
}

export function stepCamera(rig: CameraRig, inp: CameraInput, w: CollisionWorld, dt: number): void {
  const tune = CAMERA_MODES[rig.mode];
  rig.prevYaw = rig.yaw;
  rig.prevPitch = rig.pitch;
  rig.prevDist = rig.dist;
  rig.prevLead = rig.lead;
  rig.prevRise = rig.rise;
  rig.prevFov = rig.fov;
  const k = Math.min(1, CAMERA.follow * dt);
  const f = tune.frame;
  const fr = f && inp.frame && inp.focus && inp.probe === undefined ? framing(f, tune, inp.frame, inp.pivot) : null;
  const asked = inp.distance ?? tune.distance;
  if (f) {
    const kf = Math.min(1, f.follow * dt); // the framing comes in and goes out slowly, so a lock lost or switched is a drift, not a cut
    rig.lead += ((fr?.lead ?? 0) - rig.lead) * kf;
    rig.rise += ((fr?.rise ?? 0) - rig.rise) * kf;
    rig.reach += ((fr?.reach ?? asked) - rig.reach) * kf;
  } else rig.reach = asked;
  if (inp.focus) {
    const dx = inp.focus.x - inp.pivot.x;
    const dz = inp.focus.z - inp.pivot.z;
    rig.yaw = wrapAngle(rig.yaw + wrapAngle(yawOf(dx, dz) - rig.yaw) * k);
    const want = fr ? fr.pitch : tune.lockPitch + Math.atan2(inp.pivot.y - inp.focus.y + tune.lockLift, Math.max(1, Math.hypot(dx, dz)));
    rig.pitch += (clamp(want, tune.pitchMin, fr && f ? f.pitchMost : tune.lockPitchMax) - rig.pitch) * k;
    rig.recenter = 0;
  } else if (inp.probe !== undefined) {
    rig.pitch += ((inp.sea ? WATER.lookPitch : FALL.lookPitch) - rig.pitch) * k; // over an edge the camera is not the hand's: it swings up to look down after the fall (round 54)
    rig.recenter = 0;
  } else if (rig.recenter > 0) {
    rig.recenter--;
    rig.yaw = wrapAngle(rig.yaw + wrapAngle(inp.behind - rig.yaw) * k);
    rig.pitch += (tune.pitch - rig.pitch) * k;
  } else {
    rig.yaw = wrapAngle(rig.yaw - inp.lookX);
    rig.pitch = clamp(rig.pitch + inp.lookY, tune.pitchMin, tune.pitchMax);
  }
  const length = Math.hypot(rig.lead, rig.rise);
  if (length > 1e-4) { // the anchor stops short of a wall, as the boom does
    const asks = length + CAMERA.margin;
    const free = clamp(raycast(w, inp.pivot, anchorPoint(inp.pivot, rig.yaw, (rig.lead * asks) / length, (rig.rise * asks) / length)) * asks - CAMERA.margin, 0, length) / length;
    rig.lead *= free;
    rig.rise *= free;
  }
  const { read, base } = hangPoint(w, anchorPoint(inp.pivot, rig.yaw, rig.lead, rig.rise), rig.yaw, inp.probe, tune.shoulder);
  const d = boomDir(rig.yaw, rig.pitch);
  const reach = rig.reach + CAMERA.margin;
  const end = { x: read.x + d.x * reach, y: read.y + d.y * reach, z: read.z + d.z * reach };
  const allowed = Math.max(CAMERA.minDistance, raycast(w, read, end) * reach - CAMERA.margin);
  rig.dist = allowed < rig.dist ? allowed : Math.min(allowed, rig.dist + tune.easeOut * dt);
  rig.pos = lensPosition(w, base, rig.yaw, rig.pitch, rig.dist);
  const fit = fr && f && inp.frame ? fitFov(rig.pos, base, inp.frame.feet, clamp(inp.frame.height, f.height[0], f.height[1])) : 0; // where a wall or a near foe leaves less room than the framing counted on, the lens widens to keep it whole
  const lens = Math.min(tune.keepFov ?? tune.fov, Math.max(fr?.fov ?? tune.fov, fit));
  const want = tune.keepFov ? clamp(2 * Math.atan((Math.tan((lens * RAD) / 2) * rig.reach) / Math.max(1, rig.dist)) / RAD, lens, tune.keepFov) : lens;
  rig.fov += (want - rig.fov) * Math.min(1, (tune.keepFov ? FOV_FOLLOW : (f?.follow ?? FOV_FOLLOW)) * dt);
}
