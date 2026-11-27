/**
 * How a room's walls are dressed (2026-11-27, asked: "enhance procedural generation of dungeon walls and structures to ensure greater visual
 * diversity, even when constructed from the same material or within the same region"). Every wall of a kit had the one trim: a plinth, a
 * cornice and a pilaster every four metres (masonry), or posts (timber), or nothing. Now each room takes a motif of its own, drawn by its
 * dungeon and its place in it, so two rooms of one stone side by side are built differently: pilasters, a blind arcade, string courses,
 * raised panels, a wainscot, deep buttresses, niches, close ribs or a wall half fallen; posts, a wainscot of boards, braced or banded
 * timber; and on the bare kits a damp line, patched stone or shoring. And each room's floor, roof and pillars are a shade of their own (`roomShade`; not its walls, which meet another room's flush at a corner). All of it is
 * relief laid on the wall's two faces (the wall and its collider are unchanged). Render only (geometry by the slab builders it is given).
 */

import type * as THREE from 'three';
import { hash2 } from '../core/rng';
import type { Rgb } from './palette';

export type WallMotif =
  | 'pilasters' | 'arcade' | 'courses' | 'panels' | 'dado' | 'buttress' | 'niches' | 'ribs' | 'ruined' // masonry
  | 'posts' | 'wainscot' | 'braced' | 'banded' // timber
  | 'bare' | 'damp' | 'patched' | 'shored'; // no trim

const MOTIFS: Readonly<Record<'masonry' | 'timber' | 'none', readonly WallMotif[]>> = {
  masonry: ['pilasters', 'arcade', 'courses', 'panels', 'dado', 'buttress', 'niches', 'ribs', 'ruined'],
  timber: ['posts', 'wainscot', 'braced', 'banded'],
  none: ['bare', 'damp', 'patched', 'shored'],
};

const seedOf = (id: string): number => [...id].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

/** The motif of room `room` of dungeon `id`, of a kit trimmed `trim`: by its dungeon and its place, a step along the list from the room before. */
export function wallMotifOf(id: string, room: number, trim: 'masonry' | 'timber' | 'none'): WallMotif {
  const list = MOTIFS[trim];
  const start = Math.floor(hash2(seedOf(id), 0, 41) * list.length);
  const step = 1 + Math.floor(hash2(seedOf(id), room, 43) * (list.length - 1)); // never the motif of the room before it in the list
  return list[(start + room * step) % list.length]!;
}

/** A room's own shade of its kit's stone: a little lighter or darker, warmer or cooler. */
export function roomShade(c: Rgb, id: string, room: number): Rgb {
  const k = 0.84 + 0.28 * hash2(seedOf(id), room, 47);
  const w = (hash2(seedOf(id), room, 53) - 0.5) * 0.12;
  return [Math.min(1, c[0] * k * (1 + w)), Math.min(1, c[1] * k), Math.min(1, c[2] * k * (1 - w))];
}

/** What a motif is laid with: slabs along the wall (`l` long, `t` through, `hh` high, its middle at `y`, `tt` along from the wall's middle, a tone of the trim's colour), and a recess's dark. */
export interface MotifKit {
  len: number;
  thick: number;
  h: number; // the wall's height that is dressed
  base: number; // its foot
  seed: number;
  slab: (l: number, t: number, hh: number, y: number, tt: number, tone: number) => THREE.BufferGeometry;
  tilt?: (l: number, t: number, hh: number, y: number, tt: number, tone: number, angle: number) => THREE.BufferGeometry; // a brace, leaned
}

/** The pieces of a motif along one wall (its plinth and cornice are the kit's, laid apart). */
export function motifPieces(m: WallMotif, k: MotifKit): THREE.BufferGeometry[] {
  const { len, thick: T, h, base: y0, seed, slab } = k;
  const out: THREE.BufferGeometry[] = [];
  const every = (gap: number, f: (t: number, i: number) => void): void => {
    const n = Math.max(1, Math.round(len / gap));
    for (let i = 1; i < n; i++) f(-len / 2 + (i * len) / n, i);
  };
  const rnd = (i: number, salt: number): number => hash2(seed, i, salt);
  switch (m) {
    case 'pilasters':
      every(4, (t) => out.push(slab(0.5, T + 0.3, h - 0.3, y0 + (h - 0.3) / 2, t, 0.92)));
      break;
    case 'arcade': // pilasters, a band over them, and the arches' heads stepped between
      every(4.6, (t) => out.push(slab(0.6, T + 0.34, h * 0.62, y0 + h * 0.31, t, 0.9)));
      out.push(slab(len, T + 0.3, 0.3, y0 + h * 0.62 + 0.15, 0, 0.86));
      every(2.3, (t, i) => i % 2 === 1 && out.push(slab(1.8, T + 0.22, 0.22, y0 + h * 0.62 - 0.11, t, 0.82), slab(1.1, T + 0.22, 0.2, y0 + h * 0.62 - 0.32, t, 0.82)));
      break;
    case 'courses': // two string courses, the lower a little deeper
      out.push(slab(len, T + 0.22, 0.18, y0 + 1.25, 0, 0.84), slab(len, T + 0.16, 0.14, y0 + h * 0.74, 0, 0.88));
      break;
    case 'panels': // a raised frame between thin pilasters
      every(3.6, (t) => out.push(slab(0.36, T + 0.24, h - 0.3, y0 + (h - 0.3) / 2, t, 0.92)));
      every(1.8, (t, i) => {
        if (i % 2 === 0) return;
        const [lo, hi] = [y0 + 0.8, y0 + Math.min(h - 0.5, 3)];
        out.push(slab(2.4, T + 0.14, 0.1, lo, t, 0.8), slab(2.4, T + 0.14, 0.1, hi, t, 0.8), slab(0.1, T + 0.14, hi - lo, (lo + hi) / 2, t - 1.15, 0.8), slab(0.1, T + 0.14, hi - lo, (lo + hi) / 2, t + 1.15, 0.8));
      });
      break;
    case 'dado': // a wainscot of darker stone to the hip, and a rail on it
      out.push(slab(len, T + 0.12, 1.1, y0 + 0.55, 0, 0.72), slab(len, T + 0.24, 0.12, y0 + 1.16, 0, 0.9));
      break;
    case 'buttress': // few, deep, stepped
      every(6, (t) => out.push(slab(0.9, T + 0.7, h * 0.45, y0 + h * 0.225, t, 0.88), slab(0.75, T + 0.42, h * 0.4, y0 + h * 0.65, t, 0.9)));
      break;
    case 'niches': // a framed niche, its back dark
      every(4.2, (t) => {
        const [lo, hi] = [y0 + 0.9, y0 + Math.min(h - 0.4, 2.8)];
        out.push(slab(1.1, T + 0.06, hi - lo, (lo + hi) / 2, t, 0.35), slab(0.18, T + 0.26, hi - lo + 0.2, (lo + hi) / 2, t - 0.62, 0.9), slab(0.18, T + 0.26, hi - lo + 0.2, (lo + hi) / 2, t + 0.62, 0.9), slab(1.44, T + 0.3, 0.2, hi + 0.1, t, 0.86), slab(1.3, T + 0.3, 0.12, lo - 0.06, t, 0.86));
      });
      break;
    case 'ribs':
      every(1.6, (t) => out.push(slab(0.16, T + 0.18, h - 0.3, y0 + (h - 0.3) / 2, t, 0.94)));
      break;
    case 'ruined': // pilasters broken off at their own heights, and cracks down the face
      every(4, (t, i) => {
        const hh = (h - 0.3) * (0.35 + 0.65 * rnd(i, 3));
        out.push(slab(0.5, T + 0.3, hh, y0 + hh / 2, t, 0.92));
      });
      every(2.7, (t, i) => rnd(i, 5) < 0.6 && out.push(slab(0.05, T + 0.04, h * (0.3 + 0.4 * rnd(i, 7)), y0 + h * (0.45 + 0.2 * rnd(i, 9)), t + 0.6, 0.3)));
      break;
    case 'posts':
      every(4, (t) => out.push(slab(0.3, T + 0.3, h - 0.3, y0 + (h - 0.3) / 2, t, 0.92)));
      break;
    case 'wainscot': // boards to the hip, a rail and a few posts
      every(0.55, (t) => out.push(slab(0.5, T + 0.08, 1.05, y0 + 0.53, t, rnd(Math.round(t * 10), 11) < 0.5 ? 0.86 : 0.94)));
      out.push(slab(len, T + 0.18, 0.1, y0 + 1.1, 0, 0.8));
      every(5, (t) => out.push(slab(0.26, T + 0.26, h - 0.3, y0 + (h - 0.3) / 2, t, 0.9)));
      break;
    case 'braced': // posts with a brace leaned between each pair
      every(3.4, (t, i) => {
        out.push(slab(0.3, T + 0.3, h - 0.3, y0 + (h - 0.3) / 2, t, 0.92));
        if (k.tilt && i % 2 === 1) out.push(k.tilt(2.4, T + 0.22, 0.16, y0 + h * 0.45, t + 1.7, 0.86, (i % 4 === 1 ? 1 : -1) * 0.75));
      });
      break;
    case 'banded': // posts and two rails across them
      every(3.2, (t) => out.push(slab(0.28, T + 0.3, h - 0.3, y0 + (h - 0.3) / 2, t, 0.92)));
      out.push(slab(len, T + 0.2, 0.16, y0 + 1.2, 0, 0.86), slab(len, T + 0.2, 0.16, y0 + h * 0.7, 0, 0.86));
      break;
    case 'bare':
      break;
    case 'damp': // the tide line of the damp, and runs of it down the face
      out.push(slab(len, T + 0.04, 0.9, y0 + 0.45, 0, 0.62));
      every(2.2, (t, i) => rnd(i, 13) < 0.5 && out.push(slab(0.3, T + 0.03, h * 0.5, y0 + h * 0.25 + 0.6, t, 0.7)));
      break;
    case 'patched': // stone of another shade set in where it fell
      every(2.6, (t, i) => {
        const [w, hh] = [0.8 + 1.2 * rnd(i, 17), 0.6 + 1 * rnd(i, 19)];
        out.push(slab(w, T + 0.05, hh, y0 + 0.4 + (h - 1.2) * rnd(i, 23), t, rnd(i, 29) < 0.5 ? 0.78 : 1.12));
      });
      break;
    case 'shored': // props of timber set against the wall, a beam over them
      every(3, (t) => out.push(slab(0.24, T + 0.34, h - 0.4, y0 + (h - 0.4) / 2, t, 0.6)));
      out.push(slab(len, T + 0.3, 0.22, y0 + h - 0.5, 0, 0.6));
      break;
  }
  return out;
}
