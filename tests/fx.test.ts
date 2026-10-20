import { describe, expect, it } from 'vitest';
import { FX, RENDER } from '../src/data/tuning';
import { driftAt, surgeAt } from '../src/render/warpWaves';
import {
  allEffectsOn,
  anomalyProximity,
  computeFx,
  EFFECT_PARAMS,
  EFFECTS,
  lensAt,
  STEADY,
  sanityStress,
  warpOf,
  type FxState,
} from '../src/render/fx';

const state = (sanity: number, cap = 1): FxState => ({ sanity, cap, anomalyProximity: 0, enabled: allEffectsOn() });

describe('sanity stress', () => {
  it('maps sanity 100..0 to stress 0..1', () => {
    expect(sanityStress(100, 1)).toBe(0);
    expect(sanityStress(50, 1)).toBe(0.5);
    expect(sanityStress(0, 1)).toBe(1);
    expect(sanityStress(-20, 1)).toBe(1);
  });

  it('never exceeds the accessibility cap', () => {
    expect(sanityStress(0, 0.3)).toBe(0.3);
    expect(computeFx(state(0, 0))).toEqual(computeFx(state(100, 1)));
  });
});

describe('computeFx', () => {
  it.each(EFFECTS.filter((id) => !STEADY.includes(id)))('%s responds to the sanity slider', (id) => {
    const calm = computeFx(state(100));
    const mad = computeFx(state(0));
    expect(EFFECT_PARAMS[id].some((key) => calm[key] !== mad[key])).toBe(true);
  });

  it('madness warps the picture but never coarsens its pixels (playtest round 7)', () => {
    for (const id of STEADY) expect(EFFECT_PARAMS[id].every((key) => computeFx(state(100))[key] === computeFx(state(0))[key])).toBe(true);
    expect(computeFx(state(0)).ripple).toBeGreaterThan(0);
  });

  it('turns every effect off with its toggle', () => {
    const s = state(0);
    for (const id of EFFECTS) s.enabled[id] = false;
    const fx = computeFx(s);
    expect(fx).toMatchObject({
      lowRes: false,
      snapPixels: 0,
      affine: 0,
      fogAmount: 0,
      isolate: false,
      quantize: false,
      ripple: 0,
      chroma: 0,
      displace: 0,
      fovBreatheDeg: 0,
      skew: 0,
      blur: 0,
      strange: 0,
    });
  });

  it('keeps the lens still while lucid', () => {
    const fx = computeFx(state(100));
    for (const t of [0, 1.3, 7.9]) {
      const lens = lensAt(fx, t);
      expect(lens.fovDeg).toBe(RENDER.fovDeg);
      expect(Math.abs(lens.skew)).toBe(0);
    }
  });
});

describe('anomalyProximity', () => {
  it('is 1 up close and 0 far away', () => {
    expect(anomalyProximity(0)).toBe(1);
    expect(anomalyProximity(1000)).toBe(0);
    const mid = anomalyProximity(15);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });
});

describe('band pulse and audio', () => {
  it('adds the pulse to the warp, within the accessibility cap', () => {
    expect(computeFx({ ...state(100), pulse: 1 }).ripple).toBeCloseTo(FX.pulseRipple);
    expect(computeFx({ ...state(100), pulse: 1 }).chroma).toBeCloseTo(FX.pulseChroma);
    expect(computeFx({ ...state(100, 0.5), pulse: 1 }).ripple).toBeCloseTo(FX.pulseRipple / 2);
    expect(computeFx({ ...state(100, 0), pulse: 1 }).ripple).toBe(0);
  });

  it('detunes and distorts the audio as sanity falls, and leaves it be while lucid', () => {
    const calm = computeFx(state(100));
    expect([calm.detune, calm.wobble, calm.distortion]).toEqual([0, 0, 0]);
    const mad = computeFx(state(0));
    expect([mad.detune, mad.wobble, mad.distortion]).toEqual([FX.detune[1], FX.wobble[1], FX.distortion[1]]);
    expect(computeFx(state(0, 0)).distortion).toBe(0);
  });
});

describe('a failing mind warps the picture more slowly past a point, and loses its focus and its stars (rounds 22–23)', () => {
  const sanityOf = (stress: number): number => 100 * (1 - stress);

  it('holds still until FX.calm of the stress is spent (round 32), then warps up to FX.warpCap, and only FX.warpSlope as fast past it', () => {
    expect(warpOf(0)).toBe(0);
    expect(warpOf(FX.calm)).toBe(0);
    expect(warpOf(FX.warpCap)).toBeCloseTo(FX.warpCap, 9);
    expect(warpOf(1)).toBeCloseTo(FX.warpCap + (1 - FX.warpCap) * FX.warpSlope, 9);
    let last = -1;
    for (let stress = 0; stress <= 1; stress += 0.05) {
      const w = warpOf(stress);
      expect(stress <= FX.calm ? w >= last : w > last).toBe(true); // it never stops growing once it has begun, and never falls
      last = w;
    }
  });

  it('leaves the picture whole at 76 sanity, where the fringing and the shimmer once hid the scene (round 32)', () => {
    const fx = computeFx(state(76));
    expect(fx.ripple).toBeLessThan(FX.ripple[1] * 0.03); // under a tenth of a pixel
    expect(fx.chroma).toBeLessThan(FX.chroma[1] * 0.03);
    expect(fx.displace).toBeLessThan(0.03);
    expect(fx.affine).toBeLessThan(FX.affine[0] + 0.15);
    expect(fx.desaturate).toBeLessThan(0.02);
    expect(fx.fogFar).toBeGreaterThan(FX.fogFar[0] - 2);
    const uneasy = computeFx(state(70)); // and begins as it first falls Uneasy: faintly
    expect(uneasy.ripple).toBeGreaterThan(fx.ripple);
    expect(uneasy.ripple).toBeLessThan(FX.ripple[1] * 0.12);
  });

  it('warps the ripple, split, swimming walls, breathing lens and shear by that, less than they did before round 22 and more than the cap alone', () => {
    const [calm, capped, mad] = [computeFx(state(100)), computeFx(state(sanityOf(FX.warpCap))), computeFx(state(0))];
    for (const key of ['ripple', 'chroma', 'displace', 'affine', 'fovBreatheDeg', 'skew'] as const) {
      expect(mad[key], key).toBeGreaterThan(capped[key]);
      expect(mad[key] - capped[key], key).toBeLessThan(capped[key] - calm[key]); // past the cap it grows slower than up to it
    }
    expect(mad.ripple).toBeLessThan(FX.ripple[1] * 0.8); // where it was 0.012, and grew to madness
    expect(mad.ripple).toBeGreaterThan(FX.ripple[1] * 0.5); // and where round 22 left it, at 0.4 of that
    expect(mad.skew).toBeGreaterThan(FX.skew[1] * 0.5);
    expect(computeFx(state(sanityOf(0.3))).ripple).toBeLessThan(capped.ripple);
    expect(computeFx(state(sanityOf(0.3))).ripple).toBeGreaterThan(0);
  });

  it('softens the edges of sight and makes the stars strange only as the mind goes, none while it holds', () => {
    const lucid = computeFx(state(100));
    expect([lucid.blur, lucid.strange]).toEqual([0, 0]);
    expect(computeFx(state(sanityOf(FX.dreadFrom - 0.01))).blur).toBe(0);
    let last = 0;
    for (let sanity = 100; sanity >= 0; sanity -= 5) {
      const fx = computeFx(state(sanity));
      expect(fx.blur).toBeGreaterThanOrEqual(last);
      last = fx.blur;
    }
    const mad = computeFx(state(0));
    expect(mad.blur).toBeCloseTo(FX.blur[1], 9);
    expect(mad.strange).toBeCloseTo(FX.strange[1], 9);
  });

  it('keeps to the accessibility cap and its own toggle', () => {
    expect(computeFx(state(0, 0)).blur).toBe(0);
    expect(computeFx(state(0, 0)).strange).toBe(0);
    const s = state(0);
    s.enabled.dread = false;
    expect(computeFx(s)).toMatchObject({ blur: 0, strange: 0 });
    expect(computeFx(s).ripple).toBeGreaterThan(0); // the warp is its own toggle
  });
});


describe('round 58: a failing mind\'s picture is flow at the edges, a lens, a second picture and a rare tear, in waves', () => {
  const at = (sanity: number, time: number, extra: Partial<FxState> = {}): ReturnType<typeof computeFx> => computeFx({ ...state(sanity), time, ...extra });
  const times = Array.from({ length: 2400 }, (_, i) => i * 0.1);

  it('the surge is the warp\'s waves at this moment, and the picture swells and lulls with it', () => {
    for (const t of [0, 7.3, 31.9, 120.4]) expect(at(30, t).surge).toBe(surgeAt(t, 0.7));
    const xs = times.map((t) => at(30, t).surge);
    expect(Math.min(...xs)).toBeLessThan(0.45);
    expect(Math.max(...xs)).toBeGreaterThan(0.85);
  });

  it('a second picture comes with the warp, never while lucid, never past the cap or its toggle', () => {
    expect(at(100, 5).ghost).toBe(0);
    expect(at(76, 5).ghost).toBeLessThan(FX.ghost[1] * 0.03);
    expect(at(20, 5).ghost).toBeGreaterThan(at(60, 5).ghost);
    expect(at(0, 5).ghost).toBeLessThanOrEqual(FX.ghost[1]);
    expect(at(0, 5, { cap: 0 }).ghost).toBe(0);
    const off = state(0);
    off.enabled.warp = false;
    expect(computeFx({ ...off, time: 5 }).ghost).toBe(0);
  });

  it('the picture tears only at the edge of Unmoored, and only at the height of a surge', () => {
    for (const t of times) expect(at(40, t).tear).toBe(0); // Fractured: never
    const mad = times.map((time) => ({ surge: at(5, time).surge, tear: at(5, time).tear }));
    expect(mad.some((m) => m.tear > 0.8)).toBe(true);
    expect(mad.some((m) => m.tear === 0)).toBe(true);
    for (const m of mad) expect(m.surge < 0.7 ? m.tear : 0).toBe(0); // a lull never tears
    expect(Math.max(...times.map((t) => at(25, t).tear))).toBeLessThan(Math.max(...mad.map((m) => m.tear)));
  });

  it('a band lost sends a ring out of the middle, which pushes the picture as it passes and is gone with the pulse', () => {
    expect(at(100, 0, { pulse: 0 }).shock).toBe(0);
    expect(at(100, 0, { pulse: 1 }).shockAt).toBe(0);
    let peak = 0;
    let last = -1;
    for (let pulse = 1; pulse > 0; pulse -= 0.05) {
      const fx = at(100, 0, { pulse });
      expect(fx.shockAt).toBeGreaterThan(last);
      last = fx.shockAt;
      peak = Math.max(peak, fx.shock);
    }
    expect(peak).toBeCloseTo(FX.shock, 2);
    expect(at(100, 0, { pulse: 0.5, cap: 0.5 }).shock).toBeLessThan(at(100, 0, { pulse: 0.5 }).shock);
    expect(at(100, 0, { pulse: 0.5, cap: 0 }).shock).toBe(0);
  });

  it('the lens drifts unevenly within its bounds and the surge gives it more, none while lucid', () => {
    const mad = times.map((t) => lensAt(at(5, t), t));
    expect(Math.max(...mad.map((l) => Math.abs(l.fovDeg - RENDER.fovDeg)))).toBeLessThanOrEqual(FX.fovBreatheDeg[1] * 0.7 + 1e-9);
    expect(Math.max(...mad.map((l) => Math.abs(l.fovDeg - RENDER.fovDeg)))).toBeGreaterThan(FX.fovBreatheDeg[1] * 0.2);
    expect(Math.max(...mad.map((l) => Math.abs(l.skew)))).toBeLessThanOrEqual(FX.skew[1] * 0.7 + 1e-9);
    for (const t of [0, 3.3, 90]) {
      const lens = lensAt(at(100, t), t);
      expect(lens.fovDeg).toBe(RENDER.fovDeg);
      expect(Math.abs(lens.skew)).toBe(0);
    }
    expect(driftAt(0)).toBeLessThan(1);
  });

  it('the warp ramps and the new parts live under the warp\'s own toggle', () => {
    expect(EFFECT_PARAMS.warp).toEqual(expect.arrayContaining(['ripple', 'chroma', 'ghost', 'tear', 'shock']));
    const calm = at(100, 9);
    const mad = at(0, 9);
    expect([calm.ghost, calm.tear]).toEqual([0, 0]);
    expect(mad.ghost).toBeGreaterThan(0);
  });
});
