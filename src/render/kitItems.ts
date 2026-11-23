/**
 * The kits' things along a dungeon hall's walls (round 30; round 117 made each of them out of its parts and in more than one way, where
 * each was a few boxes): a case of books in its frame of sides, cornice, plinth and shelves, its books of every height with a gap, a
 * leaning one and a pile, or ledgers and a skull, or scrolls; crates of boards in their battens, stacked, one with its lid off; casks
 * that swell to the middle in their hoops, stood or laid on chocks; a sarcophagus on its plinth under a chamfered lid, with an effigy on
 * it, or a wooden coffin on trestles, or a chest broken open; a statue robed and hooded, winged, kneeling or broken; a stele round-headed,
 * pointed or broken off; a pew with its back, ends and kneeler; growths of the deep; rubble; bones and a skull. Each on a wall's own frame
 * (furnitureKit.ts), none of it more than 1.1 m off the wall; what stands proud of a face by less than a hand is relief. Render only.
 */

import * as THREE from 'three';
import type { WallItem } from '../data/dungeonLooks';
import { alongSign, blob, BONE, books, DARK, IRON, lathe, onWall, radiusAt, round, staves, wb, type Frame } from './furnitureKit';
import { tint } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

export type KitItem = Extract<WallItem, 'shelves' | 'crate' | 'barrel' | 'coffin' | 'statue' | 'stele' | 'pew' | 'growth' | 'rubble' | 'bones'>;

const PAPER: Rgb = [0.82, 0.76, 0.62];
const STRAW: Rgb = [0.62, 0.54, 0.32];
const pick = (f: Frame, n: number): number => Math.floor(f.rng() * n);

/**
 * A case of books `w` wide and `h` high, its middle `s` along the wall: two sides, a plinth and a cornice in one wood, a back and its
 * shelves as relief, and on each shelf books, or ledgers with a skull or a jar among them, or scrolls in piles.
 */
export function bookcase(f: Frame, s: number, w: number, h: number, rows: number, fill: 'books' | 'ledgers' | 'scrolls' = 'books'): void {
  const [deep, back] = [0.44, 0.03];
  const wood = scaleRgb(DARK, 0.94 + f.rng() * 0.12);
  const mid = back + deep / 2;
  f.out.wood.push(wb(f, s - w / 2 + 0.035, mid, 0.07, deep, h, 0, wood), wb(f, s + w / 2 - 0.035, mid, 0.07, deep, h, 0, wood)); // its sides
  f.out.wood.push(wb(f, s, mid, w, deep, 0.14, 0, wood), wb(f, s, mid + 0.03, w + 0.12, deep + 0.06, 0.12, h, wood)); // its plinth and cornice
  f.out.beam.push(wb(f, s, back + 0.015, w - 0.14, 0.03, h - 0.14, 0.14, scaleRgb(wood, 0.72))); // its back, against the wall
  const gap = (h - 0.14) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 0.14 + r * gap;
    if (r) f.out.beam.push(wb(f, s, mid + 0.005, w - 0.14, deep - 0.03, 0.035, y, scaleRgb(wood, 1.06))); // a shelf
    const [s0, s1, floor, room] = [s - w / 2 + 0.08, s + w / 2 - 0.08, y + (r ? 0.035 : 0), gap - 0.07];
    if (fill === 'scrolls' && r % 2) {
      for (let k = 0; k < Math.floor((s1 - s0) / 0.42); k++) for (let row = 0; row < 3; row++) for (let j = 0; j < 3 - row; j++) { // scrolls piled in a little pyramid, their ends out
        const g = new THREE.CylinderGeometry(0.055, 0.055, deep - 0.08, 6).rotateX(Math.PI / 2);
        f.out.beam.push(onWall(f, tint(g, scaleRgb(PAPER, 0.85 + 0.2 * f.rng())), s0 + 0.12 + k * 0.42 + (j - (2 - row) / 2) * 0.115, mid, floor + 0.055 + row * 0.1));
      }
      continue;
    }
    if (fill === 'ledgers' && r === 1) { // a skull among the ledgers, or a jar of something
      f.out.wall.push(f.rng() < 0.5 ? blob(f, s1 - 0.2, mid, 0.13, floor + 0.12, BONE, 1) : round(f, s1 - 0.2, mid, 0.1, 0.26, floor, [0.32, 0.36, 0.3], 8));
      books(f, s0, s1 - 0.4, floor, room, back + deep - 0.02, deep - 0.08);
      continue;
    }
    books(f, s0, s1, floor, fill === 'ledgers' ? room : room * 0.95, back + deep - 0.02, deep - 0.08);
  }
}

/** A crate of `z` metres a side at `s` along the wall, `d0` off it, its foot `y` up: its boards in one wood, battens on its edges and a brace across its face (relief). */
function crate(f: Frame, s: number, d0: number, z: number, y: number, tone: number, open = false): void {
  const c = scaleRgb(DARK, tone);
  const bat = scaleRgb(c, 0.78);
  const [mid, front, t] = [d0 + z / 2, d0 + z + 0.012, 0.024];
  f.out.wood.push(wb(f, s, mid, z, z, z - (open ? 0.03 : 0), y, c));
  for (const e of [-1, 1]) { // the battens down its front's edges and along its sides' front and back edges
    f.out.beam.push(wb(f, s + e * (z / 2 - 0.04), front, 0.08, t, z, y, bat));
    for (const dd of [d0 + 0.04, d0 + z - 0.04]) f.out.beam.push(wb(f, s + e * (z / 2 + 0.012), dd, t, 0.08, z, y, bat));
  }
  for (const yy of [y, y + z - 0.08]) f.out.beam.push(wb(f, s, front, z - 0.16, t, 0.08, yy, bat)); // and across its front, top and foot
  const brace = new THREE.BoxGeometry(Math.hypot(z - 0.16, z - 0.16), 0.07, t).rotateZ((Math.PI / 4) * alongSign(f) * (f.rng() < 0.5 ? 1 : -1));
  f.out.beam.push(onWall(f, tint(brace, bat), s, front, y + z / 2));
  if (open) { // its lid set against it, straw spilling over its rim
    const lid = new THREE.BoxGeometry(z, z, 0.05).translate(0, z / 2, 0).rotateX(-0.25);
    f.out.beam.push(onWall(f, tint(lid, scaleRgb(c, 1.08)), s, d0 + z + 0.2, y));
    for (let k = 0; k < 5; k++) f.out.wood.push(blob(f, s + (f.rng() - 0.5) * z * 0.7, mid + (f.rng() - 0.5) * z * 0.5, 0.12 + f.rng() * 0.06, y + z - 0.04, scaleRgb(STRAW, 0.85 + 0.3 * f.rng()), 0.5));
  } else for (const k of [-0.25, 0.25]) f.out.beam.push(wb(f, s, mid + k * z, z - 0.04, 0.08, t, y + z, bat)); // battens over its lid
}

/** A cask's profile, `r` at its bilge and `h` tall: swelling from its chimes to its middle, its head let in under the rim. */
const caskProfile = (r: number, h: number): [number, number][] => [[0, 0.03], [r * 0.78, 0.03], [r * 0.82, 0], [r * 0.86, h * 0.06], [r * 0.95, h * 0.25], [r, h * 0.5], [r * 0.95, h * 0.75], [r * 0.86, h * 0.94], [r * 0.82, h], [r * 0.78, h - 0.03], [0, h - 0.03]];

/** A cask, its axis upright, its foot on the floor at the item's origin: staves, a head, four hoops (relief). */
function cask(r: number, h: number, wood: Rgb): { body: THREE.BufferGeometry; hoops: THREE.BufferGeometry[] } {
  const prof = caskProfile(r, h);
  const body = staves(lathe(prof, 12, wood), 12, 0.84);
  const hoops = [0.1, 0.3, 0.7, 0.9].map((t) => {
    const rr = radiusAt(prof, h * t) + 0.012;
    return tint(new THREE.CylinderGeometry(rr, rr, 0.045, 12).translate(0, h * t, 0), IRON);
  });
  return { body, hoops };
}

/** Casks: stood up, one or two; or laid on their chocks, one with a tap; or two laid and one more on them. */
function casks(f: Frame): void {
  const [r, h] = [0.36, 0.95];
  const wood = scaleRgb(DARK, 0.95 + f.rng() * 0.15);
  const stood = (s: number, d: number): void => {
    const c = cask(r, h, wood);
    f.out.wood.push(onWall(f, c.body, s, d));
    for (const g of c.hoops) f.out.trim.push(onWall(f, g, s, d));
  };
  const laid = (s: number, d: number, y: number, tap: boolean): void => {
    const c = cask(r, h, wood);
    const turn = (g: THREE.BufferGeometry): THREE.BufferGeometry => g.translate(0, -h / 2, 0).rotateZ(Math.PI / 2);
    f.out.wood.push(onWall(f, turn(c.body), s, d, y + r));
    for (const g of c.hoops) f.out.trim.push(onWall(f, turn(g), s, d, y + r));
    if (tap) f.out.trim.push(onWall(f, tint(new THREE.BoxGeometry(0.05, 0.05, 0.16).translate(0, 0, r + 0.06), IRON), s, d, y + r)); // its tap, in its belly
  };
  const chocks = (s: number, d: number, y: number): void => {
    for (const e of [-0.32, 0.32]) f.out.wood.push(wb(f, s + e, d, 0.14, r * 1.7, 0.16, y, scaleRgb(DARK, 0.8)));
  };
  const v = pick(f, 3);
  if (v === 0) {
    stood(-0.45, 0.42);
    if (f.rng() < 0.6) stood(0.45, 0.42);
  } else if (v === 1) {
    chocks(-0.2, 0.42, 0);
    laid(-0.2, 0.42, 0.06, true);
    stood(0.75, 0.42);
  } else { // two laid on long chocks, their heads to the room, and one more in the nip of the two
    for (const dd of [0.22, 0.88]) f.out.wood.push(wb(f, 0, dd, 1.6, 0.14, 0.12, 0, scaleRgb(DARK, 0.8)));
    const out = (s: number, y: number): void => {
      const c = cask(r, h, wood);
      const turn = (g: THREE.BufferGeometry): THREE.BufferGeometry => g.translate(0, -h / 2, 0).rotateX(Math.PI / 2);
      f.out.wood.push(onWall(f, turn(c.body), s, 0.55, y + r));
      for (const g of c.hoops) f.out.trim.push(onWall(f, turn(g), s, 0.55, y + r));
    };
    out(-r, 0.06);
    out(r, 0.06);
    out(0, 0.06 + r * Math.sqrt(3));
  }
}

/** A stone coffin on its plinth under a chamfered lid, a cross cut in it or the dead carved lying on it; or a wooden coffin on trestles; or a chest broken open, its lid slid aside. */
function coffin(f: Frame): void {
  const stone = scaleRgb(f.c, 0.9);
  const v = pick(f, 4);
  if (v === 3) { // a wooden coffin, wider at the shoulder than at the foot, on two trestles, its lid set a little askew
    const wood = scaleRgb(DARK, 1.05);
    for (const e of [-0.7, 0.7]) {
      f.out.wood.push(wb(f, e, 0.55, 0.1, 0.7, 0.08, 0.42, wood));
      for (const k of [-0.25, 0.25]) f.out.wood.push(wb(f, e, 0.55 + k, 0.08, 0.08, 0.42, 0, scaleRgb(wood, 0.9)));
    }
    const shape = new THREE.Shape(([[-1, -0.22], [-1, 0.22], [-0.55, 0.32], [1, 0.18], [1, -0.18], [-0.55, -0.32]] as const).map(([x, y]) => new THREE.Vector2(x, y))); // narrow at the head, widest at the shoulders
    const body = new THREE.ExtrudeGeometry(shape, { depth: 0.36, bevelEnabled: false }).rotateX(-Math.PI / 2);
    f.out.wood.push(onWall(f, tint(body, wood), 0, 0.55, 0.5));
    const lid = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }).rotateX(-Math.PI / 2).rotateY(0.1 * (f.rng() - 0.5));
    f.out.beam.push(onWall(f, tint(lid, scaleRgb(wood, 1.12)), 0.08, 0.57, 0.86));
    return;
  }
  f.out.wall.push(wb(f, 0, 0.55, 2.5, 1.1, 0.18, 0, scaleRgb(stone, 0.88))); // its plinth
  if (v === 2) { // broken open: four walls, a dark inside, the lid slid aside and a corner of it gone
    for (const e of [-1, 1]) f.out.wall.push(wb(f, e * 1.03, 0.55, 0.14, 0.95, 0.67, 0.18, stone), wb(f, 0, 0.55 + e * 0.405, 1.92, 0.14, 0.67, 0.18, stone));
    f.out.wall.push(wb(f, 0, 0.55, 1.92, 0.67, 0.14, 0.18, scaleRgb(stone, 0.35)));
    f.out.wall.push(blob(f, -0.6, 0.55, 0.13, 0.4, BONE, 0.95));
    const lid = new THREE.BoxGeometry(2.0, 0.16, 0.9).translate(0, 0.08, 0).rotateY(0.1);
    f.out.wall.push(onWall(f, tint(lid, stone), 0.35, 0.55, 0.85)); // slid off, to the side
    return;
  }
  f.out.wall.push(wb(f, 0, 0.55, 2.2, 0.95, 0.67, 0.18, stone)); // the chest
  const lid = new THREE.CylinderGeometry(0.85, 1, 1, 4, 1).rotateY(Math.PI / 4).scale(1.175 / Math.SQRT1_2, 0.22, 0.55 / Math.SQRT1_2).translate(0, 0.11, 0); // chamfered all round
  f.out.wall.push(onWall(f, tint(lid, stone), 0, 0.55, 0.85));
  if (v === 1) { // the dead carved lying on it, hands joined
    const pale = scaleRgb(f.c, 1.08);
    const body = new THREE.CylinderGeometry(0.17, 0.22, 1.25, 6).rotateZ(Math.PI / 2).scale(1, 0.62, 1);
    f.out.wall.push(onWall(f, tint(body, pale), -0.05, 0.55, 1.07 + 0.14 * 0.62), blob(f, -0.82, 0.55, 0.15, 1.2, pale, 0.9), blob(f, 0.62, 0.55, 0.1, 1.14, pale, 0.9), blob(f, 0.7, 0.55, 0.1, 1.14, pale, 0.9));
    f.out.wall.push(blob(f, -0.3, 0.55, 0.09, 1.3, pale, 0.9));
  } else f.out.trim.push(wb(f, 0, 0.55, 0.12, 0.6, 0.05, 1.07, scaleRgb(f.c, 0.7)), wb(f, -0.15, 0.55, 0.9, 0.12, 0.05, 1.07, scaleRgb(f.c, 0.7))); // a cross cut in its lid
}

/** A statue on its plinth: robed and hooded, or bare-headed with a book; winged; kneeling with its hands joined; or broken at the waist, its head at its foot. */
function statue(f: Frame): void {
  const pale = scaleRgb(f.c, 1.08);
  const d = 0.48;
  const v = pick(f, 4);
  const base = v === 2 ? 0.55 : 0.85;
  f.out.wall.push(wb(f, 0, d, 0.92, 0.88, base, 0, scaleRgb(f.c, 0.88)), wb(f, 0, d, 1.02, 0.98, 0.14, base - 0.14, scaleRgb(f.c, 0.88))); // its plinth and its cap
  const robe = (top: number, foot: number, bottom = 0.35): THREE.BufferGeometry => staves(lathe([[0, 0], [bottom, 0], [bottom * 0.95, 0.25], [0.27, top * 0.6], [0.23, top * 0.92], [0.2, top], [0, top]], 10, pale), 10, 0.9).translate(0, foot, 0);
  if (v === 3) { // broken at the waist
    const g = robe(0.75, 0, 0.35);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0.7) pos.setY(i, pos.getY(i) - 0.22 * (0.5 + 0.5 * Math.sin(Math.atan2(pos.getX(i), pos.getZ(i)) * 3)));
    g.computeVertexNormals();
    f.out.wall.push(onWall(f, g, 0, d, base), blob(f, 0.62, d + 0.28, 0.17, 0.16, pale, 1.1));
    return;
  }
  const tall = v === 2 ? 0.95 : 1.25;
  f.out.wall.push(onWall(f, robe(tall, 0, v === 2 ? 0.42 : 0.35), 0, d, base));
  const top = base + tall;
  f.out.wall.push(wb(f, 0, d, 0.56, 0.26, 0.2, top - 0.12, pale)); // the shoulders
  const head = tint(new THREE.IcosahedronGeometry(0.16, 1).scale(0.9, 1.1, 1), pale);
  f.out.wall.push(onWall(f, head, 0, d + (v === 2 ? 0.08 : 0), top + 0.24 - (v === 2 ? 0.05 : 0)));
  if (v === 0 && f.rng() < 0.6) f.out.wall.push(onWall(f, tint(new THREE.ConeGeometry(0.22, 0.52, 8).translate(0, 0.26, -0.03), pale), 0, d, top + 0.04)); // its hood
  f.out.wall.push(wb(f, 0, d + 0.2, 0.36, 0.14, 0.14, top - 0.46, pale)); // its arms, folded or holding what it holds
  if (v === 0) f.out.trim.push(wb(f, 0, d + 0.3, 0.24, 0.06, 0.3, top - 0.54, scaleRgb(pale, 0.95))); // a book held to its breast
  if (v === 1) for (const e of [-1, 1]) { // its wings, folded behind it: rising over the shoulders and sweeping down to its heels
    const wing = new THREE.IcosahedronGeometry(1, 1).scale(0.2, 0.85, 0.06).translate(0, 0.62, 0).rotateZ(-e * 0.22 * alongSign(f));
    f.out.wall.push(onWall(f, tint(wing, pale), e * 0.24, d - 0.2, top - 0.75));
  }
}

/** A stele on its base, its face cut with a border and rows of runes: round-headed, pointed, or broken off with its top fallen beside it. */
function stele(f: Frame): void {
  const h = 1.5 + f.rng() * 1.5;
  const stone = scaleRgb(f.c, 0.95);
  const v = pick(f, 3);
  f.out.wall.push(wb(f, 0, 0.3, 0.95, 0.42, 0.3, 0, scaleRgb(f.c, 0.85)));
  const shaft = v === 2 ? h * 0.6 : h;
  f.out.wall.push(wb(f, 0, 0.3, 0.72, 0.28, shaft, 0.3, stone));
  if (v === 0) f.out.wall.push(onWall(f, tint(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 10, 1, false, Math.PI / 2, Math.PI).rotateX(Math.PI / 2).rotateZ(0), stone), 0, 0.3, 0.3 + shaft));
  else if (v === 1) f.out.wall.push(onWall(f, tint(new THREE.CylinderGeometry(0, 0.5, 0.5, 4).rotateY(Math.PI / 4).scale(1, 1, 0.38).translate(0, 0.25, 0), stone), 0, 0.3, 0.3 + shaft));
  else { // its broken top on the floor before it
    const g = new THREE.BoxGeometry(0.72, 0.28, 0.5).rotateY(0.4 * (f.rng() - 0.5));
    f.out.wall.push(onWall(f, tint(g, scaleRgb(stone, 0.96)), 0.5, 0.75, 0.14));
  }
  const cut = scaleRgb(f.c, 0.55);
  for (const e of [-1, 1]) f.out.trim.push(wb(f, e * 0.28, 0.455, 0.05, 0.03, shaft - 0.3, 0.45, cut)); // its border
  for (let k = 0; k < Math.floor((shaft - 0.5) / 0.28); k++) { // its runes, a row at a time, no two rows alike
    let x = -0.2;
    while (x < 0.2) {
      const w = 0.04 + f.rng() * 0.07;
      f.out.trim.push(wb(f, x + w / 2, 0.455, w, 0.03, 0.08 + f.rng() * 0.06, 0.6 + k * 0.28, cut));
      x += w + 0.04;
    }
  }
}

/** A pew: its seat on an apron, a back that leans a little, a rail along its top, ends with a round head, and a kneeler before it; now and then a book left on it. */
function pew(f: Frame): void {
  const wood = scaleRgb(DARK, 1.0);
  f.out.wood.push(wb(f, 0, 0.52, 2.5, 0.46, 0.07, 0.43, wood), wb(f, 0, 0.72, 2.4, 0.04, 0.16, 0.27, wood)); // the seat and its apron
  const back = new THREE.BoxGeometry(2.5, 0.72, 0.06).translate(0, 0.36, 0).rotateX(-0.12);
  f.out.wood.push(onWall(f, tint(back, wood), 0, 0.3, 0.5));
  f.out.beam.push(onWall(f, tint(new THREE.BoxGeometry(2.56, 0.07, 0.1).translate(0, 0.74, 0).rotateX(-0.12), scaleRgb(wood, 0.85)), 0, 0.3, 0.5)); // its rail
  for (const e of [-1, 1]) {
    f.out.wood.push(wb(f, e * 1.27, 0.55, 0.07, 0.62, 0.95, 0, wood));
    f.out.wood.push(onWall(f, tint(new THREE.CylinderGeometry(0.31, 0.31, 0.07, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), wood), e * 1.27, 0.55, 0.95)); // its end's round head
  }
  f.out.wood.push(wb(f, 0, 0.97, 2.4, 0.18, 0.15, 0, scaleRgb(wood, 0.9))); // the kneeler
  if (f.rng() < 0.35) f.out.beam.push(wb(f, (f.rng() - 0.5) * 1.6, 0.52, 0.2, 0.14, 0.05, 0.5, scaleRgb(BOOKS_DARK, 1)));
}
const BOOKS_DARK: Rgb = [0.3, 0.16, 0.14];

const GLOWS: readonly Rgb[] = [[0.3, 0.7, 0.62], [0.55, 0.38, 0.75]];

export const KIT_ITEMS: Readonly<Record<KitItem, (f: Frame) => void>> = {
  shelves(f) {
    const v = f.rng();
    bookcase(f, 0, 1.9, 2.8, 5, v < 0.62 ? 'books' : v < 0.84 ? 'ledgers' : 'scrolls');
  },
  crate(f) {
    const z = 0.7 + f.rng() * 0.25;
    const v = pick(f, 3);
    if (v === 0) { // two side by side and one on them
      crate(f, -0.45, 0.12, z, 0, 0.9 + f.rng() * 0.3);
      crate(f, 0.48, 0.2, 0.8, 0, 0.9 + f.rng() * 0.3);
      if (f.rng() < 0.7) crate(f, -0.4, 0.12 + z * 0.1, z * 0.8, z, 1.1);
    } else if (v === 1) { // one great one and a small one before it, open
      crate(f, -0.2, 0.08, 1.0, 0, 0.95);
      crate(f, 0.75, 0.25, 0.6, 0, 1.1, true);
    } else { // three in a row, the middle one open
      for (const [k, s] of [-0.8, 0, 0.8].entries()) crate(f, s, 0.2, 0.68, 0, 0.9 + 0.1 * k, k === 1);
    }
  },
  barrel: casks,
  coffin,
  statue,
  stele,
  pew,
  growth(f) {
    for (let k = 0; k < 5; k++) {
      const [s, d, h] = [(f.rng() - 0.5) * 1.8, 0.3 + f.rng() * 0.5, 0.35 + f.rng() * 0.9];
      f.out.wall.push(round(f, s, d, 0.07 + f.rng() * 0.05, h, 0, [0.6, 0.62, 0.55], 5, 0.05));
      const g = GLOWS[k % 2];
      f.out.glow.push(tint(blob(f, s, d, 0.18 + f.rng() * 0.15, h, g, 0.45), g));
      if (k % 2) f.out.glow.push(tint(blob(f, s, d, 0.09, h - 0.12, scaleRgb(g, 0.8), 0.4), scaleRgb(g, 0.8))); // its gills under the cap
    }
    for (let k = 0; k < 6; k++) f.out.wall.push(blob(f, (f.rng() - 0.5) * 2, 0.15 + f.rng() * 0.2, 0.1 + f.rng() * 0.1, 0.1, scaleRgb(f.c, 0.6), 0.8));
  },
  rubble(f) {
    const drum = f.rng() < 0.4 ? (f.rng() - 0.5) * 1.2 : null; // a column's drum, fallen among the stones
    if (drum !== null) f.out.wall.push(onWall(f, tint(new THREE.CylinderGeometry(0.3, 0.3, 0.55, 9).rotateZ(Math.PI / 2).rotateY(f.rng()), scaleRgb(f.c, 0.85)), drum, 0.55, 0.3));
    for (let k = 0; k < 7; k++) {
      const r = 0.12 + f.rng() * 0.3;
      const [s, d] = [(f.rng() - 0.5) * 1.8, r + f.rng() * (1.08 - 2 * r)]; // (none in the wall, nor farther from it than an item stands)
      const c = scaleRgb(f.c, 0.62 + 0.16 * f.rng());
      if (drum !== null && Math.hypot(s - drum, d - 0.55) < 0.45 + r) continue; // (none lying in the drum: two stones of two tones in one another fight for the depth)
      f.out.wall.push(blob(f, s, d, r, r * 0.4, c));
    }
  },
  bones(f) {
    for (let k = 0; k < 6; k++) f.out.wall.push(wb(f, (f.rng() - 0.5) * 1.6, 0.2 + f.rng() * 0.8, 0.5 + f.rng() * 0.3, 0.05, 0.04, 0.03 + f.rng() * 0.08, BONE));
    const skull = tint(new THREE.IcosahedronGeometry(0.12, 1).scale(0.9, 0.95, 1.15), BONE); // a skull, its jaw beside it
    f.out.wall.push(onWall(f, skull, 0.1, 0.55, 0.1), wb(f, 0.32, 0.6, 0.12, 0.1, 0.04, 0, scaleRgb(BONE, 0.9)));
    f.out.wall.push(blob(f, -0.35, 0.8, 0.1, 0.1, BONE, 0.9), blob(f, 0.5, 0.35, 0.1, 0.1, BONE, 0.9));
    for (let k = 0; k < 4; k++) { // a few ribs, fallen together
      const g = new THREE.BoxGeometry(0.34 - k * 0.03, 0.025, 0.03).rotateY(0.3 + 0.12 * k);
      f.out.wall.push(onWall(f, tint(g, BONE), -0.55 + k * 0.07, 0.45 + k * 0.03, 0.0125));
    }
  },
};
