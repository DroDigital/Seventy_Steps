import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SKY } from '../src/data/tuning';
import { createSky } from '../src/render/sky';
import type { RealmLook } from '../src/render/realmLook';
import { SKY_FRAG } from '../src/render/shaders/sky';

const look = { now: { horizon: [0, 0, 0], zenith: [0, 0, 0], moonColor: [1, 1, 1], haze: [0, 0, 0], glow: 1 } } as unknown as RealmLook;
const uniforms = (sky: ReturnType<typeof createSky>) => (sky.mesh.material as THREE.ShaderMaterial).uniforms;

describe('the wrong stars crawl at a pace the mind sets, and never leap (render/sky.ts)', () => {
  it('no longer turns the stars by time × wrongness, which swung the whole sky round whenever the mind moved', () => {
    for (const line of SKY_FRAG.split('\n')) expect(line).not.toMatch(/uTime\s*\*[^;]*uWrong/); // nor quickens their twinkle so
    expect(SKY_FRAG).toContain('uCrawl');
    expect(SKY_FRAG).toContain('uFlicker');
  });

  it('holds the stars still while the mind holds, and a jolt late in a long night moves them by a step, not a leap', () => {
    const sky = createSky(look);
    const camera = new THREE.PerspectiveCamera();
    const u = uniforms(sky);
    let t = 0;
    for (; t < 3000; t += 1 / 60) sky.update(camera, t, null, false); // an hour of a lucid night
    expect(u.uCrawl!.value).toBe(0);
    expect(u.uFlicker!.value).toBe(0);
    let before = u.uCrawl!.value as number;
    for (const wrong of [0.3, 0.05, 1, 0]) { // the mind jolted, eased back, struck hard, restored
      sky.strange(wrong);
      sky.update(camera, t, null, false);
      t += 1 / 60;
      const step = Math.abs((u.uCrawl!.value as number) - before);
      expect(step).toBeLessThanOrEqual(SKY.crawl * wrong / 60 + 1e-9);
      before = u.uCrawl!.value as number;
    }
  });

  it('crawls faster the more the mind has gone', () => {
    const pace = (wrong: number): number => {
      const sky = createSky(look);
      const camera = new THREE.PerspectiveCamera();
      sky.strange(wrong);
      for (let t = 0; t < 10; t += 1 / 60) sky.update(camera, t, null, false);
      return uniforms(sky).uCrawl!.value as number;
    };
    expect(pace(0)).toBe(0);
    expect(pace(0.4)).toBeGreaterThan(0);
    expect(pace(1)).toBeGreaterThan(pace(0.4));
  });
});
