/**
 * The carriage horse's body (round 50): a chestnut draft horse of sixteen hands, a flaxen mane and tail, a blaze, in black
 * harness with brass. Each function is the geometry of one part in that part's own frame (the rig, draftHorse.ts, hangs them
 * on the joints). The picture is 400 x 225, so the forms are big and the colours blocked: the blaze, the white stockings and
 * the pale mane are what read at a distance; the harness is the black that sets them off. Render only.
 */
import * as THREE from 'three';
import { hash2 } from '../core/rng';
import { prism } from './bodyKit';
import { blob, join, lit, loft, mixC, paintOf, type Paint, type Station } from './horseLoft';
import { ANOMALY, scaleRgb, type Rgb } from './palette';

// The chestnut, a little darker than it was: the barrel, the legs and the mottle of the hide all take these.
export const COAT: Rgb = [0.43, 0.22, 0.11];
export const COAT_DEEP: Rgb = [0.24, 0.11, 0.06];
export const COAT_HI: Rgb = [0.55, 0.29, 0.15];
export const FLAX: Rgb = [0.92, 0.74, 0.45];
export const FLAX_DEEP: Rgb = [0.66, 0.48, 0.28];
export const CREAM: Rgb = [0.97, 0.9, 0.76];
export const HOOF: Rgb = [0.2, 0.15, 0.115];
export const LEATHER: Rgb = [0.2, 0.125, 0.09];
export const BRASS: Rgb = [1.05, 0.78, 0.38];
const NOSE: Rgb = [0.6, 0.42, 0.34];

/** The body's frame sits at the barrel's middle, this high above the ground; the rig's hips and the harness hang from it. */
export const BODY_Y = 1.26;
export const NECK_AT = { y: 0.27, z: 0.5 } as const; // the neck's base joint in the body's frame
export const NECK_RISE = 0.78; // radians the neck stands from level
export const NECK_LENGTH = 0.86;
export const HEAD_DROP = 1.05; // radians the head hangs below the neck's line

const dapple = (x: number, z: number): number => 0.96 + 0.08 * hash2(Math.floor(x * 9 + 40), Math.floor(z * 9 + 40), 11);

/** The coat on the barrel: deeper under the belly, lit along the back and the croup, a little mottled. */
const coat: Paint = ({ x, y, z, ny }) => {
  const belly = Math.min(1, Math.max(0, (-0.08 - y) / 0.3));
  const back = Math.min(1, Math.max(0, (y - 0.12) / 0.3)) * 0.55;
  const base = mixC(mixC(COAT, COAT_DEEP, belly), COAT_HI, back);
  const k = dapple(x, z);
  return lit([base[0] * k, base[1] * k, base[2] * k], ny, 0.8, 1.08);
};

const BARREL: readonly Station[] = [
  { z: -0.88, rx: 0.15, ry: 0.22, cy: 0.12 },
  { z: -0.78, rx: 0.3, ry: 0.35, cy: 0.08 },
  { z: -0.54, rx: 0.37, ry: 0.42, cy: 0.04 },
  { z: -0.18, rx: 0.355, ry: 0.41, cy: 0.01 },
  { z: 0.18, rx: 0.36, ry: 0.43, cy: -0.01 },
  { z: 0.46, rx: 0.34, ry: 0.42 },
  { z: 0.66, rx: 0.28, ry: 0.37, cy: -0.02 },
  { z: 0.8, rx: 0.18, ry: 0.27, cy: -0.04 },
  { z: 0.85, rx: 0.09, ry: 0.17, cy: -0.06 },
];

/** Barrel, haunches and shoulders, in the body's frame (origin at its middle). */
export function barrel(): THREE.BufferGeometry {
  const pieces = [loft(BARREL, 10, coat)];
  for (const s of [-1, 1]) pieces.push(
    blob(0.17, 0.27, 0.3, s * 0.25, -0.02, -0.52, coat, 7), // the haunch
    blob(0.15, 0.25, 0.24, s * 0.24, -0.1, 0.48, coat, 7), // the shoulder
  );
  return join(pieces);
}

const NECK: readonly Station[] = [
  { z: -0.1, rx: 0.2, ry: 0.27, cy: -0.02 },
  { z: 0.2, rx: 0.17, ry: 0.24, cy: 0.02 },
  { z: 0.5, rx: 0.14, ry: 0.21, cy: 0.04 },
  { z: 0.76, rx: 0.12, ry: 0.17, cy: 0.03 },
  { z: 0.88, rx: 0.115, ry: 0.15, cy: 0.02 },
];

/** Neck and mane, along +z from the base joint (the rig stands it up). */
export function neck(): THREE.BufferGeometry {
  const neckCoat: Paint = (p) => coat({ ...p, y: p.y * 0.8 + 0.1 });
  const pieces = [loft(NECK, 8, neckCoat)];
  for (let i = 0; i < 9; i++) {
    const z = 0.02 + i * 0.1;
    const crest = 0.2 + 0.04 * Math.sin((z / 0.9) * Math.PI);
    const c = mixC(FLAX, FLAX_DEEP, hash2(i, 3, 5) * 0.8);
    const tuft = prism(0.015, crest + 0.06, z, 0.09, 0.13, 0.05, 0.1, 0.2 - i * 0.008, c, 0.01, 0.02, 0);
    pieces.push(paintOf(tuft, () => c));
  }
  return join(pieces);
}

const HEAD: readonly Station[] = [
  { z: -0.04, rx: 0.105, ry: 0.13 },
  { z: 0.1, rx: 0.118, ry: 0.145, cy: -0.005 },
  { z: 0.24, rx: 0.1, ry: 0.125, cy: -0.012 },
  { z: 0.4, rx: 0.075, ry: 0.1, cy: -0.03 },
  { z: 0.54, rx: 0.075, ry: 0.085, cy: -0.045 },
  { z: 0.62, rx: 0.068, ry: 0.07, cy: -0.055 },
  { z: 0.65, rx: 0.045, ry: 0.045, cy: -0.06 },
];

/** The head, from the poll: skull, long face with a blaze, a pale muzzle, two eyes and a forelock. */
export function head(): { skin: THREE.BufferGeometry; eyes: THREE.BufferGeometry } {
  const face: Paint = ({ x, z, ny, nx, nz }) => {
    let c = coat({ x, y: 0.12, z, ny, nx, nz });
    if (Math.abs(x) < 0.034 + 0.012 * Math.min(1, z * 2) && ny > 0.25 && z > 0.04 && z < 0.56) c = CREAM;
    const muzzle = Math.min(1, Math.max(0, (z - 0.5) / 0.1));
    return lit(mixC(c, NOSE, muzzle), ny, 0.82, 1.05);
  };
  const forelock = paintOf(prism(0, 0.125, 0.14, 0.05, 0.07, 0.07, 0.1, 0.13, FLAX, 0.01, 0, 0.03), () => FLAX);
  const nostrils = [-1, 1].map((s) => blob(0.016, 0.014, 0.018, s * 0.045, -0.03, 0.635, () => [0.06, 0.04, 0.035], 4));
  return { skin: join([loft(HEAD, 8, face), forelock, ...nostrils]), eyes: eyesOf() };
}

/** Where each eye stands in the head's frame: its glow is drawn there (draftEyes.ts). */
export const EYE_AT = { x: 0.108, y: 0.05, z: 0.19 } as const;

function eyesOf(): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) pieces.push(
    blob(0.03, 0.026, 0.03, s * EYE_AT.x, EYE_AT.y, EYE_AT.z, () => scaleRgb(ANOMALY.magenta, 0.2), 6), // a dark magenta; the glow is the halo
    blob(0.01, 0.009, 0.01, s * 0.128, 0.064, 0.2, () => [0.9, 0.82, 0.62], 4),
  );
  return join(pieces);
}

/** An ear, a leaf of the horse's coat with a dark rim, standing on its base. */
export function ear(): THREE.BufferGeometry {
  const c: Paint = ({ y, ny }) => lit(mixC(COAT, [0.12, 0.06, 0.04], Math.max(0, (y - 0.09) / 0.06)), ny, 0.85, 1.05);
  return paintOf(new THREE.ConeGeometry(0.04, 0.16, 4).scale(0.8, 1, 1.3).translate(0, 0.08, 0), c);
}

const TAIL: readonly Station[] = [
  { z: 0, rx: 0.045, ry: 0.055 },
  { z: 0.18, rx: 0.07, ry: 0.07 },
  { z: 0.5, rx: 0.088, ry: 0.06 },
  { z: 0.85, rx: 0.075, ry: 0.04 },
  { z: 0.96, rx: 0.03, ry: 0.02 },
];

/** The tail from its dock, hanging along -y. */
export function tail(): THREE.BufferGeometry {
  const hair: Paint = ({ z }) => mixC(COAT_DEEP, FLAX, Math.min(1, Math.max(0, (z - 0.1) / 0.3)) * (0.8 + 0.2 * hash2(Math.floor(z * 30), 2, 8)));
  return loft(TAIL, 6, hair).rotateX(Math.PI / 2);
}

/** A leather closed ring round the barrel's section at `z`. */
function girth(z: number, rx: number, ry: number, cy: number, radius: number): THREE.BufferGeometry {
  const pts = Array.from({ length: 16 }, (_, i) => new THREE.Vector3(rx * Math.cos((i / 16) * Math.PI * 2), cy + ry * Math.sin((i / 16) * Math.PI * 2), z));
  return paintOf(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 24, radius, 4, true), () => LEATHER);
}

const strap = (pts: [number, number, number][], radius: number, c: Rgb = LEATHER): THREE.BufferGeometry =>
  paintOf(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), pts.length * 3, radius, 4, false), () => c);
const knob = (r: number, x: number, y: number, z: number): THREE.BufferGeometry => blob(r, r, r, x, y, z, () => BRASS, 5);

/** Collar and hames, back pad with tugs, girth, breeching and crupper, in the body's frame. Where the shafts run: x = ±0.47, y = 0.05, z = 0.10. */
export function harness(): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  const base = new THREE.Vector3(0, NECK_AT.y + 0.1, NECK_AT.z + 0.1);
  const up = new THREE.Vector3(0, Math.cos(NECK_RISE), -Math.sin(NECK_RISE));
  const centre = base.clone().addScaledVector(new THREE.Vector3(0, Math.sin(NECK_RISE), Math.cos(NECK_RISE)), 0.12);
  pieces.push(paintOf(new THREE.TorusGeometry(0.27, 0.065, 5, 14).scale(0.9, 1.05, 1).rotateX(-NECK_RISE).translate(centre.x, centre.y, centre.z), () => LEATHER));
  for (const s of [-1, 1]) {
    const a = centre.clone().addScaledVector(up, -0.24).add(new THREE.Vector3(s * 0.27, 0, 0));
    const b = centre.clone().addScaledVector(up, 0.3).add(new THREE.Vector3(s * 0.22, 0, 0));
    pieces.push(strap([[a.x, a.y, a.z], [b.x, b.y, b.z]], 0.018, BRASS), knob(0.035, b.x, b.y, b.z), knob(0.03, a.x, a.y, a.z));
    pieces.push(strap([[s * 0.14, 0.45, 0.1], [s * 0.33, 0.31, 0.1], [s * 0.46, 0.05, 0.1]], 0.02), knob(0.04, s * 0.47, 0.05, 0.1));
    pieces.push(strap([[s * 0.14, 0.45, 0.0], [s * 0.3, 0.32, -0.3], [s * 0.37, 0.12, -0.72]], 0.015));
  }
  pieces.push(paintOf(prism(0, 0.44, 0.1, 0.3, 0.38, 0.26, 0.34, 0.08, LEATHER, 0.02), () => LEATHER), knob(0.045, 0, 0.52, 0.1));
  pieces.push(girth(0.2, 0.375, 0.45, -0.01, 0.024), girth(0.27, 0.37, 0.45, -0.01, 0.014));
  pieces.push(strap([[-0.3, 0.3, -0.6], [-0.38, 0.0, -0.8], [-0.2, -0.13, -0.9], [0.2, -0.13, -0.9], [0.38, 0.0, -0.8], [0.3, 0.3, -0.6]], 0.03));
  pieces.push(strap([[0, 0.45, 0.0], [0, 0.45, -0.4], [0, 0.4, -0.82]], 0.014));
  return join(pieces);
}

/** Bridle in the head's frame: cheekpieces, browband and noseband, two blinkers, a bit with its rings. */
export function bridle(): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    pieces.push(strap([[s * 0.118, 0.09, 0.12], [s * 0.125, -0.02, 0.2], [s * 0.1, -0.08, 0.38], [s * 0.082, -0.1, 0.56]], 0.011));
    pieces.push(paintOf(prism(s * 0.128, 0.052, 0.19, 0.022, 0.1, 0.022, 0.1, 0.1, LEATHER, 0.008), () => LEATHER)); // the blinker
    pieces.push(knob(0.022, s * 0.088, -0.1, 0.57));
  }
  pieces.push(strap([[-0.115, 0.09, 0.13], [0, 0.145, 0.13], [0.115, 0.09, 0.13]], 0.01));
  pieces.push(paintOf(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => new THREE.Vector3(0.088 * Math.cos((i / 12) * Math.PI * 2), -0.03 + 0.11 * Math.sin((i / 12) * Math.PI * 2), 0.42)), true), 20, 0.01, 4, true), () => LEATHER));
  return join(pieces);
}
