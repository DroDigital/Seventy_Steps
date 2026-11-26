/**
 * Round 125, the rasterizer the leaf atlas is drawn with (render/textureFoliage.ts): one cell of the atlas drawn at four times its
 * size, shape over shape as a painter lays them, then taken down to its texels: a texel is there (alpha 1) where at least half of it
 * was covered, and its light is the mean of what covered it. So every leaf, needle and blade keeps a hard PS1 edge, cut out where the
 * mist shows through. Pure: no Three.js. Coordinates are the cell's texels, 0..size, y up (the bottom of a cell is where a spray is
 * held: its twig, or the root of a blade).
 */

/** One cell being drawn: coverage and light at `sub` times its texels. */
export interface Canvas {
  readonly size: number; // texels a side
  readonly sub: number; // samples a texel a side
  readonly cover: Uint8Array;
  readonly light: Float32Array;
}

export const canvas = (size: number, sub = 4): Canvas => ({ size, sub, cover: new Uint8Array(size * size * sub * sub), light: new Float32Array(size * size * sub * sub) });

/** The light a shape lays at a point, from where in the shape it is: `u` across it (-1..1), `v` along it (0..1). */
export type Shade = (u: number, v: number) => number;

/** Lays `shade` wherever `inside` holds within the box (x0, y0)-(x1, y1), in texels. `inside` gives the shape's own (u, v) or null. */
function fill(c: Canvas, x0: number, y0: number, x1: number, y1: number, inside: (x: number, y: number) => [number, number] | null, shade: Shade): void {
  const n = c.size * c.sub;
  const [i0, i1] = [Math.max(0, Math.floor(x0 * c.sub)), Math.min(n - 1, Math.ceil(x1 * c.sub))];
  const [j0, j1] = [Math.max(0, Math.floor(y0 * c.sub)), Math.min(n - 1, Math.ceil(y1 * c.sub))];
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const hit = inside((i + 0.5) / c.sub, (j + 0.5) / c.sub);
      if (!hit) continue;
      const k = j * n + i;
      c.cover[k] = 1;
      c.light[k] = shade(hit[0], hit[1]);
    }
  }
}

/**
 * A leaf from its stalk's end (x, y) along `angle` (radians from +y, clockwise), `len` long and `wid` wide at its widest; `edge(t)` the
 * share of the width at each angle about its own middle (1: an ellipse; lobed for an oak, toothed for an elm).
 */
export function leaf(c: Canvas, x: number, y: number, angle: number, len: number, wid: number, shade: Shade, edge: (t: number) => number = () => 1): void {
  const [s, co] = [Math.sin(angle), Math.cos(angle)];
  const [mx, my] = [x + s * len * 0.5, y + co * len * 0.5];
  const r = Math.max(len, wid) * 0.75;
  fill(c, mx - r, my - r, mx + r, my + r, (px, py) => {
    const [dx, dy] = [px - mx, py - my];
    const along = dx * s + dy * co; // -len/2 .. len/2
    const across = dx * co - dy * s;
    const v = along / len + 0.5;
    if (v < 0 || v > 1) return null;
    const half = (wid / 2) * Math.sin(Math.PI * Math.pow(v, 0.8)) * edge(Math.atan2(across, along)); // widest a little past its middle, to a point
    if (Math.abs(across) > half) return null;
    return [half > 0 ? across / half : 0, v];
  }, shade);
}

/** A stroke from (x0, y0) to (x1, y1), `w0` wide at its start and `w1` at its end (a needle, a twig, a blade). */
export function stroke(c: Canvas, x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, shade: Shade): void {
  const [dx, dy] = [x1 - x0, y1 - y0];
  const len2 = Math.max(dx * dx + dy * dy, 1e-6);
  const pad = Math.max(w0, w1);
  fill(c, Math.min(x0, x1) - pad, Math.min(y0, y1) - pad, Math.max(x0, x1) + pad, Math.max(y0, y1) + pad, (px, py) => {
    const t = Math.min(1, Math.max(0, ((px - x0) * dx + (py - y0) * dy) / len2));
    const [cx, cy] = [x0 + dx * t, y0 + dy * t];
    const half = (w0 + (w1 - w0) * t) / 2;
    const d = Math.hypot(px - cx, py - cy);
    if (d > half) return null;
    return [half > 0 ? d / half : 0, t];
  }, shade);
}

/** A round blot about (x, y), `r` across its half (a berry, a node, a seed). */
export function blot(c: Canvas, x: number, y: number, r: number, shade: Shade): void {
  fill(c, x - r, y - r, x + r, y + r, (px, py) => {
    const d = Math.hypot(px - x, py - y) / r;
    return d > 1 ? null : [d, 0.5 + 0.5 * (py - y) / r];
  }, shade);
}

/** A shape about (x, y) whose reach at each bearing θ (from +y, clockwise, turned by `angle`) is `reach(θ)`: a maple's spread hand. */
export function polar(c: Canvas, x: number, y: number, r: number, angle: number, reach: (t: number) => number, shade: Shade): void {
  fill(c, x - r, y - r, x + r, y + r, (px, py) => {
    const [dx, dy] = [px - x, py - y];
    const d = Math.hypot(dx, dy);
    const t = Math.atan2(dx, dy) - angle;
    const most = r * reach(t);
    return d > most ? null : [d / Math.max(most, 1e-4), 0.5 + 0.5 * Math.cos(t)];
  }, shade);
}

/** A path drawn as strokes through its points, tapering from `w0` to `w1`. */
export function path(c: Canvas, pts: readonly (readonly [number, number])[], w0: number, w1: number, shade: Shade): void {
  for (let k = 0; k + 1 < pts.length; k++) {
    const [t0, t1] = [k / (pts.length - 1), (k + 1) / (pts.length - 1)];
    stroke(c, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], w0 + (w1 - w0) * t0, w0 + (w1 - w0) * t1, (u, v) => shade(u, t0 + (t1 - t0) * v));
  }
}

/** The cell taken down to its texels: alpha 255 where half a texel was covered, its light the mean of the samples that covered it. */
export function resolve(c: Canvas): { alpha: Uint8Array; light: Float32Array } {
  const { size, sub } = c;
  const n = size * sub;
  const alpha = new Uint8Array(size * size);
  const light = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let [hits, sum] = [0, 0];
      for (let j = 0; j < sub; j++) {
        for (let i = 0; i < sub; i++) {
          const k = (y * sub + j) * n + x * sub + i;
          if (c.cover[k]) (hits++, (sum += c.light[k]));
        }
      }
      alpha[y * size + x] = hits * 2 >= sub * sub ? 255 : 0;
      light[y * size + x] = hits ? sum / hits : 0;
    }
  }
  return { alpha, light };
}
