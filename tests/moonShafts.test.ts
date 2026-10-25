import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SHAFT } from '../src/data/mistLight';
import { CLOCK } from '../src/data/tuning';
import { createNightFx } from '../src/render/nightFx';
import type { Game } from '../src/systems/components';
import { createMoonShafts, moonVeil, shaftStrength } from '../src/render/moonShafts';
import { createPostPass } from '../src/render/postPass';
import { POST_FRAG } from '../src/render/shaders/post';
import { worldUniforms } from '../src/render/worldMaterial';

describe('the moon\'s shafts in the mist (round 80)', () => {
  const clear = { veil: 1, mist: 0.06 };

  it('are strongest while the moon is low enough for long shadows, thinner as it climbs, and none when it is too low for the map', () => {
    expect(shaftStrength({ moonY: 0.1, ...clear })).toBe(0); // the shadow map is off below 0.14
    expect(shaftStrength({ moonY: 0.4, ...clear })).toBeCloseTo(SHAFT.gain, 6);
    expect(shaftStrength({ moonY: 1, ...clear })).toBeCloseTo(SHAFT.gain * SHAFT.moonHigh[2], 6);
    let last = 0;
    for (let y = SHAFT.moonLow; y <= SHAFT.moonFull; y += 0.02) {
      const s = shaftStrength({ moonY: y, ...clear });
      expect(s).toBeGreaterThanOrEqual(last);
      last = s;
    }
    for (let y = 0.62; y < 1; y += 0.04) expect(shaftStrength({ moonY: y + 0.04, ...clear })).toBeLessThanOrEqual(shaftStrength({ moonY: y, ...clear }) + 1e-9);
  });

  it('are as thick as the mist: none at the Fog setting 0 (no density) and whole in a real mist', () => {
    expect(shaftStrength({ moonY: 0.4, veil: 1, mist: 0 })).toBe(0);
    expect(shaftStrength({ moonY: 0.4, veil: 1, mist: SHAFT.mistFull })).toBeCloseTo(SHAFT.gain, 6);
    expect(shaftStrength({ moonY: 0.4, veil: 1, mist: SHAFT.mistFull / 2 })).toBeLessThan(SHAFT.gain);
  });

  it('fade as weather comes over the moon and are gone in a storm', () => {
    expect(moonVeil(undefined)).toBe(1);
    expect(moonVeil({ kind: 'clear', amount: 1 })).toBe(1);
    expect(moonVeil({ kind: 'storm', amount: 1 })).toBe(0);
    expect(moonVeil({ kind: 'rain', amount: 1 })).toBeGreaterThan(0);
    expect(moonVeil({ kind: 'rain', amount: 0.5 })).toBeGreaterThan(moonVeil({ kind: 'rain', amount: 1 }));
    expect(shaftStrength({ moonY: 0.4, veil: moonVeil({ kind: 'storm', amount: 1 }), mist: 0.06 })).toBe(0);
  });

  it('write one uniform, eased, and none at all when it is not the open air', () => {
    const post = createPostPass(new THREE.Texture());
    const shafts = createMoonShafts(post);
    const u = post.uniforms.uShaft.value;
    expect(u.x).toBe(0);
    shafts.update(10, 0.4, 0.06, undefined, true);
    shafts.update(10.1, 0.4, 0.06, undefined, true);
    expect(u.x).toBeGreaterThan(0);
    expect(u.x).toBeLessThan(SHAFT.gain); // eased in, not at once
    for (let i = 0; i < 400; i++) shafts.update(10.2 + i / 20, 0.4, 0.06, undefined, true);
    expect(u.x).toBeCloseTo(SHAFT.gain, 3);
    for (let i = 0; i < 400; i++) shafts.update(40 + i / 20, 0.4, 0.06, undefined, false); // under a roof
    expect(u.x).toBe(0);
    expect(u.y).toBe(SHAFT.floor);
    expect(u.z).toBe(SHAFT.reach);
  });

  it('are read from the world\'s own moon map, in a march that is run only when they are on', () => {
    const post = createPostPass(new THREE.Texture());
    const material = (post.scene.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
    expect(material.defines.SHAFT_STEPS).toBe(SHAFT.steps);
    expect(post.uniforms.uShadowMap).toBe(worldUniforms.uShadowMap); // the one object the moon's pass fills
    expect(post.uniforms.uShadowMat).toBe(worldUniforms.uShadowMat);
    expect(post.uniforms.uShadow).toBe(worldUniforms.uShadow);
    expect(POST_FRAG).toContain('textureLod(uShadowMap');
    expect(POST_FRAG).toContain('uShaft.x > 0.0 && uShadow.x > 0.0');
    expect(POST_FRAG).toContain('SHAFT_STEPS');
    expect(POST_FRAG).toContain('shaftAlong(dir, len, jitter)');
  });

  it("makes the mist's bright quarter follow the moon across the sky, as the sky's own moon does (it stood where the night began)", () => {
    const v3 = (...c: number[]): THREE.Vector3 => new THREE.Vector3(...c);
    const sky = { material: { uniforms: { uMoonDir: { value: v3(0, 1, 0) }, uHorizon: { value: v3(0.1, 0.1, 0.1) }, uZenith: { value: v3(0.05, 0.05, 0.05) } } } };
    const post = { uniforms: { uFogColor: { value: v3(0.1, 0.1, 0.1) }, uMoonDir: { value: v3(0, 1, 0) } } };
    const fx = createNightFx({ overworld: {} } as unknown as Game, sky as never, post as never);
    const at = (phase: number): number => ((phase - CLOCK.start + 1) % 1) * CLOCK.night;
    fx.update(at(0.1));
    const early = post.uniforms.uMoonDir.value.clone();
    expect(early.distanceTo(sky.material.uniforms.uMoonDir.value)).toBeLessThan(1e-9);
    fx.update(at(0.6));
    const late = post.uniforms.uMoonDir.value.clone();
    expect(late.distanceTo(sky.material.uniforms.uMoonDir.value)).toBeLessThan(1e-9);
    expect(late.distanceTo(early)).toBeGreaterThan(0.3); // the moon has crossed the sky
  });
});
