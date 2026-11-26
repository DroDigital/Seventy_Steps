/**
 * Round 125, a library plant (render/floraData.ts) laid as a prop: one of its form's variants by the prop's seed, stood as tall as the
 * prop, its trunk's foot as thick as the prop's collider (the fit eases out by its first fork, so a crown keeps its own shape), its
 * crown a little wider or narrower, a wind-bent pine turned to its realm's wind, coloured in its realm's look (render/floraColours.ts)
 * times its baked light, snow on what faces up where the realm is cold. Its bark is `wood`, its leaves `foliage` (the leaf atlas cut
 * out, drawn on both sides: render/propMeshes.ts); every point carries its lean (aSway, by height, as round 34's) and its own wind
 * (aWind: render/windKit.ts).
 */

import * as THREE from 'three';
import { createRng } from '../core/rng';
import { FLORA } from '../data/floraTuning';
import type { PropLook } from '../data/propLooks';
import type { Prop } from '../world/props';
import { FLORA_VARIANTS, floraModel, type FloraModel } from './floraData';
import { paletteOf, slotColour, SNOW, type Palette } from './floraColours';
import { mixRgb } from './palette';
import type { Piece } from './propShapes';
import { cellUv } from './textureFoliage';
import { bearingOf } from './windField';
import { windAttribute } from './windKit';

/** How a model is stood: its heights scaled by `sy`, its spread by `sx`, its trunk's foot by `trunk` more (easing to none by `fork`), turned `turn` radians. */
interface Fit {
  sy: number;
  sx: number;
  trunk: number;
  fork: number;
  turn: number;
  height: number; // the plant's height as stood (for its lean)
}

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** The model a prop of `kind.form` draws (its seed picks the variant), or null if the library has none. */
export function floraFor(kind: string, form: string, seed: number): FloraModel | null {
  const n = FLORA_VARIANTS.get(`${kind}.${form}`) ?? 0;
  return n ? floraModel(`${kind}.${form}.${Math.abs(seed) % n}`) : null;
}

/** A point of the model stood by `fit`, into `out` at `i`. */
function stand(x: number, y: number, z: number, fit: Fit, out: Float32Array, i: number): void {
  const k = y < fit.fork ? fit.trunk + (1 - fit.trunk) * smooth(fit.fork * 0.8, fit.fork, y) : 1; // the collider's girth held as high as a body reaches it
  const [px, pz] = [x * fit.sx * k, z * fit.sx * k];
  const [s, c] = [Math.sin(fit.turn), Math.cos(fit.turn)];
  out[i] = px * c + pz * s;
  out[i + 1] = y * fit.sy;
  out[i + 2] = -px * s + pz * c;
}

function turnNormal(nx: number, ny: number, nz: number, fit: Fit, out: Float32Array, i: number): void {
  const [s, c] = [Math.sin(fit.turn), Math.cos(fit.turn)];
  const len = Math.hypot(nx, ny, nz) || 1;
  out[i] = (nx * c + nz * s) / len;
  out[i + 1] = ny / len;
  out[i + 2] = (-nx * s + nz * c) / len;
}

/** The lean of a point `y` metres up a plant `h` tall at a gust's height (round 34's: nothing at its foot, the most at its top). */
const leanAt = (y: number, h: number): number => FLORA.bend * h * Math.min(1, Math.max(0, y / h)) ** 2;

/** One geometry from the model's points (`pts` stood), their normals, colours, UVs, lean and wind. */
function geometry(pos: Float32Array, nor: Float32Array, col: Float32Array, uv: Float32Array, wind: Uint8Array, index: ArrayLike<number>, fit: Fit): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const sway = new Float32Array(pos.length / 3);
  for (let i = 0; i < sway.length; i++) sway[i] = leanAt(pos[i * 3 + 1], fit.height);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
  g.setAttribute('aWind', windAttribute(wind));
  g.setIndex(Array.from(index));
  return g;
}

/** A light-and-colour for a point: its slot's colour times its baked light and the plant's own tone, snow laid on what faces up. */
function shade(slot: number, light: number, ny: number, pal: Palette, tone: number, snow: boolean, out: Float32Array, i: number): void {
  let c = slotColour(slot, pal);
  if (snow && ny > 0.3 && slot < 16) c = mixRgb(c, SNOW, Math.min(1, (ny - 0.3) / 0.45) * 0.85);
  const k = light * tone;
  out[i] = c[0] * k;
  out[i + 1] = c[1] * k;
  out[i + 2] = c[2] * k;
}

/** The model's bark and leaves stood by `fit`, in `pal`; `phase` the plant's own in the wind. */
export function floraGeometry(m: FloraModel, fit: Fit, pal: Palette, phase: number, tone: number, snow: boolean, leafGain = FLORA_LEAF_GAIN): { wood?: THREE.BufferGeometry; foliage?: THREE.BufferGeometry } {
  const out: { wood?: THREE.BufferGeometry; foliage?: THREE.BufferGeometry } = {};
  const p8 = Math.round(phase * 255);
  if (m.wood) {
    const w = m.wood;
    const n = w.light.length;
    const [pos, nor, col, wind] = [new Float32Array(n * 3), new Float32Array(n * 3), new Float32Array(n * 3), new Uint8Array(n * 4)];
    for (let i = 0; i < n; i++) {
      stand(w.pos[i * 3], w.pos[i * 3 + 1], w.pos[i * 3 + 2], fit, pos, i * 3);
      turnNormal(w.nor[i * 3], w.nor[i * 3 + 1], w.nor[i * 3 + 2], fit, nor, i * 3);
      shade(w.slot[i], w.light[i], nor[i * 3 + 1], pal, tone, snow, col, i * 3);
      wind.set([p8, Math.round(w.reach[i] * 255), 0, Math.round(w.phase[i] * 255)], i * 4);
    }
    out.wood = geometry(pos, nor, col, Float32Array.from(w.uv), wind, w.index, fit);
  }
  const leafPts = (m.leaf?.light.length ?? 0) + (m.cards?.n ?? 0) * 4;
  if (!leafPts) return out;
  const [pos, nor, col, uv, wind] = [new Float32Array(leafPts * 3), new Float32Array(leafPts * 3), new Float32Array(leafPts * 3), new Float32Array(leafPts * 2), new Uint8Array(leafPts * 4)];
  const index: number[] = [];
  let at = 0;
  if (m.leaf) {
    const l = m.leaf;
    for (let i = 0; i < l.light.length; i++, at++) {
      stand(l.pos[i * 3], l.pos[i * 3 + 1], l.pos[i * 3 + 2], fit, pos, at * 3);
      turnNormal(l.nor[i * 3], l.nor[i * 3 + 1], l.nor[i * 3 + 2], fit, nor, at * 3);
      shade(l.slot[i], l.light[i] * leafGain, nor[at * 3 + 1], pal, tone, snow, col, at * 3);
      uv.set([l.uv[i * 2], l.uv[i * 2 + 1]], at * 2);
      wind.set([p8, Math.round(l.reach[i] * 255), Math.round(l.flutter[i] * 255), Math.round(l.phase[i] * 255)], at * 4);
    }
    for (const k of l.index) index.push(k);
  }
  const c = m.cards;
  if (c) {
    const corner = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;
    for (let i = 0; i < c.n; i++) {
      const first = at;
      for (let k = 0; k < 4; k++, at++) {
        const [a, b] = corner[k];
        const [x, y, z] = [0, 1, 2].map((d) => c.centre[i * 3 + d] + a * c.u[i * 3 + d] + b * c.v[i * 3 + d]);
        stand(x, y, z, fit, pos, at * 3);
        turnNormal(c.nor[i * 3], c.nor[i * 3 + 1], c.nor[i * 3 + 2], fit, nor, at * 3);
        shade(c.slot[i], c.light[i * 4 + k] * leafGain, nor[at * 3 + 1], pal, tone, snow, col, at * 3);
        uv.set(cellUv(c.cell[i], a < 0 ? 0 : 1, b < 0 ? c.v0[i] : c.v1[i]), at * 2);
        const free = c.hang[i] ? b < 0 : b > 0; // the corners away from where it is held flutter the most
        wind.set([p8, Math.round(c.reach[i] * 255), free ? 255 : 70, Math.round(c.phase[i] * 255)], at * 4);
      }
      index.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  }
  out.foliage = geometry(pos, nor, col, uv, wind, index, fit);
  return out;
}

/** The leaves' colours raised to show their own, as the ground's cover is (render/coverBuilder.ts GAIN): the old crowns were drawn without, and read as black. */
export const FLORA_LEAF_GAIN = 1.8;

/**
 * A prop of `kind` (tree, pine, bush) in `form` from the library, in its realm's look; null when the library has no such form (or is not
 * read), and the old forms draw it.
 */
export function floraProp(kind: 'tree' | 'pine' | 'bush', form: string, p: Prop, look: PropLook, region?: string): Piece[] | null {
  const m = floraFor(kind, form, p.seed);
  if (!m) return null;
  const rng = createRng(p.seed * 131 + 17);
  const widen = 1 + FLORA.widen * (rng() * 2 - 1);
  const pal = paletteOf(look, form, Math.floor(rng() * 4));
  const fit: Fit = kind === 'bush'
    ? { sy: p.h / m.info.h, sx: p.w / Math.max(m.info.crown[3], m.info.crown[5], 0.2), trunk: 1, fork: 0, turn: 0, height: p.h }
    : { sy: p.h / m.info.h, sx: (p.h / m.info.h) * widen, trunk: 1, fork: m.info.fork, turn: 0, height: p.h };
  if (kind !== 'bush') {
    fit.sx = Math.min(fit.sx, (p.h * 0.5 + FLORA.reach) / Math.max(m.reach, 0.1)); // a crown spreads no farther than half its height and a little (it must not stand in the road or the house beside it)
    fit.trunk = p.w / Math.max(m.info.r * fit.sx, 1e-3);
  }
  if (form === 'windswept') { // bent by its realm's wind, whichever way the prop was turned: its lean is the model's +x
    const [dx, dz] = bearingOf(region) ?? [0.89, 0.45];
    fit.turn = Math.atan2(-dz, dx) - p.yaw + (rng() - 0.5) * 0.4;
  }
  const g = floraGeometry(m, fit, pal, rng(), 0.92 + 0.16 * rng(), !!look.snow);
  const out: Piece[] = [];
  if (g.wood) out.push({ mat: 'wood', geo: g.wood });
  if (g.foliage) out.push({ mat: 'foliage', geo: g.foliage });
  return out;
}

export type { Fit };
