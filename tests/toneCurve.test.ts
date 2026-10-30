import { describe, expect, it } from 'vitest';
import { BRIGHTNESS_TOE, brightnessGamma, SETTINGS } from '../src/data/tuning';
import { toneCurve } from '../src/render/toneCurve';

const at = (v: number, brightness: number, toe = BRIGHTNESS_TOE) => toneCurve(v, brightnessGamma(brightness), toe);
const levels = Array.from({ length: 401 }, (_, i) => i / 400);

describe('the picture\'s tone curve (round 103)', () => {
  it('holds black and white, and rises from black with a slope of one, so the darkest detail keeps its contrast', () => {
    expect(at(0, 1)).toBe(0);
    expect(at(1, 1)).toBeCloseTo(1, 10);
    expect((at(0.001, 1) - at(0, 1)) / 0.001).toBeCloseTo(1, 2); // a plain gamma's slope is zero at black
  });

  it('lifts the deepest shadows above a plain gamma, and leaves the midtones and the lights to it', () => {
    const gamma = brightnessGamma(1);
    for (const v of [0.02, 0.05, 0.08]) {
      expect(toneCurve(v, gamma, BRIGHTNESS_TOE), `shadow ${v}`).toBeGreaterThan(Math.pow(v, gamma));
      expect(toneCurve(v, gamma, BRIGHTNESS_TOE), `shadow ${v} stays darker than the picture`).toBeLessThan(v);
    }
    for (const v of [BRIGHTNESS_TOE, 0.2, 0.5, 0.9]) expect(at(v, 1), `midtone ${v}`).toBeCloseTo(Math.pow(v, gamma), 10);
  });

  it('keeps the 85% mood at the default: the midtone darkening is the old curve\'s', () => {
    expect(at(0.5, SETTINGS.brightness[3])).toBeCloseTo(Math.pow(0.5, 1 / 0.85), 6);
  });

  it('is monotone across the whole range of the setting, so no two shades of a picture are reversed', () => {
    const [min, max, step] = SETTINGS.brightness;
    for (let b = min; b <= max + 1e-9; b += step) {
      let last = -1;
      for (const v of levels) {
        const out = at(v, b);
        expect(out, `brightness ${b.toFixed(2)} at ${v}`).toBeGreaterThanOrEqual(last - 1e-12);
        last = out;
      }
    }
  });

  it('with no toe is the plain gamma, the look before round 103', () => {
    for (const v of [0.01, 0.03, 0.3, 0.8]) expect(at(v, 1, 0)).toBeCloseTo(Math.pow(v, brightnessGamma(1)), 12);
  });
});
