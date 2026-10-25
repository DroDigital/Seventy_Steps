/**
 * The mirrors' geometry (round 77): which mirror is drawn, where the room's second picture is taken from, and the matrix that lays it on the glass. A mirror
 * is where a piece of a hall's set has faces of the mirror class (`planeOf`, from the faces as placed); the picture is the room drawn from the eye's image
 * behind that plane, its near plane laid on the glass so that nothing behind the wall is drawn (an oblique projection). Pure, no GL.
 */

import * as THREE from 'three';

/** A mirror as placed: the middle of its glass and the way it faces (a unit vector, toward the room). */
export interface MirrorSpot {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
  r?: number; // half the diagonal of its glass's box: how far from the middle it reaches (for what is in view)
}

export const MIRROR = {
  reach: 16, // metres: a mirror farther than this from the eye is a dark panel
  front: 0.15, // the eye must stand this far in front of its glass
  facing: 0.2, // and look toward it, by this much of the cosine of the angle (the mirror is on the screen, or nearly)
  bias: 0.003, // the oblique near plane's push off the glass
} as const;

/** The middle of the box about a mirror's faces and the mean way they face (`geo`: positions and normals, already placed); null if it has none. */
export function planeOf(geo: THREE.BufferGeometry): MirrorSpot | null {
  const [pos, nor] = [geo.getAttribute('position'), geo.getAttribute('normal')];
  if (!pos || !nor || pos.count < 3) return null;
  const [box, n] = [new THREE.Box3(), new THREE.Vector3()];
  box.setFromBufferAttribute(pos as THREE.BufferAttribute);
  for (let i = 0; i < nor.count; i++) n.add(new THREE.Vector3(nor.getX(i), nor.getY(i), nor.getZ(i)));
  if (n.lengthSq() < 1e-9) return null;
  const c = box.getCenter(new THREE.Vector3());
  n.normalize();
  return { x: c.x, y: c.y, z: c.z, nx: n.x, ny: n.y, nz: n.z, r: box.getSize(new THREE.Vector3()).length() / 2 };
}

const frustum = new THREE.Frustum();
const [view, sphere] = [new THREE.Matrix4(), new THREE.Sphere()];

/** Whether any of the glass is in the camera's picture (its sphere against the frustum): a mirror behind the shoulder is not drawn. */
export function inView(s: MirrorSpot, camera: THREE.Camera): boolean {
  view.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  sphere.set(new THREE.Vector3(s.x, s.y, s.z), s.r ?? 1.5);
  return frustum.setFromProjectionMatrix(view).intersectsSphere(sphere);
}

/** The mirror whose picture is drawn this frame: the nearest the eye stands before and looks toward, within reach; null for none. */
export function pickMirror(spots: readonly MirrorSpot[], eye: THREE.Vector3, forward: THREE.Vector3): MirrorSpot | null {
  let best: MirrorSpot | null = null;
  let near: number = MIRROR.reach;
  for (const s of spots) {
    const [dx, dy, dz] = [eye.x - s.x, eye.y - s.y, eye.z - s.z];
    const d = Math.hypot(dx, dy, dz);
    if (d >= near || dx * s.nx + dy * s.ny + dz * s.nz < MIRROR.front) continue; // too far, or behind the glass
    if (-(forward.x * dx + forward.y * dy + forward.z * dz) < MIRROR.facing * d) continue; // turned away from it
    [best, near] = [s, d];
  }
  return best;
}

const [p, n, seen, target, rotation, look, q, clip] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Matrix4(), new THREE.Vector3(), new THREE.Vector4(), new THREE.Vector4()];
const plane = new THREE.Plane();

/**
 * Sets `virtual` to the eye's image in the glass and `texture` to the matrix from a world point to the picture's own coordinates (the projection before
 * the oblique clip, as it must be); the virtual camera's projection is the real one with its near plane laid on the glass.
 */
export function mirrorCamera(virtual: THREE.PerspectiveCamera, camera: THREE.PerspectiveCamera, s: MirrorSpot, texture: THREE.Matrix4): void {
  p.set(s.x, s.y, s.z);
  n.set(s.nx, s.ny, s.nz);
  camera.updateMatrixWorld();
  const eye = look.setFromMatrixPosition(camera.matrixWorld).clone();
  seen.subVectors(p, eye).reflect(n).negate().add(p); // the eye's image in the glass
  rotation.extractRotation(camera.matrixWorld);
  target.set(0, 0, -1).applyMatrix4(rotation).add(eye);
  target.subVectors(p, target).reflect(n).negate().add(p);
  virtual.position.copy(seen);
  virtual.up.set(0, 1, 0).applyMatrix4(rotation).reflect(n);
  virtual.lookAt(target);
  virtual.near = camera.near;
  virtual.far = camera.far;
  virtual.updateMatrixWorld();
  virtual.matrixWorldInverse.copy(virtual.matrixWorld).invert();
  virtual.projectionMatrix.copy(camera.projectionMatrix);
  virtual.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
  texture.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(virtual.projectionMatrix).multiply(virtual.matrixWorldInverse);
  // Eric Lengyel's oblique near plane: what lies behind the glass is cut away, in whatever material it is drawn.
  plane.setFromNormalAndCoplanarPoint(n, p).applyMatrix4(virtual.matrixWorldInverse);
  clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
  const m = virtual.projectionMatrix.elements;
  q.set((Math.sign(clip.x) + m[8]!) / m[0]!, (Math.sign(clip.y) + m[9]!) / m[5]!, -1, (1 + m[10]!) / m[14]!);
  clip.multiplyScalar(2 / clip.dot(q));
  m[2] = clip.x;
  m[6] = clip.y;
  m[10] = clip.z + 1 - MIRROR.bias;
  m[14] = clip.w;
  virtual.projectionMatrixInverse.copy(virtual.projectionMatrix).invert();
}
