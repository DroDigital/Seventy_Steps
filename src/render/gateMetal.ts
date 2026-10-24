/**
 * The gates of iron and bronze (round 71; data/arenaHouses.ts `GateLook`; render/gateLooks.ts dispatches here): a burying ground's barred
 * gate, a keep's portcullis lifted into the arch over it, and the two leaves of a marble court's bronze doors. In the door's own frame
 * (u along the wall, v through it, y up from the floor), as `doorKit`'s: the frame is the stone, the glow its runes, the slab what moves.
 * Bars show the way through them; the leaves are shut panels. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { HiddenPieceDef } from '../data/arena';
import { box } from './meshKit';
import { BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import type { DoorKit } from './passageShapes';

const IRON: Rgb = scaleRgb(BASE.charcoal, 1.45);
const RUST: Rgb = mixRgb(IRON, BASE.rust, 0.45);
const BRONZE: Rgb = [0.42, 0.34, 0.2];
const GREEN: Rgb = [0.24, 0.36, 0.3]; // its verdigris
const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));

/** A grille: bars every `gap` metres between two rails, tipped with a spear (a diamond of a box turned) when `spears`. */
function grille(D: number, H: number, T: number, gap: number, spears: boolean, bottom: number): THREE.BufferGeometry[] {
  const t = Math.min(T, 0.16);
  const out: THREE.BufferGeometry[] = [box(D, 0.14, t * 1.4, 0, bottom + 0.1, 0, IRON), box(D, 0.14, t * 1.4, 0, H * 0.5, 0, RUST), box(D, 0.18, t * 1.4, 0, H - 0.5, 0, IRON)];
  const n = Math.max(2, Math.round(D / gap));
  for (let i = 0; i <= n; i++) {
    const u = -D / 2 + 0.07 + ((D - 0.14) * i) / n;
    out.push(box(0.07, H + 0.3 - bottom, t, u, (H + 0.3 + bottom) / 2 - 0.3, 0, i % 2 ? RUST : IRON));
    if (spears) {
      out.push(box(0.15, 0.3, t * 0.7, u, H + 0.12, 0, IRON), box(0.09, 0.22, t * 0.6, u, H + 0.34, 0, IRON));
    }
  }
  return out;
}

/** A gate by its look; `base` is the common framed door (render/passageShapes.ts). */
export function metalKit(p: HiddenPieceDef, base: DoorKit): DoorKit {
  const { width: D, height: H, thick: T } = p.door!;
  const look = p.door!.look;
  const nothing = new THREE.BufferGeometry();
  if (look === 'bars') {
    return { ...base, slab: merged(grille(D, H - 0.3, T, 0.32, true, -0.2)), slabGlow: nothing };
  }
  if (look === 'portcullis') { // lifted into the arch: tall bars with points at the foot, a grid of rails
    const parts = grille(D, H, T, 0.4, false, -0.3);
    for (const y of [H * 0.25, H * 0.75]) parts.push(box(D, 0.12, Math.min(T, 0.16) * 1.3, 0, y, 0, RUST));
    for (let i = 0; i <= Math.round(D / 0.4); i++) parts.push(box(0.12, 0.34, Math.min(T, 0.16) * 0.7, -D / 2 + 0.07 + ((D - 0.14) * i) / Math.round(D / 0.4), -0.45, 0, IRON)); // its points
    return { ...base, slab: merged(parts), slabGlow: nothing, lift: H * 0.96 };
  }
  // leaves: two panels of bronze, ribbed, each with a boss and a ring, and a bar of verdigris across
  const parts: THREE.BufferGeometry[] = [];
  const face = T * 0.5 + 0.03;
  for (const s of [-1, 1]) {
    const mid = (s * D) / 4;
    parts.push(box(D / 2 - 0.04, H + 0.3, T * 0.8, mid, (H + 0.3) / 2 - 0.3, 0, BRONZE));
    for (const side of [-1, 1]) {
      parts.push(box(D / 2 - 0.5, 0.12, 0.08, mid, H * 0.28, side * face, GREEN), box(D / 2 - 0.5, 0.12, 0.08, mid, H * 0.78, side * face, GREEN), box(0.12, H * 0.55, 0.08, mid, H * 0.53, side * face, GREEN));
      parts.push(box(0.34, 0.34, 0.14, mid - s * 0.5, H * 0.5, side * (face + 0.04), GREEN), box(0.18, 0.5, 0.1, mid - s * 0.5, H * 0.5 - 0.5, side * (face + 0.06), IRON));
    }
  }
  parts.push(box(0.12, H + 0.3, T * 0.85, 0, (H + 0.3) / 2 - 0.3, 0, GREEN));
  return { ...base, slab: merged(parts), slabGlow: nothing };
}
