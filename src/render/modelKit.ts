/**
 * The baked models of the arenas (round 61: Kenney's kits, `data/models/kenneyPack`; round 71: the supplied packs of the boss places,
 * `bossPack`, made by tools/models/bake_boss_models.py) turned into pieces: each face flat-shaded, the colour it was drawn in kept only as
 * the light and dark of it, laid over the colour of its kind (stone takes the region's, wood the bark's, cloth the place's dye, and so on),
 * as everything else in the world is dressed, and mapped to the world's textures by the plane it lies in. A kind is a face's class byte
 * (stone, wood, leaf, rock, slab, cobble, brick, cloth, metal, bone, glow; bit 7: drawn on both sides). The data is fetched once, when the
 * world is made (`loadModels`), not with the game's first script.
 */

import * as THREE from 'three';
import { MODEL_INFO } from '../data/models/index';
import { scaleOf, type Prop } from '../world/props';
import { LANTERN_MODELS } from '../world/lanternModels';
import { BASE, luma, mixRgb, scaleRgb, type Rgb } from './palette';
import type { Piece, PropMat } from './propShapes';

type Pack = Readonly<Record<string, string>>;
let pack: Pack | null = null;

/** Has the data been read? (Without it, a model draws as nothing.) */
export const modelsReady = (): boolean => pack !== null;

/** Reads the models' data (a module of its own: it is some 1.5 MB of text). */
export async function loadModels(): Promise<void> {
  if (!pack) pack = (await import('../data/models/pack')).MODEL_PACK;
}

/** The face classes a model's bytes carry, and what each is drawn as. */
export const KIND = { stone: 0, wood: 1, leaf: 2, rock: 4, slab: 5, cobble: 6, brick: 7, cloth: 8, metal: 9, bone: 10, glow: 11, glass: 12, liquid: 13, mirror: 14, wax: 15 } as const;
const MATS: Readonly<Record<number, PropMat>> = { 0: 'stone', 1: 'wood', 2: 'leaf', 4: 'rock', 5: 'slab', 6: 'cobble', 7: 'brick', 8: 'cloth', 9: 'metal', 10: 'bone', 11: 'glow', 12: 'glassware', 13: 'liquid', 14: 'mirror', 15: 'wax' };
const DOUBLE = 0x80;

interface Decoded {
  points: Float32Array;
  faces: Uint16Array;
  kind: Uint8Array; // the class of a face (without its both-sides bit)
  both: Uint8Array; // 1: drawn on both sides
  colour: Uint8Array; // 3 a face
  height: number; // the model's top
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
  const [kind, both, colour] = [new Uint8Array(nt), new Uint8Array(nt), new Uint8Array(nt * 3)];
  for (let t = 0; t < nt; t++, at += 4) {
    kind[t] = bytes[at] & ~DOUBLE;
    both[t] = bytes[at] & DOUBLE ? 1 : 0;
    colour.set(bytes.subarray(at + 1, at + 4), t * 3);
  }
  const out = { points, faces, kind, both, colour, height: box[4] };
  decoded.set(id, out);
  return out;
}

/** What the model's kinds of face are laid over, apart from the region's stone. */
const WOOD: Rgb = scaleRgb(mixRgb(BASE.charcoal, BASE.rust, 0.35), 1.7);
const LEAF: Rgb = scaleRgb(mixRgb(BASE.seaGrey, BASE.charcoal, 0.55), 1.3);
const CLOTH: Rgb = scaleRgb(mixRgb(BASE.bone, BASE.rust, 0.5), 0.5); // faded
const METAL: Rgb = [0.26, 0.22, 0.21];
const BONE: Rgb = scaleRgb(BASE.bone, 0.82);
const FLAME: Rgb = mixRgb(BASE.bone, [1, 0.8, 0.5], 0.6);
const GLASS: Rgb = [0.6, 0.66, 0.64]; // (round 77) what is clear, wet, silvered or waxen keeps most of the colour it was baked in, over these
const LIQUID: Rgb = [0.3, 0.52, 0.34];
const MIRROR: Rgb = [0.34, 0.38, 0.4];
const WAX: Rgb = [0.84, 0.76, 0.58];
/** How much of its own colour each of those keeps whatever the piece says: a liquid is the colour it is, a glass a pale cast of its own. */
const RETAIN: Readonly<Record<number, number>> = { [KIND.glass]: 0.6, [KIND.liquid]: 0.92, [KIND.wax]: 0.5 };
/** What a wax figure's faces are drawn as: all but what is lit, metal or already clear. */
const WAXEN: ReadonlySet<number> = new Set([KIND.stone, KIND.wood, KIND.rock, KIND.slab, KIND.bone, KIND.cloth, KIND.brick, KIND.cobble]);

/** The colour a kind of face is laid over, for this prop. */
function baseOf(kind: number, look: NonNullable<Prop['set']>, stone: Rgb): Rgb {
  const st = look.tint ? mixRgb(stone, look.tint, 0.6) : stone;
  switch (kind) {
    case KIND.wood: return look.dye?.wood ?? WOOD;
    case KIND.leaf: return LEAF;
    case KIND.rock: return scaleRgb(st, 0.82);
    case KIND.slab: return scaleRgb(st, 1.1);
    case KIND.cobble: return scaleRgb(st, 0.78);
    case KIND.brick: return mixRgb(st, BASE.rust, 0.45);
    case KIND.cloth: return look.dye?.cloth ?? CLOTH;
    case KIND.metal: return look.dye?.metal ?? METAL;
    case KIND.bone: return look.dye?.bone ?? BONE;
    case KIND.glow: return look.dye?.glow ?? FLAME;
    case KIND.glass: return GLASS;
    case KIND.liquid: return LIQUID;
    case KIND.mirror: return MIRROR;
    case KIND.wax: return WAX;
    default: return st;
  }
}

const LAMP_BASE: readonly Rgb[] = [[0.3, 0.31, 0.3], [0.42, 0.3, 0.16], [0.22, 0.245, 0.235]]; // a lantern's iron, wood and glass-holder, by the kit's old labels
const LAMP_GLASS: Rgb = [0.34, 0.29, 0.2];
const CLOTH_SWAY = 0.4; // metres a hanging cloth's hem is blown at a gust's height

/** The model's materials in the prop's frame. Lantern iron and glass keep their own finish instead of the kit's leaf/wood labels. */
export function modelPieces(p: Prop, stone: Rgb): Piece[] {
  const look = p.set;
  const m = look && decode(look.id);
  if (!look || !m) return [];
  const lamp = !!LANTERN_MODELS[look.id];
  const keep = look.keep ?? 0;
  const [sx, sy, sz] = scaleOf(look);
  const groups = new Map<string, number[]>(); // material → the faces drawn in it
  for (let t = 0; t < m.kind.length; t++) {
    const glass = lamp && look.id === 'lightpost' && m.kind[t] === 1;
    // Replace the baked candle's tall wick with the oil burner's small wick and flame.
    if (lamp && look.id === 'lantern' && m.kind[t] === 1 && m.colour[t * 3 + 1] < 150) continue;
    const mat = glass ? 'glass' : lamp ? 'stone' : MATS[look.wax && WAXEN.has(m.kind[t]!) ? KIND.wax : m.kind[t]!] ?? 'stone';
    groups.get(mat)?.push(t) ?? groups.set(mat, [t]);
  }
  const out: Piece[] = [];
  const top = m.height * sy;
  for (const [mat, faces] of groups) {
    const n = faces.length * (faces.some((t) => m.both[t]) ? 2 : 1) * 3;
    const [pos, nor, uv, col] = [new Float32Array(n * 3), new Float32Array(n * 3), new Float32Array(n * 2), new Float32Array(n * 3)];
    const sway = mat === 'cloth' ? new Float32Array(n) : null;
    let v = 0;
    const put = (a: number, b: number, c: number, nx: number, ny: number, nz: number, r: number, g: number, bl: number): void => {
      for (let k = 0; k < 3; k++) {
        const i = k === 0 ? a : k === 1 ? b : c;
        const [x, y, z] = [m.points[i * 3]! * sx, m.points[i * 3 + 1]! * sy, m.points[i * 3 + 2]! * sz];
        const [o3, o2] = [v * 3, v * 2];
        pos[o3] = x; pos[o3 + 1] = y; pos[o3 + 2] = z;
        nor[o3] = nx; nor[o3 + 1] = ny; nor[o3 + 2] = nz;
        col[o3] = r; col[o3 + 1] = g; col[o3 + 2] = bl;
        const [ax, ay, az] = [Math.abs(nx), Math.abs(ny), Math.abs(nz)];
        if (ay >= ax && ay >= az) { uv[o2] = x / 2; uv[o2 + 1] = z / 2; } else if (ax >= az) { uv[o2] = z / 2; uv[o2 + 1] = y / 2; } else { uv[o2] = x / 2; uv[o2 + 1] = y / 2; }
        if (sway) sway[v] = CLOTH_SWAY * Math.pow(Math.min(1, Math.max(0, (top - y) / Math.max(top, 0.5))), 1.4); // hung from its top: the hem moves most
        v++;
      }
    };
    for (const t of faces) {
      const [ia, ib, ic] = [m.faces[t * 3]!, m.faces[t * 3 + 1]!, m.faces[t * 3 + 2]!];
      const q = (i: number): [number, number, number] => [m.points[i * 3]! * sx, m.points[i * 3 + 1]! * sy, m.points[i * 3 + 2]! * sz];
      const [a, b, c] = [q(ia), q(ib), q(ic)];
      const [ux, uy, uz, wx, wy, wz] = [c[0] - b[0], c[1] - b[1], c[2] - b[2], a[0] - b[0], a[1] - b[1], a[2] - b[2]];
      let [nx, ny, nz] = [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx];
      const len = Math.hypot(nx, ny, nz);
      if (!(len > 1e-9)) continue; // a sliver
      [nx, ny, nz] = [nx / len, ny / len, nz / len];
      const raw: Rgb = [m.colour[t * 3]! / 255, m.colour[t * 3 + 1]! / 255, m.colour[t * 3 + 2]! / 255];
      const shade = 0.55 + 0.9 * Math.min(1, luma(raw) * 1.3); // its light and dark, over the colour of its kind
      const kind = look.wax && WAXEN.has(m.kind[t]!) ? KIND.wax : m.kind[t]!;
      const base = lamp ? (mat === 'glass' ? LAMP_GLASS : m.kind[t] === 1 ? LAMP_BASE[1]! : m.kind[t] === 0 ? LAMP_BASE[0]! : LAMP_BASE[2]!) : baseOf(kind, look, stone);
      const retained = lamp ? 0 : Math.max(keep, RETAIN[kind] ?? 0);
      const lit = kind === KIND.glow ? 1 : shade;
      const [r, g, bl] = [0, 1, 2].map((i) => base[i]! * lit * (1 - retained) + raw[i]! * retained * 1.3);
      put(ia, ib, ic, nx, ny, nz, r!, g!, bl!);
      if (m.both[t]) put(ia, ic, ib, -nx, -ny, -nz, r!, g!, bl!);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, v * 3), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor.subarray(0, v * 3), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv.subarray(0, v * 2), 2));
    geo.setAttribute('color', new THREE.BufferAttribute(col.subarray(0, v * 3), 3));
    if (sway) geo.setAttribute('aSway', new THREE.BufferAttribute(sway.subarray(0, v), 1));
    out.push({ mat: mat as PropMat, geo });
  }
  return out;
}

/** Whether a model by that name is baked. */
export const knownModel = (id: string): boolean => id in MODEL_INFO;
