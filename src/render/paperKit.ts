/**
 * A leaf of paper as a grid (round 89; the note in the world, render/paperViews.ts): the cells of a sheet kept inside a ragged
 * burnt outline, with the bites a fire takes, and for each vertex that is left how near the burnt rim it is (`edge`, 1 at the rim to 0 two
 * cells in), how far from it toward the middle (`inner`, the way a burn crosses), and the tone of the paper. Pure: no Three.js; the
 * bending and the colour are render/paperFlow.ts's.
 */

import { createRng } from '../core/rng';

export interface Sheet {
  readonly count: number;
  /** x and y in the sheet's own plane, centred, metres. */
  readonly rest: Float32Array;
  /** The vertex's distance from the middle as a share of the sheet's reach, and its angle about it. */
  readonly polar: Float32Array;
  readonly angle: Float32Array;
  readonly edge: Float32Array;
  readonly inner: Float32Array;
  readonly tone: Float32Array;
  readonly uv: Float32Array;
  readonly index: Uint16Array;
  /** The vertices on the burnt rim. */
  readonly rim: readonly number[];
  readonly w: number;
  readonly h: number;
}

const BAND = 2; // cells in that the rim's heat reaches

/** A `w` by `h` leaf of `cols` by `rows` cells with its edges burnt away by the pattern `seed` draws. */
export function makeSheet(cols: number, rows: number, w: number, h: number, seed: number): Sheet {
  const rng = createRng(seed);
  const ph = [rng() * 6.283, rng() * 6.283, rng() * 6.283];
  const outline = (a: number): number => 0.82 + 0.07 * Math.sin(a * 3 + ph[0]) + 0.05 * Math.sin(a * 5 + ph[1]) + 0.035 * Math.sin(a * 9 + ph[2]);
  const bites = Array.from({ length: 4 }, () => {
    const a = rng() * 6.283;
    const r = 0.62 + rng() * 0.25;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, s: 0.1 + rng() * 0.1 };
  });
  const kept = new Uint8Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const [x, y] = [((i + 0.5) / cols - 0.5) * 2, ((j + 0.5) / rows - 0.5) * 2];
      const bitten = bites.some((b) => Math.hypot(x - b.x, y - b.y) < b.s);
      kept[j * cols + i] = !bitten && Math.hypot(x, y) <= outline(Math.atan2(y, x)) ? 1 : 0;
    }
  }
  const cell = (i: number, j: number): number => (i < 0 || j < 0 || i >= cols || j >= rows ? 0 : kept[j * cols + i]);
  const stride = cols + 1;
  const at = (i: number, j: number): number => j * stride + i;
  const around = (i: number, j: number): number => cell(i - 1, j - 1) + cell(i, j - 1) + cell(i - 1, j) + cell(i, j); // the cells that meet at a grid vertex
  const slot = new Int32Array(stride * (rows + 1)).fill(-1);
  const grid: [number, number][] = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      if (around(i, j) === 0) continue;
      slot[at(i, j)] = grid.length;
      grid.push([i, j]);
    }
  }
  const count = grid.length;
  const depth = new Int16Array(count).fill(-1);
  const queue: number[] = [];
  grid.forEach(([i, j], v) => {
    if (around(i, j) >= 4) return;
    depth[v] = 0; // a vertex a missing cell touches is on the rim
    queue.push(v);
  });
  const rim = [...queue]; // (the queue as it is before the walk: the rim)
  for (let head = 0; head < queue.length; head++) {
    const [i, j] = grid[queue[head]];
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const [ni, nj] = [i + di, j + dj];
      if (ni < 0 || nj < 0 || ni > cols || nj > rows) continue;
      const n = slot[at(ni, nj)];
      if (n < 0 || depth[n] >= 0) continue;
      depth[n] = depth[queue[head]] + 1;
      queue.push(n);
    }
  }
  const deepest = Math.max(1, ...depth);
  const [rest, polar, angle, edge, inner, tone, uv] = [2, 1, 1, 1, 1, 1, 2].map((n) => new Float32Array(count * n));
  grid.forEach(([i, j], v) => {
    const [x, y] = [(i / cols - 0.5) * w, (j / rows - 0.5) * h];
    rest.set([x, y], v * 2);
    polar[v] = Math.min(1, Math.hypot(x / (w / 2), y / (h / 2)));
    angle[v] = Math.atan2(y, x);
    edge[v] = Math.max(0, 1 - depth[v] / BAND);
    inner[v] = depth[v] / deepest;
    tone[v] = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(x * 7 + ph[0]) * Math.sin(y * 6 + ph[1])) + (rng() - 0.5) * 0.05;
    uv.set([i / cols, j / rows], v * 2);
  });
  const tris: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (!kept[j * cols + i]) continue;
      const [a, b, c, d] = [slot[at(i, j)], slot[at(i + 1, j)], slot[at(i + 1, j + 1)], slot[at(i, j + 1)]];
      tris.push(a, b, c, a, c, d); // (turned to face +z)
    }
  }
  return { count, rest, polar, angle, edge, inner, tone, uv, index: Uint16Array.from(tris), rim, w, h };
}
