/**
 * A window's grate (round 125: world/dungeonWalls.ts): upright iron bars a hand apart in a flat frame, with two cross bands, filling
 * the opening the part's box spans. The box itself stops feet and eyes (a window is looked through, never passed); the bars are what the
 * picture draws, so the room beyond shows between them. Render only.
 */

import type * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { V3 } from '../core/geom';
import { box } from './meshKit';
import type { Rgb } from './palette';

const IRON: Rgb = [0.27, 0.26, 0.28];
const BAR = 0.055; // a bar's thickness
const GAP = 0.2; // from bar to bar

/** The bars, bands and frame of a grate filling the box from `min` to `max`. */
export function grateGeometry(min: V3, max: V3): THREE.BufferGeometry {
  const [w, h, d] = [max.x - min.x, max.y - min.y, max.z - min.z];
  const alongX = w >= d;
  const [len, cx, cy, cz] = [alongX ? w : d, (min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2];
  const piece = (a: number, y: number, along: number, high: number, thick = BAR): THREE.BufferGeometry =>
    alongX ? box(along, high, thick, cx + a, y, cz, IRON) : box(thick, high, along, cx, y, cz + a, IRON);
  const parts: THREE.BufferGeometry[] = [];
  const n = Math.max(2, Math.round(len / GAP));
  for (let k = 1; k < n; k++) parts.push(piece(-len / 2 + (k * len) / n, cy, BAR, h));
  for (const y of [min.y + h * 0.36, min.y + h * 0.72]) parts.push(piece(0, y, len, BAR * 1.4, BAR * 1.6));
  parts.push(piece(0, min.y + BAR, len, BAR * 2, BAR * 2), piece(0, max.y - BAR, len, BAR * 2, BAR * 2)); // the frame's sill and head
  for (const s of [-1, 1]) parts.push(piece((s * (len - BAR * 2)) / 2, cy, BAR * 2, h, BAR * 2));
  return mergeGeometries(parts);
}
