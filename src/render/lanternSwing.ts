/**
 * Round 116, the investigator's lantern swung live. Round 81 solved its pendulum in Blender for each clip on its own (tools/player/lantern.py)
 * and baked it, so it swung only with the motion the clip itself made, was brought to rest at the end of every move whether or not it would
 * have been, and knew nothing of a turn on the spot, a start or a stop, a blow that knocked him back, a jolt of the rig he rides or a fall.
 * Here the same pendulum (its length, damping, push, the soft stop at his hip and its most swing are lantern.py's) is solved each frame
 * from the way the pivot at his belt truly moves through the world, after his pose is made, and carries on across one move into the next.
 * Render only.
 */

import * as THREE from 'three';
import type { Figure } from './figures';

export const LANTERN_SWING = {
  length: 0.23, // metres from the pivot to the cage's weight (lantern.py LENGTH)
  zeta: 0.28, // damping (ZETA)
  push: 0.55, // the share of the pivot's acceleration that moves the bob (PUSH)
  soft: 9, // m/s²: a push past this is only softly more (SOFT)
  tilt: 0.42, // the most it swings, radians (TILT)
  wall: -0.2, // the tilt toward his body at which his hip stops it (IN_WALL: x is his left, where it hangs)
  step: 1 / 240, // seconds: the longest step of the solve (lantern.py: four to a 60 Hz frame)
  leap: 1.5, // metres the pivot moves in a frame before it is taken for a journey, not a swing
};

const W0 = Math.sqrt(9.81 / LANTERN_SWING.length);

export interface Swing {
  x: number; // the bob's lean toward his left, and ahead (the tangent of its tilt, nearly)
  z: number;
  vx: number;
  vz: number;
  at: THREE.Vector3; // the pivot when last drawn, and its speed then
  speed: THREE.Vector3;
  seen: number; // frames of the pivot seen since a jump: its speed needs one, its acceleration two
  time: number;
}

export function newSwing(): Swing {
  return { x: 0, z: 0, vx: 0, vz: 0, at: new THREE.Vector3(), speed: new THREE.Vector3(), seen: 0, time: -Infinity };
}

const softly = (a: number): number => (Number.isFinite(a) ? LANTERN_SWING.soft * Math.tanh(a / LANTERN_SWING.soft) : 0);

/** The pendulum `dt` seconds on, pushed by the pivot's acceleration `ax` (toward his left) and `az` (ahead), m/s², softly held under `soft`. */
export function stepSwing(s: Swing, ax: number, az: number, dt: number): void {
  const { zeta, push, length, tilt, wall } = LANTERN_SWING;
  if (!(dt > 0)) return;
  const [px, pz] = [softly(ax), softly(az)];
  const n = Math.min(60, Math.ceil(dt / LANTERN_SWING.step));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    let fx = -W0 * W0 * s.x - 2 * zeta * W0 * s.vx - (push * px) / length;
    const fz = -W0 * W0 * s.z - 2 * zeta * W0 * s.vz - (push * pz) / length;
    if (s.x < wall) fx += 900 * (wall - s.x) - 20 * Math.min(s.vx, 0); // his hip
    s.vx += fx * h;
    s.vz += fz * h;
    s.x = Math.min(tilt, Math.max(-tilt, s.x + s.vx * h));
    s.z = Math.min(tilt, Math.max(-tilt, s.z + s.vz * h));
  }
}

const [pivot, v, acc, fwd, down, dir] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(0, -1, 0), new THREE.Vector3()];
const [torso, hang, turn] = [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()];
const UP = new THREE.Vector3(0, 1, 0);

/** Swings the figure's lantern from the way its pivot has moved since the last frame drawn (its pose made and placed: the figure's world matrices are brought up to date). `still`: the figure is held in a blow's hitstop and shaken, which is no motion of its own. */
export function swingLantern(f: Figure, s: Swing, time: number, still = false): void {
  if (!f.lantern) return;
  f.root.updateMatrixWorld(true);
  f.lantern.getWorldPosition(pivot);
  f.torso.getWorldQuaternion(torso);
  fwd.set(0, 0, 1).applyQuaternion(torso);
  const yaw = Math.atan2(fwd.x, fwd.z);
  const dt = time - s.time;
  s.time = time;
  if (still && s.seen > 0) stepSwing(s, 0, 0, Math.min(Math.max(dt, 0), 0.1)); // (held: it swings on, and the shaking pivot is not followed, so nothing is thrown when the blow lets go)
  else if (!(dt > 0) || dt > 0.1 || s.seen === 0 || pivot.distanceTo(s.at) > LANTERN_SWING.leap) {
    s.seen = 1; // (a first frame, a journey or a stall: where it is, no speed known)
    s.speed.set(0, 0, 0);
    s.at.copy(pivot);
  } else {
    v.subVectors(pivot, s.at).divideScalar(dt);
    if (s.seen >= 2) {
      acc.subVectors(v, s.speed).divideScalar(dt);
      const [c, sn] = [Math.cos(yaw), Math.sin(yaw)];
      stepSwing(s, c * acc.x - sn * acc.z, sn * acc.x + c * acc.z, dt); // into the frame that turns with his torso: x his left, z ahead
    } else stepSwing(s, 0, 0, dt);
    s.speed.copy(v);
    s.seen = 2;
    s.at.copy(pivot);
  }
  dir.set(s.x, -1, s.z).normalize();
  hang.setFromUnitVectors(down, dir).premultiply(turn.setFromAxisAngle(UP, yaw)); // plumb but for its swing, turned with his torso
  f.lantern.quaternion.copy(torso.invert()).multiply(hang); // in the torso's own frame, which it hangs from
}
