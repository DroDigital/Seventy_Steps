import { describe, expect, it } from 'vitest';
import { dropTexture, washTexture } from '../src/render/audio/rainTexture';
import { DROPS, SHOWER, WASH, levelsOf } from '../src/render/audio/weatherBed';

const RATE = 22050;

/** The share of a signal's energy at or above `hz`, by Goertzel on a spread of frequencies, over its first two seconds. */
function above(x: Float32Array, hz: number): number {
  let [hi, all] = [0, 0];
  const seg = x.subarray(0, Math.min(x.length, RATE * 2));
  for (let f = 80; f < RATE / 2 - 100; f += 80) {
    const c = 2 * Math.cos((2 * Math.PI * f) / RATE);
    let [s1, s2] = [0, 0];
    for (let i = 0; i < seg.length; i++) [s1, s2] = [seg[i]! + c * s1 - s2, s1];
    const p = s1 * s1 + s2 * s2 - c * s1 * s2;
    all += p;
    if (f >= hz) hi += p;
  }
  return hi / all;
}
const rms = (x: Float32Array): number => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
const peak = (x: Float32Array): number => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const db = (v: number): number => 20 * Math.log10(v);
const correlation = (a: Float32Array, b: Float32Array): number => {
  let [ab, aa, bb] = [0, 0, 0];
  for (let i = 0; i < a.length; i++) [ab, aa, bb] = [ab + a[i]! * b[i]!, aa + a[i]! * a[i]!, bb + b[i]! * b[i]!];
  return ab / Math.sqrt(aa * bb);
};

describe('rain is a soft wash and drops, not static (round 53)', () => {
  const wash = washTexture(RATE, 7, 1);
  const sparse = dropTexture(RATE, 9, 11, 1);
  const dense = dropTexture(RATE, 11, 34, 2);

  it('the wash has its weight low and next to nothing in the hiss band, and is a different noise in each ear', () => {
    expect(peak(wash.left)).toBeCloseTo(0.5, 2);
    expect(above(wash.left, 2000)).toBeLessThan(0.08); // the old hiss lived at 1.5 to 6 kHz
    expect(above(wash.left, 1000)).toBeLessThan(0.4);
    expect(Math.abs(correlation(wash.left, wash.right))).toBeLessThan(0.2);
  });

  it('the drops are sparse and soft: far more peak than average, and nothing above the top of a drop\'s note', () => {
    expect(Math.max(peak(sparse.left), peak(sparse.right))).toBeCloseTo(0.8, 2); // the louder ear's peak
    expect(peak(sparse.left) / rms(sparse.left)).toBeGreaterThan(10); // a texture of events, not a level
    expect(above(sparse.left, 3000)).toBeLessThan(0.02);
    expect(1 - above(sparse.left, 700)).toBeGreaterThan(0.1); // the low, heavy drops, which are what a roof lets through
  });

  it('a downpour has more drops than a light rain, and each loop closes on itself', () => {
    expect(rms(dense.left)).toBeGreaterThan(rms(sparse.left) * 1.5);
    for (const t of [wash, sparse, dense]) {
      const seam = Math.abs(t.left[0]! - t.left[t.left.length - 1]!);
      expect(seam).toBeLessThan(0.1 * peak(t.left)); // no step where the loop turns over
    }
    expect(Array.from(washTexture(RATE, 7, 1).left.subarray(0, 64))).toEqual(Array.from(wash.left.subarray(0, 64))); // the same rain each start
  });

  it('the whole bed at its fullest is quiet and soft: about -33 dBFS, and almost none of it above 3 kHz', () => {
    const l = levelsOf('storm', 1, false);
    const n = RATE * 5;
    const mix = new Float32Array(n);
    for (let i = 0; i < n; i++) mix[i] = wash.left[i]! * WASH * l.rain + sparse.left[i]! * DROPS * l.patter + dense.left[i]! * SHOWER * l.shower;
    expect(db(rms(mix))).toBeGreaterThan(-38);
    expect(db(rms(mix))).toBeLessThan(-30);
    expect(db(peak(mix))).toBeLessThan(-14); // a loud drop is a drop, not a crack
    expect(above(mix, 3000)).toBeLessThan(0.04);
  });

  it('a light rain is mostly wash and a few drops; the crowd of drops comes with the downpour', () => {
    const light = levelsOf('rain', 0.3, false);
    const heavy = levelsOf('rain', 1, false);
    expect(light.shower).toBe(0);
    expect(heavy.shower).toBeGreaterThan(0.5);
    expect(levelsOf('rain', 1, true).shower).toBeLessThan(heavy.shower); // under a roof, fewer and duller
  });
});
