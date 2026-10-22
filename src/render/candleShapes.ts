/**
 * What a candle before the fog stands on (round 62, asked: "visually understated and contextually appropriate"; render/candleViews.ts
 * draws them, world/candlePlan.ts says which each is): a stub of tallow, a finger's breadth and a hand high, set on what the place has: a
 * small cairn of flat stones, a skull, the foot of a gravestone, a piece of driftwood with a shell, a votive dish on a block. Each is
 * under half a metre across, with a few drips of wax on it and, on the cairn and the stone, one scratched branch of the sign in chalk:
 * the sleeper who left it made no more of it than that. In its own frame: the foot at the origin. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CandleLook } from '../data/arenaSets';
import { box, tint } from './meshKit';
import type { Rgb } from './palette';

const STONE: Rgb = [0.58, 0.57, 0.55];
const MOSS: Rgb = [0.3, 0.34, 0.28];
const BONE: Rgb = [0.86, 0.82, 0.72];
const WOOD: Rgb = [0.68, 0.62, 0.54];
const CLAY: Rgb = [0.5, 0.34, 0.26];
const TALLOW: Rgb = [0.9, 0.86, 0.7];
const CHALK: Rgb = [0.86, 0.84, 0.78];
const SOOT: Rgb = [0.16, 0.15, 0.15];

export interface CandleBody {
  geo: THREE.BufferGeometry;
  top: number; // the height of the wick above the ground
}

/** The stub with a drip or two down it, its foot at height `y`. */
const stub = (x: number, y: number, z: number, h = 0.2): THREE.BufferGeometry[] => [
  box(0.07, h, 0.07, x, y + h / 2, z, TALLOW),
  box(0.1, 0.05, 0.1, x, y + 0.025, z, TALLOW), // the pool it has made at its foot
  box(0.02, h * 0.45, 0.02, x + 0.036, y + h * 0.72, z, TALLOW), // a drip
];

const cyl = (r0: number, r1: number, h: number, sides: number, x: number, y: number, z: number, c: Rgb): THREE.BufferGeometry => tint(new THREE.CylinderGeometry(r1, r0, h, sides).translate(x, y + h / 2, z), c);

/** A stone with a face scratched on it: one branch of the sign, a hand long. */
const scratch = (x: number, y: number, z: number): THREE.BufferGeometry[] => [box(0.025, 0.2, 0.012, x, y, z, CHALK), box(0.12, 0.022, 0.012, x - 0.04, y + 0.04, z, CHALK)];

const BODIES: Readonly<Record<CandleLook, () => { parts: THREE.BufferGeometry[]; top: number }>> = {
  cairn: () => ({
    parts: [
      box(0.46, 0.1, 0.38, 0, 0.05, 0, STONE), box(0.34, 0.09, 0.28, 0.03, 0.145, -0.02, scaleRgb(STONE, 1.12)), box(0.22, 0.08, 0.2, -0.02, 0.23, 0.01, STONE),
      box(0.09, 0.05, 0.08, 0.3, 0.025, 0.1, STONE), box(0.07, 0.04, 0.07, -0.28, 0.02, -0.14, STONE), box(0.06, 0.04, 0.06, 0.1, 0.02, 0.27, STONE), // a few pebbles about it
      ...scratch(0, 0.07, 0.196), ...stub(-0.02, 0.27, 0.01),
    ],
    top: 0.5,
  }),
  skull: () => ({
    parts: [
      tint(new THREE.SphereGeometry(0.13, 7, 5).scale(1, 0.92, 1.12).translate(0, 0.14, 0), BONE), box(0.13, 0.07, 0.12, 0, 0.05, 0.1, BONE), // the cranium, and the jaw
      box(0.05, 0.04, 0.012, -0.045, 0.16, 0.14, SOOT), box(0.05, 0.04, 0.012, 0.045, 0.16, 0.14, SOOT), // its sockets
      box(0.3, 0.025, 0.04, 0.12, 0.014, -0.08, BONE), box(0.04, 0.025, 0.24, -0.16, 0.014, 0.02, BONE), // a bone or two laid by it
      ...stub(0, 0.25, 0, 0.17),
    ],
    top: 0.5,
  }),
  grave: () => ({
    parts: [
      box(0.36, 0.44, 0.08, 0, 0.22, -0.08, scaleRgb(STONE, 0.95)), tint(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 8, 1, false, 0, Math.PI).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, 0.44, -0.08), scaleRgb(STONE, 0.95)),
      box(0.4, 0.07, 0.3, 0, 0.035, 0.1, scaleRgb(STONE, 0.8)), box(0.3, 0.02, 0.2, 0.02, 0.07, 0.1, MOSS), // a ledge before it, mossed
      ...scratch(0, 0.3, -0.04), ...stub(0, 0.08, 0.1),
    ],
    top: 0.32,
  }),
  driftwood: () => ({
    parts: [
      cyl(0.07, 0.06, 0.62, 6, 0, 0, 0, WOOD).rotateZ(Math.PI / 2).translate(0, 0.07, 0), // a bleached limb, lying
      cyl(0.04, 0.03, 0.28, 5, 0.18, 0, 0, WOOD).rotateZ(1.2).translate(0.1, 0.12, 0.05), // and its fork
      tint(new THREE.ConeGeometry(0.1, 0.16, 7).rotateZ(Math.PI / 2).translate(-0.2, 0.09, 0.2), BONE), // a shell beside it
      box(0.16, 0.025, 0.12, 0.08, 0.14, -0.02, scaleRgb(BONE, 0.9)), // a flat shell laid on it for a dish
      ...stub(0.08, 0.15, -0.02, 0.17),
    ],
    top: 0.4,
  }),
  votive: () => ({
    parts: [
      box(0.36, 0.2, 0.3, 0, 0.1, 0, STONE), box(0.4, 0.04, 0.34, 0, 0.22, 0, scaleRgb(STONE, 1.1)), // a block of stone, and its cap
      cyl(0.13, 0.1, 0.05, 7, 0, 0.24, 0, CLAY), // a dish of clay
      box(0.14, 0.012, 0.12, 0.06, 0.2, 0.14, SOOT), // soot above where the flame has been
      ...stub(0, 0.29, 0, 0.17),
    ],
    top: 0.52,
  }),
};

const scaleRgb = (c: Rgb, k: number): Rgb => [c[0] * k, c[1] * k, c[2] * k];

/** The body of a candle of `look`: one merged geometry. */
export function candleBody(look: CandleLook): CandleBody {
  const { parts, top } = BODIES[look]();
  return { geo: mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!, top };
}
