/**
 * What shuts a house's gate, besides the slab that draws aside into the wall (round 68; data/arenaHouses.ts `GateLook`; render/passageShapes.ts
 * has the common door and dispatches here): a sluice, an iron panel that lifts into a housing built over the gate, which is the dam's valve
 * tower, with its handwheel on both faces; and a boulder in a ford, set between two menhirs under a capstone, that sinks into the earth.
 * In the door's own frame (u along the wall, v through it, y up from the floor), as `doorKit`'s: the frame is the stone, the glow its runes,
 * the slab what moves, and `lift` how far (and which way: up into the housing, or down into the ground). Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { HiddenPieceDef } from '../data/arena';
import { box, tileUv, tint } from './meshKit';
import { ANOMALY, BASE, mixRgb, scaleRgb, type Rgb } from './palette';
import { doorKit, rune, STONE, WALL, type DoorKit } from './passageShapes';

const IRON: Rgb = scaleRgb(BASE.charcoal, 1.5);
const RUST: Rgb = mixRgb(IRON, BASE.rust, 0.5);
const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
const rnd = (i: number): number => {
  const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return s - Math.floor(s);
};

/** A handwheel on the face at v = `face`, its middle at (0, y): a rim, a hub and four spokes. */
function wheel(y: number, face: number, c: Rgb): THREE.BufferGeometry[] {
  const out = [tint(new THREE.TorusGeometry(0.85, 0.12, 5, 12).translate(0, y, face + Math.sign(face) * 0.2), c), box(0.3, 0.3, 0.34, 0, y, face + Math.sign(face) * 0.2, c)];
  for (const a of [0, Math.PI / 2]) out.push(tint(new THREE.BoxGeometry(1.7, 0.1, 0.1).rotateZ(a).translate(0, y, face + Math.sign(face) * 0.2), c));
  return out;
}

/** The door of a gate by its look: the common framed door (render/passageShapes.ts), a sluice or a boulder. */
export function gateKit(p: HiddenPieceDef): DoorKit {
  const base = doorKit(p);
  return p.door!.look === 'sluice' ? sluiceKit(p, base) : p.door!.look === 'boulder' ? boulderKit(p, base) : base;
}

/** The sluice: the door's frame as a house's gate, the housing of stone over it, an iron panel that lifts into the housing. */
export function sluiceKit(p: HiddenPieceDef, base: DoorKit): DoorKit {
  const { width: D, height: H, thick: T } = p.door!;
  const TF = T + 0.14;
  const stone: THREE.BufferGeometry[] = [base.stone];
  const part = (w: number, h: number, d: number, y: number, c: Rgb = STONE): void => void stone.push(tileUv(box(w, h, d, 0, y, 0, c, 0.5), Math.max(w, d), h));
  const [top, house] = [H + 0.5, H * 0.96]; // the housing: from over the cornice, as tall as the opening
  part(D + 1.5, house, TF + 0.7, top + house / 2, scaleRgb(STONE, 0.92)); // the valve tower
  part(D + 1.9, 0.5, TF + 0.9, top + house + 0.25, scaleRgb(STONE, 1.1)); // its cap
  part(D + 1.2, 0.3, TF + 0.5, top + house * 0.5, scaleRgb(STONE, 1.12)); // a string course
  const glow: THREE.BufferGeometry[] = [base.glow];
  const iron: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const face = side * (TF / 2 + 0.36);
    iron.push(...wheel(top + house * 0.48, face, IRON)); // the handwheel, a rod in a collar beneath it
    iron.push(box(0.22, house * 0.5, 0.22, 0, top + house * 0.2, face + side * 0.05, IRON));
    glow.push(...rune(3, 0, top + house * 0.82, 0.8, face + side * 0.05, ANOMALY[p.glow]));
  }
  const slab: THREE.BufferGeometry[] = [box(D, H + 0.3, T * 0.8, 0, (H + 0.3) / 2 - 0.3, 0, IRON), box(D - 0.2, 0.4, T * 0.8 + 0.1, 0, H - 0.2, 0, RUST)]; // the panel and its top rail
  for (let u = -D / 2 + 0.6; u < D / 2; u += 0.9) slab.push(box(0.2, H, T * 0.8 + 0.12, u, H / 2 - 0.1, 0, RUST)); // and its ribs, on both faces
  return { ...base, stone: merged([...stone, ...iron]), glow: merged(glow), slab: merged(slab), lift: top + house * 0.5 };
}

/** The boulder: two menhirs and a capstone, rough, and a boulder as big as the gap between them, which sinks into the earth. */
export function boulderKit(p: HiddenPieceDef, base: DoorKit): DoorKit {
  const { width: D, height: H, thick: T } = p.door!;
  const TF = T + 0.5;
  const stone: THREE.BufferGeometry[] = [];
  const rough = (w: number, h: number, d: number, x: number, y: number, lean: number): void => void stone.push(tileUv(box(w, h, d, 0, 0, 0, WALL, 0.6).rotateZ(lean).translate(x, y, 0), Math.max(w, d), h));
  for (const s of [-1, 1]) rough(1.3, H + 1.4, TF, s * (D / 2 + 0.55), (H + 1.4) / 2 - 0.3, s * 0.035); // the menhirs, leaning a little away
  rough(D + 3.2, 0.9, TF + 0.2, 0, H + 0.45, 0); // the capstone
  const glow: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const face = side * (TF / 2 + 0.01);
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) glow.push(...rune(i + (s > 0 ? 1 : 0), s * (D / 2 + 0.55), 0.8 + i * 0.95, 0.3, face, ANOMALY[p.glow]));
    glow.push(...rune(3, 0, H + 0.45, 0.5, face + side * 0.05, ANOMALY[p.glow]));
  }
  const r = D * 0.52;
  const rock = new THREE.IcosahedronGeometry(r, 2).toNonIndexed();
  const pos = rock.getAttribute('position');
  for (let i = 0; i < pos.count; i += 3) { // each face is moved as one, so the rock stays faceted
    const k = 1 + (rnd(Math.floor(i / 3)) - 0.5) * 0.14;
    for (let j = 0; j < 3; j++) pos.setXYZ(i + j, pos.getX(i + j) * k, pos.getY(i + j) * k, pos.getZ(i + j) * k);
  }
  rock.scale(1, 0.9, Math.min(1, (T * 1.1) / (2 * r))).translate(0, r * 0.9 - 0.4, 0);
  const slab = tint(tileUv(rock, r, r), WALL);
  const outline: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) outline.push(...rune(3, 0, r * 0.9 + 0.2, 0.9, side * (T * 0.55 + 0.03), ANOMALY[p.glow])); // the eye, on the boulder's faces
  return { ...base, stone: merged(stone), glow: merged(glow), slab, slabGlow: merged(outline), lift: -(r * 1.9 + 0.5) };
}
