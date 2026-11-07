/**
 * A dungeon pillar drawn as what its dungeon would raise (round 108; data/dungeonLooks.ts says which): a column with its base and
 * capital, a squared pier, a cluster of shafts, a fluted column, the Elder Things' fivefold barrel, a twisted stack of R'lyeh's wrong
 * blocks, a timber post and its braces, a mast in iron hoops, an iron pipe in flanges, a brick pier, a standing stone, a stalagmite
 * met by its stalactite, a column grown over with coral, a drum of skulls, a cluster of basalt prisms, onyx in bands of gold, a
 * fungal stalk under its shelves, an obsidian shard broken in three, a squat column under a toad's head. Its collider is the
 * cylinder it always was (world/dungeonParts.ts); what is drawn stands within it but for bases, capitals and what grows on it, low
 * or high, and nothing of it within reach of where an eye stands. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { hash2 } from '../core/rng';
import type { PillarForm } from '../data/dungeonLooks';
import type { CylPart } from '../world/dungeonParts';
import { tileUv, tint } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

/** The groups a pillar's pieces go into: its stone, timber, relief on either (drawn nearer), and glow. */
export type PillarKind = 'wall' | 'wood' | 'trim' | 'beam' | 'glow' | 'shine';
export type PillarPiece = { kind: PillarKind; geo: THREE.BufferGeometry };

const WOOD: Rgb = [0.4, 0.33, 0.27];
const IRON: Rgb = [0.27, 0.27, 0.3];
const GILT: Rgb = [0.72, 0.56, 0.24];
const BONE: Rgb = [0.8, 0.76, 0.66];
const ONYX: Rgb = [0.2, 0.2, 0.24];

type Out = Record<PillarKind, THREE.BufferGeometry[]>;

/** A cylinder from `y0` up `h`, its radii `bottom` and `top`, at (x, z). */
const cyl = (bottom: number, top: number, h: number, sides: number, x: number, y0: number, z: number, c: Rgb): THREE.BufferGeometry =>
  tint(tileUv(new THREE.CylinderGeometry(top, bottom, h, sides, Math.max(1, Math.ceil(h / 1.5))).translate(x, y0 + h / 2, z), Math.PI * (top + bottom), h), c);
const cube = (w: number, h: number, d: number, x: number, y0: number, z: number, c: Rgb, yaw = 0): THREE.BufferGeometry =>
  tint(tileUv(new THREE.BoxGeometry(w, h, d, 1, Math.max(1, Math.ceil(h / 1.5)), 1).rotateY(yaw).translate(x, y0 + h / 2, z), Math.max(w, d), h), c);
const lump = (r: number, x: number, y: number, z: number, c: Rgb, squash = 0.8): THREE.BufferGeometry => tint(new THREE.IcosahedronGeometry(r, 0).scale(1, squash, 1).translate(x, y, z), c);

/** Each form, drawn into `o` about (x, z) from `y0` to `y1`, its collider's radius `r`, its stone `c`; `k` a number of its own, 0..1. */
const FORMS: Record<PillarForm, (o: Out, x: number, z: number, y0: number, y1: number, r: number, c: Rgb, k: number) => void> = {
  round(o, x, z, y0, y1, r, c) {
    o.wall.push(cyl(r, r * 0.88, y1 - y0 - 0.75, 7, x, y0 + 0.4, z, c), cyl(r * 1.4, r * 1.3, 0.4, 8, x, y0, z, scaleRgb(c, 0.85)), cyl(r * 1.05, r * 1.35, 0.35, 8, x, y1 - 0.35, z, scaleRgb(c, 0.9)));
  },
  square(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    o.wall.push(cube(r * 1.5, h - 0.82, r * 1.5, x, y0 + 0.5, z, c), cube(r * 2, 0.5, r * 2, x, y0, z, scaleRgb(c, 0.82)), cube(r * 1.95, 0.32, r * 1.95, x, y1 - 0.32, z, scaleRgb(c, 0.9)));
    for (const y of [y0 + 0.5, y1 - 0.5]) o.trim.push(cube(r * 1.62, 0.12, r * 1.62, x, y, z, scaleRgb(c, 0.78))); // the chamfer's stops
  },
  cluster(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    o.wall.push(cyl(r * 0.72, r * 0.72, h - 0.95, 8, x, y0 + 0.45, z, c));
    for (let i = 0; i < 4; i++) {
      const a = (i + 0.5) * (Math.PI / 2);
      o.wall.push(cyl(r * 0.36, r * 0.36, h - 0.95, 6, x + Math.cos(a) * r * 0.62, y0 + 0.45, z + Math.sin(a) * r * 0.62, c)); // (one stone with the core: faces of two tones this near would fight)
    }
    o.wall.push(cyl(r * 1.4, r * 1.25, 0.45, 8, x, y0, z, scaleRgb(c, 0.82)), cyl(r * 1.0, r * 1.38, 0.5, 8, x, y1 - 0.5, z, scaleRgb(c, 0.9)));
    o.trim.push(cyl(r * 1.03, r * 1.03, 0.14, 8, x, y0 + h * 0.55, z, scaleRgb(c, 0.8))); // the shafts' ring
  },
  fluted(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    const pale = scaleRgb(c, 1.08);
    o.wall.push(cyl(r * 0.9, r * 0.84, h - 1.0, 12, x, y0 + 0.48, z, pale));
    for (let i = 0; i < 12; i++) { // the fillets between its flutes
      const a = (i / 12) * Math.PI * 2;
      o.trim.push(cube(0.07, h - 1.1, 0.07, x + Math.cos(a) * r * 0.86, y0 + 0.6, z + Math.sin(a) * r * 0.86, scaleRgb(c, 1.14), -a));
    }
    o.wall.push(cyl(r * 1.4, r * 1.4, 0.18, 12, x, y0, z, scaleRgb(c, 0.9)), cyl(r * 1.15, r * 1.2, 0.3, 12, x, y0 + 0.18, z, scaleRgb(c, 0.95)));
    o.wall.push(cube(r * 2.3, 0.22, r * 2.3, x, y1 - 0.22, z, scaleRgb(c, 0.96)), cyl(r * 0.9, r * 1.1, 0.3, 12, x, y1 - 0.52, z, pale)); // the abacus and the echinus
    for (const s of [-1, 1]) o.trim.push(tint(new THREE.CylinderGeometry(0.2 * r + 0.1, 0.2 * r + 0.1, r * 2.1, 8).rotateZ(Math.PI / 2).translate(x, y1 - 0.42, z + s * r * 0.9), pale)); // the volutes
  },
  fivefold(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    const [b, m] = [y0 + 0.4, (h - 0.85) / 2]; // (the shaft between its base and its capital, not on into them: round 108's audit)
    o.wall.push(cyl(r * 0.55, r * 0.55, h - 0.85, 10, x, b, z, c));
    for (let i = 0; i < 5; i++) { // five lobes, swelling at the middle like the Old Ones' barrels
      const a = (i / 5) * Math.PI * 2;
      const [lx, lz] = [x + Math.cos(a) * r * 0.5, z + Math.sin(a) * r * 0.5];
      o.wall.push(cyl(r * 0.3, r * 0.45, m, 6, lx, b, lz, scaleRgb(c, 0.96)), cyl(r * 0.45, r * 0.3, m, 6, lx, b + m, lz, scaleRgb(c, 0.96)));
    }
    for (const t of [0.22, 0.5, 0.78]) o.trim.push(cyl(r * 0.92, r * 0.92, 0.12, 5, x, y0 + h * t, z, scaleRgb(c, 0.8)));
    o.wall.push(cyl(r * 1.3, r * 1.05, 0.4, 5, x, y0, z, scaleRgb(c, 0.85)), cyl(r * 0.9, r * 1.3, 0.45, 5, x, y1 - 0.45, z, scaleRgb(c, 0.9)));
  },
  twisted(o, x, z, y0, y1, r, c, k) {
    const n = 9;
    const h = (y1 - y0) / n;
    for (let i = 0; i < n; i++) { // blocks of R'lyeh, each turned on the one below and set off it, as no mason would
      const s = r * (1.5 - 0.12 * Math.sin(i * 1.7 + k * 6));
      const lean = Math.sin(i * 0.9 + k * 4) * r * 0.12;
      o.wall.push(cube(s, h + 0.02, s * 0.86, x + lean, y0 + i * h, z - lean * 0.6, scaleRgb(c, 0.88 + 0.12 * ((i + Math.round(k * 5)) % 3) / 2), i * 0.21 + k));
    }
  },
  post(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    const w = r * 1.1;
    o.wall.push(cube(w * 1.5, 0.3, w * 1.5, x, y0, z, scaleRgb(c, 0.8))); // its pad of stone
    o.wood.push(cube(w, h - 0.6, w, x, y0 + 0.3, z, WOOD));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { // knee braces to the beam above
      const g = new THREE.BoxGeometry(0.16, 1.5, 0.16).rotateZ(dx * 0.7).rotateX(-dz * 0.7).translate(x + dx * (w / 2 + 0.45), y1 - 0.75, z + dz * (w / 2 + 0.45));
      o.beam.push(tint(tileUv(g, 0.3, 1.5), scaleRgb(WOOD, 0.85)));
    }
    o.wood.push(cube(w * 1.6, 0.3, w * 1.6, x, y1 - 0.3, z, scaleRgb(WOOD, 0.9)));
  },
  mast(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    o.wall.push(cyl(r * 1.25, r * 1.15, 0.3, 8, x, y0, z, scaleRgb(c, 0.8)));
    o.wood.push(cyl(r * 0.78, r * 0.68, h - 0.3, 10, x, y0 + 0.3, z, WOOD));
    for (let y = y0 + 0.9; y < y1 - 0.4; y += 1.3) {
      const t = (y - y0) / h;
      o.trim.push(cyl(r * (0.82 - 0.1 * t), r * (0.82 - 0.1 * t), 0.1, 10, x, y, z, IRON)); // its iron hoops
    }
    o.wood.push(cube(r * 2.4, 0.22, 0.28, x, y1 - 0.9, z, scaleRgb(WOOD, 0.85))); // a spar across it
  },
  pipe(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    o.wall.push(cube(r * 1.8, 0.2, r * 1.8, x, y0, z, scaleRgb(c, 0.75)), cyl(r * 0.55, r * 0.55, h - 0.45, 10, x, y0 + 0.2, z, IRON));
    for (let y = y0 + 1.2; y < y1 - 0.3; y += 1.5) o.trim.push(cyl(r * 0.78, r * 0.78, 0.12, 10, x, y, z, scaleRgb(IRON, 1.2))); // flanges
    o.trim.push(tint(new THREE.TorusGeometry(r * 0.7, 0.04, 4, 10).rotateX(Math.PI / 2).translate(x, y0 + 1.5, z), scaleRgb(IRON, 1.4))); // a valve's wheel
    o.wall.push(cube(r * 1.7, 0.25, r * 1.7, x, y1 - 0.25, z, scaleRgb(IRON, 1.1)));
  },
  brick(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    o.wall.push(cube(r * 1.45, h - 0.75, r * 1.45, x, y0 + 0.45, z, c));
    for (let y = y0; y < y1 - 0.3; y += 0.9) o.trim.push(cube(r * 1.58, 0.1, r * 1.58, x, y + 0.4, z, scaleRgb(c, 0.86))); // its courses stepped out
    o.wall.push(cube(r * 1.9, 0.45, r * 1.9, x, y0, z, scaleRgb(c, 0.8)), cube(r * 1.85, 0.3, r * 1.85, x, y1 - 0.3, z, scaleRgb(c, 0.9)));
  },
  menhir(o, x, z, y0, y1, r, c, k) {
    const h = (y1 - y0) * (0.72 + 0.28 * k);
    const g = new THREE.CylinderGeometry(r * 0.55, r * 1.1, h, 5, 3).rotateY(k * 3).rotateZ((k - 0.5) * 0.1).translate(x, y0 + h / 2 - 0.15, z);
    o.wall.push(tint(tileUv(g, r * 5, h), scaleRgb(c, 0.85 + 0.1 * k)));
    for (let i = 0; i < 3; i++) o.wall.push(lump(0.18 + 0.1 * ((i + k * 3) % 1), x + Math.cos(i * 2.1 + k) * r * 1.2, y0 + 0.05, z + Math.sin(i * 2.1 + k) * r * 1.2, scaleRgb(c, 0.7), 0.5));
  },
  stalagmite(o, x, z, y0, y1, r, c, k) {
    const top = y1 + 0.6; // the ceiling, or as high again under the sky
    const mid = y0 + (top - y0) * (0.45 + 0.15 * k);
    o.wall.push(cyl(r * 1.12, r * 0.42, mid - y0, 7, x, y0, z, scaleRgb(c, 0.86)), cyl(r * 0.42, r * 1.1, top - mid, 7, x, mid, z, scaleRgb(c, 0.94)));
    for (let i = 0; i < 4; i++) {
      const a = i * 1.6 + k * 5;
      o.wall.push(cyl(r * 0.26, 0.03, 0.5 + 0.3 * ((i * 7 + k * 10) % 3), 5, x + Math.cos(a) * r * 1.3, y0, z + Math.sin(a) * r * 1.3, scaleRgb(c, 0.8)));
    }
  },
  coral(o, x, z, y0, y1, r, c, k) {
    const h = y1 - y0;
    o.wall.push(cyl(r * 1.05, r * 0.8, h, 7, x, y0, z, scaleRgb(c, 0.9)));
    for (let i = 0; i < 9; i++) { // barnacled lumps and the polyps that glow among them
      const a = i * 2.39 + k * 6;
      const y = y0 + 0.3 + ((i * 0.37 + k) % 1) * (h - 0.6);
      o.wall.push(lump(r * (0.28 + 0.12 * (i % 3)), x + Math.cos(a) * r * 0.86, y, z + Math.sin(a) * r * 0.86, scaleRgb(c, 0.72 + 0.08 * (i % 3)), 0.7));
      if (i % 3 === 0) o.glow.push(lump(0.08, x + Math.cos(a + 0.5) * r * 0.98, y + 0.25, z + Math.sin(a + 0.5) * r * 0.98, [0.32, 0.62, 0.72], 1));
    }
  },
  bones(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    o.wall.push(cyl(r * 0.78, r * 0.78, h - 0.7, 8, x, y0 + 0.35, z, scaleRgb(c, 0.7)));
    for (let y = y0 + 0.35, row = 0; y < y1 - 0.3; y += 0.62, row++) { // a drum of skulls, row on row, their long bones between
      for (let i = 0; i < 8; i++) {
        const a = ((i + (row % 2) * 0.5) / 8) * Math.PI * 2;
        o.wall.push(lump(r * 0.21, x + Math.cos(a) * r * 0.8, y, z + Math.sin(a) * r * 0.8, BONE, 0.95));
      }
      o.trim.push(cyl(r * 0.84, r * 0.84, 0.07, 8, x, y + 0.24, z, scaleRgb(BONE, 0.85)));
    }
    o.wall.push(cyl(r * 1.3, r * 1.2, 0.35, 8, x, y0, z, scaleRgb(c, 0.75)), cyl(r * 1.0, r * 1.3, 0.35, 8, x, y1 - 0.35, z, scaleRgb(c, 0.8)));
  },
  basalt(o, x, z, y0, y1, r, c, k) {
    const h = y1 - y0;
    const dark = scaleRgb(c, 0.7);
    o.wall.push(cyl(r * 0.95, r * 0.95, h - 0.3, 6, x, y0, z, dark));
    for (let i = 0; i < 3; i++) { // its neighbours of the same jointing, shorter, set about it
      const a = (i / 3) * Math.PI * 2 + k * 2;
      o.wall.push(cyl(r * 0.42, r * 0.42, h * (0.3 + 0.18 * i), 6, x + Math.cos(a) * r * 0.82, y0, z + Math.sin(a) * r * 0.82, dark)); // (one tone with it: their faces lie near its own)
    }
    o.wall.push(cyl(r * 1.2, r * 1.05, 0.3, 6, x, y1 - 0.3, z, scaleRgb(dark, 1.1)));
  },
  onyx(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    const black = mixDark(c);
    o.wall.push(cyl(r * 0.9, r * 0.84, h - 0.8, 8, x, y0 + 0.4, z, black), cyl(r * 1.35, r * 1.3, 0.4, 8, x, y0, z, scaleRgb(black, 1.2)), cyl(r * 1.05, r * 1.4, 0.4, 8, x, y1 - 0.4, z, scaleRgb(black, 1.2)));
    for (const t of [0.12, 0.5, 0.86]) o.trim.push(cyl(r * 0.96, r * 0.96, 0.13, 8, x, y0 + h * t, z, GILT)); // bands of gold
  },
  fungal(o, x, z, y0, y1, r, c, k) {
    const h = y1 - y0;
    const flesh: Rgb = [0.58 * c[0] + 0.1, 0.5 * c[1] + 0.06, 0.55 * c[2] + 0.08];
    for (let i = 0; i < 4; i++) { // a stalk that leans as it grows
      const lean = Math.sin(i * 1.3 + k * 5) * r * 0.2;
      o.wall.push(cyl(r * (0.72 - i * 0.05), r * (0.68 - i * 0.05), (h - 0.5) / 4, 8, x + lean, y0 + (i * (h - 0.5)) / 4, z, scaleRgb(flesh, 0.9 + 0.04 * i)));
    }
    for (let i = 0; i < 3; i++) { // shelves of fungus on it, and a cap spread under the roof
      const a = i * 2.1 + k * 4;
      const y = y0 + h * (0.3 + 0.2 * i);
      o.trim.push(tint(new THREE.CylinderGeometry(r * 0.6, r * 0.45, 0.16, 8).scale(1, 1, 0.6).translate(x + Math.cos(a) * r * 0.55, y, z + Math.sin(a) * r * 0.55), scaleRgb(flesh, 1.15)));
      o.glow.push(lump(0.06, x + Math.cos(a) * r * 0.98, y + 0.12, z + Math.sin(a) * r * 0.98, [0.78, 0.56, 0.4], 1));
    }
    o.wall.push(cyl(r * 0.7, r * 1.5, 0.5, 9, x, y1 - 0.5, z, scaleRgb(flesh, 1.08)));
  },
  shard(o, x, z, y0, y1, r, c, k) {
    const h = y1 - y0;
    const glass = scaleRgb(c, 0.42);
    const cuts = [0, 0.38 + 0.08 * k, 0.72, 1];
    for (let i = 0; i < 3; i++) { // three pieces, apart, as if what held them together had let go
      const [a, b] = [y0 + h * cuts[i] + (i ? 0.18 : 0), y0 + h * cuts[i + 1] - 0.18];
      const g = new THREE.CylinderGeometry(r * (0.55 + 0.1 * i), r * (0.8 - 0.1 * i), b - a, 4).rotateY(k * 2 + i * 0.4).rotateX((i - 1) * 0.05).translate(x, (a + b) / 2, z);
      o.wall.push(tint(tileUv(g, r * 3, b - a), scaleRgb(glass, 1 + 0.1 * i)));
      o.glow.push(cyl(0.05, 0.05, 0.12, 4, x, b + 0.02, z, [0.5, 0.58, 0.85]));
    }
  },
  toad(o, x, z, y0, y1, r, c) {
    const h = y1 - y0;
    const dark = scaleRgb(c, 0.72);
    o.wall.push(cyl(r * 1.0, r * 1.1, h - 1.5, 8, x, y0 + 0.4, z, dark), cyl(r * 1.45, r * 1.35, 0.4, 8, x, y0, z, scaleRgb(dark, 0.9)));
    o.wall.push(tint(new THREE.IcosahedronGeometry(r * 1.25, 1).scale(1.1, 0.62, 1.1).translate(x, y1 - 0.65, z), scaleRgb(dark, 1.08))); // the head, broad and low
    for (let i = 0; i < 4; i++) { // its eyes, heavy-lidded, at the four sides
      const a = (i / 4) * Math.PI * 2;
      o.wall.push(lump(r * 0.3, x + Math.cos(a) * r * 1.0, y1 - 0.3, z + Math.sin(a) * r * 1.0, scaleRgb(dark, 1.2), 0.7));
    }
  },
};

/** A colour pushed toward polished black, keeping a little of its own tone. */
const mixDark = (c: Rgb): Rgb => [ONYX[0] + c[0] * 0.12, ONYX[1] + c[1] * 0.12, ONYX[2] + c[2] * 0.12];

/** A pillar's pieces by group, drawn as `form`. */
export function pillarPieces(form: PillarForm, p: CylPart, c: Rgb): PillarPiece[] {
  const o: Out = { wall: [], wood: [], trim: [], beam: [], glow: [], shine: [] };
  FORMS[form](o, p.x, p.z, p.y0, p.y1, p.radius, c, hash2(Math.round(p.x * 10), Math.round(p.z * 10), 108));
  const out: PillarPiece[] = [];
  for (const kind of Object.keys(o) as PillarKind[]) {
    const geos = o[kind].map((g) => (g.index ? g.toNonIndexed() : g));
    if (geos.length) out.push({ kind: kind === 'glow' ? 'shine' : kind, geo: mergeGeometries(geos) }); // (what glows on a pillar is set in it: drawn nearer than its stone)
  }
  return out;
}
