/**
 * The towers of a horror's house (round 63; world/arenaHouse.ts, render/setShapes.ts): the square one with a machicolated top, the
 * round one, the spire (an obelisk with a band of light), and the grove's horned tree; with a brazier burning on the top of those
 * that are lit. In the piece's own frame, feet at the origin: `w` and `d` its half breadth at the foot, `h` its height. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';
import { hornTree } from './setShapesRite';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
const FLAME: Rgb = mixRgb(BASE.bone, [1, 0.8, 0.5], 0.6);
const stone = (p: Prop, k = 1): Rgb => scaleRgb(p.set?.tint ? mixRgb(scaleRgb(BASE.seaGrey, 1.7), p.set.tint, 0.65) : scaleRgb(BASE.seaGrey, 1.7), k);
const block = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb): THREE.BufferGeometry => tileUv(box(w, h, d, x, y, z, c, Math.max(1.8, Math.max(w, h, d) / 6)), Math.max(w, d), h); // (its faces in cells 1.8 m wide at the least, and six across at the most: a wall of twenty metres is not cut into a thousand)

/** A brazier on a tower's top: a flame, lighting about it, when the piece is lit. */
function brazier(p: Prop, top: number): Piece[] {
  if (!p.set?.lit) return [];
  const size = Math.max(0.5, p.w * 0.3);
  const geo = tint(tileUv(new THREE.ConeGeometry(size, size * 1.8, 6).translate(0, top + size * 0.9 + 0.3, 0), 1, 1), FLAME);
  return [{ mat: 'glow', geo, light: p.set.lit, at: [0, top + size + 0.4, 0] }];
}

/** The square tower: a battered shaft, a machicolated head wider than it, merlons about the top. */
export function towerSquare(p: Prop): Piece[] {
  const [w, H] = [p.w * 2, p.h];
  const parts = [block(w * 1.12, H * 0.08, w * 1.12, 0, H * 0.04, 0, stone(p, 0.75)), block(w * 0.94, H * 0.8, w * 0.94, 0, H * 0.08 + H * 0.4, 0, stone(p)), block(w * 1.12, H * 0.08, w * 1.12, 0, H * 0.9, 0, stone(p, 1.1))];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(block(w * 0.28, H * 0.06, w * 0.28, sx * w * 0.42, H * 0.97, sz * w * 0.42, stone(p, 1.05)));
  return [{ mat: 'stone', geo: merged(parts) }, ...brazier(p, H * 0.94)];
}

/** The round tower: a tapering drum, a ring about its head, a roof of stone. */
export function towerRound(p: Prop): Piece[] {
  const [r, H] = [p.w, p.h];
  const drum = tint(tileUv(new THREE.CylinderGeometry(r * 0.78, r, H * 0.86, 10).translate(0, H * 0.43, 0), r * 6, H), stone(p));
  const ring = tint(tileUv(new THREE.CylinderGeometry(r * 1.02, r * 0.95, H * 0.07, 10).translate(0, H * 0.88, 0), r * 6, 1), stone(p, 1.15));
  const roof = tint(new THREE.ConeGeometry(r * 0.9, H * 0.14, 10).translate(0, H * 0.96, 0), stone(p, 0.8));
  return [{ mat: 'stone', geo: merged([drum, ring, roof]) }, ...brazier(p, H * 0.9)];
}

/** The spire: a tall four-sided obelisk, a band of light a third of the way up, a point on its top. */
export function towerSpire(p: Prop): Piece[] {
  const [r, H] = [p.w, p.h];
  const shaft = tint(tileUv(new THREE.CylinderGeometry(r * 0.3, r, H * 0.9, 4).rotateY(Math.PI / 4).translate(0, H * 0.45, 0), r * 4, H), stone(p));
  const point = tint(new THREE.ConeGeometry(r * 0.32, H * 0.1, 4).rotateY(Math.PI / 4).translate(0, H * 0.95, 0), stone(p, 1.2));
  const band = box(r * 1.35, 0.1, r * 1.35, 0, H * 0.33, 0, ANOMALY[p.set?.glow ?? 'purple']).rotateY(Math.PI / 4);
  return [{ mat: 'stone', geo: merged([shaft, point]) }, { mat: 'glow', geo: band }, ...brazier(p, H)];
}

/** The horned tree: the grove's, grown to the size of a tower. */
export const towerHorn = (p: Prop): Piece[] => hornTree({ ...p, w: p.w * 0.5, d: p.d * 0.5 });
