import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createSkyPass } from '../src/render/atm/sky';
import { createPostPass } from '../src/render/postPass';
import { createRealmLook } from '../src/render/realmLook';
import { createSky } from '../src/render/sky';
import { SKY_FRAG } from '../src/render/shaders/sky';
import { worldUniforms } from '../src/render/worldMaterial';
import type { Game } from '../src/systems/components';
import { newWeather } from '../src/systems/weather';

const MINE = ['uOver', 'uVeil', 'uHour', 'uHourGlow', 'uHourDawn', 'uTurn', 'uHeat', 'uMoonSwell', 'uMoonSour', 'uOmen', 'uOmenAt', 'uOmenSize'];

describe('the sky pass of the atmosphere hub (round 78)', () => {
  const post = createPostPass(new THREE.Texture());
  const sky = createSky(createRealmLook(post));
  const weather = newWeather();
  const g = { overworld: { region: 'dunwich', weather }, cutscene: false, mind: { insight: 0, sanity: 100 } } as unknown as Game;
  const pass = createSkyPass({ g, parts: { sky: sky.mesh, post }, scene: new THREE.Scene(), audio: {} } as never);
  const u = (sky.mesh.material as THREE.ShaderMaterial).uniforms;
  const camera = new THREE.PerspectiveCamera();

  it('has every uniform it writes both on the sky and declared in its shader', () => {
    for (const name of MINE) {
      expect(u[name], name).toBeDefined();
      expect(SKY_FRAG, name).toMatch(new RegExp(`uniform \\w+ ${name};`));
    }
  });

  it('runs a whole minute of frames in clear weather, a spell of storm and a roof without throwing, and shuts the sky and opens it again', () => {
    let t = 0;
    const frames = (n: number, enclosed = false): void => {
      for (let i = 0; i < n; i++) {
        worldUniforms.uLightColor.value.set(0.5, 0.5, 0.5);
        post.uniforms.uFogAir.value.set(0.01, 1, 0.8, 0);
        u.uOpen.value = enclosed ? 0 : 1;
        pass.update(camera, (t += 0.1), enclosed, 1);
      }
    };
    frames(600);
    expect(u.uOver.value).toBe(0);
    Object.assign(weather, { kind: 'storm', want: 'storm', amount: 1 });
    frames(80);
    expect(u.uOver.value).toBeGreaterThan(0.99);
    expect(worldUniforms.uLightColor.value.x).toBeLessThan(0.5);
    expect(worldUniforms.uLightColor.value.x).toBeGreaterThanOrEqual(0.5 * 0.4 - 1e-6);
    frames(10, true);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5, 6);
    Object.assign(weather, { kind: 'clear', want: 'clear', amount: 0 });
    frames(600);
    expect(u.uOver.value).toBe(0);
    expect((sky.mesh.userData.atm as { force: object }).force).toEqual({}); // (nothing is forced in a game)
  });
});
