import { describe, expect, it } from 'vitest';
import { EYE } from '../src/data/horizonLife';
import { LIGHTING } from '../src/data/tuning';
import { allowed, baseOf, bloomScale, createEyeAdapt, ease, keep, poolOf, vignetteScale } from '../src/render/eyeAdapt';
import { createPostPass } from '../src/render/postPass';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';
import * as THREE from 'three';

const post = () => createPostPass(new THREE.Texture());
const steady = (eye: { update(t: number, e: boolean, a: number): void }, from: number, seconds: number, enclosed = false): number => {
  let t = from;
  for (let i = 0; i < seconds * 10; i++) eye.update((t += 0.1), enclosed, 0);
  return t;
};

describe('round 80: the eye opens in lamplight and closes in the dark (render/eyeAdapt.ts)', () => {
  it('a pool is none from a stray glow, whole at a lamp, and grows with the light', () => {
    expect(poolOf(0)).toBe(0);
    expect(poolOf(EYE.take[0])).toBe(0);
    expect(poolOf(1)).toBe(1);
    expect(poolOf(EYE.take[1])).toBe(1);
    for (let x = 0; x < 1; x += 0.05) expect(poolOf(x + 0.05)).toBeGreaterThanOrEqual(poolOf(x));
  });

  it('the corners close as the pool goes, a dark lantern the darkest, and stay inside the range the picture may have', () => {
    for (let p = 0; p < 1; p += 0.1) {
      expect(vignetteScale(p + 0.1, 1)).toBeLessThanOrEqual(vignetteScale(p, 1)); // monotone: more light, wider
      expect(vignetteScale(p, 0)).toBeGreaterThanOrEqual(vignetteScale(p, 1)); // a lantern gone out reads as the dark
    }
    expect(vignetteScale(0, 1)).toBeGreaterThan(1); // the dark closes the edges a little further than the picture's own
    expect(vignetteScale(1, 1)).toBeLessThan(1); // a lamp opens them
    for (const [pool, lantern] of [[0, 0], [0, 1], [1, 1], [1, 0], [0.5, 0.5]]) {
      const v = LIGHTING.vignette * keep(vignetteScale(pool, lantern), 1);
      expect(v).toBeGreaterThanOrEqual(EYE.clamp[0] - 1e-9);
      expect(v).toBeLessThanOrEqual(EYE.clamp[1] + 1e-9);
    }
    expect(LIGHTING.vignette * EYE.vignette.dark).toBeLessThan(EYE.clamp[1]); // the dark side keeps off the clamp: the lantern's circle reads as before
  });

  it('bloom grows only in light, a little', () => {
    expect(bloomScale(0)).toBe(1);
    expect(bloomScale(1)).toBeCloseTo(1 + EYE.bloom);
    expect(bloomScale(1)).toBeLessThan(1.3);
  });

  it('opens faster than it closes', () => {
    const open = ease(0, 1, 0.5);
    const close = 1 - ease(1, 0, 0.5);
    expect(open).toBeGreaterThan(close * 2);
    expect(ease(0, 1, 100)).toBeCloseTo(1);
    expect(ease(0.3, 0.3, 1)).toBeCloseTo(0.3);
    expect(ease(0.2, 1, 0)).toBe(0.2);
  });

  it('keeps a share of its effect, and never leaves the range', () => {
    expect(keep(1.2, 0)).toBe(1);
    expect(keep(1.2, 1)).toBeCloseTo(1.2);
    expect(keep(1.2, 0.5)).toBeCloseTo(1.1);
    expect(keep(9, 1)).toBeCloseTo(EYE.clamp[1] / LIGHTING.vignette);
    expect(keep(0.1, 1)).toBeCloseTo(EYE.clamp[0] / LIGHTING.vignette);
  });

  it("composes with another hand on the uniform: it scales what it finds, unless that is its own from the frame before", () => {
    expect(baseOf(0.5, 0.5, 0.42)).toBe(0.42); // its own last write: back to the constant, so it never compounds
    expect(baseOf(0.19, 0.5, 0.42)).toBe(0.19); // another writer's this frame (a breath, a dread): scaled
    expect(baseOf(0.42, NaN, 0.42)).toBe(0.42); // the first frame
  });

  it('is neutral (none of its effect) in a cutscene, in the arena, and while the picture is taken; a fraction under a roof', () => {
    const g = createWorldGame();
    expect(allowed(g, false, 0)).toBe(1);
    expect(allowed(g, true, 0)).toBe(EYE.roofed);
    expect(allowed(g, false, 1)).toBe(0);
    expect(allowed(g, false, 0.25)).toBeCloseTo(0.75);
    g.cutscene = true;
    expect(allowed(g, false, 0)).toBe(0);
    g.cutscene = false;
    const arena = { ...g, overworld: undefined } as unknown as typeof g;
    expect(allowed(arena, false, 0)).toBe(0);
  });

  it('opens in a pool and closes in the dark, writing the vignette and the bloom, and rests on neither when nothing is lit', () => {
    const g = createWorldGame();
    const p = post();
    const eye = createEyeAdapt(p, g);
    let lit = 0;
    g.lit = () => lit;
    let t = steady(eye, 0, 6);
    const dark = p.uniforms.uVig.value;
    expect(dark).toBeCloseTo(LIGHTING.vignette * vignetteScale(0, 1), 2); // dark, the lantern kindled
    expect(dark).toBeGreaterThan(LIGHTING.vignette);
    lit = 1;
    t = steady(eye, t, 3);
    const open = p.uniforms.uVig.value;
    expect(open).toBeCloseTo(LIGHTING.vignette * vignetteScale(1, 1), 2);
    expect(open).toBeLessThan(LIGHTING.vignette);
    expect(p.uniforms.uBloom.value.x).toBeCloseTo(LIGHTING.bloom.strength * bloomScale(1), 2);
    lit = 0;
    steady(eye, t, 0.8); // closing takes longer than opening did
    expect(p.uniforms.uVig.value).toBeLessThan(dark);
    expect(eye.pool).toBeGreaterThan(0.2);
  });

  it('reads a lantern gone out as the dark of the dark', () => {
    const g = createWorldGame();
    const p = post();
    const eye = createEyeAdapt(p, g);
    g.lit = () => 0;
    const t = steady(eye, 0, 5);
    const lantern = p.uniforms.uVig.value;
    setSanity(g, 10); // unmoored: the flame gutters out
    g.frame += 600;
    steady(eye, t, 5);
    expect(p.uniforms.uVig.value).toBeGreaterThan(lantern);
    expect(p.uniforms.uVig.value).toBeCloseTo(LIGHTING.vignette * vignetteScale(0, 0), 2);
  });

  it('keeps a fraction of the effect under a roof, where a dungeon torch is a pool', () => {
    const g = createWorldGame();
    const p = post();
    const eye = createEyeAdapt(p, g);
    g.lit = () => 1;
    steady(eye, 0, 8, true);
    expect(eye.amount).toBeCloseTo(EYE.roofed, 1);
    const v = p.uniforms.uVig.value;
    expect(v).toBeLessThan(LIGHTING.vignette);
    expect(v).toBeGreaterThan(LIGHTING.vignette * vignetteScale(1, 1)); // less than in the open
  });

  it('is neutral and writes nothing but the constants in a cutscene', () => {
    const g = createWorldGame();
    const p = post();
    const eye = createEyeAdapt(p, g);
    g.lit = () => 1;
    g.cutscene = true;
    steady(eye, 0, 4);
    expect(p.uniforms.uVig.value).toBeCloseTo(LIGHTING.vignette, 5);
    expect(p.uniforms.uBloom.value.x).toBeCloseTo(LIGHTING.bloom.strength, 5);
    expect(eye.amount).toBe(0);
  });

  it('gives way to a wound, a faint or a fall: it adds nothing to the picture they have taken', () => {
    const g = createWorldGame();
    const p = post();
    const eye = createEyeAdapt(p, g);
    g.lit = () => 1;
    p.uniforms.uFade.value = 1;
    steady(eye, 0, 4);
    expect(p.uniforms.uVig.value).toBeCloseTo(LIGHTING.vignette, 2);
    p.uniforms.uFade.value = 0;
    steady(eye, 4, 6);
    expect(p.uniforms.uVig.value).toBeLessThan(LIGHTING.vignette * 0.85);
  });
});
