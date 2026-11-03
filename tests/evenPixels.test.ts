import { describe, expect, it } from 'vitest';
import { evenSample } from '../src/render/evenPixels';

/** How much of each of `n` picture pixels reaches the `out` screen pixels they are spread over: the sum of its bilinear weights. */
function coverage(n: number, out: number, sample: (texel: number, scale: number) => number): number[] {
  const got = new Array<number>(n).fill(0);
  for (let i = 0; i < out; i++) {
    const x = sample(((i + 0.5) * n) / out, out / n) - 0.5; // bilinear: between the middles of two picture pixels
    const left = Math.floor(x);
    const w = x - left;
    if (left >= 0) got[left] += 1 - w;
    if (left + 1 < n) got[left + 1] += w;
  }
  return got;
}
const nearest = (texel: number): number => Math.floor(texel) + 0.5;
const spread = (values: number[]): number => Math.max(...values) - Math.min(...values);

describe('even pixels (render/evenPixels.ts, shaders/present.ts)', () => {
  it('draws every picture pixel the same size where the screen does not hold the picture a whole number of times, as nearest-neighbour does not', () => {
    // 800 × 450 on 720p, 1080p, 1440p and 4K (1.6, 2.4, 3.2 and 4.8 times over), and 640 × 360 on a 1366 × 768 laptop
    for (const [n, out] of [[800, 1280], [800, 1920], [800, 2560], [800, 3840], [450, 720], [450, 1080], [640, 1366]]) {
      const even = coverage(n, out, evenSample).slice(1, -1);
      for (const c of even) expect(c).toBeCloseTo(out / n, 9);
      expect(spread(coverage(n, out, nearest).slice(1, -1))).toBe(1); // nearest: a whole screen pixel wider here than there
    }
  });

  it('is nearest-neighbour at a whole number of times over (640 × 360 on 720p, 1080p, 1440p and 4K)', () => {
    for (const times of [1, 2, 3, 4, 6]) {
      for (let i = 0; i < 640 * times; i++) {
        const texel = ((i + 0.5) * 640) / (640 * times);
        expect(evenSample(texel, times)).toBeCloseTo(nearest(texel), 9);
      }
    }
  });

  it('softens at most the one screen pixel that straddles two picture pixels', () => {
    for (const [n, out] of [[800, 1280], [800, 1920], [800, 2560]]) {
      let shared = 0;
      for (let i = 0; i < out; i++) {
        const w = (evenSample(((i + 0.5) * n) / out, out / n) - 0.5) % 1;
        if (w > 1e-9 && w < 1 - 1e-9) shared++;
      }
      expect(shared).toBeLessThanOrEqual(n - 1);
      expect(out - shared).toBeGreaterThanOrEqual(out - n); // every other screen pixel is one picture pixel's, untouched
    }
  });
});
