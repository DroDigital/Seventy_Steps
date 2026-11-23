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
import { capTint, roughen } from './propKit';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.some((g) => !g.index) ? parts.map((g) => (g.index ? g.toNonIndexed() : g)) : parts);
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

/**
 * The pipes: a cluster of black reeds of stone, no two of a height, each open at its top, on a low plinth. Round 117: on a plinth of two
 * steps, each pipe flaring to a lip over a dark mouth, girt with a band or two, a few of them leaning out from the rest.
 */
export function pipes(p: Prop): Piece[] {
  const c = scaleRgb(BASE.charcoal, 1.9);
  const parts: THREE.BufferGeometry[] = [cylinder(p.w * 1.5, p.w * 1.4, 0.22, 8, 0, scaleRgb(c, 0.75)), cylinder(p.w * 1.25, p.w * 1.18, 0.16, 8, 0.2, scaleRgb(c, 0.82))];
  for (let i = 0; i < 7; i++) {
    const [a, r] = [(i / 7) * Math.PI * 2 + p.seed * 0.01, i === 0 ? 0 : p.w * 0.85];
    const h = p.h * (i === 0 ? 1 : 0.45 + 0.4 * (((p.seed >> i) & 7) / 7));
    const tone = scaleRgb(c, 0.9 + 0.2 * (i % 2));
    const pipe = [cylinder(p.w * 0.28, p.w * 0.22, h, 7, 0.3, tone), cylinder(p.w * 0.22, p.w * 0.3, 0.3, 7, 0.3 + h, tone)]; // its shaft, and its lip flaring out
    pipe.push(capTint(cylinder(p.w * 0.3, p.w * 0.3, 0.02, 7, 0.6 + h, tone), scaleRgb(c, 0.18))); // the dark mouth inside the lip
    for (const t of [0.35, 0.7].slice(0, 1 + ((p.seed >> (i + 2)) & 1))) pipe.push(cylinder(p.w * 0.27, p.w * 0.27, 0.12, 7, 0.3 + h * t, tone)); // a band, in its own stone
    const lean = i && ((p.seed >> (i + 4)) & 3) === 0 ? 0.08 : 0; // one now and then leaning out from the rest
    parts.push(...pipe.map((g) => g.rotateZ(lean).rotateY(-a).translate(Math.cos(a) * r, 0, Math.sin(a) * r)));
  }
  return [{ mat: 'stone', geo: merged(parts) }];
}

/**
 * A banner on a pole: a long strip of cloth hung from a crosspiece, torn at its foot. Round 117: the cloth hangs in folds and its foot is
 * torn ragged, a sign is worked on it in a darker thread, the crosspiece ends in finials and a cord hangs from either end.
 */
export function banner(p: Prop): Piece[] {
  const iron = scaleRgb(BASE.charcoal, 2);
  const pole = [cylinder(0.12, 0.08, p.h, 5, 0, iron), box(p.w * 2, 0.08, 0.08, 0, p.h * 0.93, 0, iron), tint(new THREE.SphereGeometry(0.1, 6, 4).translate(0, p.h + 0.05, 0), iron)];
  for (const e of [-1, 1]) pole.push(tint(new THREE.ConeGeometry(0.06, 0.2, 5).translate(e * (p.w + 0.08), p.h * 0.93, 0).rotateZ(0), iron));
  const [cw, ch] = [p.w * 1.84, p.h * 0.62];
  const cloth = new THREE.BoxGeometry(cw, ch, 0.03, 8, 10, 1).translate(0, -ch / 2, 0);
  const pos = cloth.getAttribute('position');
  for (let i = 0; i < pos.count; i++) { // its folds, and its foot torn ragged
    const [x, y] = [pos.getX(i), pos.getY(i)];
    pos.setZ(i, pos.getZ(i) + Math.sin((x / cw) * Math.PI * 4 + p.seed) * 0.06 * (0.4 - y / ch));
    if (y < -ch + 1e-3) pos.setY(i, y + ch * 0.22 * ((((p.seed >> Math.round((x / cw + 0.5) * 8)) & 3) / 3) * (Math.round((x / cw + 0.5) * 8) % 2 ? 1 : 0.4)));
  }
  cloth.computeVertexNormals();
  const gold = mixRgb(BASE.bone, [0.9, 0.75, 0.3], 0.5);
  const sign: THREE.BufferGeometry[] = []; // a sign worked in it: three hooked strokes from a ring (Carcosa's, for the eye that knows it)
  const [sy, sr] = [p.h * 0.93 - ch * 0.42, Math.min(cw, ch) * 0.16];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
    sign.push(box(0.06, sr * 1.6, 0.02, 0, 0, 0, scaleRgb(gold, 0.42)).translate(0, sr * 0.8, 0).rotateZ(a).translate(0, sy, 0.05));
    sign.push(box(sr * 0.6, 0.06, 0.02, 0, 0, 0, scaleRgb(gold, 0.42)).translate(sr * 0.3, sr * 1.6, 0).rotateZ(a).translate(0, sy, 0.05));
  }
  const cords = [-1, 1].map((e) => box(0.03, p.h * 0.25, 0.03, e * (p.w - 0.05), p.h * 0.93 - p.h * 0.125, 0.02, scaleRgb(gold, 0.7)));
  return [{ mat: 'wood', geo: merged(pole) }, { mat: 'cloth', geo: merged([tint(cloth.translate(0, p.h * 0.93 - 0.04, 0.06), gold), ...cords]) }, { mat: 'trim', geo: merged(sign) }];
}

/**
 * The fallen star: a faceted stone cracked with the colour, a pale light about it. Round 117: its stone pitted and uneven, sunk in a crater
 * whose rim of earth it threw up, splinters of it lying about.
 */
export function meteor(p: Prop): Piece[] {
  const rock = tint(tileUv(roughen(new THREE.IcosahedronGeometry(p.w, 1).scale(1, 0.8, 1), 0.12, p.seed * 0.01).translate(0, p.w * 0.6, 0), 2, 2), scaleRgb(BASE.charcoal, 1.6));
  const earth = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.4), 1.3);
  const rim: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 14; k++) { // the crater's rim, thrown up in clods that lie against one another
    const a = (k / 14) * Math.PI * 2 + p.seed * 0.1;
    const r = p.w * (1.4 + 0.15 * (((p.seed >> k) & 3) / 3));
    rim.push(tint(new THREE.IcosahedronGeometry(p.w * 0.42, 0).scale(1.3, 0.55, 0.9).rotateY(-a).translate(Math.cos(a) * r, 0.06, Math.sin(a) * r), scaleRgb(earth, 0.85 + 0.1 * (k % 3))));
  }
  for (let k = 0; k < 4; k++) { // splinters of it
    const a = k * 1.9 + p.seed * 0.05;
    rim.push(tint(new THREE.OctahedronGeometry(p.w * 0.16, 0).scale(1, 0.6, 0.8).translate(Math.cos(a) * p.w * 2.1, p.w * 0.06, Math.sin(a) * p.w * 2.1), scaleRgb(BASE.charcoal, 1.4)));
  }
  const cracks = merged([0, 1, 2, 3].map((i) => box(p.w * 1.3, 0.06, 0.06, 0, p.w * (0.5 + i * 0.12), 0, ANOMALY[p.set?.glow ?? 'magenta']).rotateY(i * 0.8).rotateZ(0.4 - i * 0.2)));
  return [{ mat: 'stone', geo: merged([rock, ...rim]) }, { mat: 'glow', geo: cracks, light: p.set?.lit, at: [0, p.w * 1.2, 0] }];
}
