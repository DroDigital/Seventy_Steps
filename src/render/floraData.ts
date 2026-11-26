/**
 * Round 125, the flora library's data (tools/flora/build.py, docs/FLORA.md): the trees, conifers, bushes and undergrowth modelled in
 * Blender by code, their light baked by rays through them, fetched once as the world is made (`loadFlora`: a module of its own, some
 * 1 MB of text) and each model decoded the first time a prop asks for it. A model is its bark (an indexed mesh), its solid leaves (a
 * fungus's caps) and its leaf cards (quads cut out by the leaf atlas), each point with its baked light, its colour's slot and its wind
 * (render/floraKit.ts lays them in a prop's place). Pure of Three.js.
 */

import { FLORA_INDEX, type FloraInfo } from '../data/flora/floraIndex';

let pack: Readonly<Record<string, string>> | null = null;

/** Has the library been read? (Without it, the old forms are drawn: render/treeForms.ts.) */
export const floraReady = (): boolean => pack !== null;

/** Reads the library's data. */
export async function loadFlora(): Promise<void> {
  if (!pack) pack = (await import('../data/flora/floraPack')).FLORA_PACK;
}

/** A mesh of the model: its points' place, normal, light, slot, UV (bark: metres; leaves: the atlas's units), the reach and phase of their bough, and its faces. */
export interface FloraMesh {
  pos: Float32Array;
  nor: Float32Array;
  light: Float32Array;
  slot: Uint8Array;
  uv: Float32Array;
  reach: Float32Array;
  phase: Float32Array;
  flutter: Float32Array;
  index: Uint16Array;
}

/** Its cards: each a centre, two half-axes (across, along toward its cell's head), a cell, whether it hangs from its head, a slot, a light at each corner, a normal, its reach and phase, and the share of its cell it shows. */
export interface FloraCards {
  n: number;
  centre: Float32Array;
  u: Float32Array;
  v: Float32Array;
  cell: Uint8Array;
  hang: Uint8Array;
  slot: Uint8Array;
  light: Float32Array;
  nor: Float32Array;
  reach: Float32Array;
  phase: Float32Array;
  v0: Float32Array;
  v1: Float32Array;
}

export interface FloraModel {
  info: FloraInfo;
  reach: number; // the farthest any point of it stands from its upright axis (metres, as modelled)
  wood: FloraMesh | null;
  leaf: FloraMesh | null;
  cards: FloraCards | null;
}

const decoded = new Map<string, FloraModel | null>();

/** The variants each form has, by `kind.form` (e.g. tree.oak: 4). */
export const FLORA_VARIANTS: ReadonlyMap<string, number> = (() => {
  const m = new Map<string, number>();
  for (const id of Object.keys(FLORA_INDEX)) {
    const form = id.slice(0, id.lastIndexOf('.'));
    m.set(form, (m.get(form) ?? 0) + 1);
  }
  return m;
})();

function mesh(view: DataView, at: { o: number }, points: number, faces: number, lo: number[], hi: number[], atlas: boolean): FloraMesh {
  const m: FloraMesh = { pos: new Float32Array(points * 3), nor: new Float32Array(points * 3), light: new Float32Array(points), slot: new Uint8Array(points), uv: new Float32Array(points * 2), reach: new Float32Array(points), phase: new Float32Array(points), flutter: new Float32Array(points), index: new Uint16Array(faces * 3) };
  for (let i = 0; i < points; i++) {
    for (let k = 0; k < 3; k++) m.pos[i * 3 + k] = lo[k] + ((view.getInt16(at.o + k * 2, true) + 32768) / 65535) * (hi[k] - lo[k]);
    for (let k = 0; k < 3; k++) m.nor[i * 3 + k] = view.getInt8(at.o + 6 + k) / 127;
    m.light[i] = view.getUint8(at.o + 9) / 255;
    m.slot[i] = view.getUint8(at.o + 10);
    const [u, v] = [view.getUint16(at.o + 11, true), view.getUint16(at.o + 13, true)];
    m.uv[i * 2] = atlas ? (u / 65535) * 2 : u / 256;
    m.uv[i * 2 + 1] = atlas ? (v / 65535) * 2 : v / 256;
    m.reach[i] = view.getUint8(at.o + 15) / 255;
    m.phase[i] = view.getUint8(at.o + 16) / 255;
    at.o += 17;
    if (atlas) m.flutter[i] = view.getUint8(at.o++) / 255;
  }
  for (let i = 0; i < faces * 3; i++, at.o += 2) m.index[i] = view.getUint16(at.o, true);
  return m;
}

function cards(view: DataView, at: { o: number }, n: number, lo: number[], hi: number[], half: number): FloraCards {
  const c: FloraCards = { n, centre: new Float32Array(n * 3), u: new Float32Array(n * 3), v: new Float32Array(n * 3), cell: new Uint8Array(n), hang: new Uint8Array(n), slot: new Uint8Array(n), light: new Float32Array(n * 4), nor: new Float32Array(n * 3), reach: new Float32Array(n), phase: new Float32Array(n), v0: new Float32Array(n), v1: new Float32Array(n) };
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) c.centre[i * 3 + k] = lo[k] + ((view.getInt16(at.o + k * 2, true) + 32768) / 65535) * (hi[k] - lo[k]);
    for (let k = 0; k < 3; k++) c.u[i * 3 + k] = (view.getInt8(at.o + 6 + k) / 127) * half;
    for (let k = 0; k < 3; k++) c.v[i * 3 + k] = (view.getInt8(at.o + 9 + k) / 127) * half;
    const cell = view.getUint8(at.o + 12);
    c.cell[i] = cell & 15;
    c.hang[i] = cell & 16 ? 1 : 0;
    c.slot[i] = view.getUint8(at.o + 13);
    for (let k = 0; k < 4; k++) c.light[i * 4 + k] = view.getUint8(at.o + 14 + k) / 255;
    for (let k = 0; k < 3; k++) c.nor[i * 3 + k] = view.getInt8(at.o + 18 + k) / 127;
    c.reach[i] = view.getUint8(at.o + 21) / 255;
    c.phase[i] = view.getUint8(at.o + 22) / 255;
    c.v0[i] = view.getUint8(at.o + 23) / 255;
    c.v1[i] = view.getUint8(at.o + 24) / 255;
    at.o += 25;
  }
  return c;
}

/** The farthest point of a model from its upright axis: its bark, its solid leaves and every card's corners. */
function reachOf(m: FloraModel): number {
  let most = 0;
  for (const part of [m.wood, m.leaf]) for (let i = 0; part && i < part.light.length; i++) most = Math.max(most, Math.hypot(part.pos[i * 3], part.pos[i * 3 + 2]));
  const c = m.cards;
  for (let i = 0; c && i < c.n; i++) {
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      most = Math.max(most, Math.hypot(c.centre[i * 3] + a * c.u[i * 3] + b * c.v[i * 3], c.centre[i * 3 + 2] + a * c.u[i * 3 + 2] + b * c.v[i * 3 + 2]));
    }
  }
  return most;
}

/** Model `id` (`kind.form.variant`), decoded once; null if the library is not read or holds no such model. */
export function floraModel(id: string): FloraModel | null {
  if (decoded.has(id)) return decoded.get(id)!;
  const text = pack?.[id];
  const info = FLORA_INDEX[id];
  if (!text || !info) return null;
  const bytes = Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const [, nw, nwt, nl, nlt, nc] = Array.from({ length: 6 }, (_, i) => view.getUint16(i * 2, true));
  const f = Array.from({ length: 7 }, (_, i) => view.getFloat32(12 + i * 4, true));
  const [lo, hi, half] = [f.slice(0, 3), f.slice(3, 6), f[6]];
  const at = { o: 40 };
  const model: FloraModel = {
    info,
    reach: 0,
    wood: nw ? mesh(view, at, nw, nwt, lo, hi, false) : null,
    leaf: null,
    cards: null,
  };
  model.leaf = nl ? mesh(view, at, nl, nlt, lo, hi, true) : null;
  model.cards = nc ? cards(view, at, nc, lo, hi, half) : null;
  model.reach = reachOf(model);
  decoded.set(id, model);
  return model;
}
