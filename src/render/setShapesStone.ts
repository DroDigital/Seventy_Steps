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
import { roughen, topCoat } from './propKit';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.some((g) => !g.index) ? parts.map((g) => (g.index ? g.toNonIndexed() : g)) : parts); // (a lump's icosahedron has no index)
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

/**
 * A trilithon: two uprights and a lintel across them, standing in a circle of them; a ring is `w` wide between its posts. Round 117: the
 * stones are rough-hewn, narrowing a little as they rise, the lintel seated on its posts' tenons with lichen on its back; and in one of
 * four the lintel has fallen and lies broken at the posts' feet (its collider stands as it was: the posts still bar the way between).
 */
export function trilith(p: Prop): Piece[] {
  const c = stone(p);
  const hewn = (g: THREE.BufferGeometry, salt: number): THREE.BufferGeometry => roughen(g.index ? g.toNonIndexed() : g, 0.06, salt, [0, 0, 0], true); // (each face its own points: flat, as cut stone is)
  const post = (x: number, k: number): THREE.BufferGeometry => {
    const g = new THREE.CylinderGeometry(Math.SQRT1_2 * 0.88, Math.SQRT1_2, 1, 4, 3).rotateY(Math.PI / 4).scale(p.w * 0.5, p.h, p.d * 1.6).translate(0, p.h / 2, 0);
    return tint(tileUv(hewn(g, p.seed * 0.1 + k), p.w, p.h), scaleRgb(c, 0.85)).translate(x, 0, 0);
  };
  const fallen = p.seed % 4 === 0;
  const lintel = tint(tileUv(hewn(new THREE.BoxGeometry(p.w * 2, p.h * 0.16, p.d * 1.8, 4, 1, 1), p.seed * 0.1 + 2), p.w * 2, 1), scaleRgb(c, 0.95));
  const parts = [post(-p.w * 0.75, 0), post(p.w * 0.75, 1)];
  if (fallen) { // broken in two, its halves lying across one another between the posts
    for (const k of [0, 1]) parts.push(lintel.clone().scale(0.4, 1, 0.8).rotateY(k ? -0.45 : 0.4).rotateZ(k ? 0.06 : -0.05).translate(k ? p.w * 0.12 : -p.w * 0.14, p.h * 0.08 * (k ? 1.6 : 1), 0));
  } else parts.push(topCoat(lintel.translate(0, p.h * 1.0, 0), mixRgb(c, [0.5, 0.56, 0.4], 0.5), 0.3)); // lichen on its back
  return [{ mat: 'stone', geo: merged(parts) }];
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

/** Pushes the colours of a geometry's points below `y` toward `c`, by how far below it they are, over `fade` metres. */
function stainBelow(g: THREE.BufferGeometry, y: number, fade: number, c: Rgb): THREE.BufferGeometry {
  const [pos, col] = [g.getAttribute('position'), g.getAttribute('color')];
  for (let i = 0; i < pos.count; i++) {
    const k = Math.min(1, Math.max(0, (y - pos.getY(i)) / fade));
    if (k > 0) col.setXYZ(i, ...mixRgb([col.getX(i), col.getY(i), col.getZ(i)], c, k));
  }
  return g;
}

/** A burning carving on a slab's face (`front`, its z), its middle at (0, y): a line, an eye, or a spiral, by `kind`; `s` its size. */
function carving(kind: number, front: number, y: number, s: number, c: Rgb): THREE.BufferGeometry[] {
  const cut = (x0: number, y0: number, x1: number, y1: number, w = 0.07): THREE.BufferGeometry =>
    box(Math.hypot(x1 - x0, y1 - y0) + w, w, 0.07, 0, 0, 0, c).rotateZ(Math.atan2(y1 - y0, x1 - x0)).translate((x0 + x1) / 2, y + (y0 + y1) / 2, front);
  if (kind === 0) return [cut(-s * 0.7, 0, s * 0.7, 0)];
  if (kind === 1) { // an eye: its lids, and the pupil between them
    const out: THREE.BufferGeometry[] = [];
    for (const lid of [-1, 1]) for (let k = 0; k < 4; k++) {
      const [t0, t1] = [-1 + k / 2, -1 + (k + 1) / 2];
      out.push(cut(t0 * s * 0.6, lid * s * 0.22 * (1 - t0 * t0), t1 * s * 0.6, lid * s * 0.22 * (1 - t1 * t1)));
    }
    return [...out, box(s * 0.16, s * 0.16, 0.07, 0, y, front, c)];
  }
  const out: THREE.BufferGeometry[] = []; // a spiral winding out from its middle
  let [px, py] = [0, 0];
  for (let k = 1; k <= 14; k++) {
    const [a, r] = [k * 0.7, (k / 14) * s * 0.55];
    const [nx, ny] = [Math.cos(a) * r, Math.sin(a) * r];
    out.push(cut(px, py, nx, ny, 0.06));
    [px, py] = [nx, ny];
  }
  return out;
}

/**
 * A cyclopean slab leaning from its foot, a slime of the sea's green on it, a carving that burns on its face: R'lyeh's masonry, whose
 * angles are wrong. Round 117: its foot goes on down into the ground as far as it leans (one corner of it stood in the air), the slime
 * is laid on its own foot (a box over it lay a centimetre or two before its faces and fought them for the depth), a corner of its crown
 * is broken away, barnacled lumps cling about its foot, and what is carved on it is a line, an eye or a spiral, by its seed.
 */
export function slab(p: Prop): Piece[] {
  const c = mixRgb(scaleRgb(BASE.seaGrey, 1.2), [0.3, 0.5, 0.4], 0.5);
  const tilt = (0.08 + (p.seed % 7) * 0.025) * (p.seed % 2 ? 1 : -1);
  const sink = p.w * Math.tan(Math.abs(tilt)) + 0.25;
  const body = tileUv(box(p.w * 2, p.h + sink, p.d * 2, 0, (p.h - sink) / 2, 0, c, 1), p.w * 2, p.h);
  const pos = body.getAttribute('position');
  const [broke, cut] = [p.seed % 3 === 0 ? -1 : 1, p.h * (0.08 + 0.04 * ((p.seed >> 3) % 3))];
  for (let i = 0; i < pos.count; i++) { // a corner of its crown broken away
    const x = pos.getX(i) * broke;
    if (pos.getY(i) > p.h - 1e-3 && x > p.w * 0.3) pos.setY(i, p.h - cut * ((x - p.w * 0.3) / (p.w * 0.7)));
  }
  stainBelow(body, p.h * 0.2, p.h * 0.16, mixRgb(c, [0.1, 0.25, 0.2], 0.6));
  const lumps: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 7; k++) { // barnacled lumps about its foot
    const [x, side] = [(((p.seed >> k) % 9) / 8 - 0.5) * p.w * 1.7, k % 2 ? 1 : -1];
    lumps.push(tint(new THREE.IcosahedronGeometry(0.16 + 0.05 * (k % 3), 0).scale(1.2, 0.8, 0.7).translate(x, 0.1 + 0.12 * (k % 4), side * (p.d + 0.04)), scaleRgb(c, 0.62)));
  }
  const glyph = carving((p.seed >> 2) % 3, p.d + 0.035, p.h * 0.62, Math.min(p.w, p.h * 0.3), ANOMALY[p.set?.glow ?? 'green']);
  return [{ mat: 'stone', geo: merged([body, ...lumps]).rotateZ(tilt) }, { mat: 'glow', geo: merged(glyph).rotateZ(tilt) }];
}

/**
 * A hexagonal pedestal, its top inlaid with a glowing hexagon. Round 117: on a broader step, its body girt by a moulding near its head, a
 * dark panel inlaid in each face (relief, drawn nearer than the face), and its inlay ringed by six points of the glow.
 */
export function hexped(p: Prop): Piece[] {
  const c = stone(p);
  const step = tint(tileUv(new THREE.CylinderGeometry(p.w * 1.32, p.w * 1.4, p.h * 0.14, 6).translate(0, p.h * 0.07, 0), p.w * 2, 1), scaleRgb(c, 0.72));
  const body = tint(tileUv(new THREE.CylinderGeometry(p.w, p.w * 1.15, p.h, 6).translate(0, p.h / 2, 0), p.w * 2, p.h), scaleRgb(c, 0.8));
  const band = tint(new THREE.CylinderGeometry(p.w * 1.03, p.w * 1.03, p.h * 0.08, 6).translate(0, p.h * 0.82, 0), scaleRgb(c, 0.8)); // its moulding, in its own stone
  const cap = tint(tileUv(new THREE.CylinderGeometry(p.w * 1.1, p.w, p.h * 0.12, 6).translate(0, p.h + p.h * 0.06, 0), p.w * 2, 1), scaleRgb(c, 1.0));
  const panels: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 6; k++) { // a dark panel sunk in each face
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    const r = p.w * (1.15 - 0.15 * 0.42) * Math.cos(Math.PI / 6) + 0.015; // the face's own distance at the panel's middle, and a little more
    panels.push(box(p.w * 0.6, p.h * 0.42, 0.04, 0, 0, 0, scaleRgb(c, 0.5)).rotateX(-Math.atan((0.15 * p.w * Math.cos(Math.PI / 6)) / p.h)).rotateY(a).translate(Math.sin(a) * r, p.h * 0.42, Math.cos(a) * r)); // leaning in as the face does
  }
  const glow = ANOMALY[p.set?.glow ?? 'purple'];
  const inlay = [tint(new THREE.CylinderGeometry(p.w * 0.62, p.w * 0.62, 0.06, 6).translate(0, p.h * 1.12 + 0.03, 0), glow)];
  for (let k = 0; k < 6; k++) inlay.push(box(0.1, 0.06, 0.1, Math.sin((k / 6) * Math.PI * 2) * p.w * 0.86, p.h * 1.12 + 0.03, Math.cos((k / 6) * Math.PI * 2) * p.w * 0.86, glow));
  return [{ mat: 'stone', geo: merged([step, body, band, cap]) }, { mat: 'trim', geo: merged(panels) }, { mat: 'glow', geo: merged(inlay), light: p.set?.lit, at: [0, p.h * 1.5, 0] }];
}
