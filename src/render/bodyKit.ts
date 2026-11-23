/**
 * Bevelled forms for the figures (round 39: the player and the people were built of plain boxes, every edge a
 * hard right angle, and read as crates). A form here is a convex hull of eight corners, each corner shaved off
 * into three, so every edge has a chamfer that catches the light on its own and each limb can taper. The flat
 * shading and the large planes stay: this is still the PS1's block of a man, only one that has been planed.
 * Round 116: the people's torso, limbs, skull and neck are turned (`loft`), eight or ten sides about. Render only.
 */

import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { tint } from './meshKit';
import type { Rgb } from './palette';

type V = [number, number, number];

/** The eight corners of a form: bit 0 is x (0 low, 1 high), bit 1 is y, bit 2 is z. */
function shave(c: V[], r: number): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    const at = new THREE.Vector3(...c[i]);
    for (const bit of [1, 2, 4]) {
      const to = new THREE.Vector3(...c[i ^ bit]);
      const edge = to.clone().sub(at);
      out.push(at.clone().addScaledVector(edge.normalize(), Math.min(r, 0.45 * to.distanceTo(at))));
    }
  }
  return out;
}

/** Faces get a 0..1 UV across the face they lie in most, as a box's do (the cloth and wood textures are fine grain). */
function boxUv(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const [lo, hi] = [geo.boundingBox!.min, geo.boundingBox!.max];
  const [pos, normal] = [geo.getAttribute('position'), geo.getAttribute('normal')];
  const uv = new Float32Array(pos.count * 2);
  const t = (v: number, a: number, b: number): number => (b - a > 1e-6 ? (v - a) / (b - a) : 0.5);
  for (let i = 0; i < pos.count; i++) {
    const [nx, ny, nz] = [Math.abs(normal.getX(i)), Math.abs(normal.getY(i)), Math.abs(normal.getZ(i))];
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const [u, v] = ny >= nx && ny >= nz ? [t(x, lo.x, hi.x), t(z, lo.z, hi.z)] : nx >= nz ? [t(z, lo.z, hi.z), t(y, lo.y, hi.y)] : [t(x, lo.x, hi.x), t(y, lo.y, hi.y)];
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** A hull of `corners` with every edge chamfered by `r` metres, tinted `c`. */
export function hull(corners: V[], c: Rgb, r = 0.012): THREE.BufferGeometry {
  return mergeVertices(tint(boxUv(new ConvexGeometry(shave(corners, r))), c)); // (indexed, like a box, so the two merge)
}

/**
 * A tapering form: its foot `wB` × `dB` at `y - h/2`, its top `wT` × `dT` at `y + h/2` (its middle moved `sx`, `sz`
 * from the foot's), centred at (x, z). Bevelled by `r`.
 */
export function prism(x: number, y: number, z: number, wB: number, dB: number, wT: number, dT: number, h: number, c: Rgb, r = 0.012, sx = 0, sz = 0): THREE.BufferGeometry {
  const corners: V[] = [];
  for (let i = 0; i < 8; i++) {
    const [xs, ys, zs] = [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1];
    corners.push(ys < 0 ? [x + (xs * wB) / 2, y - h / 2, z + (zs * dB) / 2] : [x + sx + (xs * wT) / 2, y + h / 2, z + sz + (zs * dT) / 2]);
  }
  return hull(corners, c, r);
}

/** A bevelled box centred at (x, y, z): the figures' own `box`. */
export const bevel = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb, r = 0.012): THREE.BufferGeometry => prism(x, y, z, w, d, w, d, h, c, r);

// ---- round 116: rounded forms for the people ---------------------------------------------------------------------

/** A ring of a loft: at height `y` in the part's own frame, its half breadth `rx` across and `rz` front to back, its middle moved `x`, `z`. */
export interface Ring {
  y: number;
  rx: number;
  rz: number;
  x?: number;
  z?: number;
}

/**
 * Round 116: a rounded limb, neck, head or body, a tube through `rings` (from the bottom up) `sides` round and closed at both ends. Its
 * section is a squircle (`round` 2: an ellipse; higher, squarer: a coat's flat front and back with rounded sides), and its faces are flat
 * shaded, so it is still the PS1's planed man, only turned on a lathe of eight or ten sides rather than cut from a block.
 */
export function loft(rings: readonly Ring[], c: Rgb, sides = 8, round = 2.6, arc?: readonly [from: number, to: number]): THREE.BufferGeometry {
  const e = 2 / round;
  const count = arc ? sides + 1 : sides; // (an arc's section is closed by its chord)
  const at = (r: Ring, k: number): THREE.Vector3 => {
    const a = arc ? arc[0] + ((arc[1] - arc[0]) * k) / sides : (k / sides) * Math.PI * 2 + Math.PI / sides;
    const [cs, sn] = [Math.cos(a), Math.sin(a)];
    return new THREE.Vector3((r.x ?? 0) + Math.sign(cs) * Math.abs(cs) ** e * r.rx, r.y, (r.z ?? 0) + Math.sign(sn) * Math.abs(sn) ** e * r.rz);
  };
  const pts = rings.map((r) => Array.from({ length: count }, (_, k) => at(r, k)));
  const pos: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, d: THREE.Vector3): void => void pos.push(a.x, a.y, a.z, b.x, b.y, b.z, d.x, d.y, d.z);
  for (let i = 0; i + 1 < rings.length; i++) {
    for (let k = 0; k < count; k++) {
      const [a, b, cc, d] = [pts[i][k], pts[i][(k + 1) % count], pts[i + 1][(k + 1) % count], pts[i + 1][k]];
      tri(a, cc, b); // (wound outward: the world's materials draw front faces only)
      tri(a, d, cc);
    }
  }
  const middle = (ring: THREE.Vector3[]): THREE.Vector3 => ring.reduce((m, p) => m.add(p), new THREE.Vector3()).divideScalar(ring.length); // (inside any convex section)
  const [foot, top, last] = [middle(pts[0]), middle(pts[rings.length - 1]), rings.length - 1];
  for (let k = 0; k < count; k++) {
    tri(foot, pts[0][k], pts[0][(k + 1) % count]);
    tri(top, pts[last][(k + 1) % count], pts[last][k]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals(); // (unindexed: each face its own normal, flat)
  return mergeVertices(tint(boxUv(g), c)); // (indexed, so it merges with the bevelled forms)
}

// ---- the parts of a man, shared by the investigator and the people ----------------------------------------------

const lighter = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k]; // (colours go over 1 here: the world's shaders are lit down to them)

/** The coat's body from the belt up (the figure's torso group has the belt at y = 0 and the neck at 0.64): a waist that gathers, a chest that broadens, shoulders that slope to the sleeves. A robe goes on down to the ground. Round 116: turned, ten sides about, its front and back flatter than its sides, where three blocks were. */
export function coatForms(coat: Rgb, o: { robe?: boolean; belly?: number } = {}): THREE.BufferGeometry[] {
  const b = o.belly ?? 0;
  const out = [loft([
    { y: -0.01, rx: 0.21 + b / 2, rz: 0.125 + b * 0.3, z: 0.005 + b * 0.3 }, // the hips at the belt
    { y: 0.12, rx: 0.195 + b / 2, rz: 0.12 + b * 0.25, z: b * 0.2 }, // the waist, gathering
    { y: 0.27, rx: 0.2, rz: 0.122 },
    { y: 0.45, rx: 0.234, rz: 0.133 }, // the chest, broadening
    { y: 0.555, rx: 0.258, rz: 0.132 }, // the shoulders
    { y: 0.612, rx: 0.205, rz: 0.12 }, // sloping to the neck
    { y: 0.64, rx: 0.12, rz: 0.095 },
  ], coat, 10, 3.2)];
  if (o.robe) out.push(loft([{ y: -0.86, rx: 0.27, rz: 0.17 }, { y: -0.45, rx: 0.25, rz: 0.152 }, { y: 0.05, rx: 0.214, rz: 0.13 }], coat, 10, 2.8));
  return out;
}

/** Round 116: one half of a coat's skirt (`side` 1 his left, -1 his right), from the belt to the knee, flaring: the side of a turned form, closed by its middle, where a flat panel was (it hangs at the hip and swings with its thigh, poses.ts). */
export const coatSkirt = (side: 1 | -1, c: Rgb): THREE.BufferGeometry => {
  const x = side * 0.006;
  return loft([{ y: -0.43, rx: 0.246, rz: 0.17, x }, { y: -0.2, rx: 0.228, rz: 0.15, x }, { y: 0.03, rx: 0.211, rz: 0.125, x }], c, 5, 2.6, side > 0 ? [-Math.PI / 2, Math.PI / 2] : [Math.PI / 2, (3 * Math.PI) / 2]);
};

/** A sleeve from the shoulder to the elbow: wider at the top, a cuff-less end. Centred on its joint, 0.32 long. Round 116: turned, with the swell of the shoulder. */
export const upperArm = (c: Rgb): THREE.BufferGeometry => loft([{ y: -0.31, rx: 0.058, rz: 0.062 }, { y: -0.2, rx: 0.063, rz: 0.067 }, { y: -0.07, rx: 0.074, rz: 0.076 }, { y: 0.01, rx: 0.07, rz: 0.074 }], c, 8, 2.2);

/** A forearm from the elbow to the wrist with its cuff band: 0.28 long, narrowing to the wrist. */
export function foreArm(c: Rgb, cuff: Rgb, band: Rgb): THREE.BufferGeometry[] {
  return [
    loft([{ y: -0.245, rx: 0.05, rz: 0.054 }, { y: -0.16, rx: 0.056, rz: 0.06 }, { y: -0.06, rx: 0.063, rz: 0.067 }, { y: 0.01, rx: 0.062, rz: 0.066 }], c, 8, 2.2), // (round 116: turned, the forearm's swell below the elbow)
    loft([{ y: -0.275, rx: 0.061, rz: 0.065 }, { y: -0.235, rx: 0.062, rz: 0.066 }], cuff, 8, 2.4),
    bevel(0.126, 0.012, 0.134, 0, -0.232, 0, band, 0.004),
  ];
}

/** A hand closed on what it holds: the back of the hand, the fingers curled forward, the thumb across them (gloved or bare). */
export function fist(c: Rgb): THREE.BufferGeometry[] {
  return [
    bevel(0.088, 0.075, 0.1, 0, -0.045, 0.008, c, 0.012),
    bevel(0.082, 0.045, 0.05, 0, -0.1, 0.045, lighter(c, 0.92), 0.01), // the fingers, curled
    bevel(0.03, 0.065, 0.045, 0.043, -0.045, 0.062, lighter(c, 1.06), 0.01), // the thumb
    bevel(0.07, 0.012, 0.012, 0, -0.095, 0.072, lighter(c, 0.7), 0.003), // between the fingers
  ];
}

/** A leg from the hip: the thigh, 0.47 long, thicker above (centred on its joint). Round 116: turned. */
export const thigh = (c: Rgb): THREE.BufferGeometry => loft([{ y: -0.45, rx: 0.073, rz: 0.083 }, { y: -0.3, rx: 0.082, rz: 0.09 }, { y: -0.12, rx: 0.093, rz: 0.1 }, { y: 0.02, rx: 0.096, rz: 0.103 }], c, 8, 2.3);

/** The shin from the knee, 0.41 long, with the calf behind and a turn-up, or (`boot`) a tall boot over its lower half, strapped at the top. */
export function shin(c: Rgb, turnUp: Rgb, boot?: Rgb): THREE.BufferGeometry[] {
  const out = [loft([{ y: -0.38, rx: 0.061, rz: 0.072, z: -0.004 }, { y: -0.25, rx: 0.066, rz: 0.08, z: -0.006 }, { y: -0.1, rx: 0.076, rz: 0.09, z: -0.014 }, { y: 0.03, rx: 0.078, rz: 0.088, z: -0.004 }], c, 8, 2.3)]; // (round 116: turned, the calf behind)
  if (!boot) return [...out, bevel(0.14, 0.03, 0.16, 0, -0.355, 0, turnUp, 0.008)];
  return [...out, prism(0, -0.275, -0.003, 0.14, 0.165, 0.16, 0.185, 0.2, boot, 0.016), bevel(0.172, 0.03, 0.192, 0, -0.175, -0.003, lighter(boot, 1.15), 0.01), bevel(0.03, 0.03, 0.02, 0, -0.2, 0.098, lighter(boot, 1.5), 0.005)];
}

/** A boot or shoe from the ankle (the figure's sole is 0.07 below it): sole, heel, upper, toe-cap. */
export function shoe(upper: Rgb, sole: Rgb, high = 0): THREE.BufferGeometry[] {
  return [
    bevel(0.15, 0.03, 0.275, 0, -0.058, 0.04, sole, 0.008),
    bevel(0.122, 0.04, 0.09, 0, -0.04, -0.075, lighter(sole, 1.1), 0.008), // the heel
    prism(0, 0.0, 0.025, 0.145, 0.22, 0.125, 0.18, 0.075 + high, upper, 0.014, 0, -0.01),
    bevel(0.13, 0.05, 0.075, 0, -0.025, 0.15, lighter(upper, 1.14), 0.012), // the toe-cap
  ];
}

/** The head from the neck: a skull that is broad at the brow and narrows to the jaw, a nose with a bridge, cheekbones, a brow, a mouth, a chin, ears, and the neck beneath. The eyes are the caller's. */
export function faceForms(skin: Rgb): THREE.BufferGeometry[] {
  const dim = (k: number): Rgb => lighter(skin, k);
  return [
    loft([{ y: 0.015, rx: 0.074, rz: 0.08, z: 0.024 }, { y: 0.07, rx: 0.092, rz: 0.1, z: 0.015 }, { y: 0.15, rx: 0.102, rz: 0.108, z: 0.012 }, { y: 0.205, rx: 0.099, rz: 0.104, z: 0.008 }, { y: 0.238, rx: 0.07, rz: 0.08, z: 0.002 }, { y: 0.25, rx: 0.03, rz: 0.036 }], skin, 10, 2.6), // the skull and face (round 116: turned, a crown to it)
    prism(0, 0.04, 0.045, 0.1, 0.1, 0.15, 0.17, 0.07, dim(0.9), 0.016), // the jaw
    bevel(0.085, 0.045, 0.06, 0, 0.012, 0.1, dim(0.88), 0.012), // the chin
    bevel(0.038, 0.075, 0.045, 0, 0.1, 0.132, dim(0.94), 0.01), // the nose
    bevel(0.045, 0.026, 0.03, 0, 0.078, 0.145, dim(0.92), 0.008), // its tip
    bevel(0.04, 0.04, 0.02, -0.07, 0.088, 0.108, dim(0.97), 0.008), // the cheekbones
    bevel(0.04, 0.04, 0.02, 0.07, 0.088, 0.108, dim(0.97), 0.008),
    bevel(0.072, 0.012, 0.012, 0, 0.052, 0.12, dim(0.62), 0.003), // the mouth
    bevel(0.035, 0.05, 0.05, -0.108, 0.12, 0.0, dim(0.9), 0.008), // the ears
    bevel(0.035, 0.05, 0.05, 0.108, 0.12, 0.0, dim(0.9), 0.008),
    loft([{ y: -0.055, rx: 0.05, rz: 0.052, z: -0.005 }, { y: 0.035, rx: 0.047, rz: 0.05, z: -0.005 }], dim(0.86), 8, 2.2), // the neck
  ];
}
