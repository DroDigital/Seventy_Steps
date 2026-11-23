/**
 * Round 117, the ruins by realm (data/propLooks.ts), each its own kind of ruin where all were one broken wall of three boxes: a wall of
 * coursed stone broken down to a ragged line; the gable end of a house still standing, its window open and its crow-stepped gable half
 * fallen; a lone chimney over the stubs of a burned house and its charred beams; an arched doorway between broken walls; a colonnade's
 * stumps on their step with a drum fallen beside them; and cyclopean blocks heaped as no human hand set them. Each keeps to its prop's
 * line along x and its thickness (the collider's), and rises as a ruin may.
 */

import * as THREE from 'three';
import type { Rng } from '../core/rng';
import type { PropLook, RuinForm } from '../data/propLooks';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { mixRgb, scaleRgb, type Rgb } from './palette';
import { cyl, join, roughen, shadeBelow, stem, topCoat } from './propKit';
import type { Piece, PropMat } from './propShapes';
import { fluted } from './stoneForms';

type Keep = (x0: number, x1: number, y0: number, y1: number) => boolean;

/** A smooth ragged line in [0, 1] along x: where a broken wall's top runs. */
const ragged = (rng: Rng): ((x: number) => number) => {
  const [a, b, c] = [rng() * 6, rng() * 6, rng() * 6];
  return (x) => 0.5 + 0.25 * Math.sin(x * 1.1 + a) + 0.17 * Math.sin(x * 2.7 + b) + 0.08 * Math.sin(x * 6.1 + c);
};

/** A stone's length of `rest` left in its course: none so short that its joint lies within a hand of the course's end (the view audit's fights). */
export const stoneLength = (rest: number, len: readonly [number, number], rng: Rng): number => {
  const l = Math.min(len[0] + (len[1] - len[0]) * rng(), rest);
  return rest - l < Math.max(0.25, len[0] * 0.6) ? rest : l;
};

/** Coursed masonry from x0 to x1, `rows` courses of `ch`, every stone `keep` keeps (a stone left out leaves its gap). */
function masonry(x0: number, x1: number, rows: number, ch: number, depth: number, len: [number, number], rng: Rng, c: Rgb, keep: Keep): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  for (let k = 0; k < rows; k++) {
    for (let x = x0; x < x1 - 0.05; ) {
      const l = stoneLength(x1 - x, len, rng);
      const d = depth * (0.88 + 0.12 * rng());
      const tone = scaleRgb(c, 0.8 + 0.3 * rng());
      if (keep(x, x + l, k * ch, (k + 1) * ch)) out.push(tileUv(box(l, ch, d, x + l / 2, k * ch + ch / 2, (rng() - 0.5) * (depth - d), tone), l, ch));
      x += l;
    }
  }
  return out;
}

/** Fallen stones lying either side of the wall's line. */
function rubble(p: Prop, rng: Rng, c: Rgb, n: number): THREE.BufferGeometry[] {
  return Array.from({ length: n }, (_, k) => { // each in its own stretch of the wall, so no two lie in one another
    const r = 0.12 + 0.14 * rng();
    const g = tint(new THREE.IcosahedronGeometry(1, 0).scale(r * 1.3, r, r), scaleRgb(c, 0.75 + 0.25 * rng()));
    const x = -p.w + ((k + 0.5 + (rng() - 0.5) * 0.3) * p.w * 2) / n;
    return roughen(g, 0.2, rng() * 100).rotateY(rng() * 3).translate(x, r * 0.4, (k % 2 ? -1 : 1) * (p.d + 0.25 + 0.5 * rng()));
  });
}

const done = (mat: PropMat, parts: THREE.BufferGeometry[], look: PropLook, extra: Piece[] = []): Piece[] => [{ mat, geo: shadeBelow(topCoat(join(parts), look.top, look.topShare * 0.5), 0.2) }, ...extra];

/** A wall of coursed stone broken down to a ragged line, its rubble about it. */
function wall(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const ch = 0.3 + 0.08 * rng();
  const top = ragged(rng);
  const rows = Math.ceil(p.h / ch);
  const parts = masonry(-p.w, p.w, rows, ch, p.d * 2, [0.45, 1], rng, c, (x0, x1, y0, y1) => y0 < 1e-6 || y1 <= p.h * (0.15 + 0.85 * top((x0 + x1) / 2)));
  return done('stone', [...parts, ...rubble(p, rng, c, 4)], look);
}

/** The gable end of a house: its window open under a lintel, its stepped gable standing on one side and fallen on the other. */
function gable(p: Prop, rng: Rng, c: Rgb, look: PropLook, mat: PropMat): Piece[] {
  const ch = mat === 'brick' ? 0.25 : 0.32;
  const rows = Math.ceil((p.h + p.w * 0.55) / ch);
  const wx = (rng() - 0.5) * p.w * 0.6;
  const [sill, lintel] = [Math.max(1, Math.round(p.h * 0.35 / ch)), Math.max(2, Math.round(p.h * 0.75 / ch))];
  const fall = rng() < 0.5 ? -1 : 1;
  const cut = (rng() - 0.3) * p.w * 0.6;
  const top = ragged(rng);
  const keep: Keep = (x0, x1, y0, y1) => {
    const mid = (x0 + x1) / 2;
    const over = (a0: number, a1: number): boolean => x1 > a0 && x0 < a1;
    if (y0 >= sill * ch && y1 <= lintel * ch && over(wx - 0.45, wx + 0.45)) return false; // the window
    if (y0 >= lintel * ch && y1 <= (lintel + 1) * ch && over(wx - 0.7, wx + 0.7)) return false; // the lintel's place
    const standing = p.h + Math.max(0, p.w - Math.abs(mid)) * 0.55;
    const fallen = mid * fall > cut ? p.h * (0.35 + 0.5 * top(mid)) : standing;
    return y0 < 1e-6 || y1 <= Math.min(standing, fallen) + 0.02;
  };
  const parts = masonry(-p.w, p.w, rows, ch, p.d * 2, mat === 'brick' ? [0.5, 0.9] : [0.45, 0.95], rng, c, keep);
  parts.push(tileUv(box(1.36, ch, p.d * 2, wx, lintel * ch + ch / 2, 0, scaleRgb(c, 0.7)), 1.4, ch)); // the lintel
  return done(mat, [...parts, ...rubble(p, rng, c, 5)], look);
}

/** A chimney standing alone over the low stubs of the house that burned about it, a hearth open at its foot, charred beams leaning. */
function chimney(p: Prop, rng: Rng, c: Rgb, look: PropLook, mat: PropMat, brick: Rgb): Piece[] {
  const side = rng() < 0.5 ? -1 : 1;
  const cx = side * (p.w - 0.65);
  const tall = p.h * 1.5 + 2.2;
  const tone = mat === 'brick' ? brick : scaleRgb(c, 0.9);
  const stack = [
    tileUv(box(0.48, 1.0, p.d * 2, cx - 0.56, 0.5, 0, tone), 0.5, 1), tileUv(box(0.48, 1.0, p.d * 2, cx + 0.56, 0.5, 0, tone), 0.5, 1), // the hearth's jambs
    tileUv(box(1.6, tall * 0.4 - 1, p.d * 2, cx, 1 + (tall * 0.4 - 1) / 2, 0, tone), 1.6, tall * 0.4), // its breast over the hearth
    tileUv(box(0.64, 1.0, p.d * 1.2, cx, 0.5, -p.d * 0.4, scaleRgb(tone, 0.55)), 0.6, 1), // the fireback, sooted
    tileUv(box(1.1, tall * 0.6, p.d * 1.7, cx, tall * 0.4 + tall * 0.3, 0, tone), 1.1, tall * 0.6), // the stack, stepped in at its shoulders
    tileUv(box(1.36, 0.16, p.d * 1.7 + 0.26, cx, tall + 0.08, 0, scaleRgb(tone, 0.8)), 1.3, 0.2), // its cap, standing well out
  ];
  const top = ragged(rng);
  const x0 = side < 0 ? cx + 0.82 : -p.w;
  const x1 = side < 0 ? p.w : cx - 0.82;
  const stubs = masonry(x0, x1, 3, 0.3, p.d * 1.6, [0.4, 0.8], rng, scaleRgb(c, 0.85), (a, b, y0, y1) => y0 < 1e-6 || y1 <= 0.9 * top((a + b) / 2) + 0.15);
  const char: Rgb = [0.16, 0.14, 0.13];
  const beams = Array.from({ length: 2 }, (_, k) => {
    const x = x0 + (x1 - x0) * (0.3 + 0.4 * k + 0.15 * rng());
    return stem([x, -0.1, (rng() < 0.5 ? -1 : 1) * (p.d + 0.6)], [x + (rng() - 0.5) * 0.8, 0.9 + 1.2 * rng(), 0], 0.1, 0.07, 4, scaleRgb(char, 0.8 + 0.4 * rng()));
  });
  const pieces: Piece[] = [{ mat: 'stone', geo: shadeBelow(topCoat(join([...stubs, ...rubble(p, rng, c, 4)]), look.top, look.topShare * 0.5), 0.2) }, { mat: 'wood', geo: tileUv(join(beams), 1, 1) }];
  if (mat === 'brick') pieces.push({ mat: 'brick', geo: join(stack) });
  else pieces[0] = { mat: 'stone', geo: join([pieces[0].geo!, ...stack]) };
  return pieces;
}

/** A ring's sector from `from` to `to` (radians from the right), `inner` to `outer`, `depth` thick across z: an arch. */
function archOf(inner: number, outer: number, from: number, to: number, depth: number, c: Rgb): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.absarc(0, 0, outer, from, to, false);
  s.absarc(0, 0, inner, to, from, true);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -depth / 2);
  return tint(tileUv(g, 1, 1, 1), c);
}

/** An arched doorway between two piers, the walls beside it broken down; the arch sometimes half fallen. */
function arch(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const half = Math.min(0.85, p.w * 0.3);
  const spring = Math.max(1.6, p.h * 0.75);
  const pier = 0.45;
  const top = ragged(rng);
  const keep: Keep = (x0, x1, y0, y1) => {
    if (x1 > -half - pier - 0.01 && x0 < half + pier + 0.01) return false; // the piers' place and the door
    return y0 < 1e-6 || y1 <= p.h * (0.25 + 0.6 * top((x0 + x1) / 2));
  };
  const tone = scaleRgb(c, 0.92);
  const parts = masonry(-p.w, p.w, Math.ceil(p.h / 0.3), 0.3, p.d * 2, [0.45, 0.9], rng, c, keep);
  for (const s of [-1, 1]) parts.push(tileUv(box(pier, spring, p.d * 2, s * (half + pier / 2), spring / 2, 0, tone), pier, spring), tileUv(box(pier + 0.26, 0.16, p.d * 2 + 0.26, s * (half + pier / 2), spring - 0.08, 0, scaleRgb(tone, 0.85)), pier, 0.2)); // the piers and their imposts (standing well out, so no face of theirs lies within a hand of a pier's)
  const whole = rng() < 0.6;
  parts.push(archOf(half, half + pier, whole ? 0 : Math.PI * (0.45 + 0.15 * rng()), Math.PI, p.d * 2, tone).translate(0, spring, 0));
  if (whole) parts.push(tileUv(box(0.3, 0.46, p.d * 2 + 0.26, 0, spring + half + pier * 0.6, 0, scaleRgb(tone, 1.05)), 0.3, 0.4)); // its keystone, standing out
  return done('stone', [...parts, ...rubble(p, rng, c, 5)], look);
}

/** A colonnade's stumps on their step, one or two whole under a length of architrave, a drum fallen before them. */
function colonnade(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const r = Math.min(0.3, p.d * 0.85);
  const parts = [tileUv(box(p.w * 2, 0.25, p.d * 2, 0, 0.125, 0, scaleRgb(c, 0.8)), p.w * 2, 0.25)];
  const n = Math.max(2, Math.round((p.w * 2) / 1.6));
  const xs = Array.from({ length: n }, (_, k) => -p.w + 0.5 + ((p.w * 2 - 1) * k) / (n - 1));
  const tall = p.h + 1.2;
  const whole = Math.floor(rng() * (n - 1));
  xs.forEach((x, k) => {
    const up = k === whole || k === whole + 1;
    const h = up ? tall : tall * (0.2 + 0.55 * rng());
    parts.push(cyl(r * 1.25, r * 1.1, 0.18, 8, scaleRgb(c, 0.9)).translate(x, 0.25, 0), fluted(r, r * 0.88, h - 0.43, 8, c, !up, rng() * 100).translate(x, 0.43, 0));
    if (up) parts.push(tileUv(box(r * 2.6, 0.2, r * 2.6, x, tall + 0.1, 0, scaleRgb(c, 0.9)), 0.6, 0.2));
  });
  parts.push(tileUv(box(xs[whole + 1] - xs[whole] + r * 2.4, 0.4, r * 2.2, (xs[whole] + xs[whole + 1]) / 2, tall + 0.4, 0, scaleRgb(c, 0.85)), 2, 0.4)); // the architrave they still carry
  parts.push(cyl(r, r, 0.9, 8, scaleRgb(c, 0.85)).translate(0, -0.45, 0).rotateZ(Math.PI / 2).rotateY(rng() - 0.5).translate((rng() - 0.5) * p.w, r * 0.9, p.d + r + 0.25)); // a drum fallen
  return done('stone', [...parts, ...rubble(p, rng, c, 3)], look);
}

/** Cyclopean blocks: two or three of them, each greater than a man, heaped with their faces at angles no mason chose (each a hand and more thinner or thicker than the next, so no two faces lie close). */
function slabs(p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const parts: THREE.BufferGeometry[] = [];
  const block = (l: number, h: number, d: number, tone: Rgb): THREE.BufferGeometry => roughen(tint(tileUv(new THREE.BoxGeometry(l, h, d, 2, 2, 1), l, h), tone), 0.05, rng() * 100);
  const l0 = p.w * (0.9 + 0.3 * rng());
  const h0 = p.h * (0.5 + 0.2 * rng());
  parts.push(block(l0, h0 + 0.3, p.d * 2, scaleRgb(c, 0.85)).rotateZ((rng() - 0.5) * 0.1).translate(-p.w + l0 / 2, h0 / 2 - 0.15, 0));
  const l1 = p.w * (0.7 + 0.3 * rng());
  parts.push(block(l1, h0 * 0.8, p.d * 2 - 0.26, scaleRgb(c, 0.95)).rotateZ(0.12 + 0.1 * rng()).translate(-p.w + l0 * 0.55, h0 + h0 * 0.38, 0)); // tipped on the first
  const l2 = Math.min(p.w * 2 - l0 - 0.1, p.w * (0.6 + 0.3 * rng()));
  if (l2 > 0.5) parts.push(block(l2, p.h * 1.1, p.d * 2 + 0.26, scaleRgb(c, 0.78)).rotateZ(-0.25 - 0.15 * rng()).translate(p.w - l2 / 2 - 0.15, p.h * 0.45, 0)); // leaning on them
  return done('stone', [...parts, ...rubble(p, rng, mixRgb(c, look.top, 0.2), 3)], look);
}

const BRICK: Rgb = [1.02, 0.84, 0.74];

/** A ruin of `form` in the realm's look; `c` the region's stone. */
export function ruinOf(form: RuinForm, p: Prop, rng: Rng, c: Rgb, look: PropLook): Piece[] {
  const brick = rng() < (look.brick ?? 0);
  switch (form) {
    case 'wall':
      return wall(p, rng, c, look);
    case 'gable':
      return gable(p, rng, brick ? BRICK : c, look, brick ? 'brick' : 'stone');
    case 'chimney':
      return chimney(p, rng, c, look, brick || rng() < 0.4 ? 'brick' : 'stone', scaleRgb(BRICK, 0.95));
    case 'arch':
      return arch(p, rng, c, look);
    case 'colonnade':
      return colonnade(p, rng, c, look);
    case 'slabs':
      return slabs(p, rng, c, look);
  }
}
