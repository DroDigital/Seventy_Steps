import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FOGS } from '../src/data/fogs';
import { LIVING } from '../src/data/mistLight';
import { FOG } from '../src/data/tuning';
import { FOG_GLSL } from '../src/render/shaders/fog';
import type { PostPass } from '../src/render/postPass';
import { createVolumetricFog, mistDrive, thickAfterRain } from '../src/render/volumetricFog';
import { wetness } from '../src/render/wetness';
import { worldUniforms } from '../src/render/worldMaterial';

const v3 = () => ({ value: new THREE.Vector3() });
const v4 = () => ({ value: new THREE.Vector4() });
function rig() {
  const uniforms = { uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: v3(), uFog: v4(), uFogAir: v4(), uFogColor: v3(), uFogDrift: v3() };
  const fog = createVolumetricFog({ uniforms } as unknown as PostPass);
  const camera = new THREE.PerspectiveCamera();
  const frame = (o: Partial<Parameters<typeof fog.update>[2]> = {}) => ({ region: 'arkham', enclosed: false, ground: 0, stress: 0, setting: 1, ...o });
  return { uniforms, fog, camera, frame };
}

describe('a mist that lives (round 80)', () => {
  it('rises after rain by the share of the ground\'s wet, and never past the thickest it was (full madness in a wood)', () => {
    expect(thickAfterRain(1, 0)).toBe(1);
    expect(thickAfterRain(1, 1)).toBeCloseTo(1 + LIVING.afterRain, 9);
    expect(thickAfterRain(1, 0.5)).toBeCloseTo(1 + LIVING.afterRain / 2, 9);
    expect(thickAfterRain(1, 7)).toBeCloseTo(1 + LIVING.afterRain, 9); // (a wet past soaked is soaked)
    const worst = 1 * (1 + FOG.madness) * (1 + 1.1);
    expect(LIVING.thickMax).toBeGreaterThanOrEqual(worst);
    expect(thickAfterRain(worst, 1)).toBe(LIVING.thickMax);
    expect(thickAfterRain(worst, 0)).toBeCloseTo(worst, 9);
    expect(thickAfterRain(4, 0)).toBe(4); // a thickness already past it is left alone
  });

  it('is driven past by a gale and no faster than ever on a calm night', () => {
    expect(mistDrive(1)).toBe(1);
    expect(mistDrive(0.5)).toBe(1);
    expect(mistDrive(1 + LIVING.gust)).toBeCloseTo(1 + LIVING.gale, 9);
    expect(mistDrive(2.2)).toBeGreaterThan(1);
    expect(mistDrive(2.2)).toBeLessThan(mistDrive(3.4));
  });

  it('carries its drift faster in a gale, thickens after rain, and swells in the open air but not in a crypt', () => {
    const calm = rig();
    const gale = rig();
    const dt = 1 / 30;
    for (let i = 0; i < 90; i++) {
      calm.fog.update(calm.camera, 10 + i * dt, calm.frame({ wet: 0, gust: 1 }));
      gale.fog.update(gale.camera, 10 + i * dt, gale.frame({ wet: 0, gust: 3.4 }));
    }
    const [cx, gx] = [Math.hypot(calm.uniforms.uFogDrift.value.x, calm.uniforms.uFogDrift.value.y), Math.hypot(gale.uniforms.uFogDrift.value.x, gale.uniforms.uFogDrift.value.y)];
    expect(gx / cx).toBeCloseTo(1 + LIVING.gale, 1);
    const dry = rig();
    const soaked = rig();
    dry.fog.update(dry.camera, 1, dry.frame({ wet: 0 }));
    soaked.fog.update(soaked.camera, 1, soaked.frame({ wet: 1 }));
    expect(soaked.uniforms.uFog.value.x / dry.uniforms.uFog.value.x).toBeCloseTo(1 + LIVING.afterRain, 6);
    expect(dry.uniforms.uFogAir.value.w).toBeCloseTo(LIVING.swell * FOGS.arkham.patchy, 9);
    const crypt = rig();
    crypt.fog.update(crypt.camera, 1, crypt.frame({ enclosed: true, wet: 1, gust: 3.4 }));
    expect(crypt.uniforms.uFogAir.value.w).toBe(0);
    expect(crypt.uniforms.uFogDrift.value.x).toBe(0); // the first frame has no time passed; and a roof has no rain: its mist is the crypt's own
    const kept = rig();
    kept.fog.update(kept.camera, 1, kept.frame({ enclosed: true, wet: 1 }));
    const base = rig();
    base.fog.update(base.camera, 1, base.frame({ enclosed: true }));
    expect(kept.uniforms.uFog.value.x).toBeCloseTo(base.uniforms.uFog.value.x, 12);
  });

  it('reads the weather itself when a frame does not give it, and leaves today\'s values when it is calm and dry', () => {
    wetness.value = 0;
    worldUniforms.uWind.value = 1;
    const plain = rig();
    plain.fog.update(plain.camera, 5, plain.frame({ wood: 1, stress: 1 }));
    const explicit = rig();
    explicit.fog.update(explicit.camera, 5, explicit.frame({ wood: 1, stress: 1, wet: 0, gust: 1 }));
    expect(plain.uniforms.uFog.value.toArray()).toEqual(explicit.uniforms.uFog.value.toArray());
    expect(plain.uniforms.uFog.value.x).toBeCloseTo(FOGS.arkham.density * (1 + FOG.madness) * 2.1, 9); // as it was before the round
    wetness.value = 1;
    const rained = rig();
    rained.fog.update(rained.camera, 5, rained.frame({}));
    expect(rained.uniforms.uFog.value.x).toBeCloseTo(FOGS.arkham.density * (1 + LIVING.afterRain), 9);
    wetness.value = 0;
  });

  it('is sheared and swelling in the shader: the fine layer is carried on its own and the banks are a few sines', () => {
    expect(FOG_GLSL).toContain('vec3 q2 =');
    expect(FOG_GLSL).toContain('uFogAir.w * 0.8 * sin(');
    expect(FOG_GLSL).not.toContain('fogNoise(q * 2.6 + 7.3)'); // (no longer carried with the banks)
  });
});
