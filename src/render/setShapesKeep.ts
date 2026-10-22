/**
 * The keep and the gatehouse of a walled court (round 67; world/enclosureBailey.ts, data/arenaHouses.ts `Bailey`; render/setShapes.ts holds
 * them with the rest of the built pieces). The keep is a donjon on a battered plinth: a body in courses between pilasters at its corners,
 * string courses, narrow slits in rows, a few windows lit from within, a machicolated crown with a parapet of merlons about its roof, and a
 * lightning rod's mast on top. The gatehouse is the span over a gate, between its towers, crowned the same way, with a rod of its own.
 * In the piece's own frame, feet at the origin, its length along x, the face toward the court (+z) the one that is seen. Each fits
 * within the box that is its collider (the gatehouse's reaching down 0.5 m below its foot, over a gate high enough for any body). Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Prop } from '../world/props';
import { box, tileUv } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
const stone = (p: Prop, k = 1): Rgb => scaleRgb(p.set?.tint ? mixRgb(scaleRgb(BASE.seaGrey, 1.7), p.set.tint, 0.65) : scaleRgb(BASE.seaGrey, 1.7), k);
const IRON: Rgb = scaleRgb(BASE.charcoal, 1.6);
/** A tiled block: `w` along x, `h` high, `d` deep, its middle at (x, y, z). */
const block = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb): THREE.BufferGeometry => tileUv(box(w, h, d, x, y, z, c, Math.max(1.8, Math.max(w, h, d) / 6)), Math.max(w, d), h);

/** Merlons along a parapet of `length` on its two long sides (z = ±`depth` / 2) and, when `ends`, on its two short ones: every 2.2 m, 1.5 m high. */
function parapet(p: Prop, length: number, depth: number, y: number, ends: boolean): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let x = -length / 2 + 1; x < length / 2; x += 2.2) for (const s of [-1, 1]) out.push(block(1.2, 1.5, 0.8, x, y + 0.75, s * (depth / 2 - 0.4), stone(p, 1.02)));
  if (ends) for (let z = -depth / 2 + 3.2; z < depth / 2 - 2.4; z += 2.2) for (const s of [-1, 1]) out.push(block(0.8, 1.5, 1.2, s * (length / 2 - 0.4), y + 0.75, z, stone(p, 1.02)));
  return out;
}

/** A lightning rod: a mast with two cross-bars and a point of light on its top (`HOUSE.rodTip` above the piece's top, data/arenaHouses.ts), standing at (0, y, 0). */
function rod(p: Prop, y: number, length: number): Piece[] {
  const mast = [box(0.4, length, 0.4, 0, y + length / 2, 0, IRON), box(2.2, 0.16, 0.16, 0, y + length * 0.62, 0, IRON), box(1.4, 0.16, 0.16, 0, y + length * 0.82, 0, IRON)];
  return [{ mat: 'stone', geo: merged(mast) }, { mat: 'glow', geo: box(0.7, 0.7, 0.7, 0, y + length + 0.2, 0, ANOMALY[p.set?.glow ?? 'purple']) }];
}

/** The keep: `p.w`, `p.d` its half breadth and half depth, `p.h` its height to the parapet; the mast above it is `p.set.rod`. */
export function keep(p: Prop): Piece[] {
  const [L, T, H] = [p.w * 2, p.d * 2, p.h];
  const crown = H - 0.7; // the middle of the crown: its top is the keep's height
  const parts = [
    block(L * 1.1, 2.4, T * 1.1, 0, 1.2, 0, stone(p, 0.72)), // the plinth, in two steps
    block(L * 1.04, 1.4, T * 1.04, 0, 3.1, 0, stone(p, 0.82)),
    block(L, crown - 0.7 - 3.8, T, 0, 3.8 + (crown - 0.7 - 3.8) / 2, 0, stone(p)), // the body
    block(L * 1.05, 0.5, T * 1.05, 0, H * 0.36, 0, stone(p, 1.12)), // the string courses
    block(L * 1.05, 0.5, T * 1.05, 0, H * 0.66, 0, stone(p, 1.12)),
    block(L * 1.1, 1.4, T * 1.1, 0, crown, 0, stone(p, 1.08)), // the machicolated crown, wider than the body
    block(L * 0.9, 0.3, T * 0.9, 0, H + 0.15, 0, stone(p, 0.6)), // the roof's leads
    ...parapet(p, L * 1.1, T * 1.1, H, true),
  ];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(block(2.6, H * 0.9, 2.6, sx * (L / 2 - 0.6), H * 0.45, sz * (T / 2 - 0.6), stone(p, 0.92))); // the pilasters at its corners, a little proud
  const dark = scaleRgb(BASE.charcoal, 0.6);
  const slits: THREE.BufferGeometry[] = [];
  for (const [row, y] of [[3, H * 0.3], [2, H * 0.5], [3, H * 0.76]] as const) {
    for (let k = 0; k < row; k++) {
      const x = ((k + 0.5) / row - 0.5) * L * 0.72;
      slits.push(box(0.4, 2.2, 0.16, x, y, T / 2 + 0.02, dark)); // narrow slits in rows on the face toward the court
    }
  }
  for (const sx of [-1, 1]) for (const z of [-T * 0.18, T * 0.18]) slits.push(box(0.16, 2.2, 0.4, sx * (L / 2 + 0.02), H * 0.5, z, dark)); // and on its flanks
  const lit = [-0.18, 0.18].map((u) => box(0.9, 2.8, 0.18, u * L, H * 0.84, T / 2 + 0.06, ANOMALY[p.set?.glow ?? 'purple'])); // the laboratory under the roof: two windows lit from within
  return [{ mat: 'stone', geo: merged([...parts, ...slits]) }, { mat: 'glow', geo: merged(lit) }, ...rod(p, H + 0.3, p.set?.rod ?? 0)];
}

/** The gatehouse: the span over a gate. Its foot is `0.5` m below the origin; `p.h` its height from the origin; the mast above it is `p.set.rod`. */
export function gatehouse(p: Prop): Piece[] {
  const [L, T, H] = [p.w * 2, p.d * 2, p.h];
  const parts = [
    block(L, H + 0.5, T, 0, (H - 0.5) / 2, 0, stone(p)),
    block(L * 1.04, 0.45, T * 1.06, 0, H * 0.4, 0, stone(p, 1.12)), // a string course
    block(L * 1.06, 1.1, T * 1.2, 0, H - 0.55, 0, stone(p, 1.08)), // the machicolated crown
    ...parapet(p, L * 1.06, T * 1.2, H, true),
  ];
  const dark = scaleRgb(BASE.charcoal, 0.6);
  const slits = [-0.3, 0, 0.3].map((u) => box(0.4, 1.6, 0.16, u * L, H * 0.62, T / 2 + 0.02, dark));
  const lit = box(0.7, 1.4, 0.18, 0, H * 0.22, T / 2 + 0.06, ANOMALY[p.set?.glow ?? 'purple']); // a light over the arch
  return [{ mat: 'stone', geo: merged([...parts, ...slits]) }, { mat: 'glow', geo: lit }, ...rod(p, H + 0.3, p.set?.rod ?? 0)];
}
