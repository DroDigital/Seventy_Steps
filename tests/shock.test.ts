import { describe, expect, it } from 'vitest';
import { SHOCK } from '../src/data/dreadPicture';
import { RING } from '../src/data/dreadSounds';
import { STINGERS } from '../src/data/sounds';
import { SANITY, FX } from '../src/data/tuning';
import { allEffectsOn, computeFx, type FxState } from '../src/render/fx';
import { createFxController } from '../src/render/fxController';
import { createShock, DREAD_AIR, shockAfter, shockOf } from '../src/render/shock';
import { createGame } from '../src/systems/game';
import { loseSanity, setSanity } from '../src/systems/sanity';
import { render } from './soundRender';

const fresh = (): FxState => ({ sanity: 100, cap: 1, anomalyProximity: 0, enabled: allEffectsOn() });
const far = { x: 0, y: 1.6, z: -20 };

describe('the shock: a sudden large loss', () => {
  it('is a shock from SHOCK.from, whole at SHOCK.full, and none for the small jolts the bar already shows', () => {
    expect(SHOCK.from).toBeCloseTo(SANITY.jolt * 3, 9);
    expect(shockOf(SANITY.jolt)).toBe(0);
    expect(shockOf(SHOCK.from - 0.01)).toBe(0);
    expect(shockOf(SHOCK.from)).toBeGreaterThan(0.3);
    expect(shockOf(SHOCK.full)).toBe(1);
    expect(shockOf(40)).toBe(1);
  });

  it('thins over a few seconds and is gone', () => {
    expect(shockAfter(1, 0)).toBe(1);
    expect(shockAfter(1, SHOCK.seconds)).toBeCloseTo(Math.exp(-1), 9);
    let k = 1;
    for (let t = 0; t < 20; t += 0.05) k = shockAfter(k, 0.05);
    expect(k).toBe(0);
  });

  it('rings once for a shock, in the head, at a gain held by the FX intensity; and not for a small loss or at intensity 0', () => {
    const g = createGame();
    const played: { key: string; gain: number; at: unknown }[] = [];
    const shock = createShock(g, { recipe: (key, _sound, o) => (played.push({ key, gain: o?.gain ?? 1, at: o?.at ?? null }), true) });
    DREAD_AIR.cap = 1;
    g.events.emit('SanityLost', { amount: 2, sanity: 90 });
    expect(played).toHaveLength(0);
    g.events.emit('SanityLost', { amount: 12, sanity: 80 });
    expect(played).toEqual([{ key: 'shock:ring', gain: SHOCK.tone.gain, at: null }]);
    expect(shock.update(1)).toBe(1);
    expect(shock.update(1 + SHOCK.seconds * 0.1)).toBeLessThan(1);
    DREAD_AIR.cap = 0.5;
    g.events.emit('SanityLost', { amount: 6, sanity: 74 });
    expect(played[1].gain).toBeCloseTo(SHOCK.tone.gain * shockOf(6) * 0.5, 9);
    DREAD_AIR.cap = 0;
    g.events.emit('SanityLost', { amount: 12, sanity: 62 });
    expect(played).toHaveLength(2);
    DREAD_AIR.cap = 1;
  });
});

describe('the ring is not a stinger, and has a level of its own', () => {
  it('rings thinly and long, well under the stingers, and fades out', () => {
    const r = render(RING.map((l) => ({ ...l, gain: l.gain * SHOCK.tone.gain })));
    expect(r.peak).toBeLessThan(-22); // quiet: a tone in the head, not an event
    expect(r.peak).toBeGreaterThan(-40); // ...but heard
    expect(r.sec).toBeGreaterThan(2.5);
    expect(r.sec).toBeLessThan(SHOCK.tone.seconds + SHOCK.ringAt + 0.1);
    const early = r.samples.slice(0, Math.round(0.1 * 22050));
    expect(Math.max(...early.map(Math.abs))).toBeLessThan(0.01 * 0.5); // it comes in a moment after the blow, not on it
    expect('ring' in STINGERS).toBe(false);
  });
});

describe('the ring across the picture for a large loss within a band (fx controller)', () => {
  it('sends half a ring for a loss of SHOCK.from or more, a whole one for a band lost, and none for a small loss or a climb', () => {
    const g = createGame();
    const fx = createFxController(g);
    const state = fresh();
    fx.update(state, far, 10);
    expect(state.pulse).toBe(0);
    loseSanity(g, 2); // a small jolt: the bar's, not the picture's
    fx.update(state, far, 10.1);
    expect(state.pulse).toBe(0);
    loseSanity(g, 6); // 92 -> 86, within the Lucid band
    fx.update(state, far, 11);
    expect(state.pulse).toBe(1);
    expect(state.pulseScale).toBe(SHOCK.ringScale);
    const ring = computeFx({ ...state, time: 11, pressure: 0 }); // (the jolt also leans the picture, pressure.ts: that is tested there)
    expect(ring.ripple).toBeCloseTo(FX.pulseRipple * SHOCK.ringScale, 9);
    fx.update(state, far, 11 + FX.pulseSeconds / 2);
    expect(computeFx(state).shock).toBeLessThanOrEqual(FX.shock * SHOCK.ringScale + 1e-9);
    setSanity(g, 30); // a band for the worse: the whole ring
    fx.update(state, far, 20);
    expect(state.pulseScale).toBe(1);
    expect(state.pulse).toBe(1);
    setSanity(g, 80); // climbing back does not pulse
    fx.update(state, far, 30);
    expect(state.pulse).toBe(0);
  });

  it('holds the ring to the FX intensity: none at intensity 0', () => {
    const s: FxState = { ...fresh(), cap: 0, pulse: 0.5, pulseScale: 0.5 };
    expect(computeFx(s).shock).toBe(0);
    expect(computeFx(s).ripple).toBe(0);
  });
});
