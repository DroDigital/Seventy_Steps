import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { WRONG_STARS } from '../src/data/skyAir';
import { allEffectsOn, computeFx, spinOf, type FxState } from '../src/render/fx';
import type { RealmLook } from '../src/render/realmLook';
import { createSky } from '../src/render/sky';
import { SKY_FRAG } from '../src/render/shaders/sky';

const look = { now: { horizon: [0, 0, 0], zenith: [0, 0, 0], moonColor: [1, 1, 1], haze: [0, 0, 0], glow: 1 } } as unknown as RealmLook;
const uniforms = (sky: ReturnType<typeof createSky>) => (sky.mesh.material as THREE.ShaderMaterial).uniforms;
const state = (sanity: number, pressure = 0, cap = 1): FxState => ({ sanity, cap, pressure, anomalyProximity: 0, enabled: allEffectsOn() });
const spinAt = (sanity: number, pressure = 0, cap = 1): number => computeFx(state(sanity, pressure, cap)).spin;
const TAU = Math.PI * 2;
const most = (xs: number[]): number => xs.reduce((a, b) => Math.max(a, b), -Infinity);
const least = (xs: number[]): number => xs.reduce((a, b) => Math.min(a, b), Infinity);
const forward = (from: number, to: number): number => (((to - from) % TAU) + TAU) % TAU; // the turn between two frames (each far under a half turn)

/** The sky run at a spin for `seconds` of 60 Hz frames: the turn of each frame, unwrapped. */
function run(spin: number, seconds: number, sky = createSky(look), start = 0): { sky: ReturnType<typeof createSky>; steps: number[] } {
  const camera = new THREE.PerspectiveCamera();
  const u = uniforms(sky);
  const steps: number[] = [];
  sky.strange(spin > 0 ? 1 : 0, spin);
  for (let f = 1; f <= seconds * 60; f++) {
    const before = u.uCrawl!.value as number;
    sky.update(camera, start + f / 60, null, false);
    steps.push(forward(before, u.uCrawl!.value as number));
  }
  return { sky, steps };
}

describe('the wrong stars spin faster the lower the sanity, wild only at the last (fx.ts spinOf)', () => {
  it('holds them still in a sound mind', () => {
    for (const sanity of [100, 90, 80, 75]) expect(spinAt(sanity)).toBe(0);
  });

  it('spins them faster at every step down, to a turn in under three seconds at the bottom', () => {
    let last = 0;
    for (let sanity = 70; sanity >= 0; sanity -= 5) {
      const spin = spinAt(sanity);
      expect(spin).toBeGreaterThan(last);
      last = spin;
    }
    expect(spinAt(0)).toBeCloseTo(WRONG_STARS.most, 9);
    expect(TAU / spinAt(0)).toBeLessThan(3);
  });

  it('keeps an uneasy sky slow and lets it go wild only at the last', () => {
    expect(spinAt(55)).toBeLessThan(0.025); // a degree and a half a second: the crawl it had before
    expect(spinAt(40)).toBeLessThan(0.1);
    expect(spinAt(15)).toBeGreaterThan(0.5); // Unmoored: a turn in a dozen seconds
    for (const sanity of [20, 10]) expect(spinAt(sanity - 10)).toBeGreaterThan(2 * spinAt(sanity)); // still doubling near the bottom, where the stars' strangeness has all but stopped growing
  });

  it('follows the true stress: a blow that leaves sanity where it was, the cap and the dread toggle', () => {
    for (const sanity of [100, 60, 30, 5]) expect(spinAt(sanity, 1)).toBe(spinAt(sanity));
    expect(spinAt(0, 0, 0.5)).toBe(spinAt(50));
    expect(spinAt(0, 0, 0)).toBe(0);
    const off = state(0);
    off.enabled.dread = false;
    expect(computeFx(off).spin).toBe(0);
    expect(spinOf(1)).toBe(spinAt(0));
  });
});

describe('the sky turns at that pace and never leaps (render/sky.ts)', () => {
  it('no longer turns the stars by time × wrongness, which swung the whole sky round whenever the mind moved', () => {
    for (const line of SKY_FRAG.split('\n')) expect(line).not.toMatch(/uTime\s*\*[^;]*uWrong/);
    for (const name of ['uCrawl', 'uTrail', 'uFlicker']) expect(SKY_FRAG).toContain(name);
  });

  it('holds the stars still and unstreaked through a lucid hour', () => {
    const { sky, steps } = run(0, 3000);
    expect(most(steps)).toBe(0);
    expect(uniforms(sky).uTrail!.value).toBe(0);
    expect(uniforms(sky).uFlicker!.value).toBe(0);
  });

  it('spins up and down over moments when the mind jolts late in a long night: the pace changes a little a frame, the place never leaps', () => {
    const { sky } = run(0, 3000);
    const fastest = WRONG_STARS.most * (1 + WRONG_STARS.lurch);
    let start = 3000;
    let pace = 0;
    for (const spin of [WRONG_STARS.most, 0.05, WRONG_STARS.most, 0]) { // struck to the bottom, mended, struck again, restored
      const { steps } = run(spin, 4, sky, start);
      start += 4;
      expect(steps[0]!).toBeLessThan(Math.max(pace, spin) * 1.5 / 60 * 0.1 + pace / 60 + 1e-9); // the first frame: barely more than the pace it had
      for (let i = 0; i < steps.length; i++) {
        expect(steps[i]!).toBeLessThanOrEqual(fastest / 60 + 1e-9);
        if (i > 0) expect(Math.abs(steps[i]! - steps[i - 1]!)).toBeLessThan(fastest / 60 / (WRONG_STARS.ease * 60) + 1e-6);
      }
      pace = steps[steps.length - 1]! * 60;
    }
  });

  it('spins faster the lower the mind, and surges only in a wild sky, never backward', () => {
    const turned = (sanity: number) => run(spinAt(sanity), 20).steps.reduce((a, b) => a + b, 0);
    let last = 0;
    for (const sanity of [60, 45, 30, 15, 0]) {
      const turn = turned(sanity);
      expect(turn).toBeGreaterThan(last * 1.8);
      last = turn;
    }
    const slow = run(spinAt(55), 20).steps.slice(300);
    expect(most(slow) / least(slow)).toBeLessThan(1.05); // an uneasy sky turns evenly
    const wild = run(WRONG_STARS.most, 20).steps.slice(300);
    expect(least(wild)).toBeGreaterThan(0);
    expect(most(wild) / least(wild)).toBeGreaterThan(1.3); // and lurches at the last
  });

  it('streaks a fast star by its motion, never longer than the shader taps without a gap', () => {
    const taps = Number(/#define STREAK_TAPS (\d+)/.exec(SKY_FRAG)![1]);
    expect(1 + Math.ceil((WRONG_STARS.streak * 230) / 0.7)).toBeLessThanOrEqual(taps);
    const slow = run(spinAt(60), 10).sky;
    expect(uniforms(slow).uTrail!.value).toBeLessThan(0.003); // under a pixel: a point
    const wild = run(WRONG_STARS.most, 10).sky;
    expect(uniforms(wild).uTrail!.value).toBeCloseTo(WRONG_STARS.streak, 9);
  });
});
