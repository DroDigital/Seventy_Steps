import { describe, expect, it } from 'vitest';
import { rgbToHsv } from '../src/render/palette';
import { generateTexture, TEXTURE_KINDS, TEXTURE_SIZE } from '../src/render/textures';

const S = TEXTURE_SIZE;
const lumaAt = (px: Uint8Array, x: number, y: number): number => {
  const i = (((y + S) % S) * S + ((x + S) % S)) * 4;
  return (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
};

/** Mean luma step between horizontal and vertical neighbours, across the wrap seam or inside. */
function meanStep(px: Uint8Array, seam: boolean): number {
  let sum = 0;
  for (let k = 0; k < S; k++) {
    if (seam) {
      sum += Math.abs(lumaAt(px, S - 1, k) - lumaAt(px, 0, k)) + Math.abs(lumaAt(px, k, S - 1) - lumaAt(px, k, 0));
    } else {
      for (let j = 0; j < S - 1; j++) {
        sum += (Math.abs(lumaAt(px, j, k) - lumaAt(px, j + 1, k)) + Math.abs(lumaAt(px, k, j) - lumaAt(px, k, j + 1))) / (S - 1);
      }
    }
  }
  return sum / (2 * S);
}

describe.each(TEXTURE_KINDS)('%s texture', (kind) => {
  const px = generateTexture(kind, 1);

  it('is 128×128 opaque RGBA and deterministic', () => {
    expect(px.length).toBe(S * S * 4);
    for (let i = 3; i < px.length; i += 4) expect(px[i]).toBe(255);
    expect(generateTexture(kind, 1)).toEqual(px);
    expect(generateTexture(kind, 2)).not.toEqual(px);
  });

  it('has visible detail', () => {
    const lumas = Array.from({ length: S * S }, (_, i) => lumaAt(px, i % S, Math.floor(i / S)));
    const mean = lumas.reduce((a, b) => a + b, 0) / lumas.length;
    const sd = Math.sqrt(lumas.reduce((a, b) => a + (b - mean) ** 2, 0) / lumas.length);
    expect(sd).toBeGreaterThan(0.02);
  });

  it('tiles without a visible seam', () => {
    expect(meanStep(px, true)).toBeLessThan(meanStep(px, false) * 3 + 0.02);
  });

  it('stays muted: the world is coloured by its realm and its light, and only anomalies are saturated (round 32: natural grounds carry their own colours now)', () => {
    for (let i = 0; i < px.length; i += 4) {
      expect(rgbToHsv([px[i] / 255, px[i + 1] / 255, px[i + 2] / 255])[1]).toBeLessThan(0.72);
    }
  });
});

describe('floor slab texture', () => {
  const px = generateTexture('slab', 1);
  const rowMean = (ys: number[]): number => ys.reduce((a, y) => a + Array.from({ length: S }, (_, x) => lumaAt(px, x, y)).reduce((b, c) => b + c, 0) / S, 0) / ys.length;

  it('has grout darker than the slab, but never black (round 79: the PS1 flagstones start where the seed puts them, so the joints are found, as the four darkest rows)', () => {
    const rows = Array.from({ length: S }, (_, y) => y).sort((a, b) => rowMean([a]) - rowMean([b]));
    const grout = rowMean(rows.slice(0, 4));
    const slab = rowMean(rows.slice(Math.floor(S / 4), Math.floor((3 * S) / 4))); // the middle half of the rows: slab, whatever they are
    expect(grout).toBeLessThan(slab * 0.8);
    for (const y of rows.slice(0, 4)) for (let x = 0; x < S; x++) expect(lumaAt(px, x, y)).toBeGreaterThan(0.1);
  });
});

describe('cloth texture', () => {
  it('keeps its broad folds while gaining fine surface detail', () => {
    const px = generateTexture('cloth', 1);
    const base = generateTexture('cloth', 1, false);
    let change = 0;
    for (let i = 0; i < px.length; i += 4) change += Math.abs(px[i] - base[i]);
    expect(change / (S * S)).toBeGreaterThan(1);
    expect(change / (S * S)).toBeLessThan(12);
    // The four-by-eight blocks carry the authored folds; keep their value
    // relationships even though the new relief varies within each block.
    const blocks: [number, number][] = [];
    for (let y = 0; y < S; y += 8) for (let x = 0; x < S; x += 4) {
      let b = 0, d = 0;
      for (let dy = 0; dy < 8; dy++) for (let dx = 0; dx < 4; dx++) {
        b += lumaAt(base, x + dx, y + dy); d += lumaAt(px, x + dx, y + dy);
      }
      blocks.push([b / 32, d / 32]);
    }
    const mean = (j: number): number => blocks.reduce((sum, a) => sum + a[j], 0) / blocks.length;
    const a = mean(0), b = mean(1);
    const covariance = blocks.reduce((sum, p) => sum + (p[0] - a) * (p[1] - b), 0);
    const va = blocks.reduce((sum, p) => sum + (p[0] - a) ** 2, 0);
    const vb = blocks.reduce((sum, p) => sum + (p[1] - b) ** 2, 0);
    expect(covariance / Math.sqrt(va * vb)).toBeGreaterThan(0.9);
  });
});
