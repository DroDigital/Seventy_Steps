/**
 * Round 125, the leaf atlas (spec §2: generated in code, no file): sixteen cells of 32 texels (render/foliageCells.ts) in a 128-texel
 * square, cut out where the mist shows through: leaves, needles, fronds, strands and blades with a hard edge, grey, for the vertex
 * colour to give their hue. Its mips are made here and not by the GPU: a texel's colour is the mean of the covered texels under it
 * only (the cut-away ones do not darken the edge of a far crown), and its alpha their share, which the world shader cuts by an
 * ordered dither (shaders/world.ts FOLIAGE), so a far crown keeps as much of itself as it covers, stippled as the PS1's dither is.
 * Pure: no Three.js.
 */

import { canvas, resolve } from './foliageRaster';
import { CELL, drawCell, FOLIAGE_CELLS, type FoliageCell } from './foliageCells';

export { FOLIAGE_CELLS, type FoliageCell };
export const ATLAS = CELL * 4; // texels a side
/** Geometry UV units to a texture: the world materials count 64 texels to the unit (render/textures.ts UV_PER_TEXTURE). */
const UNITS = ATLAS / 64;

/** Where in a geometry's UVs a point (u, v) of `cell` lies (0..1 across it, 0 at its foot), a hair inside its edge so no neighbour bleeds in. */
export function cellUv(cell: FoliageCell | number, u: number, v: number): [number, number] {
  const i = typeof cell === 'number' ? cell : FOLIAGE_CELLS.indexOf(cell);
  const [col, row] = [i % 4, Math.floor(i / 4)];
  const inset = (x: number): number => 0.004 + x * 0.992;
  return [((col + inset(u)) / 4) * UNITS, ((row + inset(v)) / 4) * UNITS];
}

/** The atlas's light as the world's textures keep theirs: about as bright as the grass it replaced (0.26 on average), the vertex colours raised to show their own (render/coverBuilder.ts GAIN). */
const LIGHT = 0.42;

/** A cell's hue laid over its light: the green things neutral, the woody ones warm, the moss and the flesh their own. */
const TINT: Readonly<Partial<Record<FoliageCell, readonly [number, number, number]>>> = {
  bare: [1.06, 0.98, 0.9],
  thorn: [1.04, 0.97, 0.92],
  moss: [0.98, 1.0, 0.96],
  growth: [1.05, 0.95, 0.95],
};

export interface Level {
  data: Uint8Array;
  width: number;
  height: number;
}

/** The atlas and its mips, RGBA8, row 0 at v = 0. */
export function generateFoliage(): Level[] {
  const top = new Float32Array(ATLAS * ATLAS * 4);
  FOLIAGE_CELLS.forEach((name, i) => {
    const c = canvas(CELL);
    drawCell(name, c);
    const { alpha, light } = resolve(c);
    const tint = TINT[name] ?? [1, 1, 0.97];
    const [ox, oy] = [(i % 4) * CELL, Math.floor(i / 4) * CELL];
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const k = ((oy + y) * ATLAS + ox + x) * 4;
        const l = light[y * CELL + x] * LIGHT;
        const a = name === 'solid' ? 1 : alpha[y * CELL + x] / 255;
        top[k] = l * tint[0];
        top[k + 1] = l * tint[1];
        top[k + 2] = l * tint[2];
        top[k + 3] = a;
      }
    }
  });
  const levels: Float32Array[] = [top];
  for (let size = ATLAS / 2; size >= 1; size /= 2) {
    const up = levels[levels.length - 1];
    const down = new Float32Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let [r, g, b, a, n] = [0, 0, 0, 0, 0];
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
          const k = ((y * 2 + dy) * size * 2 + x * 2 + dx) * 4;
          const w = up[k + 3];
          r += up[k] * w;
          g += up[k + 1] * w;
          b += up[k + 2] * w;
          a += w;
          n++;
        }
        const k = (y * size + x) * 4;
        const keep = a > 0 ? 1 / a : 0;
        down[k] = r * keep;
        down[k + 1] = g * keep;
        down[k + 2] = b * keep;
        down[k + 3] = a / n;
      }
    }
    levels.push(down);
  }
  return levels.map((f) => {
    const width = Math.round(Math.sqrt(f.length / 4));
    const data = new Uint8Array(f.length);
    for (let k = 0; k < f.length; k++) data[k] = Math.round(Math.min(1, Math.max(0, f[k])) * 255);
    return { data, width, height: width };
  });
}
