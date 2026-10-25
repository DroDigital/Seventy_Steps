import { describe, expect, it } from 'vitest';
import { QUIET } from '../src/data/uiMood';
import { newCalm, shaped, stepCalm, type CalmInput } from '../src/ui/calm';

const run = (s = newCalm(), input: CalmInput, seconds: number, dt = 0.1): ReturnType<typeof newCalm> => {
  for (let t = 0; t < seconds - 1e-9; t += dt) stepCalm(s, input, dt);
  return s;
};
const CALM: CalmInput = { calm: true, still: true };

describe('the quiet walk (round 80)', () => {
  it('begins only after the delay, and comes on over its time', () => {
    const s = run(newCalm(), CALM, QUIET.hudAfter - 0.5);
    expect(s.hud).toBe(0);
    run(s, CALM, 1);
    expect(s.hud).toBeGreaterThan(0);
    expect(s.hud).toBeLessThan(1);
    run(s, CALM, QUIET.in + 0.5);
    expect(s.hud).toBe(1);
  });

  it('draws the camera back only after standing still a while longer', () => {
    const s = run(newCalm(), CALM, QUIET.hudAfter + QUIET.in);
    expect(s.hud).toBe(1);
    expect(s.camera).toBe(0); // (the bars are down, the camera waits on camAfter)
    run(s, CALM, QUIET.camAfter);
    expect(s.camera).toBeGreaterThan(0);
    run(s, CALM, QUIET.in + 0.5);
    expect(s.camera).toBe(1);
  });

  it('walking keeps the bars down but not the camera', () => {
    const s = run(newCalm(), { calm: true, still: false }, QUIET.hudAfter + QUIET.in + 1);
    expect(s.hud).toBe(1);
    expect(s.camera).toBe(0);
    run(s, CALM, QUIET.camAfter + QUIET.in + 0.5);
    expect(s.camera).toBe(1);
    run(s, { calm: true, still: false }, QUIET.out + 0.1); // a step: the camera is back at once
    expect(s.camera).toBe(0);
    expect(s.hud).toBe(1);
  });

  it('is snapped back under half a second by a blow, a hunt or a lock-on, and begins its count again', () => {
    const s = run(newCalm(), CALM, QUIET.hudAfter + QUIET.camAfter + QUIET.in + 1);
    expect([s.hud, s.camera]).toEqual([1, 1]);
    run(s, { calm: false, still: true }, QUIET.out + 0.05);
    expect([s.hud, s.camera, s.quiet]).toEqual([0, 0, 0]);
    run(s, CALM, QUIET.hudAfter - 0.5);
    expect(s.hud).toBe(0); // the delay is whole again
  });

  it('never comes on while something threatens, however long', () => {
    const s = run(newCalm(), { calm: false, still: true }, 120);
    expect([s.hud, s.camera]).toEqual([0, 0]);
  });

  it('shapes a recession softly at both ends', () => {
    expect(shaped(0)).toBe(0);
    expect(shaped(1)).toBe(1);
    expect(shaped(0.1)).toBeLessThan(0.1);
    expect(shaped(0.9)).toBeGreaterThan(0.9);
  });
});
