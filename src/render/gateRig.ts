/**
 * A gate hung (round 76; data/gateStyles.ts says what each arena's gate is made of, render/gateViews.ts moves it): the baked models of its parts
 * fitted to the gate's opening, coloured as the world's own stone, wood and metal are (render/modelKit.ts), and turned into pieces about the point
 * each part moves from: a hinge at its jamb for a leaf that swings, its middle for one that slides, lifts or sinks. In the door's own frame, as the
 * hidden passages' (u along the wall, v through it, y up from the floor). Render only: geometry.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { HiddenPieceDef } from '../data/arena';
import { HOUSE } from '../data/arenaHouses';
import { GATE_STYLES, type GateMotion, type GatePart } from '../data/gateStyles';
import { MODEL_INFO } from '../data/models/index';
import { groundShade } from './meshKit';
import { modelPiecesOf } from './modelKit';
import { ANOMALY, type Rgb } from './palette';
import { rune } from './passageShapes';
import type { Piece } from './propShapes';

/** A part of a gate, ready to be moved: its pieces about its pivot, and how the pivot goes as the gate opens. */
export interface RigPart {
  pieces: Piece[];
  glow: THREE.BufferGeometry | null; // runes of the house's glow, on both faces
  pivot: readonly [u: number, y: number, v: number]; // where it stands in the door's frame
  move: GateMotion;
  hinge: -1 | 0 | 1; // a swung leaf's jamb
  delay: number;
  reach: number; // metres a slid leaf goes sideways, a lifted one up, a sunk one down
  width: number; // metres across (its share of the opening)
}

export interface GateRig {
  parts: RigPart[];
  open: number; // degrees a swung leaf turns
  sound: string; // the kit whose door it sounds as
}

const BASE_Y = 0.3; // metres a leaf stands below the floor, as the seal does, unless the part says
const RUNE = 1.7; // metres between the runes down a leaf

/** Runes down the middle of a leaf, on both faces: `face` metres through the wall from the leaf's middle. */
function runes(c: Rgb, u: number, height: number, width: number, face: number): THREE.BufferGeometry {
  const size = Math.min(1.1, Math.max(0.3, width * 0.2));
  const n = Math.max(2, Math.round(height / RUNE));
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < n; i++) parts.push(...rune(i + (side > 0 ? 1 : 0), u, height * (0.14 + (0.72 * i) / Math.max(1, n - 1)), size, side * face, c));
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
}

/** One part: fitted, coloured and set about its pivot. */
function hang(p: GatePart, def: HiddenPieceDef, move: GateMotion, stone: Rgb): RigPart | null {
  const door = def.door!;
  const info = MODEL_INFO[p.model];
  if (!info) return null;
  const [D, H, T] = [door.width + 2 * HOUSE.lap, door.height, door.thick]; // (the leaves reach to where the seal does, under the towers or the piers: no light shows through a way that is shut)
  const [mw, mh, md] = [info.x1 - info.x0, info.y1 - info.y0, Math.max(0.02, info.z1 - info.z0)];
  const base = p.base ?? BASE_Y;
  let [sx, sy, sz] = [1, 1, 1];
  let [u, width, tall] = [0, mw, mh];
  if (p.span) {
    [width, tall] = [(p.span[1] - p.span[0]) * D, H * (p.tall ?? 1) + base];
    [sx, sy] = [width / mw, tall / mh];
    sz = Math.min(Math.min(sx, sy), (T * (p.thin ?? 0.9)) / md);
    u = ((p.span[0] + p.span[1]) / 2) * D;
  } else {
    const k = (p.h ?? mh) / mh;
    [sx, sy, sz] = [k, k, k];
    [width, tall] = [mw * k, mh * k];
    const j = p.jamb ?? 0;
    u = j * (D / 2 + (p.out ?? 0));
  }
  const look = { id: p.model, scale: 1, stretch: [sx, sy, sz] as const, tint: p.tint, keep: p.keep, dye: p.dye };
  const pieces = modelPiecesOf(look, stone);
  if (!pieces.length) return null;
  if (p.dim !== undefined) for (const piece of pieces) if (piece.mat !== 'glow') { const c = piece.geo.getAttribute('color').array as Float32Array; for (let i = 0; i < c.length; i++) c[i] *= p.dim; }
  const hinge: -1 | 0 | 1 = move === 'swing' ? (p.span ? (p.span[0] <= -0.5 + 1e-6 ? -1 : p.span[1] >= 0.5 - 1e-6 ? 1 : 0) : 0) : 0;
  const pivotU = hinge ? hinge * (D / 2) : u;
  const lift = p.span ? 0 : p.y ?? 0;
  for (const piece of pieces) {
    if (piece.mat !== 'glow') groundShade(piece.geo, 0.62, 2);
    if (p.roll) piece.geo.translate(0, -tall / 2, 0).rotateZ((p.roll * Math.PI) / 180).translate(0, tall / 2, 0);
    piece.geo.translate(u - pivotU, -(p.span ? base : 0) + lift, 0);
  }
  const face = (md * sz) / 2 + 0.03;
  const glow = p.glyphs ? runes(ANOMALY[def.glow], u - pivotU, tall - base, width, face) : null;
  const reach = move === 'slide' ? width + 0.45 : move === 'lift' ? H * (p.tall ?? 1) + 0.6 : move === 'sink' ? tall + 0.3 : 0;
  return { pieces, glow, pivot: [pivotU, 0, p.v ?? 0], move, hinge, delay: p.delay ?? 0, reach, width };
}

/** The rig of a house's gate by its style, or null where it has none (or the models are not read yet). */
export function gateRig(def: HiddenPieceDef, stone: Rgb): GateRig | null {
  const style = def.door?.style ? GATE_STYLES[def.door.style] : undefined;
  if (!style) return null;
  const parts: RigPart[] = [];
  for (const p of style.parts) {
    const part = hang(p, def, p.move ?? style.motion, stone);
    if (!part) return null; // (a model not decoded yet: made again later)
    parts.push(part);
  }
  return { parts, open: style.open ?? 100, sound: style.sound };
}
