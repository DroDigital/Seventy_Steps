/**
 * The built pieces of the Cavern of Flame (round 122, asked: the cavern and the whole of the stairs "way more lore accurate"). Lovecraft's
 * Dream-Quest of Unknown Kadath gives it three things: the seventy steps of light slumber lead down to it, it is a cavern of flame, and in
 * it dwell "the bearded priests Nasht and Kaman-Thah", who "shook their pshent-bearing heads". So: a rift in the cavern's floor ringed
 * with scorched rock, out of which the flame that names it stands; and the priests' effigies, seated colossi with the false beard and the
 * pshent, the white crown set in the red. In the piece's own frame, feet at the origin, facing +z. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hash2 } from '../core/rng';
import type { Prop } from '../world/props';
import { fireSpot } from './fireSpot';
import { box, tileUv, tint } from './meshKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
const stone = (p: Prop): Rgb => (p.set?.tint ? mixRgb(scaleRgb(BASE.seaGrey, 1.7), p.set.tint, 0.6) : scaleRgb(BASE.seaGrey, 1.7));
const cube = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb): THREE.BufferGeometry => tileUv(box(w, h, d, x, y, z, c, 1), Math.max(w, d), h);

/** The flame of the Cavern of Flame: a rift in the rock ringed with scorched, broken stone, and out of it a fire taller than a man, with lesser tongues about it. `w` its radius. */
export function cleft(p: Prop): Piece[] {
  const c = stone(p);
  const scorched = scaleRgb(mixRgb(c, BASE.charcoal, 0.55), 0.9);
  const parts: THREE.BufferGeometry[] = [tint(new THREE.CylinderGeometry(p.w * 0.62, p.w * 0.7, 0.06, 9).translate(0, 0.03, 0), scaleRgb(BASE.charcoal, 0.6))]; // the rift's mouth, black
  const n = 9;
  for (let i = 0; i < n; i++) { // the broken lip of the rift: jagged stones leaning outward, no two alike
    const a = (i / n) * Math.PI * 2 + hash2(i, 3, p.seed) * 0.4;
    const s = 0.32 + hash2(i, 7, p.seed) * 0.3;
    const h = s * (1.1 + hash2(i, 11, p.seed) * 0.9);
    const g = new THREE.IcosahedronGeometry(1, 0).scale(s, h, s * 0.8).rotateY(a).rotateZ(0.25 * Math.cos(a)).rotateX(-0.25 * Math.sin(a));
    parts.push(tint(g.translate(Math.cos(a) * p.w * 0.78, h * 0.55, Math.sin(a) * p.w * 0.78), i % 3 === 0 ? c : scorched));
  }
  const fires: Piece[] = [{ mat: 'glow', ...fireSpot('fire', [0, 0.1, 0], 3, 1.6) }]; // the flame itself, three times a fire's height, its light high in it
  for (let i = 0; i < 3; i++) { // lesser tongues licking up from the rift's edges
    const a = (i / 3) * Math.PI * 2 + 0.5;
    fires.push({ mat: 'glow', ...fireSpot('fire', [Math.cos(a) * p.w * 0.38, 0.1, Math.sin(a) * p.w * 0.38], 1.1) });
  }
  return [{ mat: 'rock', geo: merged(parts) }, ...fires];
}

/**
 * An effigy of one of the priests: seated on a block throne, hands on the knees, the long false beard of a priest-king and the pshent,
 * the tall white crown set in the red one with its back plate, as Egypt crowned its kings. `h` its height to the crown's top.
 */
export function priest(p: Prop): Piece[] {
  const c = stone(p);
  const dark = scaleRgb(c, 0.82);
  const H = p.h;
  const k = H / 4.5; // the figure was drawn 4.5 m high, to the white crown's knob
  const seat = 1.45 * k; // the throne's seat
  const parts: THREE.BufferGeometry[] = [
    cube(1.7 * k, seat, 1.9 * k, 0, seat / 2, -0.2 * k, dark), // the throne
    cube(1.8 * k, 1.6 * k, 0.35 * k, 0, seat + 0.8 * k - 0.2 * k, -1.0 * k, dark), // its back
    cube(1.0 * k, 0.32 * k, 1.25 * k, 0, seat + 0.16 * k, 0.2 * k, c), // the lap
    cube(1.0 * k, seat, 0.42 * k, 0, seat / 2, 0.88 * k, c), // the shins, side by side
    cube(1.06 * k, 0.22 * k, 0.75 * k, 0, 0.11 * k, 1.05 * k, c), // the feet
    cube(0.95 * k, 1.25 * k, 0.6 * k, 0, seat + 0.32 * k + 0.62 * k, -0.4 * k, c), // the body, upright
    cube(1.25 * k, 0.28 * k, 0.62 * k, 0, seat + 1.42 * k, -0.4 * k, c), // the shoulders
    cube(0.2 * k, 0.95 * k, 0.24 * k, -0.6 * k, seat + 0.85 * k, -0.3 * k, c), // the upper arms
    cube(0.2 * k, 0.95 * k, 0.24 * k, 0.6 * k, seat + 0.85 * k, -0.3 * k, c),
    cube(0.2 * k, 0.2 * k, 0.75 * k, -0.42 * k, seat + 0.44 * k, 0.12 * k, c), // the forearms, laid along the thighs to the knees
    cube(0.2 * k, 0.2 * k, 0.75 * k, 0.42 * k, seat + 0.44 * k, 0.12 * k, c),
    cube(0.5 * k, 0.55 * k, 0.5 * k, 0, seat + 1.85 * k, -0.38 * k, c), // the head
    cube(0.62 * k, 0.5 * k, 0.08 * k, 0, seat + 1.8 * k, -0.68 * k, dark), // the headcloth's fall behind it
    cube(0.16 * k, 0.5 * k, 0.12 * k, 0, seat + 1.42 * k, -0.08 * k, dark), // the plaited false beard, long under the chin
  ];
  const crown = seat + 2.1 * k; // the pshent: the red crown's flat-topped cap with its tall back plate, and the white crown rising out of it
  parts.push(tint(new THREE.CylinderGeometry(0.3 * k, 0.28 * k, 0.26 * k, 8).translate(0, crown + 0.13 * k, -0.38 * k), dark));
  parts.push(cube(0.42 * k, 0.6 * k, 0.1 * k, 0, crown + 0.3 * k, -0.63 * k, dark));
  parts.push(tint(new THREE.CylinderGeometry(0.06 * k, 0.21 * k, 0.6 * k, 8).translate(0, crown + 0.26 * k + 0.3 * k, -0.38 * k), scaleRgb(c, 1.12)));
  parts.push(tint(new THREE.IcosahedronGeometry(0.09 * k, 0).translate(0, crown + 0.26 * k + 0.62 * k, -0.38 * k), scaleRgb(c, 1.12)));
  return [{ mat: 'stone', geo: merged(parts) }];
}
