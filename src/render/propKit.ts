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

/** Darkens what faces down by up to `k` (the shade inside a crown or under a bush), by each vertex's own normal. */
export function shadeBelow(geo: THREE.BufferGeometry, k: number): THREE.BufferGeometry {
  geo.computeVertexNormals();
  const [nor, col] = [geo.getAttribute('normal'), geo.getAttribute('color')];
  for (let i = 0; i < col.count; i++) {
    const f = 1 - k * (0.5 - 0.5 * nor.getY(i));
    col.setXYZ(i, col.getX(i) * f, col.getY(i) * f, col.getZ(i) * f);
  }
  return geo;
}

/**
 * Each point pushed out from `centre` by a scatter of where it is, between 1 - amount and 1 + amount (the same at a seam's twin points,
 * so no face tears); with `level`, out from the upright axis through `centre` alone, so its height is kept.
 */
export function roughen(geo: THREE.BufferGeometry, amount: number, salt: number, centre: readonly number[] = [0, 0, 0], level = false): THREE.BufferGeometry {
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    const k = 1 - amount + 2 * amount * scatter(x, y, z, salt);
    pos.setXYZ(i, centre[0] + (x - centre[0]) * k, level ? y : centre[1] + (y - centre[1]) * k, centre[2] + (z - centre[2]) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * A cone of boughs, `r` wide and `h` tall about its own middle (as ConeGeometry stands), whose rim is drawn in and lifted at every other
 * point: a skirt of hanging bough tips, not a smooth lampshade. Its base cap's rim moves with the side's, so it stays closed.
 */
export function boughCone(r: number, h: number, tips: number, inset = 0.3, lift = 0.16): THREE.BufferGeometry {
  const seg = tips * 2;
  const g = new THREE.ConeGeometry(r, h, seg);
  const pos = g.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    if (y > -h / 2 + 1e-4 || Math.hypot(x, z) < r * 0.5) continue;
    const k = Math.round(Math.atan2(x, z) / ((Math.PI * 2) / seg));
    if (((k % 2) + 2) % 2 === 0) continue;
    pos.setXYZ(i, x * (1 - inset), y + h * lift, z * (1 - inset));
  }
  g.computeVertexNormals();
  return g;
}

/** Roots from a trunk of radius `r` at its foot: `n` of them out from its flank and down into the ground, `reach` metres out. */
export function roots(r: number, n: number, reach: number, c: Rgb, rng: Rng, from = 0.3): THREE.BufferGeometry[] {
  return Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 + rng() * 0.7;
    const [s, co] = [Math.sin(a), Math.cos(a)];
    const out = reach * (0.75 + 0.5 * rng());
    return stem([s * r * 0.5, from + 0.1 * rng(), co * r * 0.5], [s * (r + out), -0.3, co * (r + out)], r * 0.45, r * 0.24, 4, c); // thick at the trunk, diving into the ground rather than pointing along it
  });
}

/** Colours a cylinder's two flat ends (|normal.y| near 1, before it is turned): its rim `rim`, its middle `heart` (a sawn log's or stump's end grain). */
export function endGrain(geo: THREE.BufferGeometry, rim: Rgb, heart: Rgb): THREE.BufferGeometry {
  const [nor, col, pos] = [geo.getAttribute('normal'), geo.getAttribute('color'), geo.getAttribute('position')];
  for (let i = 0; i < col.count; i++) {
    if (Math.abs(nor.getY(i)) < 0.95) continue;
    const c = Math.hypot(pos.getX(i), pos.getZ(i)) < 1e-4 ? heart : rim;
    col.setXYZ(i, c[0], c[1], c[2]);
  }
  return geo;
}
