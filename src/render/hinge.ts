/**
 * A joint's bend about x, read from its quaternion (round 81). A clip sets a joint's quaternion, and three.js reads its Euler (YXZ) back from it: a joint bent
 * past a right angle then reads as x = π − bend with y and z at π, so `rotation.x += d` turns it the other way and a lerp of its Eulers twists it. The
 * bend is the twist about x of the quaternion (its swing, any turn about the other axes, is kept when it is set).
 */

import * as THREE from 'three';
import { wrapAngle } from '../core/geom';

const X = new THREE.Vector3(1, 0, 0);
const [twist, swing] = [new THREE.Quaternion(), new THREE.Quaternion()];

/** How far `j` is bent about x, radians in (−π, π], whatever Euler it reads as. */
export const bendOf = (j: THREE.Object3D): number => wrapAngle(2 * Math.atan2(j.quaternion.x, j.quaternion.w));

/** Sets the bend of `j` about x to `angle`, its turn about the other axes as it was. */
export function bendTo(j: THREE.Object3D, angle: number): void {
  const q = j.quaternion;
  twist.set(Math.sin(bendOf(j) / 2), 0, 0, Math.cos(bendOf(j) / 2)); // the twist part of q (a rotation of bendOf(j) about x)
  swing.copy(q).multiply(twist.invert());
  q.copy(swing.multiply(twist.setFromAxisAngle(X, angle)));
}
