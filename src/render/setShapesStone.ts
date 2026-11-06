/**
 * The built pieces of cut stone (round 61; render/setShapes.ts): the pylon of a gate with a fire on its top, the sphinx, the trilithon
 * of a stone circle, the stepped mound, the leaning cyclopean slab of R'lyeh, the hexagonal pedestal. In the piece's own frame, feet
 * at the origin, facing +z. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Prop } from '../world/props';
import { fireSpot } from './fireSpot';
import { box, tileUv, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts);
const stone = (p: Prop): Rgb => p.set?.tint ? mixRgb(scaleRgb(BASE.seaGrey, 1.7), p.set.tint, 0.6) : scaleRgb(BASE.seaGrey, 1.7);

/** A tapered tower of stepped blocks, `w` from the middle at its foot and `h` high, a brazier burning on its top. */
export function pylon(p: Prop): Piece[] {
  const c = stone(p);
  const parts: THREE.BufferGeometry[] = [];
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const k = 1 - i * 0.14;
    const sh = (p.h * 0.9) / steps;
    parts.push(tileUv(box(p.w * 2 * k, sh, p.d * 2 * k, 0, sh * (i + 0.5), 0, scaleRgb(c, 0.85 + 0.08 * i), 1), p.w * 2, sh));
  }
  const top = (p.h * 0.9);
  parts.push(box(p.w * 2.3 * 0.62, p.h * 0.05, p.d * 2.3 * 0.62, 0, top + p.h * 0.025, 0, scaleRgb(c, 1.1)));
  for (const s of [-1, 1]) for (const t of [-1, 1]) parts.push(box(0.3, p.h * 0.06, 0.3, s * p.w * 0.55, top + p.h * 0.08, t * p.d * 0.55, c)); // the brazier's horns
  return [{ mat: 'stone', geo: merged(parts) }, { mat: 'glow', ...fireSpot(p.set?.lit ?? 'fire', [0, top + p.h * 0.05, 0], Math.min(2, Math.max(0.6, p.w / 1.2)), top + p.h * 0.1 + p.w * 0.5) }]; // (its fire burns on the cap, between the horns: the pixel flame, no cone of it is built; its light stays where the cone's stood, above the pylon's collider, that the eye may see it)
}

/** A sphinx lying along its z, `w` half its width and `h` its height: a lion's body, forepaws out, a head in a headdress. */
export function sphinx(p: Prop): Piece[] {
  const c = stone(p);
  const [w, L] = [p.w, p.d];
  const part = (bw: number, bh: number, bd: number, x: number, y: number, z: number, k = 1): THREE.BufferGeometry => tileUv(box(bw, bh, bd, x, y, z, scaleRgb(c, k), 1), bw, bh);
  const parts = [
    part(w * 1.6, p.h * 0.42, L * 1.3, 0, p.h * 0.21, -L * 0.2, 0.9), // the body
    part(w * 1.5, p.h * 0.3, L * 0.5, 0, p.h * 0.44, -L * 0.52, 0.95), // the haunch
    part(w * 0.5, p.h * 0.2, L * 0.55, -w * 0.5, p.h * 0.1, L * 0.62), // the forepaws
    part(w * 0.5, p.h * 0.2, L * 0.55, w * 0.5, p.h * 0.1, L * 0.62),
    part(w * 0.9, p.h * 0.42, w * 0.9, 0, p.h * 0.64, L * 0.32, 1.1), // the head,
    part(w * 1.6, p.h * 0.46, w * 0.45, 0, p.h * 0.62, L * 0.2, 1.0), // the headdress behind it
    part(w * 0.5, p.h * 0.2, w * 0.4, 0, p.h * 0.58, L * 0.32 + w * 0.5, 1.2), // and the nose
  ];
  return [{ mat: 'stone', geo: merged(parts) }];
}

/** A trilithon: two uprights and a lintel across them, standing in a circle of them; a ring is `w` wide between its posts. */
export function trilith(p: Prop): Piece[] {
  const c = stone(p);
  const post = (x: number): THREE.BufferGeometry => tileUv(box(p.w * 0.5, p.h, p.d * 1.6, x, p.h / 2, 0, scaleRgb(c, 0.85), 1), p.w, p.h);
  return [{ mat: 'stone', geo: merged([post(-p.w * 0.75), post(p.w * 0.75), tileUv(box(p.w * 2, p.h * 0.16, p.d * 1.8, 0, p.h * 1.0, 0, scaleRgb(c, 0.95), 1), p.w * 2, 1)]) }];
}

/** A mound of steps: boxes narrowing as they climb, a dark mouth in its face. */
export function ziggurat(p: Prop): Piece[] {
  const c = stone(p);
  const n = 4;
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const k = 1 - i * 0.2;
    const sh = p.h / n;
    parts.push(tileUv(box(p.w * 2 * k, sh, p.d * 2 * k, 0, sh * (i + 0.5), 0, scaleRgb(c, 0.8 + 0.07 * i), 1), p.w * 2, sh));
  }
  const mouth = box(p.w * 0.5, p.h * 0.3, 0.3, 0, p.h * 0.17, p.d + 0.02, scaleRgb(BASE.charcoal, 0.4)); // a doorway into it, black
  return [{ mat: 'stone', geo: merged(parts) }, { mat: 'trim', geo: mouth }];
}

/** A cyclopean slab leaning from its foot, a slime of the sea's green on it, a glow along its crown: R'lyeh's masonry, whose angles are wrong. */
export function slab(p: Prop): Piece[] {
  const c = mixRgb(scaleRgb(BASE.seaGrey, 1.2), [0.3, 0.5, 0.4], 0.5);
  const lean = 0.08 + (p.seed % 7) * 0.025;
  const body = tileUv(box(p.w * 2, p.h, p.d * 2, 0, p.h / 2, 0, c, 1.5), p.w * 2, p.h).rotateZ(lean * (p.seed % 2 ? 1 : -1));
  const ooze = box(p.w * 2.05, p.h * 0.18, p.d * 2.05, 0, p.h * 0.09, 0, mixRgb(c, [0.1, 0.25, 0.2], 0.6)).rotateZ(lean * (p.seed % 2 ? 1 : -1));
  const parts = [body, ooze];
  const glow = box(p.w * 1.4, 0.07, 0.07, 0, p.h * 0.62, p.d + 0.04, ANOMALY[p.set?.glow ?? 'green']).rotateZ(lean * (p.seed % 2 ? 1 : -1)); // a line of carving that burns
  return [{ mat: 'stone', geo: merged(parts) }, { mat: 'glow', geo: glow }];
}

/** A hexagonal pedestal, its top inlaid with a glowing hexagon. */
export function hexped(p: Prop): Piece[] {
  const c = stone(p);
  const body = tint(tileUv(new THREE.CylinderGeometry(p.w, p.w * 1.15, p.h, 6).translate(0, p.h / 2, 0), p.w * 2, p.h), scaleRgb(c, 0.8));
  const cap = tint(tileUv(new THREE.CylinderGeometry(p.w * 1.1, p.w, p.h * 0.12, 6).translate(0, p.h + p.h * 0.06, 0), p.w * 2, 1), scaleRgb(c, 1.0));
  const inlay = tint(new THREE.CylinderGeometry(p.w * 0.62, p.w * 0.62, 0.06, 6).translate(0, p.h * 1.12 + 0.03, 0), ANOMALY[p.set?.glow ?? 'purple']);
  return [{ mat: 'stone', geo: merged([body, cap]) }, { mat: 'glow', geo: inlay, light: p.set?.lit, at: [0, p.h * 1.5, 0] }];
}
