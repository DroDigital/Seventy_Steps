import { describe, expect, it } from 'vitest';
import { FX } from '../src/data/tuning';
import { PRESSURE } from '../src/data/dreadPicture';
import { allEffectsOn, computeFx, leant, type FxState } from '../src/render/fx';
import { approach, createPressure, jolt, PRESSURE_DEBUG, pressureOf, rateDread } from '../src/render/pressure';
import type { Fight } from '../src/systems/components';
import { loseSanity, restoreSanity, setSanity } from '../src/systems/sanity';
import { scriptedGame } from './helpers';

const state = (sanity: number, pressure?: number, cap = 1): FxState => ({ sanity, cap, anomalyProximity: 0, enabled: allEffectsOn(), pressure });

describe('pressure: the curve', () => {
  it('is whole at PRESSURE.rate sanity a second, and none at none', () => {
    expect(rateDread(0)).toBe(0);
    expect(rateDread(PRESSURE.rate)).toBe(1);
    expect(rateDread(PRESSURE.rate * 5)).toBe(1);
    expect(rateDread(PRESSURE.rate / 2)).toBeCloseTo(0.5, 9);
  });

  it('takes a sudden loss as a jolt, whole at PRESSURE.shock', () => {
    expect(jolt(0)).toBe(0);
    expect(jolt(PRESSURE.shock)).toBe(1);
    expect(jolt(PRESSURE.shock / 4)).toBeCloseTo(0.25, 9);
  });

  it('is a share of itself in a horror\'s fight, and never past one', () => {
    expect(pressureOf(0.6, 0.2, 0)).toBeCloseTo(0.8, 9);
    expect(pressureOf(0.6, 0.2, 1)).toBeCloseTo(0.8 * PRESSURE.fight, 9);
    expect(pressureOf(1, 1, 0)).toBe(1);
    expect(pressureOf(0, 0, 1)).toBe(0);
  });

  it('approaches by an exponential', () => {
    expect(approach(1, 0, 0, 2)).toBe(1);
    expect(approach(1, 0, 2, 2)).toBeCloseTo(Math.exp(-1), 9);
    expect(approach(0, 1, 100, 1)).toBeCloseTo(1, 9);
  });
});

describe('pressure: read from the mind', () => {
  /** Runs `seconds` of 60 Hz steps with `drain` sanity a second taken, rendering at `fps`; returns the pressure at the end. */
  const run = (g: ReturnType<typeof scriptedGame>['g'], p: ReturnType<typeof createPressure>, from: number, seconds: number, drain: number, fps = 30): number => {
    let value = 0;
    for (let t = 0; t < seconds; t += 1 / fps) {
      if (drain > 0) setSanity(g, g.mind.sanity - drain / fps); // (a slow drain: no SanityLost)
      value = p.update(from + t);
    }
    return value;
  };

  it('rises while sanity is being lost, and settles when it stops: auras, clouds and places all alike', () => {
    const { g } = scriptedGame();
    const p = createPressure(g);
    expect(run(g, p, 0, 1, 0)).toBe(0);
    const pressed = run(g, p, 1, 3, 1.2);
    expect(pressed).toBeGreaterThan(0.9);
    const settled = run(g, p, 4, 10, 0);
    expect(settled).toBeLessThan(0.05);
  });

  it('is slight under a slow drain, and none while the mind mends or a dose of Laudanum holds the drain off', () => {
    const { g } = scriptedGame();
    const p = createPressure(g);
    run(g, p, 0, 1, 0);
    const slight = run(g, p, 1, 6, 0.2);
    expect(slight).toBeGreaterThan(0.1);
    expect(slight).toBeLessThan(0.4);
    for (let t = 0; t < 3; t += 1 / 30) {
      restoreSanity(g, 1 / 30);
      expect(p.update(7 + t)).toBeLessThanOrEqual(slight);
    }
    expect(p.update(10.5)).toBeLessThan(0.1);
  });

  it('jolts at a sudden loss and fades, without counting the loss again as a rate', () => {
    const { g } = scriptedGame();
    const p = createPressure(g);
    run(g, p, 0, 1, 0);
    loseSanity(g, PRESSURE.shock / 2); // a first sight: SanityLost
    const at = p.update(1.05);
    expect(at).toBeGreaterThan(0.45);
    expect(at).toBeLessThan(0.55); // the jolt, and not the jolt plus a rate of hundreds a second
    let later = at;
    for (let t = 0; t < PRESSURE.shockSeconds * 3; t += 1 / 30) later = p.update(1.05 + t);
    expect(later).toBeLessThan(0.1);
  });

  it('is halved in a horror\'s fight', () => {
    const { g, dummy } = scriptedGame();
    const p = createPressure(g);
    run(g, p, 0, 1, 0);
    loseSanity(g, PRESSURE.shock);
    const open = p.update(1.02);
    g.ecs.c.fight.set(dummy, { engaged: true } as Fight);
    let eased = open;
    for (let t = 0; t < 4; t += 1 / 30) eased = p.update(1.02 + t);
    expect(open).toBeGreaterThan(0.9);
    expect(eased).toBeLessThan(open * 0.5); // (the jolt has also faded in the four seconds)
    expect(pressureOf(1, 0, 1)).toBe(PRESSURE.fight);
  });

  it('holds still while the world does, and a debug value overrides it', () => {
    const { g } = scriptedGame();
    const p = createPressure(g);
    run(g, p, 0, 1, 0);
    setSanity(g, g.mind.sanity - 30); // lost while nothing passed (a menu): not dread
    expect(p.update(1)).toBeCloseTo(0, 9);
    PRESSURE_DEBUG.force = 0.7;
    expect(p.update(2)).toBeCloseTo(0.7, 9);
    PRESSURE_DEBUG.force = -1;
    expect(p.update(3)).toBeLessThan(0.05);
  });

  it('is nothing under a cutscene', () => {
    const { g } = scriptedGame();
    const p = createPressure(g);
    run(g, p, 0, 1, 0);
    g.cutscene = true;
    expect(run(g, p, 1, 3, 1.5)).toBe(0);
  });
});

describe('the picture leans toward madness by the pressure (fx.ts)', () => {
  it('reproduces today\'s picture exactly when no pressure is on, at any sanity', () => {
    for (const sanity of [100, 80, 55, 30, 5]) {
      expect(computeFx(state(sanity, 0))).toEqual({ ...computeFx(state(sanity)), felt: expect.anything(), heard: expect.anything() });
      expect(computeFx(state(sanity, 0)).felt).toBe(computeFx(state(sanity)).stress);
      expect(computeFx(state(sanity, 0)).heard).toBe(computeFx(state(sanity)).stress);
    }
  });

  it('takes up the edges at full sanity: the swim, the split, the second picture, the lens, the soft edges and the stars', () => {
    const calm = computeFx(state(100));
    const pressed = computeFx(state(100, 1));
    for (const key of ['ripple', 'chroma', 'ghost', 'fovBreatheDeg', 'skew', 'blur', 'strange'] as const) expect(pressed[key]).toBeGreaterThan(calm[key]);
    expect(pressed.felt).toBeCloseTo(PRESSURE.lean, 9);
    expect(pressed.heard).toBeCloseTo(PRESSURE.leanHeard, 9);
  });

  it('leaves the fog, the colour, the dither, the vertex displacement, the tear and all of the sound on the true stress', () => {
    for (const sanity of [100, 70, 45]) {
      const calm = computeFx(state(sanity));
      const pressed = computeFx(state(sanity, 1));
      for (const key of ['stress', 'fogNear', 'fogFar', 'fogAmount', 'desaturate', 'anomalyStress', 'ditherSpread', 'displace', 'affine', 'tear', 'detune', 'wobble', 'distortion'] as const) expect(pressed[key]).toBe(calm[key]);
    }
  });

  it('never goes past the FX intensity setting, and none at 0', () => {
    for (const cap of [0, 0.1, 0.3, 0.5, 1]) {
      for (const sanity of [100, 60, 20]) {
        const fx = computeFx(state(sanity, 1, cap));
        expect(fx.felt).toBeLessThanOrEqual(cap + 1e-9);
        expect(fx.heard).toBeLessThanOrEqual(cap + 1e-9);
      }
    }
    expect(computeFx(state(100, 1, 0))).toEqual(computeFx(state(100, 0, 0)));
    expect(leant(0.3, 1, 0.4, 0.3)).toBe(0.3);
    expect(leant(0.5, 0.5, 0.4, 1)).toBeCloseTo(0.5 + 0.4 * 0.5 * 0.5, 9);
  });

  it('keeps the effect toggles', () => {
    const s = state(100, 1);
    for (const id of ['warp', 'dread', 'lens'] as const) s.enabled[id] = false;
    expect(computeFx(s)).toMatchObject({ ripple: 0, chroma: 0, ghost: 0, blur: 0, strange: 0, fovBreatheDeg: 0, skew: 0 });
  });

  it('leans the whispers in only at the top of a pressure (they begin at the Fractured)', () => {
    expect(computeFx(state(100, 0.5)).heard).toBeLessThan(0.6);
    expect(computeFx(state(100, 1)).heard).toBeGreaterThan(0.6);
    expect(FX.calm).toBeLessThan(PRESSURE.lean); // (the lean is enough to take up the warp)
  });
});
