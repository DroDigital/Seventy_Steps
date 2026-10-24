/**
 * The shapes of the secret passages (round 61, asked: "enhance the visual design of secret passages"; render/hiddenViews.ts moves them).
 * A hidden doorway was three plain blocks banded with the same glowing stripe every half metre, and a slab of plain wall; a hidden
 * bridge a single plank of the same. Now a doorway is a framed door of cut stone: a plinth and a capital to each jamb, a lintel with a
 * cornice and a keystone, runes carved down the jambs and an eye on the keystone, on both faces of the wall; the wall that fills it is
 * a slab that carries, once the mind is ready for it, a faint outline of the door and the same eye; and a bridge is a row of
 * slabs, each edged with light and set with a rune, that rise across the gap one after another. All in a frame of their own: u along
 * the wall (or the bridge), v through it, y up from the floor. Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { HiddenPieceDef } from '../data/arena';
import { box, tileUv } from './meshKit';
import { ANOMALY, BASE, scaleRgb, type Rgb } from './palette';

export const STONE: Rgb = scaleRgb(BASE.seaGrey, 1.8); // cold stone, unlike the arena's
export const WALL: Rgb = scaleRgb(BASE.bone, 0.9); // the plain wall a hidden door hides behind (as the dungeon's walls are)
const PROUD = 0.1; // metres a carved line is thick, standing 7 cm out of its face (round 19: at 1.5 cm the PS1's snapping sank them into the stone)

const merged = (parts: THREE.BufferGeometry[]): THREE.BufferGeometry => (parts.length ? mergeGeometries(parts) : new THREE.BufferGeometry());

/** One carved line on a face at v = `face`: centred at (u, y), `w` across and `h` high. */
const line = (u: number, y: number, w: number, h: number, face: number, c: Rgb): THREE.BufferGeometry => box(w, h, PROUD, u, y, face + Math.sign(face) * (PROUD / 2 - 0.03), c);

/** A rune of one of four kinds, about `s` metres high, centred at (u, y) on the face at v = `face`. */
export function rune(kind: number, u: number, y: number, s: number, face: number, c: Rgb): THREE.BufferGeometry[] {
  const t = 0.045;
  switch (kind % 4) {
    case 0: // a stem with a branch up one side and down the other: the Elder Sign's own idea
      return [line(u, y, t, s, face, c), line(u - s * 0.28, y + s * 0.2, s * 0.5, t, face, c), line(u + s * 0.28, y - s * 0.2, s * 0.5, t, face, c)];
    case 1: // a square about a point
      return [line(u, y + s * 0.4, s * 0.8, t, face, c), line(u, y - s * 0.4, s * 0.8, t, face, c), line(u - s * 0.4, y, t, s * 0.8, face, c), line(u + s * 0.4, y, t, s * 0.8, face, c), line(u, y, t * 1.6, t * 1.6, face, c)];
    case 2: // two bars over a stem, a hanged man's gate
      return [line(u, y, t, s, face, c), line(u, y + s * 0.3, s * 0.7, t, face, c), line(u, y - s * 0.05, s * 0.45, t, face, c)];
    default: // a slit and a pupil: the eye
      return [line(u, y + s * 0.16, s * 0.8, t, face, c), line(u, y - s * 0.16, s * 0.8, t, face, c), line(u, y, t * 1.8, s * 0.3, face, c)];
  }
}

export interface DoorKit {
  stone: THREE.BufferGeometry; // the frame
  glow: THREE.BufferGeometry; // its runes, its eye and the line across its lintel
  slab: THREE.BufferGeometry; // the plug of wall that fills the opening, from a little below the floor to the lintel
  slabGlow: THREE.BufferGeometry; // an outline of the door and its eye, on the slab's faces: the passage awake but shut
  width: number; // the opening
  height: number;
  lift?: number; // round 68: the slab goes up (or, negative, down) this many metres instead of into the wall (render/gateLooks.ts)
}

/** A hidden doorway. `sealed` (Kadath's door, shut on the seals): the slab is cut stone, not wall. */
export function doorKit(p: HiddenPieceDef): DoorKit {
  const { width: D, height: H, thick: T } = p.door!;
  const glow = ANOMALY[p.glow];
  const [W2, TF] = [D / 2, T + 0.14];
  const edge = W2 + 0.17; // a jamb's middle
  const stone: THREE.BufferGeometry[] = [];
  const part = (w: number, h: number, d: number, u: number, y: number): void => void stone.push(tileUv(box(w, h, d, u, y, 0, STONE, 0.5), Math.max(w, d), h));
  for (const s of [-1, 1]) {
    part(0.34, H + 0.1, TF, s * edge, (H + 0.1) / 2); // the jamb,
    part(0.5, 0.28, TF + 0.08, s * edge, 0.14); // its plinth,
    part(0.5, 0.2, TF + 0.08, s * edge, H - 0.05); // and its capital
  }
  part(D + 0.96, 0.34, TF, 0, H + 0.17); // the lintel,
  part(0.46, 0.58, TF + 0.1, 0, H + 0.1); // the keystone set into it,
  part(D + 1.1, 0.1, TF + 0.12, 0, H + 0.39); // and a cornice over all
  const carved: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const face = side * (TF / 2 + 0.01); // both faces of the wall
    for (const s of [-1, 1]) {
      const n = Math.max(3, Math.round(H / 0.6)); // runes down each jamb, of kinds that run through the four
      for (let i = 0; i < n; i++) carved.push(...rune(i + (s > 0 ? 1 : 0), s * edge, 0.62 + (i * (H - 1.0)) / Math.max(1, n - 1), 0.2, face, glow));
    }
    carved.push(line(0, H + 0.1, D + 0.6, 0.04, face, glow)); // a line across the lintel,
    carved.push(...rune(3, 0, H + 0.12, 0.34, face + side * 0.05, glow)); // and the eye on the keystone
  }
  const slabStone = p.seal?.look === 'sealed' ? STONE : WALL;
  const slab = tileUv(box(D, H + 0.3, T, 0, (H + 0.3) / 2 - 0.3, 0, slabStone, 1), D, H + 0.3);
  const outline: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const face = side * (T / 2 - 0.01); // 5 cm proud of the slab's face
    const [iu, top, foot] = [W2 - 0.2, H - 0.2, 0.2];
    outline.push(line(0, top, iu * 2, 0.04, face, glow), line(0, foot, iu * 2, 0.04, face, glow), line(-iu, (top + foot) / 2, 0.04, top - foot, face, glow), line(iu, (top + foot) / 2, 0.04, top - foot, face, glow));
    outline.push(...rune(3, 0, H * 0.58, 0.5, face, glow), ...rune(0, 0, H * 0.3, 0.36, face, glow));
  }
  return { stone: merged(stone), glow: merged(carved), slab, slabGlow: merged(outline), width: D, height: H };
}

export interface BridgeSegment {
  stone: THREE.BufferGeometry;
  glow: THREE.BufferGeometry;
  u: number; // its middle along the span
}

/** A hidden bridge as a row of slabs from brink to brink, each edged with light and, every other one, set with a rune. */
export function bridgeKit(p: HiddenPieceDef): BridgeSegment[] {
  const { half, width } = p.bridge!;
  const glow = ANOMALY[p.glow];
  const n = Math.max(6, Math.round((half * 2) / 0.9));
  const len = (half * 2) / n;
  return Array.from({ length: n }, (_, i): BridgeSegment => {
    const u = -half + len * (i + 0.5);
    const stone = tileUv(box(len - 0.05, 0.4, width, u, -0.2, 0, STONE, 0.5), len, width);
    const lit: THREE.BufferGeometry[] = [];
    for (const s of [-1, 1]) lit.push(box(len - 0.14, 0.05, 0.07, u, 0.0, s * (width / 2 - 0.09), glow)); // an edge of light along each side, standing 5 cm proud of the deck
    if (i % 2 === 1) lit.push(box(0.05, 0.05, width * 0.5, u, 0.0, 0, glow), box(len * 0.45, 0.05, 0.05, u, 0.0, 0.0, glow)); // a rune on the top: a stem across and a bar
    return { stone, glow: merged(lit), u };
  });
}
