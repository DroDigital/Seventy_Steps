/**
 * Lights that last a moment (round 83; render/flashLights.ts): a shot, a blow, a bolt in flight take
 * the slots of the farthest of the world's own lamps, so the world, the creatures and the mist light up
 * with no shader loop made longer.
 */
import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { FLASH_LIGHTS } from '../src/data/fxTuning';
import { flashLight, layFlashes, level, putOutFlashes } from '../src/render/flashLights';
import { createLampAim } from '../src/render/lampAim';
import { createPostPass } from '../src/render/postPass';
import { LAMP_SLOTS } from '../src/render/shaders/world';
import { createWorldLights, LIGHT_VIEW, type LightSpot } from '../src/render/worldLights';
import { worldUniforms } from '../src/render/worldMaterial';

const slots = () => ({ lamps: Array.from({ length: LAMP_SLOTS }, () => new THREE.Vector4()), colors: Array.from({ length: LAMP_SLOTS }, () => new THREE.Vector3()) });
const at = { x: 0, y: 1, z: 0 };

afterEach(putOutFlashes);

describe('a flash of light', () => {
  it('comes to its height in a moment, and dies away within its life, never negative', () => {
    expect(level(0, 0.3)).toBe(0);
    expect(level(FLASH_LIGHTS.attack, 0.3)).toBeCloseTo(1, 5);
    let last = 1;
    for (let t = FLASH_LIGHTS.attack; t < 0.3; t += 0.02) {
      expect(level(t, 0.3)).toBeLessThanOrEqual(last + 1e-9);
      last = level(t, 0.3);
    }
    expect(level(0.3, 0.3)).toBe(0);
    expect(level(-1, 0.3)).toBe(0);
  });

  it('takes the last slots of the lamps, the strongest first, and the shadow of a lamp that had one of them', () => {
    const { lamps, colors } = slots();
    lamps.forEach((l, i) => l.set(i, 0, 0, 5));
    const casters = [{ slot: 2, x: 0, y: 0, z: 0, key: 'a' }, { slot: LAMP_SLOTS - 1, x: 0, y: 0, z: 0, key: 'b' }, { slot: LAMP_SLOTS - 2, x: 0, y: 0, z: 0, key: 'c' }];
    flashLight({ x: 3, y: 1, z: 0 }, [1, 0.8, 0.5], 2, 6, 0.2);
    flashLight({ x: 3, y: 1, z: 1 }, [1, 1, 1], 6, 8, 0.2);
    expect(layFlashes(lamps, colors, casters, 10, at)).toBe(0 + 2); // (born at this call: level 0, but both are laid)
    layFlashes(lamps, colors, casters, 10.05, at);
    expect(lamps[LAMP_SLOTS - 1].toArray()).toEqual([3, 1, 1, 8]); // the strongest in the very last
    expect(lamps[LAMP_SLOTS - 2].toArray()).toEqual([3, 1, 0, 6]);
    expect(colors[LAMP_SLOTS - 1].x).toBeGreaterThan(colors[LAMP_SLOTS - 2].x);
    expect(casters.map((c) => c.key)).toEqual(['a']); // b and c lost their slots
    expect(lamps[0].toArray()).toEqual([0, 0, 0, 5]); // the nearest lamps are left
  });

  it('uses at most FLASH_LIGHTS.slots, puts the rest out when their moment is by, and ignores what is far from the investigator', () => {
    const { lamps, colors } = slots();
    for (let i = 0; i < 6; i++) flashLight({ x: i, y: 1, z: 0 }, [1, 1, 1], 1 + i, 5, 0.2);
    flashLight({ x: 500, y: 1, z: 0 }, [1, 1, 1], 99, 5, 0.2);
    layFlashes(lamps, colors, [], 1, at);
    expect(layFlashes(lamps, colors, [], 1.05, at)).toBe(FLASH_LIGHTS.slots);
    const far = lamps.filter((l) => l.x >= 400);
    expect(far.length).toBe(0);
    expect(layFlashes(lamps, colors, [], 1.5, at)).toBe(0); // all out
  });

  it('is one light, moved, when its source calls it each frame, and dies only when the calls stop', () => {
    const { lamps, colors } = slots();
    for (let f = 0; f < 5; f++) {
      flashLight({ x: f, y: 1, z: 0 }, [1, 0.5, 0.2], 2, 5, 0.1, 7);
      expect(layFlashes(lamps, colors, [], 20 + f / 60, at)).toBe(1);
      expect(lamps[LAMP_SLOTS - 1].x).toBe(f);
      expect(colors[LAMP_SLOTS - 1].x).toBeCloseTo(2, 5); // at its height each frame it is called
    }
    expect(layFlashes(lamps, colors, [], 21, at)).toBe(0);
  });

  it('reaches the shader through the world\'s lights: the world, the creatures and the mist read the same slots', () => {
    const lights = createWorldLights();
    flashLight({ x: 2, y: 1, z: 2 }, [1, 0.84, 0.54], 3.4, 9, 0.1);
    lights.update(new THREE.Vector3(0, 2, 0), 5, null, at);
    lights.update(new THREE.Vector3(0, 2, 0), 5.03, null, at);
    const last = worldUniforms.uLamps.value[LAMP_SLOTS - 1];
    expect(last.w).toBe(9);
    expect(worldUniforms.uLampColors.value[LAMP_SLOTS - 1].x).toBeGreaterThan(3);
  });

  it('puts out the glass plane and the mist\'s aim of the window whose slot it takes, so it is clipped by none', () => {
    const lights = createWorldLights();
    const panes: LightSpot[] = Array.from({ length: LAMP_SLOTS + 2 }, (_, i) => ({ x: 2 + i * 0.4, y: 2, z: 3, kind: 'window', glass: { x: 2 + i * 0.4, y: 2, z: 2.5 }, pane: 0.9 }));
    lights.add(1, panes);
    const post = createPostPass(new THREE.Texture());
    const aim = createLampAim(post);
    const eye = new THREE.Vector3(0, 1.7, 0);
    lights.update(eye, 5, null, at);
    aim.update(true);
    const last = LAMP_SLOTS - 1;
    expect(LIGHT_VIEW.flashes).toBe(0);
    expect(worldUniforms.uLampPlane.value[last].lengthSq()).toBeGreaterThan(0); // (a window's, with no flash)
    expect(post.uniforms.uLampAim.value[last].w).toBeGreaterThan(0);
    flashLight({ x: 2, y: 1, z: 2 }, [1, 0.84, 0.54], 3.4, 9, 0.1);
    lights.update(eye, 5.01, null, at);
    lights.update(eye, 5.03, null, at);
    aim.update(true);
    expect(LIGHT_VIEW.flashes).toBe(1);
    expect(worldUniforms.uLamps.value[last].w).toBe(9);
    expect(worldUniforms.uLampPlane.value[last].toArray()).toEqual([0, 0, 0, 0]);
    expect(post.uniforms.uLampAim.value[last].toArray()).toEqual([0, 0, 0, 0]);
    expect(worldUniforms.uLampPlane.value[last - 1].lengthSq()).toBeGreaterThan(0); // (the rest keep theirs)
  });
});
