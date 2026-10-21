/**
 * The built pieces of the rites (round 61; render/setShapes.ts): glyphs laid in the ground and glowing there, in an anomaly colour (a
 * ring of ticks, a star, the Yellow Sign, a hexagon, a spiral, an eye), the totem of stacked faces, the skull on its pole, the
 * horned tree of the black grove. In the piece's own frame, feet at the origin; a glyph is `w` metres across from its middle, flat,
 * 7 cm proud of the ground (any less and the PS1's snapping sinks it: round 19). Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Prop } from '../world/props';
import { box, tileUv, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts);
const PROUD = 0.07;
const LEAST = 0.34; // metres: the thinnest a line is drawn, for the picture's low resolution loses a thinner one at twenty paces
const SUNK = 0.15; // the prop job sets every prop 15 cm into the ground (render/propMeshes.ts): a glyph's bars stand that much higher in their own frame
const BARK: Rgb = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.25), 1.5);
const BONE: Rgb = scaleRgb(BASE.bone, 0.75);

/** A flat bar from (x0, z0) to (x1, z1), `w` wide, a glyph's line. */
function bar(x0: number, z0: number, x1: number, z1: number, width: number, c: Rgb): THREE.BufferGeometry {
  const [dx, dz, w] = [x1 - x0, z1 - z0, Math.max(width, LEAST)];
  return box(Math.hypot(dx, dz) + w * 0.5, PROUD, w, 0, SUNK + PROUD / 2, 0, c).rotateY(-Math.atan2(dz, dx)).translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
}

/** A polyline through `pts`. */
const line = (pts: readonly (readonly [number, number])[], w: number, c: Rgb): THREE.BufferGeometry[] => pts.slice(1).map((p, i) => bar(pts[i][0], pts[i][1], p[0], p[1], w, c));

/** A circle of radius r about (cx, cz) in `n` bars, or the arc of it from a0 to a1. */
const circle = (r: number, w: number, c: Rgb, n = 36, cx = 0, cz = 0, a0 = 0, a1 = Math.PI * 2): THREE.BufferGeometry[] =>
  line(Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(a0 + ((a1 - a0) * i) / n) * r, cz + Math.sin(a0 + ((a1 - a0) * i) / n) * r] as const), w, c);

const polar = (r: number, a: number): readonly [number, number] => [Math.cos(a) * r, Math.sin(a) * r];

type Glyph = (r: number, c: Rgb) => THREE.BufferGeometry[];

const GLYPHS: Record<string, Glyph> = {
  ring: (r, c) => [...circle(r, r * 0.035, c), ...circle(r * 0.82, r * 0.02, c), ...Array.from({ length: 24 }, (_, i) => bar(...polar(r * 0.86, (i * Math.PI) / 12), ...polar(r * 0.96, (i * Math.PI) / 12), r * 0.02, c)), ...circle(r * 0.3, r * 0.02, c, 18)],
  star: (r, c) => [...circle(r, r * 0.03, c), ...circle(r * 0.93, r * 0.016, c), ...line([0, 2, 4, 1, 3, 0].map((k) => polar(r * 0.9, -Math.PI / 2 + (k * Math.PI * 2) / 5)), r * 0.03, c)],
  sign: (r, c) => { // the Yellow Sign: three arms turned about a ring, each a hooked curve
    const arm = (a0: number): THREE.BufferGeometry[] => line(Array.from({ length: 13 }, (_, i) => polar(r * (0.1 + 0.8 * Math.pow(i / 12, 0.8)), a0 + (i / 12) * 2.1)), r * 0.04, c);
    return [...circle(r, r * 0.03, c), ...[0, 1, 2].flatMap((k) => arm((k * Math.PI * 2) / 3)), ...circle(r * 0.09, r * 0.03, c, 10)];
  },
  hex: (r, c) => [0, 1, 2, 3, 4, 5].flatMap((k) => [bar(...polar(r, (k * Math.PI) / 3), ...polar(r, ((k + 1) * Math.PI) / 3), r * 0.03, c), bar(...polar(r * 0.55, (k * Math.PI) / 3), ...polar(r * 0.55, ((k + 1) * Math.PI) / 3), r * 0.02, c), bar(...polar(r * 0.55, (k * Math.PI) / 3), ...polar(r, (k * Math.PI) / 3), r * 0.02, c)]),
  spiral: (r, c) => line(Array.from({ length: 64 }, (_, i) => polar(r * (0.05 + 0.95 * (i / 63)), (i / 63) * Math.PI * 5.5)), r * 0.04, c),
  eye: (r, c) => [...line(Array.from({ length: 17 }, (_, i) => [(i / 8 - 1) * r, -Math.sin((i / 16) * Math.PI) * r * 0.42] as const), r * 0.03, c), ...line(Array.from({ length: 17 }, (_, i) => [(i / 8 - 1) * r, Math.sin((i / 16) * Math.PI) * r * 0.42] as const), r * 0.03, c), ...circle(r * 0.2, r * 0.03, c, 14), box(r * 0.07, PROUD, r * 0.3, 0, SUNK + PROUD / 2, 0, c)],
  serpent: (r, c) => { // a snake coiled in two turns, its head a wedge at the outside
    const body = line(Array.from({ length: 56 }, (_, i) => polar(r * (0.12 + 0.82 * Math.pow(i / 55, 0.9)), 0.4 + (i / 55) * Math.PI * 4)), r * 0.06, c);
    const head = polar(r * 0.94, 0.4 + Math.PI * 4);
    return [...body, bar(head[0], head[1], head[0] * 1.05 + 0.1 * r, head[1] * 1.05, r * 0.1, c), ...circle(r, r * 0.02, c)];
  },
};

/** A glyph laid in the ground, glowing. */
export function glyph(p: Prop): Piece[] {
  const c = ANOMALY[p.set?.glow ?? 'purple'];
  const make = GLYPHS[(p.set?.id ?? '').replace('inlay_', '')] ?? GLYPHS.ring;
  return [{ mat: 'glow', geo: merged(make(p.w, c)), light: p.set?.lit, at: [0, 0.6, 0] }];
}

/** A totem: stacked blocks, each turned a little from the last, with a beak and two eyes on its face, a crest of two boards above. */
export function totem(p: Prop): Piece[] {
  const [n, s] = [5, p.h / 5];
  const wood: THREE.BufferGeometry[] = [box(s * 1.15, 0.3, s * 1.15, 0, 0.15, 0, scaleRgb(BARK, 0.8))];
  const eyes: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const turn = (i % 2) * 0.35 - 0.15;
    const [y, k] = [0.3 + i * s * 0.9 + s / 2, 1 - i * 0.05];
    wood.push(tileUv(box(s * k, s * 0.9, s * k, 0, y, 0, scaleRgb(BARK, 0.9 + 0.2 * (i % 2))), s, s).rotateY(turn));
    wood.push(box(s * 0.18, s * 0.2, s * 0.35, 0, y - s * 0.05, s * k * 0.5 + 0.1, scaleRgb(BARK, 1.2)).rotateY(turn)); // the beak
    for (const e of [-1, 1]) eyes.push(box(0.08, 0.08, 0.05, e * s * k * 0.22, y + s * 0.18, s * k * 0.5 + 0.02, [1, 0.62, 0.3]).rotateY(turn));
  }
  const top = 0.3 + (n - 1) * s * 0.9 + s;
  for (const e of [-1, 1]) wood.push(box(s * 0.12, s * 0.9, s * 0.7, e * s * 0.55, top + s * 0.1, 0, scaleRgb(BARK, 1.3)).rotateZ(e * 0.35));
  return [{ mat: 'wood', geo: merged(wood) }, { mat: 'glow', geo: merged(eyes) }];
}

/** A skull on a pole, antlered: what the sabbat sets about its fire. */
export function skullPole(p: Prop): Piece[] {
  const h = p.h;
  const cylGeo = (r0: number, r1: number, len: number, c: Rgb): THREE.BufferGeometry => tint(tileUv(new THREE.CylinderGeometry(r1, r0, len, 5).translate(0, len / 2, 0), 1, len), c);
  const wood = [cylGeo(0.1, 0.07, h, BARK), box(0.5, 0.05, 0.05, 0, h * 0.62, 0, BARK), box(0.05, 0.05, 0.4, 0, h * 0.5, 0, BARK)];
  const bone: THREE.BufferGeometry[] = [
    tint(new THREE.SphereGeometry(0.24, 6, 5).scale(1, 0.9, 1.15).translate(0, h + 0.1, 0), BONE),
    box(0.2, 0.12, 0.2, 0, h - 0.06, 0.16, BONE),
  ];
  for (const e of [-1, 1]) {
    bone.push(cylGeo(0.05, 0.02, 0.7, BONE).rotateZ(e * 0.7).translate(e * 0.14, h + 0.2, 0), cylGeo(0.035, 0.015, 0.4, BONE).rotateZ(e * 1.1).translate(e * 0.4, h + 0.55, 0));
  }
  return [{ mat: 'wood', geo: merged(wood) }, { mat: 'stone', geo: merged(bone) }];
}

/** The horned tree of the black grove: a trunk that swells at its foot, and limbs that climb and fork like antlers. */
export function hornTree(p: Prop): Piece[] {
  const h = p.h;
  const limb = (len: number, r: number, yaw: number, lean: number, y: number): THREE.BufferGeometry[] => {
    const out: THREE.BufferGeometry[] = [];
    let [x, yy, z, a, b] = [0, y, 0, yaw, lean];
    for (let seg = 0; seg < 3; seg++) {
      const l = len / (seg + 1.4);
      const g = tint(tileUv(new THREE.CylinderGeometry(r * 0.6, r, l, 5).translate(0, l / 2, 0), 1, l), BARK).rotateX(b).rotateY(a).translate(x, yy, z);
      out.push(g);
      [x, yy, z] = [x + Math.sin(a) * Math.sin(b) * l, yy + Math.cos(b) * l, z + Math.cos(a) * Math.sin(b) * l];
      a += seg % 2 ? 0.5 : -0.5; // forks
      b = Math.max(0.2, b * 0.7);
      r *= 0.6;
    }
    return out;
  };
  const parts = [tint(tileUv(new THREE.CylinderGeometry(p.w * 0.5, p.w * 1.6, 0.8, 7).translate(0, 0.4, 0), 2, 1), scaleRgb(BARK, 0.8)), tint(tileUv(new THREE.CylinderGeometry(p.w * 0.35, p.w * 0.55, h * 0.75, 7, 4).translate(0, 0.8 + h * 0.375, 0), 2, h), BARK)];
  for (let k = 0; k < 7; k++) parts.push(...limb(h * 0.4, p.w * 0.28, k * 2.4 + p.seed * 0.001, 0.5 + 0.25 * (k % 3), h * (0.55 + 0.05 * k)));
  return [{ mat: 'wood', geo: merged(parts) }];
}
