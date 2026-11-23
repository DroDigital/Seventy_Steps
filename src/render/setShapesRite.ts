/**
 * The built pieces of the rites (round 61; render/setShapes.ts): the totem of stacked faces, the skull on its pole, and the
 * horned tree of the black grove. In the piece's own frame, feet at the origin. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.some((g) => !g.index) ? parts.map((g) => (g.index ? g.toNonIndexed() : g)) : parts);
const BARK: Rgb = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.25), 1.5);
const BONE: Rgb = scaleRgb(BASE.bone, 0.75);

/** A totem: stacked blocks, each turned a little from the last, with a beak and two eyes on its face, a crest of two boards above. */
export function totem(p: Prop): Piece[] {
  const [n, s] = [5, p.h / 5];
  const wood: THREE.BufferGeometry[] = [box(s * 1.15, 0.3, s * 1.15, 0, 0.15, 0, scaleRgb(BARK, 0.8))];
  const eyes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const turn = (i % 2) * 0.35 - 0.15;
    const [y, k] = [0.3 + i * s * 0.9 + s / 2, 1 - i * 0.05];
    wood.push(tileUv(box(s * k, s * 0.9, s * k, 0, y, 0, scaleRgb(BARK, 0.9 + 0.2 * (i % 2))), s, s).rotateY(turn));
    wood.push(box(s * 0.18, s * 0.2, s * 0.35, 0, y - s * 0.05, s * k * 0.5 + 0.1, scaleRgb(BARK, 1.2)).rotateY(turn)); // the beak
    for (const e of [-1, 1]) eyes.push(box(0.08, 0.08, 0.05, e * s * k * 0.22, y + s * 0.18, s * k * 0.5 + 0.02, [1, 0.62, 0.3]).rotateY(turn));
  }
  const top = 0.3 + (n - 1) * s * 0.9 + s;
  for (const e of [-1, 1]) wood.push(box(s * 0.12, s * 0.9, s * 0.7, e * s * 0.55, top + s * 0.1, 0, scaleRgb(BARK, 1.3)).rotateZ(e * 0.35));
  return [{ mat: 'wood', geo: merged(wood) }, { mat: 'glow', geo: merged(eyes) }];
}

/**
 * A skull on a pole, antlered: what the sabbat sets about its fire. Round 117: the pole bound with cords at its crosspiece, small bones
 * and rags hung from the crosspiece's ends on their strings, a jaw under the skull, and a ring of stones heaped about its foot.
 */
export function skullPole(p: Prop): Piece[] {
  const h = p.h;
  const cylGeo = (r0: number, r1: number, len: number, c: Rgb): THREE.BufferGeometry => tint(tileUv(new THREE.CylinderGeometry(r1, r0, len, 5).translate(0, len / 2, 0), 1, len), c);
  const wood = [cylGeo(0.1, 0.07, h, BARK), box(0.5, 0.05, 0.05, 0, h * 0.62, 0, BARK), box(0.05, 0.05, 0.4, 0, h * 0.5, 0, BARK)];
  for (const y of [h * 0.6, h * 0.64, h * 0.48]) wood.push(tint(new THREE.CylinderGeometry(0.095, 0.095, 0.03, 5).translate(0, y, 0), scaleRgb(BARK, 0.6))); // the cords that bind it
  const bone: THREE.BufferGeometry[] = [
    tint(new THREE.SphereGeometry(0.24, 6, 5).scale(1, 0.9, 1.15).translate(0, h + 0.1, 0), BONE),
    box(0.2, 0.12, 0.2, 0, h - 0.06, 0.16, BONE),
    box(0.22, 0.05, 0.16, 0, h - 0.17, 0.12, scaleRgb(BONE, 0.9)), // its jaw
  ];
  for (const e of [-1, 1]) {
    bone.push(cylGeo(0.05, 0.02, 0.7, BONE).rotateZ(e * 0.7).translate(e * 0.14, h + 0.2, 0), cylGeo(0.035, 0.015, 0.4, BONE).rotateZ(e * 1.1).translate(e * 0.4, h + 0.55, 0));
    wood.push(box(0.012, 0.3, 0.012, e * 0.24, h * 0.62 - 0.15, 0, scaleRgb(BARK, 0.7)), box(0.012, 0.22, 0.012, 0, h * 0.5 - 0.11, e * 0.19, scaleRgb(BARK, 0.7))); // strings
    bone.push(box(0.03, 0.16, 0.03, e * 0.24, h * 0.62 - 0.38, 0, BONE), box(0.03, 0.12, 0.03, 0, h * 0.5 - 0.28, e * 0.19, BONE)); // and the small bones on them
  }
  const stones: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) { // a ring of stones heaped about its foot
    const a = (k / 6) * Math.PI * 2 + p.seed * 0.3;
    stones.push(tint(new THREE.IcosahedronGeometry(0.13 + 0.04 * (k % 3), 0).scale(1.2, 0.7, 1).translate(Math.cos(a) * 0.3, 0.06, Math.sin(a) * 0.3), scaleRgb(BASE.seaGrey, 1.2 + 0.1 * (k % 2))));
  }
  return [{ mat: 'wood', geo: merged(wood) }, { mat: 'stone', geo: merged([...bone, ...stones]) }];
}

/** The horned tree of the black grove: a trunk that swells at its foot, and limbs that climb and fork like antlers. */
export function hornTree(p: Prop): Piece[] {
  const h = p.h;
  const limb = (len: number, r: number, yaw: number, lean: number, y: number): THREE.BufferGeometry[] => {
    const out: THREE.BufferGeometry[] = [];
    let [x, yy, z, a, b] = [0, y, 0, yaw, lean];
    for (let seg = 0; seg < 3; seg++) {
      const l = len / (seg + 1.4);
      const g = tint(tileUv(new THREE.CylinderGeometry(r * 0.6, r, l, 5).translate(0, l / 2, 0), 1, l), BARK).rotateX(b).rotateY(a).translate(x, yy, z);
      out.push(g);
      [x, yy, z] = [x + Math.sin(a) * Math.sin(b) * l, yy + Math.cos(b) * l, z + Math.cos(a) * Math.sin(b) * l];
      a += seg % 2 ? 0.5 : -0.5; // forks
      b = Math.max(0.2, b * 0.7);
      r *= 0.6;
    }
    return out;
  };
  const parts = [tint(tileUv(new THREE.CylinderGeometry(p.w * 0.5, p.w * 1.6, 0.8, 7).translate(0, 0.4, 0), 2, 1), scaleRgb(BARK, 0.8)), tint(tileUv(new THREE.CylinderGeometry(p.w * 0.35, p.w * 0.55, h * 0.75, 7, 4).translate(0, 0.8 + h * 0.375, 0), 2, h), BARK)];
  for (let k = 0; k < 7; k++) parts.push(...limb(h * 0.4, p.w * 0.28, k * 2.4 + p.seed * 0.001, 0.5 + 0.25 * (k % 3), h * (0.55 + 0.05 * k)));
  return [{ mat: 'wood', geo: merged(parts) }];
}
