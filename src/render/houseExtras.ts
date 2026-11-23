/**
 * Round 111, what a realm's houses carry beyond their walls and roof (data/houseLooks.ts): the railed widow's walk of an Innsmouth
 * captain's house on its ridge, the louvred cupola of a college building, the round turret of an Ulthar house at a gable end, and
 * the planks nailed across a dark window. In the house's own frame (front toward +z, feet at y = 0); each returns its geometries by
 * the material they join (trim is drawn nearer than it is, so it may stand on a wall).
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import { roofAt, type Profile } from './houseRoof';
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

const TURRET = { r: 1.2, seg: 8, clear: 1.7 };

/** A triangular prism along z, `len` long, `half` wide each way and `rise` high from its foot at y = 0: a small gable's roof or a pediment. */
const gablet = (half: number, rise: number, len: number): THREE.BufferGeometry =>
  new THREE.CylinderGeometry(1, 1, len, 3).rotateX(-Math.PI / 2).translate(0, 0.5, 0).scale(half / Math.sin(Math.PI / 3), rise / 1.5, 1);

/**
 * A round turret in the back corner of the gable end `side`: its wall rises through the roof and stands `clear` metres above it all
 * round, belted under its steep conical roof, a slit of dark glass looking out over the gable and another to the back. Round 117: it
 * stood a metre and a half short of the roof over it, so only its cone came through the slope, a horn on the roof; it is still inside
 * the house's walls (the collider's).
 */
export function turret(side: 1 | -1, wx: number, wd: number, profile: Profile, wall: Rgb, roof: Rgb, trim: Rgb, dark: Rgb): Extra {
  const out = empty();
  const { seg, clear } = TURRET;
  const r = Math.min(TURRET.r, wd * 0.33); // a narrower house a narrower turret, so it keeps clear of the ridge
  const x = side * (wx - r * 1.3 - 0.02); // its roof's eaves within the walls
  const z = -wd + r * 1.3 + 0.02;
  const h = Math.max(roofAt(profile, z + r), roofAt(profile, z - r)) + clear;
  out.wall.push(tileUv(tint(new THREE.CylinderGeometry(r, r * 1.05, h, seg).rotateY(Math.PI / seg).translate(x, h / 2, z), wall), Math.PI * r * 2, h));
  out.roof.push(tint(new THREE.ConeGeometry(r * 1.3, 3, seg).rotateY(Math.PI / seg).translate(x, h + 1.5, z), roof));
  out.trim.push(tint(new THREE.CylinderGeometry(r * 1.1, r * 1.1, 0.18, seg).rotateY(Math.PI / seg).translate(x, h - 0.12, z), trim)); // the belt under its eaves
  out.trim.push(tint(new THREE.CylinderGeometry(0.02, 0.06, 0.8, 4).translate(x, h + 3.3, z), trim)); // its finial
  const face = r * Math.cos(Math.PI / seg); // the flat of the wall facing out
  out.trim.push(box(0.06, 0.9, 0.32, x + side * (face + 0.03), h - 0.85, z, dark), box(0.32, 0.9, 0.06, x, h - 0.85, z - face - 0.03, dark));
  return out;
}

/**
 * Round 117: dormers on the front slope of a pitched roof, one to three, set evenly: each a box in the wall's own material standing
 * out of the slope, under a small gable of the roof's, with a framed window of dark glass. They end inside the roof behind them.
 */
export function dormers(profile: Profile, wx: number, wd: number, rng: Rng, wall: Rgb, trim: Rgb, dark: Rgb): Extra {
  const out = empty();
  const n = wx > 4.2 ? 2 + (rng() < 0.4 ? 1 : 0) : 1 + (rng() < 0.5 ? 1 : 0);
  const [half, tall, zf] = [0.62 + 0.1 * rng(), 1.15, wd * (0.42 + 0.1 * rng())];
  const foot = roofAt(profile, zf) - 0.05;
  let zb = zf;
  while (zb > -wd && roofAt(profile, zb) < foot + tall + 0.75) zb -= 0.1; // back to where the roof stands over its gable
  const len = zf - zb;
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * ((wx * 1.3) / Math.max(n, 1.5));
    out.wall.push(tileUv(box(half * 2, tall + 0.02, len, x, foot + tall / 2, zb + len / 2, wall), half * 2, tall));
    out.roof.push(tint(gablet(half + 0.16, 0.7, len + 0.2).translate(x, foot + tall, zb + len / 2 + 0.1), wall));
    out.trim.push(box(half * 1.3, 0.85, 0.08, x, foot + 0.6, zf + 0.04, trim), box(half * 1.05, 0.65, 0.06, x, foot + 0.6, zf + 0.1, dark));
    out.trim.push(box(0.05, 0.65, 0.05, x, foot + 0.6, zf + 0.14, trim), box(half * 1.05, 0.05, 0.05, x, foot + 0.6, zf + 0.14, trim)); // its glazing bars
  }
  return out;
}

/** Corner boards (round 117): a clapboard house's four corners cased in trim from its footing to its eaves, but where a wing meets it (`skip` the side). */
export function cornerBoards(wx: number, wd: number, h: number, skip: number, trim: Rgb): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) if (sx !== skip) out.push(box(0.22, h, 0.22, sx * wx, 0.4 + h / 2, sz * wd, trim));
  return out;
}

/** A door's surround (round 117): pilasters either side and, over it, a pediment or a flat hood on two brackets; the door on the front at z = `wd`. */
export function doorHood(wd: number, pediment: boolean, trim: Rgb): THREE.BufferGeometry[] {
  const out = [-1, 1].map((s) => box(0.16, 2.2, 0.1, s * 0.66, 0.4 + 1.1, wd + 0.06, trim));
  if (pediment) out.push(tint(gablet(0.85, 0.42, 0.22).translate(0, 0.4 + 2.24, wd + 0.11), trim));
  else out.push(box(1.7, 0.1, 0.55, 0, 0.4 + 2.42, wd + 0.27, trim), ...[-1, 1].map((s) => box(0.08, 0.3, 0.4, s * 0.72, 0.4 + 2.24, wd + 0.21, trim)));
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
