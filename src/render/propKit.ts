/**
 * What the prop builders share (round 111: propShapes.ts and the form files beside it): a tapering cylinder, a branch, a scatter
 * that is the same at a seam's vertices, a colour by height, a merge that takes indexed and unindexed pieces alike, and a lumpy
 * rock-like solid from a sphere.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Rng } from '../core/rng';
import { tileUv, tint } from './meshKit';
import { mixRgb, type Rgb } from './palette';

export type { Rgb };

/** A cylinder from its foot (r0) to its top (r1), `h` tall, standing on the origin. */
export const cyl = (r0: number, r1: number, h: number, seg: number, c: Rgb, rows = 1): THREE.BufferGeometry =>
  tint(tileUv(new THREE.CylinderGeometry(r1, r0, h, seg, rows).translate(0, h / 2, 0), Math.PI * (r0 + r1), h), c);

/** A branch from the origin along (yaw, pitch from vertical), `len` long, tapering from r. */
export const limb = (len: number, r: number, yaw: number, pitch: number, c: Rgb, taper = 0.35): THREE.BufferGeometry => cyl(r, r * taper, len, 4, c).rotateX(pitch).rotateY(yaw);

/** Where a limb from `from` along (yaw, pitch) ends after `len`. */
export const tipOf = (from: readonly number[], yaw: number, pitch: number, len: number): [number, number, number] => [
  from[0] + Math.sin(yaw) * Math.sin(pitch) * len,
  from[1] + Math.cos(pitch) * len,
  from[2] + Math.cos(yaw) * Math.sin(pitch) * len,
];

/** A segment of trunk or limb from a to b, tapering r0 to r1 (a cylinder turned onto the line). */
export function stem(a: readonly number[], b: readonly number[], r0: number, r1: number, seg: number, c: Rgb): THREE.BufferGeometry {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = Math.max(d.length(), 1e-3);
  const g = cyl(r0, r1, len, seg, c);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  return g.translate(a[0], a[1], a[2]);
}

/** A scatter in [0, 1) from where a point is (round 21: a sphere's seam and poles are several vertices at one place, and drawing a scatter for each tore the rock open along them). */
export const scatter = (x: number, y: number, z: number, salt: number): number => {
  const v = Math.sin(Math.round(x * 1e4) * 12.9898 + Math.round(y * 1e4) * 78.233 + Math.round(z * 1e4) * 37.719 + salt * 4.1414) * 43758.5453;
  return v - Math.floor(v);
};

/** Pieces merged into one geometry, indexed or not (an icosahedron is unindexed, a cylinder indexed). */
export function join(geos: readonly THREE.BufferGeometry[]): THREE.BufferGeometry {
  const mixed = geos.some((g) => g.index) && geos.some((g) => !g.index);
  return mergeGeometries(mixed ? geos.map((g) => (g.index ? g.toNonIndexed() : g)) : [...geos]);
}

/** Recolours a geometry by each vertex's height and how much it faces up: `top` laid on what faces the sky, by `share`. */
export function topCoat(geo: THREE.BufferGeometry, top: Rgb, share: number): THREE.BufferGeometry {
  geo.computeVertexNormals();
  const [nor, col] = [geo.getAttribute('normal'), geo.getAttribute('color')];
  for (let i = 0; i < col.count; i++) {
    const k = Math.max(0, (nor.getY(i) - (1 - share)) / Math.max(share, 1e-3));
    const c = mixRgb([col.getX(i), col.getY(i), col.getZ(i)], top, Math.min(1, k));
    col.setXYZ(i, c[0], c[1], c[2]);
  }
  return geo;
}

/**
 * A lump of stone from a sphere of radius `w`, flattened to `h` tall: each point pushed in or out by `rough` (where it is, so seams
 * hold), cut flat below `floor` of its radius, and the colour `c`, with `top` on what faces up.
 */
export function lump(w: number, h: number, rng: Rng, c: Rgb, top: Rgb, share: number, { rough = 0.44, floor = -0.25, seg = 8, rows = 6 } = {}): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(w, seg, rows);
  const pos = geo.getAttribute('position');
  const salt = rng() * 100;
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const k = 1 - rough / 2 + rough * scatter(x, y, z, salt);
    pos.setXYZ(i, x * k, Math.max(floor * w, y) * (h / w) * (1 - rough / 3 + (rough * 2) / 3 * scatter(x, y, z, salt + 1)), z * (1 - rough / 2 + rough * scatter(x, y, z, salt + 2)));
  }
  tint(geo, c);
  return topCoat(tileUv(geo, w * 2, h), top, share);
}

/** Recolours what faces straight up (a cylinder's top cap: a stump's sawn face, a pipe's dark mouth). */
export function capTint(geo: THREE.BufferGeometry, c: Rgb): THREE.BufferGeometry {
  const [nor, col] = [geo.getAttribute('normal'), geo.getAttribute('color')];
  for (let i = 0; i < col.count; i++) if (nor.getY(i) > 0.95) col.setXYZ(i, c[0], c[1], c[2]);
  return geo;
}
