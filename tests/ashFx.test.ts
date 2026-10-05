import { describe, expect, it } from 'vitest';
import { goneAt, makeAsh, paintAsh, soften } from '../src/ui/ashFx';

/** Round 45: the opening's cards leave and return as ash (ui/ashFx.ts), a pure picture from a mask. */
const [w, h] = [160, 80];
const mask = new Float32Array(w * h);
for (let y = 30; y < 44; y++) for (let x = 20; x < 140; x++) mask[y * w + x] = 1;
const soft = soften(mask, w, h, 4);
const ash = makeAsh(w, h, 1, 3);
const frame = (d: number): Uint8ClampedArray => {
  const out = new Uint8ClampedArray(w * h * 4);
  paintAsh(ash, mask, soft, d, out);
  return out;
};
const alphaSum = (f: Uint8ClampedArray): number => f.reduce((s, v, i) => (i % 4 === 3 ? s + v : s), 0);

describe('ash', () => {
  it('goneAt runs from whole to gone and is flat at both ends', () => {
    expect([goneAt(0), goneAt(1)]).toEqual([0, 1]);
    expect(goneAt(0.02)).toBeLessThan(0.002);
    expect(goneAt(0.5)).toBeCloseTo(0.5, 5);
  });

  it('is the words exactly when whole, and nothing at all when gone', () => {
    const whole = frame(0);
    for (let i = 0; i < w * h; i++) expect(whole[i * 4 + 3]).toBe(Math.round(mask[i] * 255));
    expect(alphaSum(frame(1))).toBe(0);
  });

  it('thins steadily between, and is the same picture every time for the same moment', () => {
    const [a, b, c] = [alphaSum(frame(0.2)), alphaSum(frame(0.5)), alphaSum(frame(0.8))];
    expect(a).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(c);
    expect(frame(0.5)).toEqual(frame(0.5));
  });

  it('carries the grains downwind, and the other way for the next transition (an odd seed blows left, an even one right)', () => {
    const centre = (f: Uint8ClampedArray): number => {
      let [sum, n] = [0, 0];
      for (let i = 0; i < w * h; i++) {
        const a = f[i * 4 + 3];
        sum += (i % w) * a;
        n += a;
      }
      return sum / n;
    };
    const [left, right] = [centre(frame(0.6)), (() => { const o = new Uint8ClampedArray(w * h * 4); paintAsh(makeAsh(w, h, 1, 4), mask, soft, 0.6, o); return centre(o); })()];
    expect(right).toBeGreaterThan(80);
    expect(left).toBeLessThan(80);
  });
});
