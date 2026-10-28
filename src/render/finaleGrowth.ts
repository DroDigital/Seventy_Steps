/**
 * What grows on the tall man only (round 98): the investigator's figure, and out of the coat a mass of
 * tentacles, spare eyes and a mouth. They writhe. The investigator himself is not this. Render only.
 */

import * as THREE from 'three';
import type { Figure } from './figures';
import { box, tint } from './meshKit';
import type { Rgb } from './palette';
import { createTubeGeometry } from './tentacleMesh';
import { createWorldMaterial } from './worldMaterial';

const STEPS = 9;
const SIDES = 5;
const FLESH: Rgb = [0.32, 0.07, 0.12];
const WET: Rgb = [0.62, 0.18, 0.28];
const EYE: Rgb = [0.93, 0.78, 0.72];
const PIT: Rgb = [0.05, 0.01, 0.03];
const TOOTH: Rgb = [0.75, 0.68, 0.58];

/** Which joint a limb is grown from, in the same order as `LIMBS`: it stays on the coat when he flinches. */
const JOINT = ['torso', 'torso', 'torso', 'torso', 'armR', 'armL', 'armR', 'armL', 'body', 'body', 'body', 'head', 'head', 'head'] as const;

/** Where a limb erupts, in the figure's space, which way it grows, and how long and thick it is. */
const LIMBS: readonly (readonly [number, number, number, number, number, number, number, number, number, number])[] = [
  [0, 1.32, -0.12, -0.35, 0.85, 0.55, 1.75, 0.055, 1.2, 1.3],
  [0.04, 1.26, -0.14, 0.42, 0.78, 0.55, 1.55, 0.048, 2.4, 1.1],
  [-0.1, 1.16, -0.12, -0.72, 0.5, 0.4, 1.4, 0.044, 3.1, 1.5],
  [0.12, 1.08, -0.1, 0.78, 0.38, 0.42, 1.25, 0.04, 4.2, 0.9],
  [-0.28, 1.48, 0.02, -0.9, 0.42, 0.28, 1.15, 0.04, 5.0, 1.4],
  [0.28, 1.48, 0.02, 0.88, 0.48, 0.22, 1.2, 0.038, 5.7, 1.2],
  [-0.22, 1.04, 0.12, -0.32, -0.12, 0.92, 0.9, 0.03, 6.3, 1.6],
  [0.22, 1.0, 0.1, 0.38, -0.18, 0.88, 0.95, 0.028, 7.1, 1.35],
  [-0.1, 0.7, -0.05, -0.28, -0.8, -0.35, 1.0, 0.036, 8.2, 1.0],
  [0.12, 0.68, -0.04, 0.22, -0.82, -0.3, 1.1, 0.038, 8.8, 0.85],
  [0, 0.76, 0.1, 0.08, -0.3, 0.9, 0.72, 0.026, 9.4, 1.7],
  [-0.06, 1.7, 0.08, -0.18, 0.5, 0.8, 0.55, 0.016, 10.1, 2.0],
  [0.07, 1.68, 0.09, 0.22, 0.38, 0.84, 0.5, 0.015, 10.6, 1.8],
  [0, 1.6, 0.12, 0.04, -0.12, 1, 0.45, 0.018, 11.2, 2.2],
];

const EYES: readonly (readonly [number, number, number, number])[] = [
  [-0.05, 1.58, 0.13, 0.02],
  [0.06, 1.55, 0.12, 0.016],
  [-0.17, 1.4, 0.13, 0.026],
  [0.16, 1.34, 0.14, 0.02],
  [-0.08, 1.05, 0.15, 0.018],
  [0.11, 0.96, 0.14, 0.022],
  [0.2, 1.2, 0.12, 0.015],
];

interface Limb {
  mesh: THREE.Mesh;
  length: number;
  thick: number;
  seed: number;
  rate: number;
}

export interface Growth {
  writhe(time: number, grown: number): void;
}

const ease = (x: number): number => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Tentacles, spare eyes and a mouth, hung on the joints they break out of. `grown` is 0 shut in the coat, 1 out. */
export function attachGrowth(f: Figure): Growth {
  const flesh = createWorldMaterial({ texture: 'flesh', uvScale: [1.2, 2.2], vertexColors: true, vary: 0.4, seed: 4, character: 'creature' });
  const eyeMat = createWorldMaterial({ texture: 'cloth', vertexColors: true, emissive: 0.75, character: 'creature' });
  const mawMat = createWorldMaterial({ texture: 'flesh', vertexColors: true, vary: 0.15, seed: 11, character: 'creature' });
  const up = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3();
  const at = new THREE.Vector3();
  const inv = new THREE.Matrix4();
  f.root.updateMatrixWorld(true);
  const pin = (joint: THREE.Object3D, x: number, y: number, z: number): THREE.Vector3 => at.set(x, y, z).applyMatrix4(inv.copy(joint.matrixWorld).invert());
  const limbs: Limb[] = LIMBS.map((spec, i) => {
    const [x, y, z, dx, dy, dz, length, thick, seed, rate] = spec;
    const joint = f[JOINT[i]];
    const anchor = new THREE.Group();
    anchor.position.copy(pin(joint, x, y, z));
    anchor.quaternion.setFromUnitVectors(up, dir.set(dx, dy, dz).normalize());
    const mesh = new THREE.Mesh(createTubeGeometry(STEPS, SIDES), flesh);
    mesh.frustumCulled = false;
    anchor.add(mesh);
    joint.add(anchor);
    return { mesh, length, thick, seed, rate };
  });
  const eyeJoint = ['head', 'head', 'torso', 'torso', 'torso', 'torso', 'torso'] as const;
  const eyes = EYES.map(([x, y, z, size], i) => {
    const joint = f[eyeJoint[i]];
    const g = new THREE.Group();
    g.position.copy(pin(joint, x, y, z));
    g.userData.blink = i * 0.37;
    const white = new THREE.Mesh(tint(new THREE.IcosahedronGeometry(size, 0), EYE), eyeMat);
    const pupil = new THREE.Mesh(tint(new THREE.IcosahedronGeometry(size * 0.42, 0), PIT), eyeMat);
    pupil.position.z = size * 0.7;
    g.add(white, pupil);
    joint.add(g);
    return g;
  });
  const maw = new THREE.Group();
  maw.position.copy(pin(f.torso, 0.01, 1.16, 0.155));
  maw.add(new THREE.Mesh(tint(new THREE.SphereGeometry(0.05, 7, 5).scale(1.35, 0.5, 0.4), PIT), mawMat));
  const upper = new THREE.Group();
  const lower = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.016;
    upper.add(new THREE.Mesh(box(0.01, 0.026, 0.01, x, 0.018, 0.008, TOOTH), mawMat));
    lower.add(new THREE.Mesh(box(0.01, 0.022, 0.01, x + 0.006, -0.016, 0.01, TOOTH), mawMat));
  }
  maw.add(upper, lower);
  f.torso.add(maw);

  const pose = (limb: Limb, time: number, out: number): void => {
    const pos = limb.mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
    const col = limb.mesh.geometry.getAttribute('color') as THREE.BufferAttribute;
    const length = limb.length * out;
    for (let i = 0; i <= STEPS; i++) {
      const s = i / STEPS;
      const amp = 0.22 * s * limb.length * out;
      const wx = Math.sin(s * 6.2 - time * limb.rate + limb.seed) * amp;
      const wz = Math.cos(s * 4.1 - time * limb.rate * 0.75 + limb.seed * 1.7) * amp * 0.65;
      const curl = Math.pow(Math.max(0, (s - 0.72) / 0.28), 2) * 0.28 * length;
      const rad = Math.max(0.008, limb.thick * Math.pow(1 - s, 0.8) * (0.4 + 0.6 * out));
      const band = 0.55 + 0.45 * Math.sin(s * 28 + limb.seed);
      for (let j = 0; j < SIDES; j++) {
        const a = (j / SIDES) * Math.PI * 2;
        const n = i * SIDES + j;
        pos.setXYZ(n, Math.cos(a) * rad + wx, s * length - curl, Math.sin(a) * rad + wz);
        col.setXYZ(n, FLESH[0] * band + WET[0] * s * 0.65, FLESH[1] * band + WET[1] * s * 0.65, FLESH[2] * band + WET[2] * s * 0.65);
      }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    limb.mesh.geometry.computeVertexNormals();
  };

  return {
    writhe(time, grown) {
      for (const limb of limbs) {
        const out = ease((grown - (limb.seed % 1) * 0.28) / 0.62);
        limb.mesh.visible = out > 0.02;
        if (limb.mesh.visible) pose(limb, time, out);
      }
      for (const g of eyes) {
        const phase = (time * 0.31 + (g.userData.blink as number)) % 1;
        const shut = phase > 0.9 ? (phase - 0.9) / 0.1 : 0;
        g.scale.y = 0.12 + 0.88 * (1 - shut);
      }
      const open = (0.12 + 0.22 * (0.5 + 0.5 * Math.sin(time * 0.65))) * ease(grown);
      upper.rotation.x = -open;
      lower.rotation.x = open * 0.8;
      maw.scale.y = 0.35 + 0.65 * ease(grown);
    },
  };
}
