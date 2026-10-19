import { describe, expect, it } from 'vitest';
import { driftAt, ringAt, surgeAt } from '../src/render/warpWaves';

const run = (f: (t: number) => number, seconds: number, step = 0.1): number[] => Array.from({ length: Math.round(seconds / step) + 1 }, (_, i) => f(i * step));

describe('round 58: a failing mind’s picture comes in waves', () => {
  it('swells and lulls: a mind lightly failed has long calm stretches, and the peaks are not the constant', () => {
    const xs = run((t) => surgeAt(t, 0.35), 240);
    expect(Math.min(...xs)).toBeLessThan(0.15);
    expect(Math.max(...xs)).toBeGreaterThan(0.8);
    expect(xs.filter((x) => x < 0.15).length / xs.length).toBeGreaterThan(0.1); // calm for a tenth of the time or more
    expect(xs.every((x) => x >= 0 && x <= 1)).toBe(true);
  });

  it('never settles on a beat: no period repeats it', () => {
    const xs = run((t) => surgeAt(t, 0.5), 600, 0.25);
    for (const period of [5, 10, 17, 20, 30, 36, 60]) {
      const shift = Math.round(period / 0.25);
      let same = 0;
      for (let i = 0; i + shift < xs.length; i++) if (Math.abs(xs[i] - xs[i + shift]) < 0.02) same++;
      expect(same / (xs.length - shift), `period ${period}`).toBeLessThan(0.35);
    }
  });

  it('the lulls fill as the mind goes: never quite calm at the last, and always the more for the less sanity', () => {
    const floor = (stress: number): number => Math.min(...run((t) => surgeAt(t, stress), 240));
    expect(floor(0.2)).toBeLessThan(floor(0.6));
    expect(floor(0.6)).toBeLessThan(floor(1));
    expect(floor(1)).toBeGreaterThan(0.3);
    expect(floor(1)).toBeLessThan(0.8); // but it still swells and lulls
    const mean = (stress: number): number => run((t) => surgeAt(t, stress), 240).reduce((a, b) => a + b, 0) / 2401;
    expect(mean(0.9)).toBeGreaterThan(mean(0.3));
  });

  it('the lens drifts unevenly within its bounds, and the two drifts of different seeds part', () => {
    const xs = run((t) => driftAt(t), 120);
    expect(Math.max(...xs.map(Math.abs))).toBeLessThanOrEqual(1);
    expect(Math.max(...xs)).toBeGreaterThan(0.6);
    expect(Math.min(...xs)).toBeLessThan(-0.6);
    expect(run((t) => driftAt(t, 3), 60).some((x, i) => Math.abs(x - xs[i]) > 0.3)).toBe(true);
  });

  it('a band for the worse sends one ring from the middle outward, strongest on the way, and gone when the pulse is spent', () => {
    expect(ringAt(1).radius).toBe(0);
    expect(ringAt(0).strength).toBe(0);
    let last = -1;
    let peak = 0;
    for (let pulse = 1; pulse >= 0.001; pulse -= 0.02) {
      const { radius, strength } = ringAt(pulse);
      expect(radius).toBeGreaterThan(last);
      last = radius;
      peak = Math.max(peak, strength);
    }
    expect(peak).toBeGreaterThan(0.95);
    expect(last).toBeGreaterThan(1); // it leaves the picture
  });
});
