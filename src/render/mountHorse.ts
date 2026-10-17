/** Articulated, anatomically readable spectral horse; all eight limb bones share one instanced draw. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { prism } from './bodyKit';
import { tint } from './meshKit';
import { MOUNT_COLORS as C, MountBuilder, group, orb, panel, rod, tube, type Point } from './mountKit';

export interface SpectralHorse { root: THREE.Group; update(time: number, phase: number, speed: number, turn: number, ground?: (x: number, z: number) => number): void }
const UP = new THREE.Vector3(0, 1, 0);

export function spectralHorse(b: MountBuilder, parent: THREE.Object3D, x: number, z: number, offset: number): SpectralHorse {
  const root = group(parent, x, 0, z), body = group(root, 0, 1.36);
  root.name = 'spectral-skeleton-horse';
  const neck = group(body, 0, 0.12, 0.63), skull = group(neck, 0, 0.62, 0.35);
  const tail = group(body, 0, 0.04, -0.77);
  const ribs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const s = i / 8, zz = -0.51 + s * 1.05, w = 0.19 + 0.13 * Math.sin(s * Math.PI);
    ribs.push(tube([[0, 0.15, zz], [-w * 0.8, 0.04, zz + 0.02], [-w, -0.2, zz + 0.09], [-w * 0.64, -0.36, zz + 0.16], [0, -0.38, zz + 0.18], [w * 0.64, -0.36, zz + 0.16], [w, -0.2, zz + 0.09], [w * 0.8, 0.04, zz + 0.02], [0, 0.15, zz]], 0.027, C.bone));
    ribs.push(panel(0.13, 0.13, 0.095, 0, 0.16, zz, C.bone, 0.02));
    if (i % 2 === 0) ribs.push(rod([0, 0.18, zz], [0, 0.29, zz - 0.05], 0.018, C.bone));
  }
  for (const side of [-1, 1]) ribs.push(
    panel(0.1, 0.27, 0.32, side * 0.25, -0.02, 0.45, C.bone, 0.03).rotateZ(side * 0.08),
    tube([[side * 0.25, -0.07, -0.54], [side * 0.3, 0.04, -0.79], [side * 0.12, 0.17, -0.83], [0, 0.13, -0.61]], 0.075, C.bone),
    rod([side * 0.25, -0.07, -0.55], [side * 0.14, -0.23, -0.71], 0.045, C.bone),
  );
  b.add(body, ribs, 'flesh', 0.22);
  const vertebrae = [];
  for (let i = 0; i < 6; i++) {
    const a: Point = [0, i * 0.105, i * 0.058];
    vertebrae.push(orb(0.075 - i * 0.004, a, C.bone));
    if (i) vertebrae.push(rod([0, (i - 1) * 0.105, (i - 1) * 0.058], a, 0.055, C.bone));
  }
  b.add(neck, vertebrae, 'flesh', 0.22);
  b.add(skull, [prism(0, 0.08, 0.12, 0.21, 0.31, 0.25, 0.32, 0.26, C.bone, 0.035),
    prism(0, -0.075, 0.31, 0.16, 0.27, 0.2, 0.31, 0.16, C.bone, 0.018, 0, -0.035),
    panel(0.15, 0.045, 0.36, 0, -0.17, 0.23, C.bone),
    ...[-1, 1].flatMap(side => [
      panel(0.07, 0.11, 0.09, side * 0.113, 0.1, 0.18, C.black, 0.025),
      rod([side * 0.085, 0.17, -0.01], [side * 0.11, 0.42, 0.015], 0.045, C.bone, 0.008),
      panel(0.04, 0.04, 0.065, side * 0.078, -0.08, 0.44, C.black, 0.01),
      ...[0, 1, 2, 3, 4].map(i => panel(0.025, 0.045, 0.025, side * 0.076, -0.12, 0.15 + i * 0.047, C.pale, 0.004)),
    ])], 'flesh', 0.22);
  b.add(skull, [-1, 1].map(side => orb(0.035, [side * 0.138, 0.1, 0.19], [0.85, 0.15, 1])), 'cloth', 1);
  b.add(skull, [tube([[-0.14, 0.04, 0.04], [-0.14, -0.1, 0.32], [0, -0.14, 0.4], [0.14, -0.1, 0.32], [0.14, 0.04, 0.04]], 0.018, C.leather),
    rod([-0.17, -0.11, 0.32], [0.17, -0.11, 0.32], 0.014, C.brass)]);
  b.add(body, [-1, 1].flatMap(side => [tube([[side * 0.29, 0.2, 0.42], [side * 0.37, -0.1, 0.5], [side * 0.22, -0.42, 0.5]], 0.035, C.leather),
    rod([side * 0.31, -0.17, 0.46], [side * 0.31, -0.14, -0.65], 0.023, C.leather),
    orb(0.049, [side * 0.34, -0.13, 0.46], C.brass)]));
  b.add(tail, [tube([[0, 0, 0], [0, -0.16, -0.22], [0.04, -0.45, -0.35], [0.02, -0.72, -0.41]], 0.035, C.bone)], 'flesh', 0.2);

  const boneGeo = mergeGeometries([tint(new THREE.CylinderGeometry(0.033, 0.027, 1, 6), C.bone), orb(0.047, [0, -0.5, 0], C.bone), orb(0.047, [0, 0.5, 0], C.bone)]);
  const bones = new THREE.InstancedMesh(boneGeo, b.material('flesh', 0.22), 12); bones.frustumCulled = false; bones.instanceMatrix.setUsage(THREE.DynamicDrawUsage); body.add(bones);
  const hoofGeo = mergeGeometries([panel(0.14, 0.105, 0.2, 0, 0.035, 0.055, C.iron), panel(0.12, 0.025, 0.19, 0, -0.022, 0.055, C.brass, 0.008)]);
  const hooves = new THREE.InstancedMesh(hoofGeo, b.material(), 4); hooves.frustumCulled = false; hooves.instanceMatrix.setUsage(THREE.DynamicDrawUsage); body.add(hooves);
  const a = new THREE.Vector3(), d = new THREE.Vector3(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), matrix = new THREE.Matrix4();
  function segment(i: number, from: Point, to: Point, thickness = 1): void {
    a.set(...from); d.set(...to).sub(a); p.copy(a).addScaledVector(d, 0.5);
    q.setFromUnitVectors(UP, d.clone().normalize()); s.set(thickness, d.length(), thickness);
    matrix.compose(p, q, s); bones.setMatrixAt(i, matrix);
  }
  return { root, update(time, phase, speed, turn, ground) {
    const moving = Math.min(1, speed / 1.5), gallop = Math.min(1, Math.max(0, (speed - 3) / 5));
    const cycle = phase + offset, bob = Math.sin(cycle * 2) * 0.045 * moving;
    const floor = ground?.(x, z) ?? 0;
    root.position.y = floor;
    body.position.y = 1.36 + bob + 0.055 * Math.sin(time * 1.7 + offset) * (1 - moving);
    body.rotation.x = Math.sin(cycle) * 0.035 * gallop;
    body.rotation.z = -turn * 0.045 + Math.cos(cycle) * 0.018 * moving;
    neck.rotation.x = Math.sin(cycle + 0.3) * 0.085 * moving - 0.07 * gallop;
    neck.rotation.y = Math.sin(time * 0.7 + offset) * 0.045 * (1 - moving);
    skull.rotation.x = -neck.rotation.x * 0.65;
    tail.rotation.set(Math.sin(cycle) * 0.12 * moving - 0.16 * gallop, Math.sin(time * 2.5 + offset) * 0.18, 0);
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1, front = i < 2, hipZ = front ? 0.5 : -0.6, hipX = side * 0.23;
      const trotOffset = [0, Math.PI, Math.PI, 0][i], gallopOffset = [0, 0.45, Math.PI + 0.7, Math.PI + 0.2][i];
      const ph = cycle + trotOffset + (gallopOffset - trotOffset) * gallop;
      const stride = Math.sin(ph) * (0.3 + gallop * 0.32) * moving;
      const lift = Math.max(0, Math.cos(ph)) * (0.18 + 0.16 * gallop) * moving;
      const localGround = Math.max(-0.23, Math.min(0.23, (ground?.(x + hipX, z + hipZ + stride) ?? floor) - floor));
      const fy = -1.285 - bob + lift + localGround, fz = hipZ + stride;
      const dy = fy, dz = fz - hipZ, distance = Math.min(1.28, Math.hypot(dy, dz));
      const upper = 0.63, lower = 0.68, along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
      const h = Math.sqrt(Math.max(0, upper * upper - along * along)), bend = front ? 1 : -1;
      const ky = dy / distance * along - dz / distance * h * bend, kz = hipZ + dz / distance * along + dy / distance * h * bend;
      segment(i * 3, [hipX, 0, hipZ], [hipX, ky, kz]);
      segment(i * 3 + 1, [hipX, ky, kz], [hipX, fy + 0.05, fz]);
      segment(i * 3 + 2, [hipX + side * 0.035, ky - 0.04, kz], [hipX + side * 0.027, fy + 0.13, fz], 0.45);
      matrix.makeRotationX(-0.32 * Math.max(0, Math.cos(ph)) * moving); matrix.setPosition(hipX, fy, fz);
      hooves.setMatrixAt(i, matrix);
    }
    bones.instanceMatrix.needsUpdate = true; hooves.instanceMatrix.needsUpdate = true;
  }};
}
