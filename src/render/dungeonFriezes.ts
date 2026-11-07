/**
 * The frieze carved round a roofed hall under its cornice (round 108; data/dungeonLooks.ts says which): dentils under the library's
 * coffers, a Greek key in the sculptor's tower, waves in the drowned city and the captain's house, stars in the Starry Wisdom church,
 * skulls in the catacombs, witch-marks and runes scratched in the Witch House and the Great Race's curving script in its archives,
 * the Old Ones' five-armed stars, a zigzag in Red Hook, and in Akeley's farmhouse a wainscot of boards instead. Relief on the wall's
 * face (drawn nearer than it), its band 4.2 to 4.9 m up, over every stretch of wall but its doorways. Render only.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { Frieze } from '../data/dungeonLooks';
import { DUNGEON } from '../data/tuning';
import type { DungeonLayout, RoomLayout } from '../world/dungeonKit';
import type { Out, Wall } from './dungeonFurniture';
import { scaleRgb, type Rgb } from './palette';
import { doorsOn, SIDES, slab, stroke, wallOf } from './roomWalls';

const BAND = { low: 4.2, high: 4.9 } as const;
const BONE: Rgb = [0.8, 0.76, 0.66];
const WOOD: Rgb = [0.4, 0.33, 0.27];

type Mark = (w: Wall, y: number, s: number, c: Rgb, out: Out, rng: Rng) => void;

/** One repeat of each motif about `s`, and how far apart they stand. */
const MOTIFS: Record<Exclude<Frieze, 'none' | 'boards'>, { pitch: number; mark: Mark }> = {
  dentils: { pitch: 0.42, mark: (w, y, s, c, out) => void out.trim.push(slab(w, y, s, 0.07, 0.2, 0.14, 0.24, BAND.low + 0.1, scaleRgb(c, 0.9))) },
  meander: {
    pitch: 1.2,
    mark: (w, y, s, c, out) => {
      const [a, b, k] = [BAND.low + 0.08, BAND.high - 0.08, scaleRgb(c, 0.88)];
      const seg = (s0: number, y0: number, s1: number, y1: number): number => out.trim.push(stroke(w, y, s + s0, y0, s + s1, y1, 0.06, 0.07, 0.1, k));
      seg(-0.6, a, 0.45, a); seg(0.45, a, 0.45, b); seg(0.45, b, -0.35, b); seg(-0.35, b, -0.35, a + 0.24); seg(-0.35, a + 0.24, 0.2, a + 0.24); seg(0.2, a + 0.24, 0.2, b - 0.22);
    },
  },
  waves: {
    pitch: 0.9,
    mark: (w, y, s, c, out) => {
      const mid = (BAND.low + BAND.high) / 2;
      for (let k = 0; k < 6; k++) { // a running scroll: a crest that curls back on itself
        const [t0, t1] = [(k / 6) * Math.PI * 1.6, ((k + 1) / 6) * Math.PI * 1.6];
        const at = (t: number): [number, number] => [s - 0.4 + t * 0.2 + Math.sin(t) * 0.12, mid - Math.cos(t) * 0.2];
        const [[s0, y0], [s1, y1]] = [at(t0), at(t1)];
        out.trim.push(stroke(w, y, s0, y0, s1, y1, 0.06, 0.07, 0.1, scaleRgb(c, 0.86)));
      }
    },
  },
  stars: {
    pitch: 1.5,
    mark: (w, y, s, c, out) => {
      const mid = (BAND.low + BAND.high) / 2;
      for (let k = 0; k < 5; k++) { // a five-pointed star, its strokes from point to point
        const [a, b] = [(k * 4 * Math.PI) / 5, ((k + 1) * 4 * Math.PI) / 5];
        out.trim.push(stroke(w, y, s + Math.sin(a) * 0.3, mid + Math.cos(a) * 0.3, s + Math.sin(b) * 0.3, mid + Math.cos(b) * 0.3, 0.06, 0.05, 0.1, scaleRgb(c, 1.15)));
      }
    },
  },
  eyes: {
    pitch: 1.4,
    mark: (w, y, s, c, out) => {
      const mid = (BAND.low + BAND.high) / 2;
      for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) {
        const [t0, t1] = [-1 + k / 2, -1 + (k + 1) / 2];
        out.trim.push(stroke(w, y, s + t0 * 0.4, mid + sg * 0.18 * (1 - t0 * t0), s + t1 * 0.4, mid + sg * 0.18 * (1 - t1 * t1), 0.06, 0.05, 0.1, scaleRgb(c, 0.8)));
      }
      out.trim.push(slab(w, y, s, 0.1, 0.14, 0.12, 0.14, mid - 0.07, scaleRgb(c, 0.45)));
    },
  },
  skulls: {
    pitch: 1.0,
    mark: (w, y, s, _c, out) => {
      const p = w.at(s, 0.12);
      out.trim.push(tintBlob(p.x, y + BAND.low + 0.38, p.z, 0.17, BONE));
      for (const e of [-0.06, 0.06]) out.trim.push(slab(w, y, s + e, 0.26, 0.06, 0.04, 0.05, BAND.low + 0.36, [0.1, 0.09, 0.08]));
      out.trim.push(stroke(w, y, s - 0.3, BAND.low + 0.1, s + 0.3, BAND.low + 0.22, 0.05, 0.05, 0.08, BONE), stroke(w, y, s - 0.3, BAND.low + 0.22, s + 0.3, BAND.low + 0.1, 0.05, 0.05, 0.08, BONE)); // crossed bones
    },
  },
  tentacles: {
    pitch: 0.8,
    mark: (w, y, s, c, out, rng) => {
      let [ps, py]: [number, number] = [s, BAND.high];
      for (let k = 1; k <= 5; k++) {
        const [ns, ny] = [s + Math.sin(k * 1.4 + rng()) * 0.14, BAND.high - (k / 5) * (BAND.high - BAND.low)];
        out.trim.push(stroke(w, y, ps, py, ns, ny, 0.06, 0.09 - k * 0.012, 0.1, scaleRgb(c, 0.82)));
        [ps, py] = [ns, ny];
      }
    },
  },
  runes: {
    pitch: 0.75,
    mark: (w, y, s, c, out, rng) => {
      for (let k = 0; k < 3; k++) { // strokes as a hand scratched them: no two marks alike
        const [s0, y0] = [s - 0.25 + rng() * 0.5, BAND.low + 0.1 + rng() * 0.5];
        const [a, l] = [rng() * Math.PI, 0.16 + rng() * 0.2];
        out.trim.push(stroke(w, y, s0, y0, s0 + Math.cos(a) * l, Math.min(BAND.high, y0 + Math.sin(a) * l), 0.05, 0.04, 0.08, scaleRgb(c, 0.55)));
      }
    },
  },
  fivefold: {
    pitch: 1.3,
    mark: (w, y, s, c, out) => {
      const mid = (BAND.low + BAND.high) / 2;
      for (let k = 0; k < 5; k++) {
        const a = (k * 2 * Math.PI) / 5;
        out.trim.push(stroke(w, y, s, mid, s + Math.sin(a) * 0.32, mid + Math.cos(a) * 0.32, 0.06, 0.08, 0.1, scaleRgb(c, 0.86)));
      }
    },
  },
  zigzag: {
    pitch: 0.6,
    mark: (w, y, s, c, out) => {
      out.trim.push(stroke(w, y, s - 0.3, BAND.low + 0.12, s, BAND.high - 0.12, 0.06, 0.08, 0.1, scaleRgb(c, 0.8)), stroke(w, y, s, BAND.high - 0.12, s + 0.3, BAND.low + 0.12, 0.06, 0.08, 0.1, scaleRgb(c, 0.8)));
    },
  },
};

const tintBlob = (x: number, y: number, z: number, r: number, c: Rgb): THREE.BufferGeometry => {
  const g = new THREE.IcosahedronGeometry(r, 0).scale(1, 1.1, 0.8).translate(x, y, z);
  const n = g.getAttribute('position').count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set(c, i * 3);
  return g.setAttribute('color', new THREE.BufferAttribute(col, 3));
};

/** The free stretches of a wall: from one end to the other, less a doorway's breadth and a pace either side of each. */
function stretches(d: DungeonLayout, r: RoomLayout, side: (typeof SIDES)[number], inner: number): [number, number][] {
  const doors = doorsOn(d, r, side).sort((a, b) => a - b);
  const out: [number, number][] = [];
  let from = -inner + 0.3;
  for (const s of doors) {
    if (s - DUNGEON.door / 2 - 0.4 > from) out.push([from, s - DUNGEON.door / 2 - 0.4]);
    from = s + DUNGEON.door / 2 + 0.4;
  }
  if (inner - 0.3 > from) out.push([from, inner - 0.3]);
  return out;
}

/** A hall's frieze round its four walls (or its wainscot), into `out`. */
export function frieze(kind: Frieze, d: DungeonLayout, r: RoomLayout, c: Rgb, out: Out, rng: Rng): void {
  if (kind === 'none') return;
  const inner = r.half - DUNGEON.wall / 2;
  for (const side of SIDES) {
    const w = wallOf(r, side, inner);
    for (const [a, b] of stretches(d, r, side, inner)) {
      if (kind === 'boards') { // a wainscot: a rail and a skirting, boards between
        out.beam.push(slab(w, r.level, (a + b) / 2, 0.05, b - a, 0.1, 0.1, 1.1, scaleRgb(WOOD, 1.1)), slab(w, r.level, (a + b) / 2, 0.04, b - a, 0.08, 0.2, 0, scaleRgb(WOOD, 0.8)));
        for (let s = a + 0.35; s < b - 0.2; s += 0.7) out.beam.push(slab(w, r.level, s, 0.03, 0.62, 0.06, 0.9, 0.2, scaleRgb(WOOD, 0.9 + rng() * 0.2)));
        continue;
      }
      const m = MOTIFS[kind];
      out.trim.push(slab(w, r.level, (a + b) / 2, 0.04, b - a, 0.08, 0.08, BAND.low - 0.12, scaleRgb(c, 0.85)), slab(w, r.level, (a + b) / 2, 0.04, b - a, 0.08, 0.08, BAND.high + 0.04, scaleRgb(c, 0.85))); // the band's fillets
      const n = Math.floor((b - a - 0.4) / m.pitch);
      const start = (a + b) / 2 - ((n - 1) * m.pitch) / 2;
      for (let k = 0; k < n; k++) m.mark(w, r.level, start + k * m.pitch, c, out, rng);
    }
  }
}
