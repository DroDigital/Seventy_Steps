import { describe, expect, it } from 'vitest';
import { createSeabedWindow } from '../src/world/seabedWindow';

const field = (x: number, z: number): number => Math.sin(x * 0.13) * 3 + Math.cos(z * 0.09) * 2 + x * 0.01;

describe('the seabed window (round 55)', () => {
  const settle = (w: ReturnType<typeof createSeabedWindow>, x: number, z: number): void => {
    for (let i = 0; i < 40 && !w.ready; i++) w.update(x, z);
  };

  it('is filled a few rows at a time, and then holds the field about the point', () => {
    const w = createSeabedWindow(field, 64, 2, 16);
    expect(w.ready).toBe(false);
    w.update(100, 50);
    expect(w.ready).toBe(false);
    settle(w, 100, 50);
    expect(w.ready).toBe(true);
    for (const [x, z] of [[100, 50], [70, 30], [130, 80], [101.3, 49.2]]) expect(w.at(x, z, -9)).toBeCloseTo(field(x, z), 0);
  });

  it('is the deep outside of the window', () => {
    const w = createSeabedWindow(field, 64, 2, 64);
    settle(w, 0, 0);
    expect(w.at(1000, 1000, -9)).toBe(-9);
  });

  it('scrolls: after a move the same world point reads the same, new ground is made and the rest is kept', () => {
    const calls: string[] = [];
    const w = createSeabedWindow((x, z) => (calls.push(`${x},${z}`), field(x, z)), 64, 2, 64);
    settle(w, 0, 0);
    const kept = w.at(5, 5, -9);
    calls.length = 0;
    w.update(10, 0);
    expect(calls.length).toBeLessThan(64 * 8); // a few columns, not the whole window
    expect(w.at(5, 5, -9)).toBeCloseTo(kept, 6);
    for (const [x, z] of [[40, 0], [-20, 20], [60, -25]]) expect(w.at(x, z, -9)).toBeCloseTo(field(x, z), 0);
    w.update(10, 0);
    expect(w.update(10, 0)).toBe(false);
    w.update(10, -30);
    for (const [x, z] of [[10, -30], [-10, -50], [35, -10]]) expect(w.at(x, z, -9)).toBeCloseTo(field(x, z), 0);
  });

  it('is made anew after a jump', () => {
    const w = createSeabedWindow(field, 32, 2, 32);
    settle(w, 0, 0);
    w.update(5000, 5000);
    expect(w.at(5000, 5000, -9)).toBeCloseTo(field(5000, 5000), 0);
    expect(w.at(0, 0, -9)).toBe(-9);
  });
});
