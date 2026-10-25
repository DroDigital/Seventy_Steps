/**
 * The built furniture of a reading room (round 79, the University Library, the Archives, Zann's garret): cases and low cases of books, a shelf
 * on a wall, a heap on the floor. Built, not baked: the shelf pack the brief names forbids its assets being redistributed, and the game's
 * own models are its data. A case is a frame of boards and rows of spines of every height and colour, some gaps; the set's `tint`
 * leans its wood (dark for the restricted room, damp for the bindery). In the piece's own frame, feet at the origin, facing +z. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng, type Rng } from '../core/rng';
import type { Prop } from '../world/props';
import { box } from './meshKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const WOOD: Rgb = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.35), 1.6);
const SPINES: readonly Rgb[] = [[0.42, 0.16, 0.14], [0.2, 0.24, 0.34], [0.3, 0.34, 0.2], [0.48, 0.38, 0.22], [0.26, 0.2, 0.3], [0.5, 0.46, 0.4]];
const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts);
const woodOf = (p: Prop): Rgb => (p.set?.tint ? mixRgb(WOOD, p.set.tint, 0.5) : WOOD);

/** A row of spines along a shelf from `x0` to `x1`, standing on `y`, at most `room` high and `depth` deep, flush toward the front (+z). */
function spines(parts: THREE.BufferGeometry[], rng: Rng, x0: number, x1: number, y: number, room: number, depth: number, front: number): void {
  for (let x = x0; x < x1 - 0.1;) {
    if (rng() < 0.08) { x += 0.1 + rng() * 0.15; continue; } // a gap where a book was taken
    const [bw, bh, bd] = [0.06 + rng() * 0.06, room * (0.6 + 0.35 * rng()), depth * (0.6 + 0.3 * rng())];
    parts.push(box(bw, bh, bd, x + bw / 2, y + bh / 2, front - bd / 2, scaleRgb(SPINES[Math.floor(rng() * SPINES.length)]!, 0.75 + 0.5 * rng())));
    x += bw + 0.005;
  }
}

/** A case: two sides, a back, a top and a plinth, and `rows` shelves, each filled with books. */
function cased(p: Prop, rows: number): Piece[] {
  const [rng, c, plinth] = [createRng(p.seed), woodOf(p), 0.12];
  const [w2, d2] = [p.w * 2, p.d * 2];
  const frame: THREE.BufferGeometry[] = [
    box(0.05, p.h, d2, -p.w + 0.025, p.h / 2, 0, c), box(0.05, p.h, d2, p.w - 0.025, p.h / 2, 0, c),
    box(w2, p.h, 0.03, 0, p.h / 2, -p.d + 0.015, scaleRgb(c, 0.8)),
    box(w2, 0.05, d2, 0, p.h - 0.025, 0, c), box(w2, plinth, d2, 0, plinth / 2, 0, scaleRgb(c, 0.9)),
  ];
  const books: THREE.BufferGeometry[] = [];
  const gap = (p.h - plinth - 0.05) / rows;
  for (let r = 0; r < rows; r++) {
    const y = plinth + r * gap;
    frame.push(box(w2 - 0.1, 0.03, d2 - 0.04, 0, y + 0.015, 0.01, c));
    spines(books, rng, -p.w + 0.07, p.w - 0.07, y + 0.03, gap - 0.07, d2 - 0.06, p.d - 0.03);
  }
  return [{ mat: 'wood', geo: merged(frame) }, { mat: 'cloth', geo: merged(books) }];
}

/** A tall case of books, five shelves. */
export const bookcase = (p: Prop): Piece[] => cased(p, Math.max(3, Math.round(p.h / 0.5)));
/** A low case, two or three shelves. */
export const bookcaseLow = (p: Prop): Piece[] => cased(p, Math.max(2, Math.round(p.h / 0.4)));

/** A shelf on a wall: a plank on two brackets, a row of books on it. */
export function bookshelf(p: Prop): Piece[] {
  const [rng, c] = [createRng(p.seed), woodOf(p)];
  const frame = [box(p.w * 2, 0.04, p.d * 2, 0, 0.02, 0, c), ...[-1, 1].map((e) => box(0.04, 0.12, p.d * 1.6, e * (p.w - 0.15), -0.06, 0, scaleRgb(c, 0.8)))];
  const books: THREE.BufferGeometry[] = [];
  spines(books, rng, -p.w + 0.06, p.w - 0.06, 0.04, p.h - 0.06, p.d * 2 - 0.02, p.d - 0.01);
  return [{ mat: 'wood', geo: merged(frame) }, { mat: 'cloth', geo: merged(books) }];
}

/** A heap of books on the floor, each turned its own way. */
export function bookpile(p: Prop): Piece[] {
  const [rng, n] = [createRng(p.seed), 5 + (p.seed % 3)];
  const books: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const [bw, bh, bd] = [0.22 + rng() * 0.12, 0.04 + rng() * 0.03, 0.15 + rng() * 0.1];
    const layer = Math.floor(i / 2);
    books.push(box(bw, bh, bd, 0, 0, 0, scaleRgb(SPINES[Math.floor(rng() * SPINES.length)]!, 0.7 + 0.4 * rng())).rotateY(rng() * Math.PI).translate((rng() - 0.5) * p.w, layer * 0.07 + bh / 2, (rng() - 0.5) * p.d));
  }
  return [{ mat: 'cloth', geo: merged(books) }];
}
