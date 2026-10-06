import { describe, expect, it } from 'vitest';
import { LIGHTNING } from '../src/data/tuning';
import { flicker } from '../src/render/lightning';

const curve = (flashes: number): number[] => Array.from({ length: 60 }, (_, i) => flicker((i / 60) * LIGHTNING.flash, flashes));
/** The largest fall from one sample to the next: a strobe's dark beat between pulses. */
const drop = (c: number[]): number => Math.max(...c.slice(1).map((v, i) => c[i] - v));

describe('the Flashes setting (photosensitivity, round 47)', () => {
  it('at full, the strike is as it was: three quick pulses', () => {
    expect(flicker(0.01)).toBe(flicker(0.01, 1));
    expect(drop(curve(1))).toBeGreaterThan(0.4);
  });

  it('lowered, it is dimmer and its strobe softens; off, nothing', () => {
    const [full, half] = [curve(1), curve(0.5)];
    expect(Math.max(...half)).toBeLessThan(Math.max(...full) * 0.6);
    expect(drop(half)).toBeLessThan(drop(full) * 0.3);
    expect(curve(0).every((v) => v === 0)).toBe(true);
  });
});
