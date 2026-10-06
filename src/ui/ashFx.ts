/**
 * Ash (round 45): how the opening's cards leave the mist and return to it. A card's words break into fine
 * grains torn loose in patches by a gust, which blow off leaving a few drifting specks and a faint haze of
 * the words' own shape; the next card is the same grains coming back on the wind and settling into letters.
 * Pure: the words arrive as masks (ink coverage per cell), the picture leaves as RGBA, so a test can run it
 * without a page. The numbers are in "sim units" (a line of 14 px type is 14 of them), which `k` turns into
 * cells; they are those of the previews the author chose (docs/DECISIONS.md, round 45).
 */

import { hash2 } from '../core/rng';
import { fbm } from '../core/noise';

export type Rgb = readonly [number, number, number];
export const INK: Rgb = [217, 208, 184];
export const GLINT: Rgb = [240, 232, 214];
export const HAZE: Rgb = [150, 134, 184];

const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** How far gone the words are (0 whole, 1 gone) for a progress `p` through a dissolve (0 to 1) or a return (1 to 0). */
export const goneAt = (p: number): number => smooth(0, 1, p);

/** Separable box blur twice over (a soft copy of the words, for the haze and the dust). */
export function soften(src: Float32Array, w: number, h: number, r: number): Float32Array {
  let cur = src;
  for (let pass = 0; pass < 2; pass++) {
    const tmp = new Float32Array(cur.length);
    const out = new Float32Array(cur.length);
    const n = r * 2 + 1;
    for (let y = 0; y < h; y++) {
      let s = 0;
      for (let x = -r; x <= r; x++) s += cur[y * w + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = s / n;
        s += cur[y * w + clamp(x + r + 1, 0, w - 1)] - cur[y * w + clamp(x - r, 0, w - 1)];
      }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = s / n;
        s += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
      }
    }
    cur = out;
  }
  return cur;
}

/** The fixed fields of one dissolve and its return: the wind, the patches, the grains. Made once per transition. */
export interface Ash {
  readonly w: number;
  readonly h: number;
  readonly k: number; // cells per sim unit
  readonly dir: 1 | -1;
  readonly grain: Uint8Array; // each cell's grain, 0..255
  readonly dust: Uint8Array;
  readonly gust: Float32Array; // on a coarse grid of STEP cells
  readonly flow: Float32Array;
  readonly patch: Float32Array;
  readonly cw: number;
  readonly feather: readonly [number, number];
}
const STEP = 8;

/** `feather`: cells inward from the picture's edge over which the grains fade to nothing, across and down: the ash drifts into the dark beyond the words' box and is never cut off at the box's edge. */
export function makeAsh(w: number, h: number, k: number, seed: number, feather: readonly [number, number] = [0, 0]): Ash {
  const cw = Math.ceil(w / STEP) + 2;
  const ch = Math.ceil(h / STEP) + 2;
  const [gust, flow, patch] = [new Float32Array(cw * ch), new Float32Array(cw * ch), new Float32Array(cw * ch)];
  const o = seed * 0.29;
  for (let j = 0; j < ch; j++) {
    for (let i = 0; i < cw; i++) {
      const [x, y] = [(i * STEP) / k, (j * STEP) / k]; // sim units
      gust[j * cw + i] = fbm(x * 0.003 + o, y * 0.004 + 0.3, 3, 3);
      flow[j * cw + i] = fbm(x * 0.006 + 0.6, y * 0.008 + o, 5, 3);
      patch[j * cw + i] = fbm(x * 0.012 + o, y * 0.02 + 0.5, 7, 3);
    }
  }
  const [grain, dust] = [new Uint8Array(w * h), new Uint8Array(w * h)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      grain[y * w + x] = hash2(x, y, seed) * 255;
      dust[y * w + x] = hash2(x, y, seed + 5) * 255;
    }
  }
  return { w, h, k, dir: seed % 2 ? -1 : 1, grain, dust, gust, flow, patch, cw, feather };
}

function field(a: Ash, f: Float32Array, x: number, y: number): number {
  const [u, v] = [x / STEP, y / STEP];
  const [i, j] = [Math.floor(u), Math.floor(v)];
  const [fu, fv] = [u - i, v - j];
  const k = j * a.cw + i;
  return lerp(lerp(f[k], f[k + 1], fu), lerp(f[k + a.cw], f[k + a.cw + 1], fu), fv);
}

function sample(m: Float32Array, w: number, h: number, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) return 0;
  const [i, j] = [x | 0, y | 0];
  const [fx, fy] = [x - i, y - j];
  const k = j * w + i;
  return lerp(lerp(m[k], m[k + 1], fx), lerp(m[k + w], m[k + w + 1], fx), fy);
}

/** One frame: `d` how far gone (0 whole, 1 gone), `mask` the words' ink and `soft` a blurred copy; writes RGBA into `out`. */
export function paintAsh(a: Ash, mask: Float32Array, soft: Float32Array, d: number, out: Uint8ClampedArray): void {
  const { w, h, k } = a;
  out.fill(0);
  if (d <= 0.001) {
    for (let i = 0; i < w * h; i++) {
      out[i * 4] = INK[0];
      out[i * 4 + 1] = INK[1];
      out[i * 4 + 2] = INK[2];
      out[i * 4 + 3] = mask[i] * 255;
    }
    return;
  }
  const eased = d * d * (1.3 - 0.3 * d);
  const fade = 1 - smooth(0.9, 1, d);
  const dustFade = smooth(0.1, 0.4, d) * (1 - smooth(0.55, 0.98, d));
  const hazeFade = smooth(0.05, 0.4, d) * (1 - smooth(0.5, 0.95, d)) * 0.22;
  const glint = 0.35 * d;
  const ink: Rgb = [lerp(INK[0], GLINT[0], glint), lerp(INK[1], GLINT[1], glint), lerp(INK[2], GLINT[2], glint)];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const vx = (30 + field(a, a.gust, x, y) * 80) * a.dir * k * eased;
      const vy = (-8 + (field(a, a.flow, x, y) - 0.5) * 30) * k * eased;
      const [sx, sy] = [x - vx, y - vy];
      let ta = 0;
      if (sx >= 0 && sy >= 0 && sx < w && sy < h) {
        const th = clamp(d * 1.35 - 0.12 + (field(a, a.patch, x, y) - 0.5) * 0.7, 0, 1.2);
        if (a.grain[(sy | 0) * w + (sx | 0)] / 255 > th) ta = sample(mask, w, h, sx, sy) * fade;
      }
      const [ex, ey] = [x - vx * 1.8, y - vy * 1.8];
      let dust = 0;
      if (dustFade > 0 && ex >= 0 && ey >= 0 && ex < w && ey < h && a.dust[(ey | 0) * w + (ex | 0)] > 230) dust = sample(soft, w, h, ex, ey) * 0.72 * dustFade;
      const haze = sample(soft, w, h, x - vx * 1.4, y - vy * 1.4) * hazeFade;
      const [fx, fy] = a.feather;
      const edge = fx > 0 && fy > 0 ? smooth(0, 1, Math.min(Math.min(x, w - 1 - x) / fx, Math.min(y, h - 1 - y) / fy)) : 1; // the grains and the haze alike die before the picture's edge
      const ti = Math.max(ta, dust) * edge;
      const ha = haze * edge;
      const al = ti + ha * (1 - ti);
      if (al < 0.002) continue;
      const o = (y * w + x) * 4;
      const hz = ha * (1 - ti);
      out[o] = (ink[0] * ti + HAZE[0] * hz) / al;
      out[o + 1] = (ink[1] * ti + HAZE[1] * hz) / al;
      out[o + 2] = (ink[2] * ti + HAZE[2] * hz) / al;
      out[o + 3] = al * 255;
    }
  }
}
