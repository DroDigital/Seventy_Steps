/** The borrowed grey: one plain mare, saddle and bridle, nothing spectral. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tint } from './meshKit';
import { MOUNT_COLORS as C, MountBuilder, group, orb, panel, rod, tube, type Point } from './mountKit';
import { breathWisp, type HorseWisp } from './mountEffects';

export interface GreyHorse {
  body: THREE.Group;
  seat: THREE.Object3D;
  breath: HorseWisp;
  update(time: number, phase: number, speed: number, turn: number, ground?: (x: number, z: number) => number): void;
}

const COAT: Point = [0.4, 0.39, 0.36];
const DARK: Point = [0.16, 0.15, 0.14];
const UP = new THREE.Vector3(0, 1, 0);

export function greyHorse(b: MountBuilder, root: THREE.Object3D): GreyHorse {
  const body = group(root, 0, 1.18, 0.05);
  body.name = 'borrowed-grey';
  const neck = group(body, 0, 0.22, 0.46), skull = group(neck, 0, 0.46, 0.28), tail = group(body, 0, 0.16, -0.62);
  b.add(body, [
    panel(0.4, 0.46, 1.02, 0, 0.06, -0.02, COAT, 0.06),
    panel(0.34, 0.32, 0.28, 0, 0.02, 0.46, COAT, 0.05),
    panel(0.38, 0.36, 0.34, 0, 0.1, -0.42, COAT, 0.05),
    panel(0.36, 0.08, 0.42, 0, 0.32, -0.08, C.leather, 0.03),
    panel(0.12, 0.16, 0.16, 0, 0.28, -0.28, C.leather, 0.02),
    ...[-1, 1].flatMap(side => [
      rod([side * 0.12, 0.3, -0.02], [side * 0.2, -0.15, 0.08], 0.012, C.leather),
      orb(0.035, [side * 0.2, -0.2, 0.1], C.iron),
    ]),
  ], 'flesh', 0.04);
  b.add(neck, [
    panel(0.16, 0.42, 0.18, 0, 0.16, 0.06, COAT, 0.04),
    panel(0.05, 0.4, 0.06, 0, 0.2, -0.02, DARK, 0.02),
  ], 'flesh', 0.04);
  b.add(skull, [
    panel(0.16, 0.2, 0.34, 0, 0.02, 0.08, COAT, 0.03),
    panel(0.1, 0.08, 0.16, 0, -0.08, 0.2, COAT, 0.02),
    ...[-1, 1].flatMap(side => [
      panel(0.035, 0.1, 0.04, side * 0.05, 0.16, -0.02, COAT, 0.01),
      orb(0.028, [side * 0.07, 0.04, 0.12], DARK),
      rod([side * 0.05, 0.02, 0.18], [side * 0.08, -0.02, 0.1], 0.008, C.leather),
    ]),
    rod([-0.08, -0.02, 0.16], [0.08, -0.02, 0.16], 0.008, C.leather),
  ], 'flesh', 0.05);
  b.add(tail, [tube([[0, 0, 0], [0.02, -0.28, -0.12], [0, -0.55, -0.16]], 0.035, DARK)], 'flesh', 0.02);
  const boneGeo = mergeGeometries([
    tint(new THREE.CylinderGeometry(0.055, 0.045, 1, 6), COAT),
    tint(new THREE.SphereGeometry(0.07, 6, 4).translate(0, -0.5, 0), COAT),
    tint(new THREE.SphereGeometry(0.07, 6, 4).translate(0, 0.5, 0), COAT),
  ]);
  const bones = new THREE.InstancedMesh(boneGeo, b.material('flesh', 0.04), 8);
  bones.frustumCulled = false; bones.instanceMatrix.setUsage(THREE.DynamicDrawUsage); body.add(bones);
  const hoofGeo = panel(0.12, 0.08, 0.16, 0, 0.02, 0.04, DARK, 0.01);
  const hooves = new THREE.InstancedMesh(hoofGeo, b.material(), 4);
  hooves.frustumCulled = false; hooves.instanceMatrix.setUsage(THREE.DynamicDrawUsage); body.add(hooves);
  const breath = breathWisp(skull);
  const seat = group(body, 0, 0.34, -0.06); seat.name = 'rider-seat-feet-origin';
  const a = new THREE.Vector3(), d = new THREE.Vector3(), p = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), matrix = new THREE.Matrix4();
  const segment = (i: number, from: Point, to: Point): void => {
    a.set(...from); d.set(...to).sub(a); p.copy(a).addScaledVector(d, 0.5);
    q.setFromUnitVectors(UP, d.clone().normalize()); s.set(1, d.length(), 1);
    matrix.compose(p, q, s); bones.setMatrixAt(i, matrix);
  };
  return { body, seat, breath, update(time, phase, speed, turn, ground) {
    const moving = Math.min(1, speed / 1.5), gallop = Math.min(1, Math.max(0, (speed - 3) / 5));
    const bob = Math.sin(phase * 2) * 0.04 * moving;
    const floor = ground?.(0, 0.05) ?? 0;
    body.position.y = 1.18 + floor + bob + Math.sin(time * 1.4) * 0.012 * (1 - moving);
    body.rotation.x = Math.sin(phase) * 0.03 * gallop;
    body.rotation.z = -turn * 0.05;
    neck.rotation.x = -0.55 + Math.sin(phase + 0.4) * 0.07 * moving;
    neck.rotation.y = Math.sin(time * 0.6) * 0.05 * (1 - moving * 0.7);
    skull.rotation.x = 0.35 - neck.rotation.x * 0.35;
    tail.rotation.set(-0.4 + Math.sin(phase) * 0.15 * moving, Math.sin(time * 2.2) * 0.2, 0);
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1, front = i < 2, hipZ = front ? 0.42 : -0.46, hipX = side * 0.14;
      const ph = phase + [0, Math.PI, Math.PI, 0][i] + gallop * [0, 0.35, Math.PI * 0.2, Math.PI * 0.15][i];
      const stride = Math.sin(ph) * (0.28 + gallop * 0.26) * moving;
      const lift = Math.max(0, Math.cos(ph)) * (0.14 + gallop * 0.14) * moving;
      const local = Math.max(-0.2, Math.min(0.2, (ground?.(hipX, 0.05 + hipZ + stride) ?? floor) - floor));
      const fy = -1.12 - bob + lift + local, fz = hipZ + stride;
      const dy = fy, dz = fz - hipZ, distance = Math.min(1.15, Math.hypot(dy, dz));
      const upper = 0.55, lower = 0.58, along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
      const h = Math.sqrt(Math.max(0, upper * upper - along * along)), bend = front ? 1 : -1;
      const ky = dy / distance * along - dz / distance * h * bend, kz = hipZ + dz / distance * along + dy / distance * h * bend;
      segment(i * 2, [hipX, 0.05, hipZ], [hipX, ky, kz]);
      segment(i * 2 + 1, [hipX, ky, kz], [hipX, fy + 0.04, fz]);
      matrix.makeRotationX(-0.25 * Math.max(0, Math.cos(ph)) * moving); matrix.setPosition(hipX, fy, fz);
      hooves.setMatrixAt(i, matrix);
    }
    bones.instanceMatrix.needsUpdate = true; hooves.instanceMatrix.needsUpdate = true;
    breath.update(time, speed);
  } };
}
