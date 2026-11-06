/**
 * What is built on a boss hall's walls (round 108; data/hallLore.ts says what, and on which walls): tall windows of stained glass,
 * niches with what they keep, a steeple's boarded louvres, mirrors in gilt, curtains, frescoes, sea charts, pinned papers, leaning
 * braces, rat-holes, and any of the walls' furniture (dungeonFurniture.ts, loreItems.ts); and the piece that closes the far wall: a
 * throne, a cold hearth, an arch. Each stands at a slot along its wall between the hall's buttresses, and a slot is let go where a
 * doorway, a torch or a piece of the hall's set is. In an open hall (a ruin), nothing rises over the broken walls. Render only.
 */

import * as THREE from 'three';
import { createRng, type Rng } from '../core/rng';
import type { FarPiece, HallLore, WallPut, Walls } from '../data/hallLore';
import type { WallItem } from '../data/dungeonLooks';
import { DUNGEON } from '../data/tuning';
import type { DungeonLayout, RoomLayout } from '../world/dungeonKit';
import { BONE, blob, DARK, IRON, place, round, wb, type Frame, type Out, type Wall } from './dungeonFurniture';
import { scaleRgb, type Rgb } from './palette';
import { doorsOn, slab, stroke, wallOf, type Side } from './roomWalls';

/** The extra groups a hall's walls draw into, beside a furniture's. */
export interface HallOut extends Out {
  cloth: THREE.BufferGeometry[];
}

type Spot = { x: number; z: number; r: number };
type Deco = Exclude<WallPut['what'], WallItem>;
type Ctx = { w: Wall; y: number; s: number; c: Rgb; glow: Rgb; put: WallPut; out: HallOut; rng: Rng; open: boolean };

const GILT: Rgb = [0.72, 0.56, 0.24];
const PAPER: Rgb = [0.84, 0.8, 0.68];
const ON: Record<Walls, readonly Side[]> = { sides: ['u+', 'u-'], far: ['v+'], entry: ['v-'], all: ['u+', 'u-', 'v+', 'v-'] };

/** A window: a pointed frame of stone, panes of coloured glass in their leads, a sill. */
function lancet({ w, y, s, c, glow, put, out }: Ctx): void {
  const [lo, hi, half] = [2.5, 5.0, 0.75];
  const [g1, g2] = [put.colour ?? glow, scaleRgb(put.colour ?? glow, 0.55)];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
    const pane = (row + col) % 2 ? g1 : g2;
    out.shine.push(slab(w, y, s - half * (2 / 3) + col * half * (2 / 3), 0.17, half * (2 / 3) - 0.04, 0.05, (hi - lo) / 4 - 0.04, lo + row * ((hi - lo) / 4), pane));
  }
  for (let k = 0; k < 3; k++) out.shine.push(slab(w, y, s, 0.17, half * 2 * (1 - k / 3) - 0.1, 0.05, 0.22, hi + k * 0.24, k % 2 ? g2 : g1)); // the pointed head, stepped in
  const frame = scaleRgb(c, 0.82);
  out.trim.push(slab(w, y, s - half - 0.12, 0.14, 0.24, 0.28, hi - lo + 0.1, lo - 0.05, frame), slab(w, y, s + half + 0.12, 0.14, 0.24, 0.28, hi - lo + 0.1, lo - 0.05, frame));
  out.trim.push(stroke(w, y, s - half - 0.12, hi + 0.05, s, hi + 0.85, 0.14, 0.22, 0.28, frame), stroke(w, y, s + half + 0.12, hi + 0.05, s, hi + 0.85, 0.14, 0.22, 0.28, frame));
  out.trim.push(slab(w, y, s, 0.22, half * 2 + 0.5, 0.36, 0.14, lo - 0.16, scaleRgb(c, 0.9))); // the sill
  for (const k of [-1, 1]) out.trim.push(slab(w, y, s + k * half * (1 / 3), 0.21, 0.04, 0.03, hi - lo, lo, [0.08, 0.08, 0.09])); // the leads
  for (let row = 1; row < 4; row++) out.trim.push(slab(w, y, s, 0.21, half * 2, 0.03, 0.04, lo + row * ((hi - lo) / 4) - 0.02, [0.08, 0.08, 0.09]));
}

/** A niche: a dark recess framed in stone, a round head, a sill and what it keeps. */
function niche({ w, y, s, c, glow, put, out }: Ctx): void {
  const [lo, hi, half] = [1.1, 2.9, 0.6];
  const frame = scaleRgb(c, 0.85);
  out.trim.push(slab(w, y, s, 0.03, half * 2, 0.06, hi - lo + 0.3, lo, scaleRgb(c, 0.3)));
  out.trim.push(slab(w, y, s - half - 0.1, 0.1, 0.2, 0.2, hi - lo, lo, frame), slab(w, y, s + half + 0.1, 0.1, 0.2, 0.2, hi - lo, lo, frame));
  for (let k = 0; k < 4; k++) { // the round head, in four voussoirs
    const [a0, a1] = [Math.PI - (k * Math.PI) / 4, Math.PI - ((k + 1) * Math.PI) / 4];
    out.trim.push(stroke(w, y, s + Math.cos(a0) * (half + 0.1), hi + Math.sin(a0) * (half + 0.1), s + Math.cos(a1) * (half + 0.1), hi + Math.sin(a1) * (half + 0.1), 0.1, 0.2, 0.2, frame));
  }
  out.trim.push(slab(w, y, s, 0.2, half * 2 + 0.5, 0.4, 0.12, lo - 0.12, frame));
  const f: Frame = { wall: w, s, y, c, rng: () => 0.5, out };
  switch (put.holds) {
    case 'skull':
      out.wall.push(blob(f, 0, 0.25, 0.16, lo + 0.17, BONE, 1.05), blob(f, -0.32, 0.22, 0.12, lo + 0.1, BONE, 0.9), blob(f, 0.3, 0.22, 0.12, lo + 0.1, BONE, 0.9));
      break;
    case 'urn':
      out.wall.push(round(f, 0, 0.25, 0.22, 0.5, lo, scaleRgb(c, 0.7), 8, 0.14), round(f, 0, 0.25, 0.16, 0.08, lo + 0.5, scaleRgb(c, 0.6), 8));
      break;
    case 'idol':
      out.wall.push(blob(f, 0, 0.25, 0.3, lo + 0.25, scaleRgb(c, 0.55), 0.85));
      out.shine.push(blob(f, -0.1, 0.5, 0.04, lo + 0.38, glow, 1), blob(f, 0.1, 0.5, 0.04, lo + 0.38, glow, 1)); // its eyes, lit on its face
      break;
    case 'bust':
      out.wall.push(wb(f, 0, 0.25, 0.4, 0.24, 0.3, lo, scaleRgb(c, 1.1)), blob(f, 0, 0.25, 0.17, lo + 0.48, scaleRgb(c, 1.15), 1.25));
      break;
    case 'jar':
      out.glow.push(round(f, 0, 0.25, 0.17, 0.5, lo, scaleRgb(glow, 0.7), 8)); // lit by what floats in it
      break;
    case 'candle':
      out.wall.push(round(f, 0, 0.25, 0.06, 0.3, lo, [0.86, 0.82, 0.7], 6));
      out.glow.push(blob(f, 0, 0.25, 0.04, lo + 0.36, [0.95, 0.75, 0.4], 1.5));
      break;
  }
}

const DECO: Record<Deco, (x: Ctx) => void> = {
  lancet: (x) => (x.open ? niche({ ...x, put: { ...x.put, holds: 'candle' } }) : lancet(x)),
  niche,
  louvres({ w, y, s, out }) { // the steeple's louvres, boarded over against the light
    for (let k = 0; k < 9; k++) out.beam.push(stroke(w, y, s - 1.1, 2.6 + k * 0.3, s + 1.1, 2.6 + k * 0.3, 0.2, 0.26, 0.05, scaleRgb(DARK, 0.9)));
    for (const k of [-0.7, 0.6]) out.beam.push(stroke(w, y, s + k, 2.4, s + k + 0.1, 5.4, 0.3, 0.2, 0.05, scaleRgb(DARK, 1.2)));
    out.beam.push(stroke(w, y, s - 1.1, 2.6, s + 1.1, 5.2, 0.34, 0.22, 0.05, scaleRgb(DARK, 1.1)));
  },
  mirror({ w, y, s, out }) {
    out.shine.push(slab(w, y, s, 0.1, 1.3, 0.04, 2.6, 1.3, [0.26, 0.29, 0.34]));
    for (const k of [-1, 1]) out.cloth.push(slab(w, y, s + k * 0.74, 0.1, 0.18, 0.12, 3.0, 1.1, GILT));
    out.cloth.push(slab(w, y, s, 0.1, 1.66, 0.12, 0.2, 1.1, GILT), slab(w, y, s, 0.1, 1.66, 0.12, 0.26, 3.9, GILT), slab(w, y, s, 0.12, 0.5, 0.14, 0.3, 4.12, GILT));
  },
  drapes({ w, y, s, glow, put, out, open }) {
    const top = open ? 2.6 : 5.6;
    const cloth = put.colour ?? scaleRgb(glow, 0.5);
    for (let k = 0; k < 9; k++) out.cloth.push(slab(w, y, s - 1.2 + k * 0.3, k % 2 ? 0.2 : 0.12, 0.32, 0.1, top - 0.1, 0.1, scaleRgb(cloth, k % 2 ? 1 : 0.72)));
    out.wall.push(slab(w, y, s, 0.25, 2.8, 0.08, 0.08, top, IRON));
    for (const k of [-1, 1]) out.cloth.push(slab(w, y, s + k * 0.9, 0.3, 0.12, 0.08, 0.16, 1.3, GILT)); // their tie-backs
  },
  fresco({ w, y, s, c, rng, out }) { // a painted panel of Leng's history, low on the wall
    const [lo, hi] = [0.7, 2.4];
    out.trim.push(slab(w, y, s, 0.03, 3, 0.05, hi - lo, lo, [0.46, 0.38, 0.26]), slab(w, y, s, 0.05, 3.2, 0.05, 0.1, hi, scaleRgb(c, 0.5)), slab(w, y, s, 0.05, 3.2, 0.05, 0.1, lo - 0.1, scaleRgb(c, 0.5)));
    const hues: Rgb[] = [[0.62, 0.2, 0.14], [0.72, 0.6, 0.22], [0.2, 0.26, 0.42], [0.12, 0.1, 0.1]];
    for (let k = 0; k < 6; k++) { // its figures: priests, the almost-humans, a winged thing
      const [fs, fh] = [s - 1.25 + k * 0.5 + rng() * 0.1, 0.5 + rng() * 0.8];
      out.trim.push(slab(w, y, fs, 0.06, 0.22, 0.03, fh, lo + 0.15, hues[k % hues.length]), slab(w, y, fs, 0.06, 0.16, 0.03, 0.16, lo + 0.18 + fh, hues[(k + 1) % hues.length]));
    }
  },
  charts({ w, y, s, rng, out }) { // sea charts pinned up, their coasts inked
    for (const k of [-0.65, 0.65]) {
      const [cs, lo] = [s + k, 1.5 + rng() * 0.3];
      out.cloth.push(slab(w, y, cs, 0.03, 1.1, 0.03, 0.8, lo, PAPER));
      for (let j = 0; j < 4; j++) out.trim.push(stroke(w, y, cs - 0.4 + j * 0.2, lo + 0.2 + rng() * 0.4, cs - 0.2 + j * 0.2, lo + 0.2 + rng() * 0.4, 0.06, 0.03, 0.02, [0.24, 0.28, 0.36]));
    }
  },
  papers({ w, y, s, rng, out }) {
    for (let k = 0; k < 7; k++) {
      const [ps, py, tilt] = [s - 1.1 + rng() * 2.2, 1.2 + rng() * 1.8, (rng() - 0.5) * 0.4];
      out.cloth.push(stroke(w, y, ps - tilt * 0.2, py, ps + tilt * 0.2, py + 0.36, 0.03 + k * 0.004, 0.28, 0.02, scaleRgb(PAPER, 0.85 + rng() * 0.2)));
    }
  },
  slant({ w, y, s, out, open }) { // timbers braced against a wall that leans
    const top = open ? 2.4 : 4.6;
    out.beam.push(stroke(w, y, s - 1.0, 0, s + 0.9, top, 0.3, 0.24, 0.24, DARK), stroke(w, y, s + 1.0, 0, s + 0.1, top * 0.7, 0.28, 0.2, 0.2, scaleRgb(DARK, 0.85)));
  },
  ratholes({ w, y, s, c, rng, out }) {
    for (let k = 0; k < 3; k++) {
      const hs = s - 1.2 + rng() * 2.4;
      out.trim.push(slab(w, y, hs, 0.02, 0.32, 0.04, 0.22, 0, [0.03, 0.03, 0.03]));
      for (let j = 0; j < 3; j++) out.wall.push(blob({ wall: w, s: hs, y, c, rng, out }, (rng() - 0.5) * 0.6, 0.2 + rng() * 0.3, 0.05 + rng() * 0.05, 0.03, scaleRgb(c, 0.6), 0.6));
    }
  },
};

/** The piece that closes the far wall. */
function farPiece(kind: FarPiece, w: Wall, y: number, c: Rgb, glow: Rgb, out: HallOut): void {
  const f: Frame = { wall: w, s: 0, y, c, rng: () => 0.5, out };
  if (kind === 'throne') {
    const [body, edge] = [scaleRgb(c, 0.55), scaleRgb(glow, 0.9)];
    out.wall.push(wb(f, 0, 0.55, 3.6, 1.1, 0.3, 0, scaleRgb(c, 0.75)), wb(f, 0, 0.45, 2.6, 0.9, 0.3, 0.3, scaleRgb(c, 0.8))); // its steps
    out.wall.push(wb(f, 0, 0.4, 1.6, 0.8, 0.6, 0.6, body), wb(f, 0, 0.12, 1.8, 0.24, 3.6, 0.6, body)); // the seat and the tall back
    for (const k of [-0.85, 0.85]) out.wall.push(wb(f, k, 0.4, 0.2, 0.8, 0.95, 0.6, body));
    out.trim.push(wb(f, 0, 0.26, 1.9, 0.06, 0.16, 4.1, edge), wb(f, -0.95, 0.26, 0.08, 0.06, 3.5, 0.6, edge), wb(f, 0.95, 0.26, 0.08, 0.06, 3.5, 0.6, edge));
    out.wall.push(blob(f, 0, 0.2, 0.32, 4.5, edge, 1.2));
  } else if (kind === 'hearth') { // a great cold fireplace and its chimney breast
    out.wall.push(wb(f, 0, 0.45, 3.4, 0.9, 5.9, 0, scaleRgb(c, 0.85)));
    out.trim.push(wb(f, 0, 0.93, 2.2, 0.06, 1.7, 0.1, [0.05, 0.04, 0.04]), wb(f, 0, 1.0, 3.8, 0.24, 0.18, 1.9, scaleRgb(c, 0.7)));
    for (let k = 0; k < 4; k++) out.wall.push(blob(f, -0.6 + k * 0.4, 0.95, 0.1, 0.12, [0.12, 0.1, 0.09], 0.6)); // ash and the black of old fires
  } else { // an arch standing free of the wall, its edge alight: the way out of the world
    const stone = scaleRgb(c, 0.6);
    for (const k of [-2.2, 2.2]) out.wall.push(wb(f, k, 0.8, 0.6, 0.6, 4.4, 0, stone));
    for (let k = 0; k < 6; k++) {
      const [a0, a1] = [Math.PI - (k * Math.PI) / 6, Math.PI - ((k + 1) * Math.PI) / 6];
      out.wall.push(stroke(w, y, Math.cos(a0) * 2.2, 4.4 + Math.sin(a0) * 2.2, Math.cos(a1) * 2.2, 4.4 + Math.sin(a1) * 2.2, 0.8, 0.6, 0.6, stone));
      out.shine.push(stroke(w, y, Math.cos(a0) * 1.85, 4.4 + Math.sin(a0) * 1.85, Math.cos(a1) * 1.85, 4.4 + Math.sin(a1) * 1.85, 0.8, 0.08, 0.66, glow));
    }
    for (const k of [-1.85, 1.85]) out.shine.push(stroke(w, y, k, 0.1, k, 4.4, 0.8, 0.08, 0.66, glow));
  }
}

/** The slots along a wall, metres from its middle: between a great hall's buttresses (at ±8 and ±16), or every eight metres. */
const slots = (r: RoomLayout): number[] => (r.size === 3 ? [-20, -12, -4, 4, 12, 20] : [-4, 4]);

/** What a boss hall's lore builds on its walls, into `out`; `avoid` are the torches and the set's pieces, which keep their places. */
export function hallWalls(d: DungeonLayout, r: RoomLayout, lore: HallLore, c: Rgb, open: boolean, avoid: readonly Spot[], out: HallOut): void {
  const inner = r.half - DUNGEON.wall / 2;
  const free = (w: Wall, side: Side, s: number, half: number): boolean => {
    if (doorsOn(d, r, side).some((o) => Math.abs(o - s) < DUNGEON.door / 2 + half + 0.4)) return false;
    const p = w.at(s, 0.5);
    return avoid.every((a) => Math.hypot(a.x - p.x, a.z - p.z) > a.r + half + 0.3);
  };
  const taken = new Set<string>();
  for (const put of lore.walls) {
    for (const side of ON[put.on]) {
      const w = wallOf(r, side, inner);
      slots(r).forEach((s, k) => {
        const key = `${side}${s}`;
        if (k % (put.every ?? 1) !== 0 || taken.has(key) || !free(w, side, s, 1.3)) return;
        taken.add(key);
        const x: Ctx = { w, y: r.level, s, c, glow: lore.glow, put, out, rng: createRng(Math.round((s + 40) * 977 + k * 31 + side.charCodeAt(1)) >>> 0), open };
        if (put.what in DECO) DECO[put.what as Deco](x);
        else place(put.what as WallItem, { wall: w, s, y: r.level, c, rng: x.rng, out });
      });
    }
  }
  if (lore.far) {
    const w = wallOf(r, 'v+', inner);
    if (free(w, 'v+', 0, 2.2)) farPiece(lore.far, w, r.level, c, lore.glow, out);
  }
}
