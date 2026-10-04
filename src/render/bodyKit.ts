/**
 * Bevelled forms for the figures (round 39: the player and the people were built of plain boxes, every edge a
 * hard right angle, and read as crates). A form here is a convex hull of eight corners, each corner shaved off
 * into three, so every edge has a chamfer that catches the light on its own and each limb can taper. The flat
 * shading and the large planes stay: this is still the PS1's block of a man, only one that has been planed.
 * Render only.
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

// ---- the parts of a man, shared by the investigator and the people ----------------------------------------------

const lighter = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k]; // (colours go over 1 here: the world's shaders are lit down to them)

/** The coat's body from the belt up (the figure's torso group has the belt at y = 0 and the neck at 0.64): a waist that gathers, a chest that broadens, shoulders that slope to the sleeves. A robe goes on down to the ground. */
export function coatForms(coat: Rgb, o: { robe?: boolean; belly?: number } = {}): THREE.BufferGeometry[] {
  const b = o.belly ?? 0;
  const out = [
    prism(0, 0.12, 0.005 + b * 0.3, 0.42 + b, 0.25 + b * 0.6, 0.37, 0.235, 0.26, coat, 0.02), // waist and hips
    prism(0, 0.43, 0, 0.37, 0.235, 0.47, 0.265, 0.36, coat, 0.022), // the chest, broadening
    prism(0, 0.585, 0, 0.53, 0.27, 0.34, 0.235, 0.09, coat, 0.022), // the shoulders sloping to the neck
  ];
  if (o.robe) out.push(prism(0, -0.4, 0, 0.52, 0.33, 0.42, 0.26, 0.9, coat, 0.03));
  return out;
}

/** A sleeve from the shoulder to the elbow: wider at the top, a cuff-less end. Centred on its joint, 0.32 long. */
export const upperArm = (c: Rgb): THREE.BufferGeometry => prism(0, -0.15, 0, 0.115, 0.125, 0.145, 0.15, 0.32, c, 0.016);

/** A forearm from the elbow to the wrist with its cuff band: 0.28 long, narrowing to the wrist. */
export function foreArm(c: Rgb, cuff: Rgb, band: Rgb): THREE.BufferGeometry[] {
  return [prism(0, -0.125, 0, 0.1, 0.108, 0.128, 0.135, 0.27, c, 0.014), bevel(0.122, 0.04, 0.13, 0, -0.255, 0, cuff, 0.01), bevel(0.126, 0.012, 0.134, 0, -0.232, 0, band, 0.004)];
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

/** A leg from the hip: the thigh, 0.47 long, thicker above (centred on its joint). */
export const thigh = (c: Rgb): THREE.BufferGeometry => prism(0, -0.215, 0, 0.145, 0.165, 0.19, 0.205, 0.47, c, 0.02);

/** The shin from the knee, 0.41 long, with the calf behind and a turn-up, or (`boot`) a tall boot over its lower half, strapped at the top. */
export function shin(c: Rgb, turnUp: Rgb, boot?: Rgb): THREE.BufferGeometry[] {
  const out = [prism(0, -0.175, -0.004, 0.122, 0.145, 0.155, 0.175, 0.41, c, 0.016)];
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
    prism(0, 0.125, 0.012, 0.155, 0.17, 0.205, 0.215, 0.22, skin, 0.02), // the skull and face
    prism(0, 0.04, 0.045, 0.1, 0.1, 0.15, 0.17, 0.07, dim(0.9), 0.016), // the jaw
    bevel(0.085, 0.045, 0.06, 0, 0.012, 0.1, dim(0.88), 0.012), // the chin
    bevel(0.038, 0.075, 0.045, 0, 0.1, 0.132, dim(0.94), 0.01), // the nose
    bevel(0.045, 0.026, 0.03, 0, 0.078, 0.145, dim(0.92), 0.008), // its tip
    bevel(0.04, 0.04, 0.02, -0.07, 0.088, 0.108, dim(0.97), 0.008), // the cheekbones
    bevel(0.04, 0.04, 0.02, 0.07, 0.088, 0.108, dim(0.97), 0.008),
    bevel(0.072, 0.012, 0.012, 0, 0.052, 0.12, dim(0.62), 0.003), // the mouth
    bevel(0.035, 0.05, 0.05, -0.108, 0.12, 0.0, dim(0.9), 0.008), // the ears
    bevel(0.035, 0.05, 0.05, 0.108, 0.12, 0.0, dim(0.9), 0.008),
    bevel(0.1, 0.09, 0.1, 0, -0.01, -0.005, dim(0.86), 0.012), // the neck
  ];
}
