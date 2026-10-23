/**
 * The CC0 models of the arenas (round 61; data/models, made by tools/models/bake_models.py from Kenney's kits) turned into pieces:
 * each face flat-shaded, the colour it was drawn in kept only as the light and dark of it, laid over the colour of its kind (stone takes
 * the region's, wood the bark's, leaves the needles'), as everything else in the world is dressed, and mapped to the world's textures by
 * the plane it lies in. The data is fetched once, when the world is made (`loadModels`), not with the game's first script.
 */

import * as THREE from 'three';
import { MODEL_INFO } from '../data/models/index';
import type { Prop } from '../world/props';
import { LANTERN_MODELS } from '../world/lanternModels';
import { BASE, luma, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece } from './propShapes';

type Pack = Readonly<Record<string, string>>;
let pack: Pack | null = null;

/** Has the data been read? (Without it, a model draws as nothing.) */
export const modelsReady = (): boolean => pack !== null;

/** Reads the models' data (a module of its own: it is some 400 kB of text). */
export async function loadModels(): Promise<void> {
  if (!pack) pack = (await import('../data/models/pack')).MODEL_PACK;
}

interface Decoded {
  points: Float32Array;
  faces: Uint16Array;
  kind: Uint8Array; // 0 stone, 1 wood, 2 leaf
  colour: Uint8Array; // 3 a face
}

const decoded = new Map<string, Decoded | null>();

function decode(id: string): Decoded | null {
  if (decoded.has(id)) return decoded.get(id)!;
  const text = pack?.[id];
  if (!text) return null;
  const bytes = Uint8Array.from(atob(text), (ch) => ch.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const [nv, nt] = [view.getUint16(0, true), view.getUint16(2, true)];
  const box = Array.from({ length: 6 }, (_, i) => view.getFloat32(4 + i * 4, true));
  let at = 28;
  const points = new Float32Array(nv * 3);
  for (let i = 0; i < nv * 3; i++, at += 2) {
    const axis = i % 3;
    points[i] = box[axis] + ((view.getInt16(at, true) + 32768) / 65535) * (box[axis + 3] - box[axis]);
  }
  const faces = new Uint16Array(nt * 3);
  for (let i = 0; i < nt * 3; i++, at += 2) faces[i] = view.getUint16(at, true);
  const [kind, colour] = [new Uint8Array(nt), new Uint8Array(nt * 3)];
  for (let t = 0; t < nt; t++, at += 4) {
    kind[t] = bytes[at];
    colour.set(bytes.subarray(at + 1, at + 4), t * 3);
  }
  const out = { points, faces, kind, colour };
  decoded.set(id, out);
  return out;
}

/** What the model's kinds of face are laid over: the region's stone, bark, needles. */
const WOOD: Rgb = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.35), 1.7);
const LEAF: Rgb = scaleRgb(mixRgb(BASE.seaGrey, BASE.charcoal, 0.55), 1.3);

/** The model's materials in the prop's frame. Lantern iron and glass keep their own finish instead of the kit's leaf/wood labels. */
export function modelPieces(p: Prop, stone: Rgb): Piece[] {
  const look = p.set;
  const m = look && decode(look.id);
  if (!look || !m) return [];
  const bases: readonly Rgb[] = [look.tint ? mixRgb(stone, look.tint, 0.6) : stone, WOOD, LEAF];
  const lamp = !!LANTERN_MODELS[look.id];
  const mats = ['stone', 'wood', 'leaf', 'glass'] as const;
  const keep = look.keep ?? 0;
  const k = look.scale ?? 1;
  const out: Piece[] = [];
  for (let kind = 0; kind < (lamp ? 4 : 3); kind++) {
    const pos: number[] = [];
    const nor: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    for (let t = 0; t < m.kind.length; t++) {
      const glass = lamp && look.id === 'lightpost' && m.kind[t] === 1;
      if ((glass ? 3 : lamp ? 0 : m.kind[t]) !== kind) continue;
      // Replace the baked candle's tall wick with the oil burner's small wick and flame.
      if (lamp && look.id === 'lantern' && m.kind[t] === 1 && m.colour[t * 3 + 1] < 150) continue;
      const v = [0, 1, 2].map((c) => m.faces[t * 3 + c]);
      const [a, b, c] = v.map((i) => new THREE.Vector3(m.points[i * 3] * k, m.points[i * 3 + 1] * k, m.points[i * 3 + 2] * k));
      const n = new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize();
      if (!Number.isFinite(n.x)) continue; // a sliver
      const raw: Rgb = [m.colour[t * 3] / 255, m.colour[t * 3 + 1] / 255, m.colour[t * 3 + 2] / 255];
      const shade = 0.55 + 0.9 * Math.min(1, luma(raw) * 1.3); // its light and dark, over the colour of its kind
      const base = lamp ? (glass ? [0.34, 0.29, 0.2] : m.kind[t] === 1 ? [0.42, 0.3, 0.16] : m.kind[t] === 0 ? [0.3, 0.31, 0.3] : [0.22, 0.245, 0.235]) : bases[kind];
      const retained = lamp ? 0 : keep;
      const c3 = [0, 1, 2].map((i) => base[i] * shade * (1 - retained) + raw[i] * retained * 1.3);
      const [ax, ay, az] = [Math.abs(n.x), Math.abs(n.y), Math.abs(n.z)];
      for (const q of [a, b, c]) {
        pos.push(q.x, q.y, q.z);
        nor.push(n.x, n.y, n.z);
        col.push(c3[0], c3[1], c3[2]);
        if (ay >= ax && ay >= az) uv.push(q.x / 2, q.z / 2);
        else if (ax >= az) uv.push(q.z / 2, q.y / 2);
        else uv.push(q.x / 2, q.y / 2);
      }
    }
    if (!pos.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    out.push({ mat: mats[kind], geo });
  }
  return out;
}

/** Whether a model by that name is baked. */
export const knownModel = (id: string): boolean => id in MODEL_INFO;

