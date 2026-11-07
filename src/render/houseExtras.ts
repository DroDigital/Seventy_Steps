/**
 * Round 111, what a realm's houses carry beyond their walls and roof (data/houseLooks.ts): the railed widow's walk of an Innsmouth
 * captain's house on its ridge, the louvred cupola of a college building, the round turret of an Ulthar house at a gable end, and
 * the planks nailed across a dark window. In the house's own frame (front toward +z, feet at y = 0); each returns its geometries by
 * the material they join (trim is drawn nearer than it is, so it may stand on a wall).
 */

import * as THREE from 'three';
import { box, tileUv, tint } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

export interface Extra {
  wall: THREE.BufferGeometry[];
  roof: THREE.BufferGeometry[];
  trim: THREE.BufferGeometry[];
}

const empty = (): Extra => ({ wall: [], roof: [], trim: [] });

/** A widow's walk on the ridge at (0, y, z): a deck on a low base, a post at each corner and a rail about it. */
export function widowWalk(y: number, z: number, trim: Rgb): Extra {
  const out = empty();
  const [hw, hd] = [0.9, 0.8];
  out.trim.push(box(1.5, 0.7, 1.2, 0, y - 0.15, z, scaleRgb(trim, 0.7)), box(hw * 2, 0.14, hd * 2, 0, y + 0.27, z, trim));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) out.trim.push(box(0.08, 0.75, 0.08, sx * (hw - 0.04), y + 0.7, z + sz * (hd - 0.04), trim));
  for (const s of [-1, 1]) out.trim.push(box(hw * 2, 0.06, 0.06, 0, y + 1.04, z + s * (hd - 0.04), trim), box(0.06, 0.06, hd * 2 - 0.16, s * (hw - 0.04), y + 1.04, z, trim));
  return out;
}

/** A cupola on the ridge at (0, y, z): a square lantern in the wall's material with a dark louvre on each face, a pyramid cap and a finial. */
export function cupola(y: number, z: number, wall: Rgb, roof: Rgb, trim: Rgb, dark: Rgb): Extra {
  const out = empty();
  out.wall.push(tileUv(box(1.3, 1.3, 1.3, 0, y + 0.35, z, wall), 1.3, 1.3));
  for (const [dx, dz, turn] of [[0, 1, false], [0, -1, false], [1, 0, true], [-1, 0, true]] as const) {
    out.trim.push(turn ? box(0.06, 0.7, 0.6, dx * 0.68, y + 0.45, z, dark) : box(0.6, 0.7, 0.06, 0, y + 0.45, z + dz * 0.68, dark));
  }
  out.trim.push(box(1.5, 0.1, 1.5, 0, y + 1.05, z, trim));
  out.roof.push(tint(new THREE.ConeGeometry(1.1, 1.1, 4).rotateY(Math.PI / 4).translate(0, y + 1.65, z), roof));
  out.trim.push(tint(new THREE.CylinderGeometry(0.03, 0.05, 0.7, 4).translate(0, y + 2.45, z), trim));
  return out;
}

const TURRET = { r: 1.2, out: 0.6, seg: 8 };

/** A round turret on the gable end `side` (x = side * (wx + out)): its wall up past the eaves, a steep conical roof, a slit of dark glass. */
export function turret(side: 1 | -1, wx: number, top: number, wall: Rgb, roof: Rgb, dark: Rgb): Extra {
  const out = empty();
  const { r, seg } = TURRET;
  const x = side * (wx + TURRET.out);
  const h = top + 1.3;
  out.wall.push(tileUv(tint(new THREE.CylinderGeometry(r, r * 1.05, h, seg).rotateY(Math.PI / seg).translate(x, h / 2, 0), wall), Math.PI * r * 2, h));
  out.roof.push(tint(new THREE.ConeGeometry(r * 1.25, 2.8, seg).rotateY(Math.PI / seg).translate(x, h + 1.4, 0), roof));
  const face = r * Math.cos(Math.PI / seg); // the flat of the wall facing out
  out.trim.push(box(0.06, 0.9, 0.32, x + side * (face + 0.03), h - 1.2, 0, dark));
  return out;
}

/** Two planks nailed across a window's frame at (x, y, z) on its wall (`turn` for a side wall), standing out `out` (+1 or -1). */
export function boards(x: number, y: number, z: number, out: number, turn: boolean, c: Rgb): THREE.BufferGeometry[] {
  return [-0.55, 0.5].map((a, k) => {
    const g = box(1.05, 0.16, 0.04, 0, k ? 0.18 : -0.22, 0, scaleRgb(c, k ? 0.9 : 1)).rotateZ(a);
    if (turn) g.rotateY(Math.PI / 2);
    return g.translate(turn ? x + out * 0.17 : x, y, turn ? z : z + out * 0.17);
  });
}

export const noExtra = empty;
