/**
 * What else stands along a hall's walls (round 108; data/dungeonLooks.ts says which dungeon sets which): a lectern with its open book,
 * an ossuary's shelves of skulls, Akeley's machines of the Outer Ones, the Great Race's record cases, a squat idol on its plinth,
 * nets hung to dry with their floats, a plant's pipes and valves, shelves of specimens in glowing fluid, a cyclopean slab leaned
 * at a wrong angle, the Mi-Go's brain cylinders on their rack, chains and shackles, roots come through the wall, and a bust on its
 * pillar. Built on a wall's own frame like the kits' things (dungeonFurniture.ts), none of it more than 1.1 m off the wall. Render only.
 */

import * as THREE from 'three';
import type { WallItem } from '../data/dungeonLooks';
import { blob, BONE, DARK, IRON, round, wb, type Frame } from './dungeonFurniture';
import { tint } from './meshKit';
import { stroke } from './roomWalls';
import { scaleRgb, type Rgb } from './palette';

export type LoreItem = Extract<WallItem, 'lectern' | 'ossuary' | 'apparatus' | 'cases' | 'idol' | 'nets' | 'pipes' | 'specimens' | 'slab' | 'cylinders' | 'chains' | 'roots' | 'bust'>;

const PAGE: Rgb = [0.86, 0.82, 0.7];
const BRASS: Rgb = [0.6, 0.48, 0.26];
const FLUID: readonly Rgb[] = [[0.42, 0.62, 0.34], [0.62, 0.5, 0.26], [0.36, 0.52, 0.62]];
const NET: Rgb = [0.5, 0.46, 0.36];
const ROOT: Rgb = [0.3, 0.24, 0.18];

/** A strand from (s0, y0) to (s1, y1) at `d` off the wall, `w` thick: a rope, a root, a chain's run. */
const strand = (f: Frame, s0: number, y0: number, s1: number, y1: number, d: number, w: number, c: Rgb): THREE.BufferGeometry => stroke(f.wall, f.y, f.s + s0, y0, f.s + s1, y1, d, w, w, c);

export const LORE_ITEMS: Readonly<Record<LoreItem, (f: Frame) => void>> = {
  lectern(f) {
    f.out.wood.push(wb(f, 0, 0.7, 0.5, 0.5, 0.15, 0, DARK), wb(f, 0, 0.7, 0.16, 0.16, 0.9, 0.15, DARK), wb(f, 0, 0.7, 0.75, 0.55, 0.18, 1.05, scaleRgb(DARK, 1.15))); // (its desk deep enough that the post's top in it is no fight)
    f.out.beam.push(wb(f, -0.17, 0.7, 0.32, 0.42, 0.05, 1.23, PAGE), wb(f, 0.17, 0.7, 0.32, 0.42, 0.05, 1.23, scaleRgb(PAGE, 0.94))); // the open book
    f.out.wood.push(...[-0.8, 0.8].map((s) => wb(f, s, 0.3, 0.5, 0.45, 1.6, 0, scaleRgb(DARK, 0.9)))); // a case of books either side
  },
  ossuary(f) {
    f.out.wall.push(wb(f, 0, 0.3, 2.2, 0.6, 2.6, 0, scaleRgb(f.c, 0.8)));
    for (let row = 0; row < 4; row++) {
      f.out.trim.push(wb(f, 0, 0.62, 2.2, 0.06, 0.06, 0.25 + row * 0.6, scaleRgb(f.c, 0.6)));
      for (let k = 0; k < 6; k++) f.out.wall.push(blob(f, -0.9 + k * 0.36, 0.62, 0.15, 0.48 + row * 0.6, BONE, 0.95)); // skulls in rows on its shelves
    }
  },
  apparatus(f) {
    f.out.wall.push(wb(f, 0, 0.45, 1.6, 0.8, 1.0, 0, IRON), wb(f, 0, 0.35, 1.2, 0.6, 0.5, 1.0, scaleRgb(IRON, 1.2)));
    for (let k = 0; k < 4; k++) f.out.shine.push(tint(wb(f, -0.55 + k * 0.36, 0.86, 0.14, 0.04, 0.14, 0.6, [0, 0, 0]), k % 2 ? [0.5, 0.7, 0.85] : [0.8, 0.62, 0.3])); // its dials, lit
    for (const s of [-0.4, 0.4]) f.out.wall.push(round(f, s, 0.35, 0.13, 0.7, 1.5, BRASS, 8)); // the lenses on their tubes
    f.out.trim.push(wb(f, 0, 0.86, 1.3, 0.03, 0.04, 0.3, BRASS));
  },
  cases(f) {
    f.out.wall.push(wb(f, 0, 0.32, 1.9, 0.64, 3.4, 0, scaleRgb(f.c, 0.62)));
    for (let row = 0; row < 5; row++) for (let k = 0; k < 4; k++) f.out.trim.push(wb(f, -0.66 + k * 0.44, 0.66, 0.34, 0.04, 0.5, 0.25 + row * 0.62, scaleRgb(f.c, row % 2 ? 0.8 : 0.9))); // the drawers of the records, hinged
    f.out.shine.push(tint(wb(f, 0, 0.66, 0.08, 0.04, 0.08, 3.1, [0, 0, 0]), [0.55, 0.62, 0.72]));
  },
  idol(f) {
    const dark = scaleRgb(f.c, 0.62);
    f.out.wall.push(wb(f, 0, 0.5, 1.0, 0.9, 0.7, 0, scaleRgb(f.c, 0.85)), tint(blob(f, 0, 0.5, 0.55, 1.15, dark, 0.7), dark)); // a squat thing on a plinth, broad and low
    for (const s of [-0.22, 0.22]) f.out.wall.push(blob(f, s, 0.9, 0.12, 1.42, scaleRgb(dark, 1.25), 0.7));
    f.out.wall.push(blob(f, -0.4, 0.75, 0.16, 0.85, dark, 0.6), blob(f, 0.4, 0.75, 0.16, 0.85, dark, 0.6));
  },
  nets(f) {
    for (let k = 0; k <= 6; k++) f.out.beam.push(strand(f, -1.1 + k * 0.37, 2.4, -1.0 + k * 0.33 + Math.sin(k) * 0.08, 0.6, 0.08, 0.035, NET)); // the net hung from its pegs, sagging
    for (let k = 0; k < 4; k++) f.out.beam.push(strand(f, -1.1, 2.1 - k * 0.42, 1.1, 2.0 - k * 0.42 - 0.08 * k, 0.09, 0.03, NET));
    for (const s of [-0.7, 0.1, 0.8]) f.out.wall.push(blob(f, s, 0.14, 0.12, 0.7 + Math.abs(s) * 0.3, [0.62, 0.42, 0.24], 1)); // its floats
    f.out.wood.push(wb(f, 0, 0.1, 2.4, 0.12, 0.1, 2.4, DARK));
  },
  pipes(f) {
    for (const s of [-0.6, 0, 0.55]) f.out.wall.push(round(f, s, 0.2, 0.12, 5.4, 0, IRON, 8));
    for (const y of [1.1, 3.4]) f.out.trim.push(round(f, -0.6, 0.2, 0.17, 0.08, y, scaleRgb(IRON, 1.3), 8), round(f, 0, 0.2, 0.17, 0.08, y + 0.3, scaleRgb(IRON, 1.3), 8));
    f.out.wall.push(wb(f, 0, 0.45, 0.24, 0.3, 0.24, 1.35, scaleRgb(IRON, 1.2))); // a valve, its wheel and the frost on the joint
    f.out.trim.push(wb(f, 0, 0.62, 0.44, 0.04, 0.44, 1.25, scaleRgb(IRON, 1.5)));
    f.out.wall.push(blob(f, 0.55, 0.32, 0.2, 2.2, [0.84, 0.88, 0.92], 1.2));
  },
  specimens(f) {
    f.out.wood.push(wb(f, 0, 0.25, 2.0, 0.44, 0.06, 0.9, DARK), wb(f, 0, 0.25, 2.0, 0.44, 0.06, 1.7, DARK));
    f.out.beam.push(wb(f, 0, 0.06, 2.0, 0.1, 2.2, 0, scaleRgb(DARK, 0.8))); // its back, against the wall: relief
    for (const [row, y] of [[0, 0.96], [1, 1.76]]) for (let k = 0; k < 5; k++) { // jars, lit by what floats in them
      const s = -0.76 + k * 0.38;
      f.out.glow.push(round(f, s, 0.26, 0.13, 0.36, y, scaleRgb(FLUID[(k + row) % FLUID.length], 0.8), 8));
    }
  },
  slab(f) {
    const h = 2.8 + f.rng() * 1.2;
    const p = f.wall.at(f.s, 0.5);
    const g = new THREE.BoxGeometry(1.4, h, 0.5).rotateZ((f.rng() - 0.5) * 0.4); // a block of the wrong city, leaned at an angle no mason gave it
    if (!f.wall.alongX) g.rotateY(Math.PI / 2);
    f.out.wall.push(tint(g.translate(p.x, f.y + h / 2 - 0.1, p.z), scaleRgb(f.c, 0.78)));
    for (let k = 0; k < 3; k++) f.out.trim.push(wb(f, -0.2 + k * 0.2, 0.84, 0.1, 0.04, 0.5, 0.6 + k * 0.5, scaleRgb(f.c, 0.5)));
  },
  cylinders(f) {
    f.out.wall.push(wb(f, 0, 0.3, 2.2, 0.6, 0.08, 0.9, IRON), wb(f, 0, 0.3, 2.2, 0.6, 0.08, 1.9, IRON));
    f.out.trim.push(wb(f, 0, 0.04, 2.2, 0.08, 2.4, 0, scaleRgb(IRON, 0.8))); // its back, against the wall: relief
    for (const y of [0.98, 1.98]) for (let k = 0; k < 4; k++) { // the bright metal cans of the brains, each with its three sockets
      const s = -0.75 + k * 0.5;
      f.out.wall.push(round(f, s, 0.32, 0.16, 0.44, y, [0.66, 0.68, 0.7], 10));
      f.out.shine.push(tint(wb(f, s, 0.5, 0.06, 0.03, 0.06, y + 0.28, [0, 0, 0]), [0.55, 0.72, 0.85]));
    }
  },
  chains(f) {
    for (const s of [-0.7, 0.2, 0.9]) {
      const low = 1.0 + f.rng() * 1.0;
      for (let y = 3.6; y > low; y -= 0.16) f.out.trim.push(wb(f, s, 0.1, (Math.round(y / 0.16) % 2 ? 0.1 : 0.04), 0.06, 0.14, y - 0.14, IRON)); // its links, turned in turn
      f.out.wall.push(wb(f, s, 0.12, 0.26, 0.1, 0.1, low - 0.12, scaleRgb(IRON, 1.2))); // and a shackle at its end
    }
    f.out.trim.push(wb(f, 0.1, 0.06, 2.0, 0.12, 0.14, 3.6, scaleRgb(IRON, 0.9))); // the bar they hang from, against the wall: relief
  },
  roots(f) {
    for (let k = 0; k < 6; k++) { // roots come through the wall from above, and down it to the floor
      const s = (f.rng() - 0.5) * 2;
      let [y, at] = [5.4, s];
      for (let j = 0; j < 4; j++) {
        const [ny, nat] = [y - 0.9 - f.rng() * 0.6, at + (f.rng() - 0.5) * 0.6];
        f.out.beam.push(strand(f, at, y, nat, ny, 0.1 + j * 0.03, 0.09 - j * 0.015, scaleRgb(ROOT, 0.9 + f.rng() * 0.3)));
        [y, at] = [ny, nat];
        if (y < 0.6) break;
      }
    }
  },
  bust(f) {
    const pale = scaleRgb(f.c, 1.12);
    f.out.wall.push(wb(f, 0, 0.5, 0.55, 0.55, 1.0, 0, scaleRgb(f.c, 0.9)), wb(f, 0, 0.5, 0.7, 0.7, 0.25, 1.0, pale)); // (its plinth deep enough that the pedestal's top in it is no fight)
    f.out.wall.push(wb(f, 0, 0.5, 0.5, 0.3, 0.32, 1.25, pale), blob(f, 0, 0.5, 0.2, 1.78, pale, 1.25)); // the shoulders and the head
  },
};
