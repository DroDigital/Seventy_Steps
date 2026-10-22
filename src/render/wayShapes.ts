/**
 * The built things of the ways (round 62; render/wayViews.ts draws them where systems/ways.ts says they are): a plate in the ground, a hexagon
 * of stone with a rune glowing on it; the tablet that shows the rune that is safe, a slab on its edge with the same rune cut large; and the
 * lights of a rite, each a post of its own height with a flame at its top. In their own frames, the foot at the origin. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { LightLook } from '../data/arenaWays';
import { box, tint, tileUv } from './meshKit';
import { BASE, scaleRgb, type Rgb } from './palette';

const STONE: Rgb = scaleRgb(BASE.seaGrey, 1.9);
const WOOD: Rgb = [0.4, 0.32, 0.26];
const IRON: Rgb = [0.26, 0.26, 0.28];
const WAX: Rgb = [0.9, 0.86, 0.7];
const FLAME: Rgb = [1, 0.8, 0.45];
const T = 0.07; // a rune's line

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;

/** A flat rune of four kinds (the same four as the passages', render/passageShapes.ts), `s` across, lying in the XZ plane at height `y`. */
export function runeFlat(kind: number, s: number, y: number, c: Rgb): THREE.BufferGeometry {
  const line = (x: number, z: number, w: number, d: number): THREE.BufferGeometry => box(w, 0.05, d, x, y, z, c);
  switch (((kind % 4) + 4) % 4) {
    case 0: // a stem with a branch up one side and down the other: the Elder Sign's own idea
      return merged([line(0, 0, T, s), line(-s * 0.28, -s * 0.2, s * 0.5, T), line(s * 0.28, s * 0.2, s * 0.5, T)]);
    case 1: // a square about a point
      return merged([line(0, -s * 0.4, s * 0.8, T), line(0, s * 0.4, s * 0.8, T), line(-s * 0.4, 0, T, s * 0.8), line(s * 0.4, 0, T, s * 0.8), line(0, 0, T * 1.6, T * 1.6)]);
    case 2: // two bars over a stem
      return merged([line(0, 0, T, s), line(0, -s * 0.3, s * 0.7, T), line(0, s * 0.05, s * 0.45, T)]);
    default: // a slit and a pupil: the eye
      return merged([line(0, -s * 0.16, s * 0.8, T), line(0, s * 0.16, s * 0.8, T), line(0, 0, T * 1.8, s * 0.3)]);
  }
}

export interface PlateShape {
  stone: THREE.BufferGeometry;
  rune: THREE.BufferGeometry;
}

/** A plate: a hexagon of stone sunk to its face, and its rune. */
export function plateShape(kind: number, radius = 0.95): PlateShape {
  const slab = tileUv(tint(new THREE.CylinderGeometry(radius, radius * 1.04, 0.16, 6).translate(0, 0.02, 0), STONE), radius * 2, radius * 2);
  return { stone: slab, rune: runeFlat(kind, radius * 1.1, 0.115, [1, 1, 1]) };
}

export interface TabletShape {
  stone: THREE.BufferGeometry;
  rune: THREE.BufferGeometry;
}

/** The tablet: a slab on its edge, the rune cut large and standing proud of its face (which looks along +z). */
export function tabletShape(kind: number): TabletShape {
  const stone = tileUv(merged([box(1.0, 1.8, 0.24, 0, 0.9, 0, STONE), box(1.2, 0.18, 0.4, 0, 0.09, 0, scaleRgb(STONE, 0.8))]), 1, 2);
  const flat = runeFlat(kind, 0.72, 0, [1, 1, 1]).rotateX(Math.PI / 2).translate(0, 1.1, 0.14); // stood up on its face
  return { stone, rune: flat };
}

export interface LightShape {
  body: THREE.BufferGeometry;
  flame: THREE.BufferGeometry;
  top: number; // the height of the wick
}

/** A light of a rite `height` metres tall (the foot to the top of its flame's seat). */
export function lightShape(look: LightLook, height: number): LightShape {
  const cyl = (r0: number, r1: number, h: number, sides: number, y: number, c: Rgb): THREE.BufferGeometry => tint(new THREE.CylinderGeometry(r1, r0, h, sides).translate(0, y + h / 2, 0), c);
  const parts: THREE.BufferGeometry[] = [];
  let top = height;
  switch (look) {
    case 'candle': // a taper of tallow on a dish, as tall as it is asked
      parts.push(cyl(0.22, 0.2, 0.06, 7, 0, IRON), cyl(0.06 + height * 0.03, 0.05 + height * 0.025, height, 6, 0.04, WAX));
      top = height + 0.04;
      break;
    case 'brazier': // a bowl on three legs
      for (let i = 0; i < 3; i++) parts.push(tint(new THREE.CylinderGeometry(0.03, 0.04, height, 4).rotateZ(0.18).rotateY((i / 3) * Math.PI * 2).translate(0, height / 2, 0), IRON));
      parts.push(cyl(0.34, 0.2, 0.22, 7, height - 0.1, IRON));
      top = height + 0.14;
      break;
    case 'fire': // a ring of stones about a fire laid on the ground, and a post that stands to its height
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        parts.push(box(0.3, 0.2, 0.24, Math.cos(a) * 0.45, 0.1, Math.sin(a) * 0.45, STONE).rotateY(-a));
      }
      parts.push(cyl(0.05, 0.04, height, 5, 0, WOOD));
      top = height;
      break;
    case 'glow': // a stalk of pale stone with a bulb at its head
      parts.push(cyl(0.16, 0.07, height, 6, 0, scaleRgb(STONE, 1.2)), tint(new THREE.SphereGeometry(0.16, 6, 5).translate(0, height + 0.08, 0), scaleRgb(STONE, 1.3)));
      top = height + 0.2;
      break;
    default: // a lamp: a post and a lantern at its top
      parts.push(cyl(0.1, 0.06, height, 6, 0, IRON), box(0.3, 0.34, 0.3, 0, height + 0.17, 0, IRON), box(0.36, 0.05, 0.36, 0, height + 0.37, 0, IRON));
      top = height + 0.18;
  }
  return { body: merged(parts), flame: tint(new THREE.ConeGeometry(0.17, 0.55, 6).translate(0, top + 0.2, 0), FLAME), top: top + 0.35 };
}
