/**
 * The built idols and instruments (round 61; render/setShapes.ts): the sea-green idol of Bokrug on its pedestal, the pipes of the
 * daemon pipers, the tattered banner of Carcosa, the fallen star of the heath. In the piece's own frame, feet at the origin, facing
 * +z. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts);
const SEA: Rgb = mixRgb(scaleRgb(BASE.seaGrey, 1.5), [0.3, 0.55, 0.45], 0.45);
const cylinder = (r0: number, r1: number, h: number, seg: number, y: number, c: Rgb): THREE.BufferGeometry => tint(tileUv(new THREE.CylinderGeometry(r1, r0, h, seg).translate(0, y + h / 2, 0), r0 * 6, h), c);

/** The idol: a stepped pedestal, a squat saurian crouched on it, its head low and broad, two green eyes, a spine of plates down its back. */
export function idol(p: Prop): Piece[] {
  const s = p.h / 5;
  const parts: THREE.BufferGeometry[] = [
    tileUv(box(p.w * 2, s * 0.6, p.d * 2, 0, s * 0.3, 0, scaleRgb(SEA, 0.8), 1), p.w * 2, 1),
    tileUv(box(p.w * 1.6, s * 0.5, p.d * 1.6, 0, s * 0.85, 0, scaleRgb(SEA, 0.9), 1), p.w * 2, 1),
    tint(tileUv(new THREE.SphereGeometry(s * 1.2, 7, 5).scale(1.1, 0.95, 1.5).translate(0, s * 2.1, 0), 2, 2), SEA), // the body
    tint(tileUv(new THREE.SphereGeometry(s * 0.7, 6, 5).scale(1.2, 0.8, 1.1).translate(0, s * 3.1, s * 1.4), 2, 2), scaleRgb(SEA, 1.1)), // the head, thrust forward
    box(s * 0.9, s * 0.4, s * 0.9, 0, s * 2.8, s * 2.1, scaleRgb(SEA, 1.0)), // the snout
  ];
  for (const e of [-1, 1]) {
    parts.push(cylinder(s * 0.35, s * 0.2, s * 1.4, 5, 0.5 * s, scaleRgb(SEA, 0.9)).rotateZ(e * 0.5).translate(e * s * 1.1, s * 0.4, s * 0.4)); // the forelegs, bent
  }
  for (let i = 0; i < 6; i++) parts.push(box(s * 0.12, s * 0.5 * (1 - i * 0.1), s * 0.35, 0, s * 3.1 - i * s * 0.18, -s * 0.2 - i * s * 0.35, scaleRgb(SEA, 1.15)).rotateX(-0.3));
  const eyes = [-1, 1].map((e) => box(s * 0.18, s * 0.14, s * 0.1, e * s * 0.48, s * 3.28, s * 1.95, ANOMALY[p.set?.glow ?? 'green']));
  return [{ mat: 'stone', geo: merged(parts) }, { mat: 'glow', geo: merged(eyes), light: p.set?.lit, at: [0, s * 3.2, s * 2.2] }];
}

/** The pipes: a cluster of black reeds of stone, no two of a height, each open at its top, on a low plinth. */
export function pipes(p: Prop): Piece[] {
  const c = scaleRgb(BASE.charcoal, 1.9);
  const parts: THREE.BufferGeometry[] = [cylinder(p.w * 1.5, p.w * 1.4, 0.35, 8, 0, scaleRgb(c, 0.8))];
  for (let i = 0; i < 7; i++) {
    const [a, r] = [(i / 7) * Math.PI * 2 + p.seed * 0.01, i === 0 ? 0 : p.w * 0.85];
    const h = p.h * (i === 0 ? 1 : 0.45 + 0.4 * (((p.seed >> i) & 7) / 7));
    parts.push(cylinder(p.w * 0.28, p.w * 0.22, h, 7, 0.3, scaleRgb(c, 0.9 + 0.2 * (i % 2))).translate(Math.cos(a) * r, 0, Math.sin(a) * r));
  }
  return [{ mat: 'stone', geo: merged(parts) }];
}

/** A banner on a pole: a long strip of cloth hung from a crosspiece, torn at its foot. */
export function banner(p: Prop): Piece[] {
  const pole = merged([cylinder(0.12, 0.08, p.h, 5, 0, scaleRgb(BASE.charcoal, 2)), box(p.w * 2, 0.08, 0.08, 0, p.h * 0.93, 0, scaleRgb(BASE.charcoal, 2))]);
  const cloth: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) { // the strip in four tatters, each hung a little askew
    const [w, h] = [p.w * 0.46, p.h * (0.5 - i * 0.04 + (((p.seed >> i) & 3) / 3) * 0.12)];
    cloth.push(box(w, h, 0.04, (i - 1.5) * p.w * 0.5, p.h * 0.9 - h / 2, 0.06, mixRgb(BASE.bone, [0.9, 0.75, 0.3], 0.5)).rotateZ((((p.seed >> (i + 4)) & 3) - 1.5) * 0.03));
  }
  return [{ mat: 'wood', geo: pole }, { mat: 'trim', geo: merged(cloth) }];
}

/** The fallen star: a faceted stone cracked with the colour, a pale light about it. */
export function meteor(p: Prop): Piece[] {
  const rock = tint(tileUv(new THREE.IcosahedronGeometry(p.w, 0).scale(1, 0.8, 1).translate(0, p.w * 0.7, 0), 2, 2), scaleRgb(BASE.charcoal, 1.6));
  const cracks = merged([0, 1, 2, 3].map((i) => box(p.w * 1.3, 0.06, 0.06, 0, p.w * (0.5 + i * 0.12), 0, ANOMALY[p.set?.glow ?? 'magenta']).rotateY(i * 0.8).rotateZ(0.4 - i * 0.2)));
  return [{ mat: 'stone', geo: rock }, { mat: 'glow', geo: cracks, light: p.set?.lit, at: [0, p.w * 1.2, 0] }];
}
