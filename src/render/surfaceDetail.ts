/**
 * An inexpensive, tileable relief-like overlay for RGBA8 surface textures.
 * It is baked once, not evaluated per fragment. A seeded, softly interpolated
 * height field varies the pixels' light while leaving alpha unchanged.
 */
import { hash2 } from '../core/rng';

/** Direction describes the texture's grain, not the direction of a scene light. */
export type SurfaceDetailProfile = 'generic' | 'stone' | 'wood' | 'woodAcross' | 'snow' | 'cloth' | 'hide' | 'water' | 'organic';

/**
 * Mutates a row-major RGBA8 buffer of exactly width * height * 4 bytes. Width
 * and height must be positive integers. `strength` must be finite and scales
 * the default effect; zero leaves the pixels untouched. The field wraps on both axes,
 * so it can be applied to an already-tileable texture without a new hard seam.
 * Mipmaps should be generated after this function, not before it.
 */
export function applySurfaceDetail(pixels: Uint8Array, width: number, height: number, seed: number, strength = 1, profile: SurfaceDetailProfile = 'generic'): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || pixels.length !== width * height * 4) {
    throw new RangeError('Surface detail requires a positive-size RGBA8 buffer');
  }
  if (!Number.isFinite(strength)) throw new RangeError('Surface detail strength must be finite');
  if (strength <= 0) return;
  const amount = Math.min(strength, 1);
  if (profile !== 'generic') {
    materialDetail(pixels, width, height, seed, amount, profile);
    return;
  }
  // Four source texels per cell at 128px; cap the field to bound setup cost
  // for larger images. Wrapped interpolation gives the texture a periodic edge.
  const cols = Math.max(1, Math.min(32, Math.round(width / 4)));
  const rows = Math.max(1, Math.min(32, Math.round(height / 4)));
  const field = new Float32Array(cols * rows);
  let mean = 0;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const h = hash2(x, y, seed + 173);
    field[y * cols + x] = h;
    mean += h;
  }
  mean /= field.length;
  for (let y = 0; y < height; y++) {
    const fy = y * rows / height;
    const iy = Math.floor(fy), ty = fy - iy, nextY = (iy + 1) % rows;
    for (let x = 0; x < width; x++) {
      const fx = x * cols / width;
      const ix = Math.floor(fx), tx = fx - ix, nextX = (ix + 1) % cols;
      const a = field[iy * cols + ix], b = field[iy * cols + nextX];
      const c = field[nextY * cols + ix], d = field[nextY * cols + nextX];
      const top = a + (b - a) * tx, bottom = c + (d - c) * tx;
      const relief = (top + (bottom - top) * ty - mean) * 0.2 + ((b - a) * (1 - ty) + (d - c) * ty + bottom - top) * 0.04;
      const gain = 1 + relief * amount;
      const i = (y * width + x) * 4;
      pixels[i] = Math.round(Math.min(255, pixels[i] * gain));
      pixels[i + 1] = Math.round(Math.min(255, pixels[i + 1] * gain));
      pixels[i + 2] = Math.round(Math.min(255, pixels[i + 2] * gain));
    }
  }
}

/** Detail follows the material's existing marks. A snapshot makes neighbouring
 * luminance independent of iteration order; all lookups wrap at the tile edge. */
function materialDetail(pixels: Uint8Array, width: number, height: number, seed: number, amount: number, profile: Exclude<SurfaceDetailProfile, 'generic'>): void {
  const source = pixels.slice();
  const count = width * height;
  const light = new Float32Array(count);
  const horizontal = new Float32Array(count);
  const vertical = new Float32Array(count);
  const left = new Int32Array(width), right = new Int32Array(width), left2 = new Int32Array(width), right2 = new Int32Array(width);
  const above = new Int32Array(height), below = new Int32Array(height), above2 = new Int32Array(height), below2 = new Int32Array(height);
  for (let x = 0; x < width; x++) { left[x] = (x + width - 1) % width; right[x] = (x + 1) % width; left2[x] = (x + width * 2 - 2) % width; right2[x] = (x + 2) % width; }
  for (let y = 0; y < height; y++) { above[y] = ((y + height - 1) % height) * width; below[y] = ((y + 1) % height) * width; above2[y] = ((y + height * 2 - 2) % height) * width; below2[y] = ((y + 2) % height) * width; }
  for (let p = 0; p < count; p++) {
    const i = p * 4;
    light[p] = (source[i] * 0.2126 + source[i + 1] * 0.7152 + source[i + 2] * 0.0722) / 255;
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x;
    horizontal[p] = (light[y * width + left[x]] + light[p] + light[y * width + right[x]]) / 3;
    vertical[p] = (light[above[y] + x] + light[p] + light[below[y] + x]) / 3;
  }
  // A small wrapped lattice is interpolated over the image: a long, narrow
  // cell follows timber fibers, while stone receives fine, irregular pores.
  const across = profile === 'woodAcross';
  const wood = profile === 'wood' || across;
  const fineGrid = profile === 'cloth' || profile === 'hide' ? 12 : 32;
  const cols = Math.max(1, Math.min(width, wood ? (across ? 8 : 48) : fineGrid));
  const rows = Math.max(1, Math.min(height, wood ? (across ? 48 : 8) : fineGrid));
  const field = new Float32Array(cols * rows);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) field[y * cols + x] = hash2(x, y, seed + 271);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = y * width + x, i = p * 4;
    // Estimate the slope over a short footprint, averaging across it so the
    // light describes forms instead of outlining each individual source texel.
    const east = vertical[y * width + right2[x]], west = vertical[y * width + left2[x]];
    const south = horizontal[below2[y] + x], north = horizontal[above2[y] + x];
    const slope = 0.9 * (east - west) + 0.55 * (south - north);
    if (profile === 'snow') {
      // Snow catches soft relief and scattered pale crystal facets; avoid a dark cloudy grain.
      const sparkle = hash2(x, y, seed + 719);
      const facet = sparkle > 0.93 ? (sparkle - 0.93) / 0.07 * 0.42 * amount : 0;
      const snowLight = 1 + Math.max(-0.045, Math.min(0.045, slope * 0.3)) * amount;
      pixels[i] = Math.round(Math.min(255, (source[i] + Math.max(0, 244 - source[i]) * facet) * snowLight));
      pixels[i + 1] = Math.round(Math.min(255, (source[i + 1] + Math.max(0, 249 - source[i + 1]) * facet) * snowLight));
      pixels[i + 2] = Math.round(Math.min(255, (source[i + 2] + (255 - source[i + 2]) * facet) * snowLight));
      continue;
    }
    const fx = x * cols / width, fy = y * rows / height;
    const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const nx = (ix + 1) % cols, ny = (iy + 1) % rows;
    const top = field[iy * cols + ix] * (1 - tx) + field[iy * cols + nx] * tx;
    const bottom = field[ny * cols + ix] * (1 - tx) + field[ny * cols + nx] * tx;
    const grain = top * (1 - ty) + bottom * ty - 0.5;
    const centre = light[p];
    const neighbours = (light[y * width + left[x]] + light[y * width + right[x]] + light[above[y] + x] + light[below[y] + x]) * 0.25;
    const gentle = profile === 'cloth' || profile === 'hide' || profile === 'water';
    const relief = Math.max(-0.12, Math.min(0.12, (centre - neighbours) * (gentle ? 0.15 : wood ? 0.5 : 0.6)));
    // Favor the lighter shoulder of a groove, keeping dark joints dark.
    const shoulder = Math.min(1, centre / Math.max(neighbours, 0.01));
    const bevel = Math.max(-0.24, Math.min(0.24, slope)) * shoulder * (profile === 'cloth' ? 0.35 : profile === 'hide' ? 0.50 : profile === 'water' ? 0.55 : profile === 'organic' ? 0.7 : 1);
    const texture = profile === 'water' ? 0 : grain * (wood ? 0.50 : profile === 'cloth' ? 0.12 : profile === 'hide' ? 0.045 : profile === 'organic' ? 0.20 : 0.36);
    const gain = 1 + amount * (texture + relief + bevel);
    pixels[i] = Math.round(Math.min(255, source[i] * gain));
    pixels[i + 1] = Math.round(Math.min(255, source[i + 1] * gain));
    pixels[i + 2] = Math.round(Math.min(255, source[i + 2] * gain));
  }
}
