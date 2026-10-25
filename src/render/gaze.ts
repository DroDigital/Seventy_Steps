/**
 * Where the lens looks (round 78): the helpers the dread of the picture shares. The watchers step nearer only while they are out of view and the
 * darters cross only the edge of it; the eyes beyond the lantern go when looked at squarely; the shade with no one moves only while the lens is
 * turned away from it. All of it asks the same two things: how far a place is from the middle of the picture, and how fast the lens is turning.
 * Presentation only; reads a camera, writes nothing.
 */

import * as THREE from 'three';

export interface Gaze {
  x: number; // the lens
  y: number;
  z: number;
  look: number; // the heading the lens looks along (yaw 0 faces +z), radians
  half: number; // half the width of the picture, as an angle
}

const dir = new THREE.Vector3();

/** An angle wrapped to (-π, π]. */
export const wrap = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));

/** Half the horizontal field of view of a lens of `fovDeg` (vertical) and `aspect`. */
export const halfWidth = (fovDeg: number, aspect: number): number => Math.atan(Math.tan((fovDeg * Math.PI) / 360) * Math.max(0.1, aspect));

/** Reads the lens of `camera` into `out` (no allocation). */
export function readGaze(camera: THREE.Camera, out: Gaze): Gaze {
  camera.getWorldDirection(dir);
  const lens = camera as Partial<THREE.PerspectiveCamera>;
  out.x = camera.position.x;
  out.y = camera.position.y;
  out.z = camera.position.z;
  out.look = Math.atan2(dir.x, dir.z);
  out.half = halfWidth(lens.fov ?? 60, lens.aspect ?? 16 / 9);
  return out;
}

export const newGaze = (): Gaze => ({ x: 0, y: 0, z: 0, look: 0, half: 0.5 });

/** The bearing of (x, z) from the lens, radians (yaw 0 faces +z). */
export const bearingTo = (gaze: Gaze, x: number, z: number): number => Math.atan2(x - gaze.x, z - gaze.z);

/** Signed angle from the middle of the picture to (x, z): positive toward the bearing's increase. */
export const offsetTo = (gaze: Gaze, x: number, z: number): number => wrap(bearingTo(gaze, x, z) - gaze.look);

/** Whether (x, z) is in the picture, `margin` radians inside its edge (negative: out beyond it by that much still counts as in). */
export const inView = (gaze: Gaze, x: number, z: number, margin = 0): boolean => Math.abs(offsetTo(gaze, x, z)) < gaze.half - margin;

/** Whether (x, z) is out of the picture by at least `beyond` radians past its edge. */
export const outOfView = (gaze: Gaze, x: number, z: number, beyond = 0): boolean => Math.abs(offsetTo(gaze, x, z)) > gaze.half + beyond;

export interface Turn {
  /** Takes this frame's heading at `time` seconds; gives the smoothed rate of turning, radians a second, signed like `offsetTo`. */
  update(look: number, time: number): number;
  readonly rate: number;
}

/** How fast the lens is turning: the change of heading, smoothed over about a fifth of a second so that a frame of jitter is not a swing. */
export function createTurn(): Turn {
  let [last, at, rate] = [Number.NaN, Number.NaN, 0];
  return {
    update(look, time) {
      const dt = time - at;
      if (Number.isFinite(at) && !(dt > 0)) return rate; // the same frame again (a world standing still)
      if (Number.isFinite(at)) rate = dt < 0.5 ? rate + (wrap(look - last) / dt - rate) * Math.min(1, dt / 0.2) : 0; // (a long gap, a menu, a cutscene or a journey, is not a swing)
      [last, at] = [look, time];
      return rate;
    },
    get rate() {
      return rate;
    },
  };
}
