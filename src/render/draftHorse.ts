/** One bay between the shafts. The form is lofted; the legs are two bones, posed on the CPU. */
import * as THREE from 'three';
import { MOUNT_TRAVERSAL } from '../data/mounts';
import { hoofTarget, solveLeg } from './horseGait';
import { DOCK, NECK_AT, POLL, horseBody, horseHead, horseLeg, horseMane, horseNeck, horseTail } from './horseForm';
import { MountBuilder, group } from './mountKit';

export const DRAFT_PLACE = { x: 0, z: 2.7 } as const;

export interface DraftHorse {
  root: THREE.Group;
  bit: THREE.Object3D;
  update(time: number, phase: number, speed: number, turn: number, ground?: (x: number, z: number) => number): void;
}

interface Limb {
  front: boolean;
  side: number;
  L1: number;
  L2: number;
  hip: readonly [number, number, number];
  walk: number;
  gallop: number;
  mesh: THREE.Mesh;
  rest: Float32Array;
  weight: Float32Array;
  hoof: THREE.Object3D;
  knee: THREE.Object3D;
}

const LIMBS = [
  { name: 'back-left', front: false, side: -1, L1: 0.48, L2: 0.62, hip: [0.26, 1.1, -0.58] as const, walk: 0, gallop: 0 },
  { name: 'front-left', front: true, side: -1, L1: 0.46, L2: 0.58, hip: [0.24, 1.04, 0.5] as const, walk: 0.25, gallop: 0.4 },
  { name: 'back-right', front: false, side: 1, L1: 0.48, L2: 0.62, hip: [0.26, 1.1, -0.58] as const, walk: 0.5, gallop: 0.12 },
  { name: 'front-right', front: true, side: 1, L1: 0.46, L2: 0.58, hip: [0.24, 1.04, 0.5] as const, walk: 0.75, gallop: 0.55 },
];

function weights(geo: THREE.BufferGeometry, knee: number): Float32Array {
  const pos = geo.getAttribute('position');
  const w = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - (knee - 0.08)) / 0.16;
    const s = Math.min(1, Math.max(0, t));
    w[i] = s * s * (3 - 2 * s);
  }
  return w;
}

function skinned(geo: THREE.BufferGeometry, material: THREE.Material): THREE.Mesh {
  (geo.getAttribute('position') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
  (geo.getAttribute('normal') as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  return mesh;
}

function poseLimb(limb: Limb, upper: number, lower: number): void {
  const pos = limb.mesh.geometry.getAttribute('position');
  const cu = Math.cos(upper), su = Math.sin(upper), cl = Math.cos(lower), sl = Math.sin(lower);
  const knee = -limb.L1;
  for (let i = 0; i < limb.weight.length; i++) {
    const x = limb.rest[i * 3], y = limb.rest[i * 3 + 1], z = limb.rest[i * 3 + 2];
    const uy = y * cu - z * su, uz = y * su + z * cu;
    const dy = y - knee;
    const ly = dy * cl - z * sl, lz = dy * sl + z * cl;
    const fy = (knee + ly) * cu - lz * su, fz = (knee + ly) * su + lz * cu;
    const t = limb.weight[i];
    pos.setXYZ(i, x, uy * t + fy * (1 - t), uz * t + fz * (1 - t));
  }
  pos.needsUpdate = true;
  limb.mesh.geometry.computeVertexNormals();
}

export function draftHorse(b: MountBuilder, parent: THREE.Object3D, x: number, z: number): DraftHorse {
  const root = group(parent, x, 0, z);
  root.name = 'draft-horse';
  const lean = group(root);
  const body = group(lean);
  const hide = b.material('hide');
  const coatMap = hide.uniforms.uMap.value as THREE.Texture;
  coatMap.generateMipmaps = false;
  coatMap.minFilter = THREE.NearestFilter;
  coatMap.needsUpdate = true;
  const add = (geo: THREE.BufferGeometry, parentNode: THREE.Object3D, name: string): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, hide);
    mesh.name = name;
    mesh.frustumCulled = false;
    parentNode.add(mesh);
    return mesh;
  };
  add(horseBody(), body, 'draft-body');
  const neck = group(body, NECK_AT[0], NECK_AT[1], NECK_AT[2]);
  add(horseNeck(), neck, 'draft-neck');
  add(horseMane(), neck, 'draft-mane');
  const head = group(neck, POLL[0], POLL[1], POLL[2]);
  head.name = 'head';
  add(horseHead(), head, 'draft-head');
  const bit = group(head, 0, -0.16, 0.58);
  bit.name = 'draft-bit';
  const tail = group(body, DOCK[0], DOCK[1], DOCK[2]);
  tail.name = 'tail';
  add(horseTail(), tail, 'draft-tail');
  const limbs: Limb[] = LIMBS.map((spec) => {
    const part = group(body, spec.side * spec.hip[0], spec.hip[1], spec.hip[2]);
    part.name = `leg-${spec.name}`;
    const mesh = skinned(horseLeg(spec.L1, spec.L2, spec.front), hide);
    part.add(mesh);
    const hoof = group(part); hoof.name = `hoof-${spec.name}`;
    const knee = group(part); knee.name = `knee-${spec.name}`;
    return { ...spec, mesh, rest: new Float32Array(mesh.geometry.getAttribute('position').array), weight: weights(mesh.geometry, -spec.L1), hoof, knee };
  });
  const span = MOUNT_TRAVERSAL.gallop - MOUNT_TRAVERSAL.cruise;
  return { root, bit, update(time, phase, speed, turn, ground) {
    const moving = Math.min(1, Math.max(0, speed) / 1.5);
    const gallop = Math.min(1, Math.max(0, (speed - MOUNT_TRAVERSAL.cruise) / span));
    const wobble = Math.sin(phase * 2) * (1 - gallop) + Math.sin(phase) * gallop;
    const dip = moving * (0.5 - 0.5 * wobble) * (0.04 + 0.02 * gallop);
    const floor = ground?.(x, z) ?? 0;
    root.position.y = floor;
    lean.rotation.y = -turn * 0.12;
    body.position.y = -dip + Math.sin(time * 1.5) * 0.012 * (1 - moving);
    body.rotation.x = Math.sin(phase) * 0.04 * gallop;
    body.rotation.z = -turn * 0.045;
    neck.rotation.x = dip * 1.5 - 0.06 * gallop + Math.sin(time * 1.2) * 0.05 * (1 - moving);
    neck.rotation.y = Math.sin(time * 0.55) * 0.07 * (1 - moving) + turn * 0.06;
    head.rotation.x = -neck.rotation.x * 0.62;
    head.rotation.y = Math.sin(time * 0.4) * 0.04 * (1 - moving);
    tail.rotation.set(Math.sin(phase * 2) * 0.1 * moving - 0.22 * gallop, Math.sin(time * 2.3) * 0.22, 0);
    const breath = body.position.y + dip;
    for (const limb of limbs) {
      const cycle = phase / (Math.PI * 2) + limb.walk + (limb.gallop - limb.walk) * gallop;
      const length = limb.L1 + limb.L2;
      const aim = hoofTarget(cycle, gallop, moving, dip - breath, 0, length);
      const sampleZ = z + limb.hip[2] + aim.tz;
      const delta = Math.max(-0.2, Math.min(0.2, (ground?.(x + limb.side * limb.hip[0], sampleZ) ?? floor) - floor));
      aim.ty += delta;
      const solved = solveLeg(aim.tz, aim.ty, limb.L1, limb.L2, limb.front ? -1 : 1);
      poseLimb(limb, solved.upper, solved.lower);
      limb.knee.position.set(0, solved.ky, solved.kz);
      limb.hoof.position.set(0, solved.hy, solved.hz);
    }
  } };
}
