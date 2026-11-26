/**
 * Round 125, the cells of the leaf atlas (render/textureFoliage.ts), each a spray as the PS1 drew them: a cluster of oak or elm
 * leaves on its twig, a maple's spread hands, a birch's small leaves, bare twigs, a fir's flat spray, a spruce's bottle brush, pine
 * tufts, a cypress's scale-leaf fans, a fern's frond, a willow's strands, a beard of moss, thorny twigs, a clump of grass, reeds and
 * a cattail, the Black Wood's fleshy tendrils, and one cell all covered (for what is solid: a blob, a blade, a cap). Each is light
 * only, grey: the vertex colour gives its hue (its realm's October, its needles, its growth). A spray is held at its cell's foot,
 * a strand or a beard from its head. Pure; drawn once, from a fixed seed.
 */

import { createRng, type Rng } from '../core/rng';
import { blot, leaf, path, polar, stroke, type Canvas, type Shade } from './foliageRaster';

export const CELL = 32; // texels a side
type Draw = (c: Canvas, rng: Rng) => void;

/** A leaf's light: its own tone, darker toward its rim and along its midrib, paler toward its tip. */
const leafy = (tone: number): Shade => (u, v) => tone * (1 - 0.24 * u * u) * (Math.abs(u) < 0.14 ? 0.78 : 1) * (0.88 + 0.16 * v);
/** A stem's light: dark, a little paler along one flank (the light from above). */
const woody = (tone: number): Shade => (u) => tone * (1.06 - 0.16 * u);
/** A needle's or a blade's light, from its root (dark) to its tip (pale). */
const tipped = (root: number, tip: number): Shade => (_u, v) => root + (tip - root) * v;
const span = (rng: Rng, a: number, b: number): number => a + (b - a) * rng();

/** A twig from (x, y) along `angle` (from up, clockwise), `len` long: its end. */
function twig(c: Canvas, x: number, y: number, angle: number, len: number, w: number, tone = 0.4): [number, number] {
  const [ex, ey] = [x + Math.sin(angle) * len, y + Math.cos(angle) * len];
  stroke(c, x, y, ex, ey, w, w * 0.55, woody(tone));
  return [ex, ey];
}

/** Leaves along a twig and at its tip, alternate sides, each `len` long. */
function leaves(c: Canvas, rng: Rng, x: number, y: number, angle: number, reach: number, n: number, len: number, wid: number, splay: number, edge?: (t: number) => number): void {
  for (let k = 0; k < n; k++) {
    const t = (k + 1) / (n + 0.5);
    const [lx, ly] = [x + Math.sin(angle) * reach * t, y + Math.cos(angle) * reach * t];
    const side = k % 2 ? 1 : -1;
    leaf(c, lx, ly, angle + side * span(rng, splay * 0.7, splay * 1.2), len * span(rng, 0.8, 1.1), wid * span(rng, 0.85, 1.1), leafy(span(rng, 0.66, 0.98)), edge);
  }
  leaf(c, x + Math.sin(angle) * reach, y + Math.cos(angle) * reach, angle + span(rng, -0.2, 0.2), len * 1.1, wid, leafy(span(rng, 0.72, 1)), edge);
}

/** Oak and elm: a twig forking into a fan, each fork in lobed leaves. */
const broad: Draw = (c, rng) => {
  const [bx, by] = twig(c, 16, 0, span(rng, -0.15, 0.15), 7, 1.5);
  const lobed = (t: number): number => 0.78 + 0.22 * Math.abs(Math.cos(t * 3.5));
  for (const a of [-1.05, -0.45, 0.15, 0.7, 1.15]) {
    const angle = a + span(rng, -0.15, 0.15);
    const len = span(rng, 9, 13);
    twig(c, bx, by, angle, len * 0.8, 1, 0.42);
    leaves(c, rng, bx, by, angle, len * 0.85, 4, 8.5, 5.4, 0.8, lobed);
  }
};

/** A maple's hands: five-lobed leaves, wide, on their stalks. */
const maple: Draw = (c, rng) => {
  const [bx, by] = twig(c, 16, 0, 0, 6, 1.4);
  const hands: [number, number, number][] = [[-1.0, 10, 6], [-0.35, 13, 7], [0.35, 12, 7], [1.0, 10, 6], [0, 18, 7.5], [-0.7, 17, 5.5], [0.75, 16, 5.5]];
  for (const [a, reach, r] of hands) {
    const angle = a + span(rng, -0.12, 0.12);
    const [hx, hy] = [bx + Math.sin(angle) * reach, by + Math.cos(angle) * reach];
    stroke(c, bx, by, hx, hy, 0.8, 0.6, woody(0.42));
    const tone = span(rng, 0.66, 0.98);
    polar(c, hx, hy, r, angle, (t) => 0.42 + 0.58 * Math.pow(Math.abs(Math.cos(t * 2.5)), 0.55), (u, v) => tone * (1 - 0.22 * u * u) * (0.9 + 0.12 * v));
  }
};

/** A birch's or an aspen's small leaves, many, hanging from fine twigs. */
const small: Draw = (c, rng) => {
  const [bx, by] = twig(c, 16, 0, 0, 5, 1.2);
  for (const a of [-1.2, -0.65, -0.1, 0.45, 1.0, 1.35]) {
    const angle = a + span(rng, -0.1, 0.1);
    const len = span(rng, 11, 16);
    twig(c, bx, by, angle, len, 0.7, 0.38);
    for (let k = 0; k < 5; k++) {
      const t = (k + 1) / 5.5;
      const [lx, ly] = [bx + Math.sin(angle) * len * t, by + Math.cos(angle) * len * t];
      leaf(c, lx, ly, angle + (k % 2 ? 1 : -1) * span(rng, 1.3, 2.2), span(rng, 3.6, 4.8), span(rng, 2.6, 3.2), leafy(span(rng, 0.7, 1)));
    }
  }
};

/** Bare twigs: forks of forks, fine at their ends, a dry leaf left here and there. */
const bare: Draw = (c, rng) => {
  const grow = (x: number, y: number, a: number, len: number, w: number, depth: number): void => {
    const [ex, ey] = twig(c, x, y, a, len, w, span(rng, 0.34, 0.46));
    if (depth === 0) {
      if (rng() < 0.2) leaf(c, ex, ey, a + span(rng, -0.5, 0.5), 3, 2, leafy(0.7));
      return;
    }
    const n = rng() < 0.45 ? 3 : 2;
    for (let k = 0; k < n; k++) grow(ex, ey, a + (k - (n - 1) / 2) * span(rng, 0.5, 0.8), len * span(rng, 0.7, 0.86), Math.max(0.7, w * 0.72), depth - 1);
  };
  grow(16, 0, span(rng, -0.08, 0.08), 7.5, 2.2, 2);
  for (const a of [-0.95, 0.95]) grow(16, 3, a + span(rng, -0.15, 0.15), 6.5, 1.5, 3); // the low forks, so the fan fills its cell
};

/** Needles along a stem from (x0, y0) to (x1, y1), at `splay` to it on both sides (and all about, for a brush). */
function needled(c: Canvas, rng: Rng, x0: number, y0: number, x1: number, y1: number, len: number, splay: number, step: number, brush: boolean, tone: number): void {
  stroke(c, x0, y0, x1, y1, 1, 0.6, woody(0.36));
  const [dx, dy] = [x1 - x0, y1 - y0];
  const l = Math.hypot(dx, dy);
  const a = Math.atan2(dx, dy);
  for (let s = 0; s < l; s += step) {
    const [px, py] = [x0 + (dx * s) / l, y0 + (dy * s) / l];
    const short = len * (1 - 0.45 * (s / l));
    for (const side of brush ? [-1, -0.45, 0.45, 1] : [-1, 1]) {
      const na = a + side * splay * span(rng, 0.85, 1.15);
      stroke(c, px, py, px + Math.sin(na) * short, py + Math.cos(na) * short, 0.75, 0.45, tipped(tone * 0.78, tone * span(rng, 1, 1.18)));
    }
  }
}

/** A fir's flat spray: a drooping stem, side shoots alternate, short needles in two ranks. */
const fir: Draw = (c, rng) => {
  const pts: [number, number][] = [[16, 0], [15.5, 9], [16.5, 19], [18.5, 29]];
  for (let k = 0; k + 1 < pts.length; k++) needled(c, rng, ...pts[k], ...pts[k + 1], 3, 1.05, 0.9, false, 0.7);
  for (let k = 0; k < 7; k++) {
    const t = 0.12 + k * 0.12;
    const [px, py] = [16 + t * 2.5, t * 29];
    const side = k % 2 ? 1 : -1;
    const len = 10 * (1 - t * 0.7);
    needled(c, rng, px, py, px + side * len * 0.9, py + len * 0.55, 2.6, 1.0, 0.9, false, span(rng, 0.62, 0.8));
  }
};

/** A spruce's bottle brush: stiff shoots, needles all about them, dense and dark. */
const spruce: Draw = (c, rng) => {
  needled(c, rng, 16, 0, 16.5, 30, 3.4, 0.95, 0.75, true, 0.58);
  for (let k = 0; k < 6; k++) {
    const t = 0.1 + k * 0.14;
    const side = k % 2 ? 1 : -1;
    const len = 11 * (1 - t * 0.6);
    needled(c, rng, 16, t * 30, 16 + side * len, t * 30 + len * 0.35, 3, 0.9, 0.8, true, span(rng, 0.5, 0.66));
  }
};

/** Pine tufts: long needles fanned from the ends of short shoots. */
const pine: Draw = (c, rng) => {
  const tufts: [number, number, number][] = [[9, 10, -0.75], [16, 14, 0], [23, 10, 0.75], [12, 19, -0.3], [20, 19, 0.3]];
  for (const [tx, ty, a] of tufts) {
    stroke(c, 16, 0, tx, ty, 1.3, 0.9, woody(0.38));
    for (let k = 0; k < 15; k++) { // a brush of long needles fanned up and out from the shoot's end
      const na = a + span(rng, -0.75, 0.75);
      const len = span(rng, 7, 11.5);
      stroke(c, tx, ty, tx + Math.sin(na) * len, ty + Math.cos(na) * len, 0.85, 0.4, tipped(0.5, span(rng, 0.8, 1)));
    }
  }
};

/** A cypress's or a juniper's scale-leaf sprays: flattened fans of rounded scales, lace at their edge. */
const scale: Draw = (c, rng) => {
  const shoot = (x: number, y: number, a: number, len: number, w: number, depth: number): void => {
    const [ex, ey] = [x + Math.sin(a) * len, y + Math.cos(a) * len];
    const tone = span(rng, 0.6, 0.85);
    for (let s = 0; s <= 1.001; s += 0.2) blot(c, x + (ex - x) * s, y + (ey - y) * s, w * (1 - 0.35 * s), (u) => tone * (1.05 - 0.28 * u)); // a chain of scales
    if (depth === 0) return;
    for (let k = 1; k <= 4; k++) { // shoots off alternate sides, each shorter toward the tip: a flat fan
      const t = k / 4.6;
      const side = k % 2 ? 1 : -1;
      shoot(x + (ex - x) * t, y + (ey - y) * t, a + side * span(rng, 0.75, 1.0), len * (0.62 - 0.1 * t), w * 0.78, depth - 1);
    }
  };
  shoot(16, 0, span(rng, -0.08, 0.08), 29, 2.2, 2);
};

/** A fern's frond: its stalk curving up, leaflets in pairs, longest a third of the way up, toothed. */
const frond: Draw = (c, rng) => {
  const at = (v: number): [number, number] => [16 + 3 * v * v, v * 31];
  path(c, Array.from({ length: 6 }, (_, k) => at(k / 5)), 1.3, 0.5, woody(0.45));
  const toothed = (t: number): number => 0.72 + 0.28 * Math.abs(Math.cos(t * 4));
  for (let k = 1; k < 15; k++) {
    const v = k / 15;
    const [x, y] = at(v);
    const len = 13 * Math.sin(Math.PI * Math.pow(1 - v, 0.75)) * (0.9 + 0.2 * rng()) + 1.5;
    for (const side of [-1, 1]) leaf(c, x, y, side * (1.35 - 0.6 * v), len, 2.8 - 1.2 * v, leafy(span(rng, 0.7, 0.95)), toothed);
  }
};

/** A willow's strands: thin whips hung from the cell's head, narrow leaves down them. */
const strand: Draw = (c, rng) => {
  for (let k = 0; k < 6; k++) {
    const x = 4 + k * 4.8 + span(rng, -1, 1);
    const end = span(rng, 0, 14);
    const sway = span(rng, -2.5, 2.5);
    const pts: [number, number][] = Array.from({ length: 5 }, (_, i) => [x + sway * (i / 4) ** 2, 32 - (32 - end) * (i / 4)]);
    path(c, pts, 0.8, 0.55, woody(0.42));
    for (let y = 30; y > end + 1; y -= 2.2) {
      const t = (32 - y) / (32 - end);
      const px = x + sway * t * t;
      leaf(c, px, y, Math.PI + (Math.round(y) % 2 ? 0.55 : -0.55), span(rng, 3.6, 5), 1.6, leafy(span(rng, 0.68, 0.95)));
    }
  }
};

/** A beard of moss: grey threads hanging tangled from the head, thickest there. */
const moss: Draw = (c, rng) => {
  for (let k = 0; k < 16; k++) {
    let [x, y] = [span(rng, 3, 29), 32];
    const len = span(rng, 12, 31);
    const pts: [number, number][] = [[x, y]];
    for (let s = 0; s < 6; s++) {
      x += span(rng, -1.8, 1.8);
      y -= len / 6;
      pts.push([x, y]);
    }
    path(c, pts, span(rng, 1.4, 2.2), 0.5, tipped(span(rng, 0.62, 0.8), span(rng, 0.72, 0.95)));
  }
};

/** Thorny twigs: crooked stems, thorns at their joints, a few dark leaves and berries. */
const thorn: Draw = (c, rng) => {
  for (const a of [-0.85, -0.3, 0.25, 0.8]) {
    let [x, y, ang] = [16 + a * 3, 0, a * 0.8];
    for (let s = 0; s < 6; s++) {
      ang += span(rng, -0.45, 0.45) - ang * 0.15; // crooked, but it keeps within its cell
      const [ex, ey] = twig(c, x, y, ang, span(rng, 4, 5.5), 1.6 - s * 0.16, 0.36);
      for (const side of [-1, 1]) if (rng() < 0.75) stroke(c, ex, ey, ex + Math.sin(ang + side * 1.25) * 2, ey + Math.cos(ang + side * 1.25) * 2, 0.9, 0.2, woody(0.5));
      if (rng() < 0.55) leaf(c, ex, ey, ang + (rng() < 0.5 ? -1.1 : 1.1), span(rng, 3.6, 5), span(rng, 2.6, 3.4), leafy(span(rng, 0.55, 0.8)));
      if (rng() < 0.3) blot(c, ex + span(rng, -1.5, 1.5), ey, 1.2, (u) => 0.48 * (1.15 - 0.4 * u));
      [x, y] = [ex, ey];
    }
  }
};

/** A clump of grass: blades from a tuft at the foot, each curving over to its side, some heads gone to seed. */
const grass: Draw = (c, rng) => {
  for (let k = 0; k < 17; k++) {
    const x = 16 + span(rng, -7, 7);
    const lean = (x - 16) * 0.5 + span(rng, -4, 4);
    const h = span(rng, 16, 31);
    const pts: [number, number][] = Array.from({ length: 5 }, (_, i) => [x + lean * (i / 4) ** 1.6, (h * i) / 4]);
    path(c, pts, span(rng, 1.4, 2), 0.35, tipped(0.48, span(rng, 0.82, 1)));
    if (k % 6 === 0) for (let s = 0; s < 4; s++) blot(c, pts[4][0] + s * 0.3, pts[4][1] - s * 1.4, 0.75, () => 0.95);
  }
};

/** Reeds: tall straight blades, a cattail's brown head on its stem, a plume gone to seed. */
const reeds: Draw = (c, rng) => {
  for (let k = 0; k < 9; k++) {
    const x = 16 + span(rng, -8, 8);
    const lean = span(rng, -3, 3);
    stroke(c, x, 0, x + lean, span(rng, 24, 31), span(rng, 1.4, 1.9), 0.3, tipped(0.45, span(rng, 0.78, 0.95)));
  }
  for (const x of [11, 20]) {
    const top = span(rng, 27, 31);
    stroke(c, x, 0, x + 0.6, top, 0.8, 0.6, woody(0.5));
    stroke(c, x + 0.4, top - 10, x + 0.55, top - 3, 2.8, 2.6, (u) => 0.38 * (1.1 - 0.3 * u)); // the cattail's head
  }
};

/** The Black Wood's growth: tendrils curling from the foot, swollen at their nodes, veined. */
const growth: Draw = (c, rng) => {
  for (let k = 0; k < 5; k++) {
    let [x, y, a] = [16 + (k - 2) * 3.5, 0, (k - 2) * 0.22];
    const turn = span(rng, 0.12, 0.24) * (k < 2 ? 1 : -1); // curling in toward the cell's middle, never out of it
    const pts: [number, number][] = [[x, y]];
    for (let s = 0; s < 9; s++) {
      a += turn * (s > 4 ? 1.8 : 1);
      x += Math.sin(a) * 3.1;
      y += Math.cos(a) * 3.1;
      pts.push([Math.min(30, Math.max(2, x)), Math.min(31, y)]);
    }
    path(c, pts, 2.6, 0.6, (u, v) => (0.55 + 0.3 * v) * (1 - 0.3 * u * u) * (Math.abs(u) < 0.2 ? 0.8 : 1));
    for (const s of [3, 6]) blot(c, pts[s][0], pts[s][1], 1.6, (u) => 0.7 * (1.1 - 0.35 * u));
  }
};

/** All covered: leaves laid edge to edge over a dark ground (for what is solid: a blob's face, a blade, a cap). */
const solid: Draw = (c, rng) => {
  stroke(c, -2, 16, 34, 16, 40, 40, () => 0.5);
  for (let k = 0; k < 70; k++) leaf(c, span(rng, 0, 32), span(rng, -4, 30), span(rng, 0, Math.PI * 2), span(rng, 5, 8), span(rng, 3, 4.5), leafy(span(rng, 0.58, 0.95)));
};

export const FOLIAGE_CELLS = ['broad', 'maple', 'small', 'bare', 'fir', 'spruce', 'pine', 'scale', 'frond', 'strand', 'moss', 'thorn', 'grass', 'reeds', 'growth', 'solid'] as const;
export type FoliageCell = (typeof FOLIAGE_CELLS)[number];
const DRAW: Record<FoliageCell, Draw> = { broad, maple, small, bare, fir, spruce, pine, scale, frond, strand, moss, thorn, grass, reeds, growth, solid };

/** Draws cell `name` into a fresh canvas, from its own fixed seed. */
export function drawCell(name: FoliageCell, c: Canvas): void {
  DRAW[name](c, createRng(9127 + FOLIAGE_CELLS.indexOf(name) * 131));
}
