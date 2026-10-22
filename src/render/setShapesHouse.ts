/**
 * The walls of a horror's house (round 63; data/arenaHouses.ts, world/arenaHouse.ts; render/setShapes.ts holds them with the rest of
 * the built pieces): a length of wall `2 w` long, `2 d` thick and `h` high, in nine stuffs: ashlar with a parapet, the dam's battered
 * embankment, a rock cliff, the grove's trunks and horns, a colonnade on its plinth, a hedge, R'lyeh's leaning slabs, crystal, a
 * ziggurat's terraces. Each fits within the box that is its collider, so a body is stopped where the picture says. In the piece's
 * own frame, feet at the origin, its length along x. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
const stone = (p: Prop, k = 1): Rgb => scaleRgb(p.set?.tint ? mixRgb(scaleRgb(BASE.seaGrey, 1.7), p.set.tint, 0.65) : scaleRgb(BASE.seaGrey, 1.7), k);
const glowOf = (p: Prop): Rgb => ANOMALY[p.set?.glow ?? 'purple'];
const rnd = (seed: number, i: number): number => {
  const s = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** A tiled block: `w` along the wall, `h` high, `d` thick, its middle at (x, y, z). */
const block = (w: number, h: number, d: number, x: number, y: number, z: number, c: Rgb): THREE.BufferGeometry => tileUv(box(w, h, d, x, y, z, c, Math.max(1.8, Math.max(w, h, d) / 6)), Math.max(w, d), h); // (its faces in cells 1.8 m wide at the least, and six across at the most: a wall of twenty metres is not cut into a thousand)
/** A line of light along the crown of a wall, on both its faces. */
const crown = (p: Prop, y: number, thick: number): THREE.BufferGeometry => merged([-1, 1].map((s) => box(p.w * 1.9, 0.07, 0.06, 0, y, s * (thick / 2 + 0.03), glowOf(p))));

/** Ashlar: a plinth, a body in courses, a string course and a parapet of merlons. */
export function ashlar(p: Prop): Piece[] {
  const [L, T, H, c] = [p.w * 2, p.d * 2, p.h, stone(p)];
  const parts = [block(L, H * 0.14, T * 1.1, 0, H * 0.07, 0, stone(p, 0.78)), block(L, H * 0.76, T, 0, H * 0.14 + H * 0.38, 0, c), block(L, 0.2, T * 1.07, 0, H * 0.5, 0, stone(p, 1.12)), block(L, 0.3, T * 1.08, 0, H * 0.9, 0, stone(p, 1.1))];
  for (let x = -L / 2 + 0.7; x < L / 2 - 0.3; x += 1.55) parts.push(block(0.85, H * 0.12, T * 0.8, x, H * 0.9 + 0.15 + H * 0.06, 0, stone(p, 0.95))); // the merlons
  const out: Piece[] = [{ mat: 'stone', geo: merged(parts) }];
  if (p.set?.glow) out.push({ mat: 'glow', geo: crown(p, H * 0.62, T) });
  return out;
}

/** The dam: a battered embankment in three steps, ribbed with buttresses, a cap on the top. */
export function dam(p: Prop): Piece[] {
  const [L, T, H, c] = [p.w * 2, p.d * 2, p.h, stone(p, 0.95)];
  const parts = [block(L, H * 0.4, T * 1.3, 0, H * 0.2, 0, stone(p, 0.8)), block(L, H * 0.35, T * 1.12, 0, H * 0.4 + H * 0.175, 0, c), block(L, H * 0.25, T * 0.96, 0, H * 0.75 + H * 0.125, 0, stone(p, 1.05)), block(L, 0.22, T * 1.04, 0, H + 0.05, 0, stone(p, 1.15))];
  for (let x = -L / 2 + 1.1; x < L / 2; x += 2.3) parts.push(block(0.5, H * 0.92, T * 0.35, x, H * 0.46, T * 0.62, stone(p, 0.85))); // the ribs on the face that is seen from within
  const out: Piece[] = [{ mat: 'stone', geo: merged(parts) }];
  if (p.set?.glow) {
    const cracks = [0, 1, 2].map((i) => box(0.06, H * (0.3 + 0.4 * rnd(p.seed, i)), 0.06, (rnd(p.seed, i + 4) - 0.5) * L * 0.8, H * 0.55, -T * 0.62, glowOf(p)));
    out.push({ mat: 'glow', geo: merged(cracks) });
  }
  return out;
}

/** A cliff: tilted blocks of rock side by side at different heights, scree at the foot. */
export function cliff(p: Prop): Piece[] {
  const [L, T, H] = [p.w * 2, p.d * 2, p.h];
  const n = Math.max(3, Math.round(L / 1.6));
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const [h, w] = [H * (0.72 + 0.28 * rnd(p.seed, i)), L / n * 1.18];
    parts.push(block(w, h, T * (0.8 + 0.2 * rnd(p.seed, i + 9)), -L / 2 + (i + 0.5) * (L / n), h / 2, 0, stone(p, 0.8 + 0.3 * rnd(p.seed, i + 3))).rotateZ((rnd(p.seed, i + 6) - 0.5) * 0.07));
  }
  parts.push(block(L, H * 0.16, T * 1.2, 0, H * 0.08, 0, stone(p, 0.7)));
  return [{ mat: 'stone', geo: merged(parts) }];
}

/** The grove: trunks side by side, forked into horns, a dark crown of leaf above them. */
export function grove(p: Prop): Piece[] {
  const [L, T, H] = [p.w * 2, p.d * 2, p.h];
  const bark: Rgb = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.25), 1.4);
  const trunks: THREE.BufferGeometry[] = [];
  const leaf: THREE.BufferGeometry[] = [];
  const n = Math.max(3, Math.round(L / 1.2));
  for (let i = 0; i < n; i++) {
    const [x, h, r] = [-L / 2 + (i + 0.5) * (L / n), H * (0.7 + 0.3 * rnd(p.seed, i)), T * (0.2 + 0.08 * rnd(p.seed, i + 5))];
    trunks.push(tint(tileUv(new THREE.CylinderGeometry(r * 0.7, r * 1.2, h, 6).translate(x, h / 2, (rnd(p.seed, i + 2) - 0.5) * T * 0.3), 1, h), scaleRgb(bark, 0.8 + 0.4 * rnd(p.seed, i + 1))));
    for (const s of [-1, 1]) trunks.push(box(r * 0.7, h * 0.34, r * 0.7, x + s * r * 1.4, h * 0.9, 0, bark).rotateZ(-s * 0.5)); // the fork's two horns
    leaf.push(tint(new THREE.IcosahedronGeometry(T * 0.55, 0).scale(1.2, 0.8, 1).translate(x, h * 0.95, 0), scaleRgb([0.2, 0.28, 0.2], 0.5)));
  }
  return [{ mat: 'wood', geo: merged(trunks) }, { mat: 'leaf', geo: merged(leaf) }];
}

/** A colonnade: a plinth wall, columns in front of it and an entablature over them, some of them broken short. */
export function colonnade(p: Prop): Piece[] {
  const [L, T, H, c] = [p.w * 2, p.d * 2, p.h, stone(p, 1.1)];
  const parts = [block(L, H * 0.3, T, 0, H * 0.15, 0, stone(p, 0.85)), block(L, H * 0.12, T * 1.1, 0, H * 0.94, 0, c), block(L, 0.18, T * 1.2, 0, H * 0.99, 0, stone(p, 1.2))];
  for (let x = -L / 2 + 0.8; x < L / 2; x += 1.9) {
    const h = rnd(p.seed, Math.round(x * 3)) < 0.18 ? H * 0.4 : H * 0.66; // a few fallen to a stump
    parts.push(tint(tileUv(new THREE.CylinderGeometry(T * 0.26, T * 0.3, h, 8).translate(x, H * 0.3 + h / 2, T * 0.2), 1, h), c));
  }
  return [{ mat: 'stone', geo: merged(parts) }];
}

/** A hedge: blocks of leaf at uneven heights, a dark body beneath. */
export function hedge(p: Prop): Piece[] {
  const [L, T, H] = [p.w * 2, p.d * 2, p.h];
  const green: Rgb = [0.12, 0.2, 0.12];
  const parts: THREE.BufferGeometry[] = [box(L, H * 0.7, T * 0.9, 0, H * 0.35, 0, scaleRgb(green, 0.7))];
  const n = Math.max(3, Math.round(L / 1.1));
  for (let i = 0; i < n; i++) parts.push(box(L / n * 1.1, H * (0.3 + 0.12 * rnd(p.seed, i)), T * (0.95 + 0.1 * rnd(p.seed, i + 4)), -L / 2 + (i + 0.5) * (L / n), H * 0.8, 0, scaleRgb(green, 0.9 + 0.5 * rnd(p.seed, i + 8))));
  return [{ mat: 'leaf', geo: merged(parts) }, { mat: 'stone', geo: block(L, 0.4, T * 1.1, 0, 0.2, 0, stone(p, 0.7)) }];
}

/** R'lyeh's masonry: slabs leaning against one another, a slime of the sea on their feet, a carved line that burns. */
export function slabs(p: Prop): Piece[] {
  const [L, T, H] = [p.w * 2, p.d * 2, p.h];
  const c = mixRgb(scaleRgb(BASE.seaGrey, 1.2), [0.3, 0.5, 0.4], 0.5);
  const n = Math.max(2, Math.round(L / 2.4));
  const parts: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * (L / n);
    const lean = (rnd(p.seed, i) - 0.5) * 0.16;
    parts.push(block(L / n * 1.14, H * (0.82 + 0.18 * rnd(p.seed, i + 3)), T * 0.95, x, H * 0.45, 0, scaleRgb(c, 0.85 + 0.3 * rnd(p.seed, i + 7))).rotateZ(lean));
    parts.push(box(L / n * 1.16, H * 0.14, T * 1.02, x, H * 0.07, 0, mixRgb(c, [0.1, 0.25, 0.2], 0.6)));
    glow.push(box(L / n * 0.7, 0.07, 0.07, x, H * (0.45 + 0.2 * rnd(p.seed, i + 11)), T / 2 + 0.04, glowOf(p)).rotateZ(lean));
  }
  return [{ mat: 'stone', geo: merged(parts) }, { mat: 'glow', geo: merged(glow) }];
}

/** Crystal: tall four-sided prisms, a glow in their faces. */
export function crystal(p: Prop): Piece[] {
  const [L, T, H] = [p.w * 2, p.d * 2, p.h];
  const c = scaleRgb(mixRgb(BASE.seaGrey, glowOf(p), 0.3), 1.5);
  const n = Math.max(3, Math.round(L / 1.4));
  const prisms: THREE.BufferGeometry[] = [block(L, H * 0.22, T, 0, H * 0.11, 0, scaleRgb(c, 0.7))];
  const veins: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const [x, h, r] = [-L / 2 + (i + 0.5) * (L / n), H * (0.6 + 0.4 * rnd(p.seed, i)), T * 0.5];
    prisms.push(tint(tileUv(new THREE.CylinderGeometry(r * 0.35, r, h, 4).rotateY(Math.PI / 4).translate(x, h / 2, 0), 1, h), scaleRgb(c, 0.8 + 0.5 * rnd(p.seed, i + 5))).rotateZ((rnd(p.seed, i + 2) - 0.5) * 0.12));
    veins.push(box(0.08, h * 0.7, 0.08, x, h * 0.5, r * 0.5, glowOf(p)));
  }
  return [{ mat: 'stone', geo: merged(prisms) }, { mat: 'glow', geo: merged(veins) }];
}

/** A ziggurat's terraces: stepped blocks narrowing as they climb, a line of light on each step. */
export function terrace(p: Prop): Piece[] {
  const [L, T, H, c] = [p.w * 2, p.d * 2, p.h, stone(p, 0.9)];
  const parts: THREE.BufferGeometry[] = [];
  const glow: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const [k, h] = [1 - i * 0.12, H / 4];
    parts.push(block(L, h, T * k, 0, h * (i + 0.5), 0, scaleRgb(c, 0.8 + 0.08 * i)));
    glow.push(box(L * 0.92, 0.06, 0.06, 0, h * (i + 1) - 0.1, T * k / 2 + 0.03, glowOf(p)));
  }
  return [{ mat: 'stone', geo: merged(parts) }, { mat: 'glow', geo: merged(glow) }];
}
