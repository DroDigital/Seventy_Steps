import { describe, expect, it } from 'vitest';
import { stirStep } from '../src/ui/menuSkin';

describe('the menus\' mist surge (round 40: it began in a step, and again mid-fall, so the mist jumped)', () => {
  const run = (goals: number[], dt = 1 / 30): number[] => goals.reduce<number[]>((a, g) => [...a, stirStep(a.at(-1) ?? 0, g, dt)], []);

  it('swells and settles without a step: no frame moves it more than a quarter', () => {
    const levels = run([...Array(30).fill(1), ...Array(120).fill(0)]);
    let prev = 0;
    for (const l of levels) {
      expect(Math.abs(l - prev)).toBeLessThan(0.25);
      prev = l;
    }
    expect(levels[29]).toBeGreaterThan(0.95);
    expect(levels.at(-1)).toBe(0);
  });

  it('a second surge while one is falling goes on from where it is', () => {
    const levels = run([...Array(20).fill(1), ...Array(6).fill(0), ...Array(20).fill(1)]);
    for (let i = 1; i < levels.length; i++) expect(Math.abs(levels[i] - levels[i - 1])).toBeLessThan(0.25);
  });

  it('rises quicker than it settles, and a long frame is no jump past the goal', () => {
    expect(stirStep(0, 1, 0.1)).toBeGreaterThan(1 - stirStep(1, 0, 0.1));
    expect(stirStep(0, 1, 5)).toBeLessThanOrEqual(1);
    expect(stirStep(1, 0, 5)).toBe(0);
  });
});
