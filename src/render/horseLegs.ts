/**
 * The carriage horse's legs (round 50): an upper bone (the forearm, or the thigh and gaskin), a cannon bone below the knee
 * or the hock, and a hoof group at the fetlock (pastern, hoof, a feather of white hair). The rig bends the two bones by their
 * joints, so the knees fold and the hocks drive; the hoof tilts to lie flat on the ground. Geometry hangs along -y from each
 * joint, as the tail does. Render only.
 */
import * as THREE from 'three';
import { prism } from './bodyKit';
import { COAT, COAT_DEEP, CREAM, HOOF } from './horseBody';
import { blob, join, lit, loft, mixC, paintOf, type Paint, type Station } from './horseLoft';

export interface LegPlan {
  front: boolean;
  /** +1 the left side of the horse (+x), -1 the right. */
  side: number;
  /** Where the leg hangs from, in the body's frame. */
  hip: readonly [number, number, number];
  upper: number;
  lower: number;
  /** How far up from the ground the white of the leg goes. */
  sock: number;
}

/** From the knee or the hock to the fetlock (the leg's second bone), and the fetlock's height above the ground: the hoof hangs from it, flat. */
export const CANNON = 0.38;
export const FETLOCK = 0.22;
const [FRONT_UPPER, HIND_UPPER] = [0.58, 0.66];

/** The four legs, in the order of the gait: left fore, right fore, left hind, right hind. */
export const LEGS: readonly LegPlan[] = [
  { front: true, side: 1, hip: [0.21, -0.1, 0.5], upper: FRONT_UPPER, lower: CANNON, sock: 0.28 },
  { front: true, side: -1, hip: [-0.21, -0.1, 0.5], upper: FRONT_UPPER, lower: CANNON, sock: 0.3 }, // (round 57: it had none, and the one dark foot of four stood out; the socks are no two the same height)
  { front: false, side: 1, hip: [0.23, -0.06, -0.56], upper: HIND_UPPER, lower: CANNON, sock: 0.5 },
  { front: false, side: -1, hip: [-0.23, -0.06, -0.56], upper: HIND_UPPER, lower: CANNON, sock: 0.42 },
];
export const LEG_NAMES = ['leg-front-left', 'leg-front-right', 'leg-back-left', 'leg-back-right'] as const;


const FORE: readonly Station[] = [
  { z: 0, rx: 0.15, ry: 0.19 },
  { z: 0.14, rx: 0.125, ry: 0.165 },
  { z: 0.38, rx: 0.085, ry: 0.105 },
  { z: 0.56, rx: 0.07, ry: 0.085 },
];
const HIND: readonly Station[] = [
  { z: 0, rx: 0.17, ry: 0.25 },
  { z: 0.2, rx: 0.125, ry: 0.2 },
  { z: 0.44, rx: 0.08, ry: 0.115 },
  { z: 0.6, rx: 0.068, ry: 0.095 },
];
const CANNON_BONE: readonly Station[] = [
  { z: 0, rx: 0.062, ry: 0.07 },
  { z: 0.12, rx: 0.05, ry: 0.06 },
  { z: 0.3, rx: 0.05, ry: 0.065 },
  { z: CANNON, rx: 0.062, ry: 0.075 },
];

const hair = mixC(COAT, COAT_DEEP, 0.25);

/** A bone's sections, stretched to its length. */
const longer = (st: readonly Station[], length: number): Station[] => st.map((s) => ({ ...s, z: (s.z / st[st.length - 1].z) * length }));

/** The upper bone from the hip: hangs along -y. */
export function upperBone(plan: LegPlan): THREE.BufferGeometry {
  const coat: Paint = ({ z, ny }) => lit(mixC(COAT, COAT_DEEP, Math.min(1, z / plan.upper) * 0.3), ny, 0.82, 1.05);
  const knee = blob(0.075, 0.07, 0.085, 0, 0, plan.upper, coat, 5);
  return join([loft(longer(plan.front ? FORE : HIND, plan.upper), 7, coat), knee]).rotateX(Math.PI / 2);
}

/** The cannon bone from the knee (or hock) to the fetlock, white from the ground up to the leg's sock. */
export function cannonBone(plan: LegPlan): THREE.BufferGeometry {
  const paint: Paint = ({ z, ny }) => lit(mixC(hair, CREAM, plan.sock > 0 ? (z - (FETLOCK + CANNON - plan.sock)) / 0.05 : 0), ny, 0.82, 1.05);
  return join([loft(CANNON_BONE, 6, paint), blob(0.066, 0.06, 0.075, 0, 0, CANNON, paint, 5)]).rotateX(Math.PI / 2);
}

/** Pastern, hoof and feather, hanging from the fetlock: the ground is `FETLOCK` below it. */
export function hoofOf(plan: LegPlan): THREE.BufferGeometry {
  const white = plan.sock > 0.1;
  const fur = white ? CREAM : hair;
  const furred: Paint = ({ ny }) => lit(fur, ny, 0.85, 1.05);
  const pastern = paintOf(prism(0, -0.065, 0.025, 0.085, 0.1, 0.1, 0.11, 0.14, fur, 0.015, 0, -0.02), furred);
  const hoof = paintOf(prism(0, -0.17, 0.045, 0.145, 0.17, 0.11, 0.115, 0.1, HOOF, 0.015, 0, -0.018), () => HOOF);
  const tuft = paintOf(prism(0, -0.045, -0.06, 0.15, 0.17, 0.1, 0.08, 0.17, fur, 0.02, 0, -0.01), furred);
  return join([pastern, hoof, tuft]);
}
