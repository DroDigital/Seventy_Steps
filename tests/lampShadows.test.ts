import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LAMP_SHADOWS } from '../src/data/fxTuning';
import { createLampShadows, type Caster } from '../src/render/lampShadows';
import { createWorldLights } from '../src/render/worldLights';
import { worldUniforms } from '../src/render/worldMaterial';

const lamp = (slot: number, x: number): Caster => ({ slot, x, y: 2, z: 0, key: `lamp${x}` });

describe('the lamps cast shadows (round 35)', () => {
  it('lets oriented windows share the existing map budget with lamps, fires and torches', () => {
    const lights = createWorldLights();
    lights.add(1, [
      { x: 2, y: 2, z: 0, kind: 'window', glass: { x: 1.48, y: 2, z: 0 } },
      { x: -3, y: 2, z: 1, kind: 'window', glass: { x: -2.48, y: 2, z: 1 } },
      { x: 1, y: 2, z: 3, kind: 'window' }, // legacy light without a pane direction
      { x: 4, y: 2, z: 0, kind: 'window', glass: { x: 4, y: 2, z: 0 } }, // degenerate direction
      { x: 0, y: 3, z: 0, kind: 'lamp' },
      { x: 6, y: 2, z: 0, kind: 'torch' },
      { x: 8, y: 2, z: 0, kind: 'fire' },
      { x: 1, y: 2, z: 2, kind: 'sigil' },
      { x: -5, y: 2, z: 0, kind: 'window', glass: { x: -5.52, y: 2, z: 0 }, pane: 0.2 }, // this seed is put out at t = 0
    ]);
    lights.update(new THREE.Vector3(), 0, null);
    expect(lights.casters).toHaveLength(5);
    const windows = lights.casters.filter((c) => c.aim);
    expect(windows.map((c) => c.aim)).toEqual([{ x: 1, y: -0.6, z: 0 }, { x: -1, y: -0.6, z: 0 }]);
    expect(lights.casters.filter((c) => !c.aim).map((c) => c.x)).toEqual([0, 6, 8]);
    const shadows = createLampShadows();
    shadows.enabled = true;
    shadows.update(lights.casters, 0.1);
    expect(worldUniforms.uLampSlot.value.filter((slot) => slot >= 0)).toHaveLength(LAMP_SHADOWS.count);
  });

  it('keeps a window map aimed outward and down as the investigator moves, while ordinary maps follow them', () => {
    const shadows = createLampShadows();
    shadows.enabled = true;
    const window: Caster = { ...lamp(0, 0), aim: { x: 0, y: -0.6, z: 1 } };
    const ordinary = lamp(1, 3);
    shadows.update([window, ordinary], 0.1);
    const directions: THREE.Vector3[] = [];
    const renderer = {
      getRenderTarget: () => null,
      setRenderTarget: () => undefined,
      render: (_scene: THREE.Scene, camera: THREE.PerspectiveCamera) => directions.push(camera.getWorldDirection(new THREE.Vector3())),
    } as unknown as THREE.WebGLRenderer;
    const scene = new THREE.Scene();
    shadows.render(renderer, scene, { x: 5, y: 0, z: 2 });
    shadows.render(renderer, scene, { x: -5, y: 0, z: -2 });
    const expected = new THREE.Vector3(0, -0.6, 1).normalize();
    expect(directions[0].distanceTo(expected)).toBeLessThan(1e-6);
    expect(directions[2].distanceTo(expected)).toBeLessThan(1e-6);
    expect(directions[1].distanceTo(directions[3])).toBeGreaterThan(0.5);
    expect(scene.overrideMaterial).toBeNull();
  });

  it('a lamp keeps its map while it is among the nearest, the nearest few get one, and its shadow comes in over time', () => {
    const s = createLampShadows();
    s.enabled = true;
    const slots = worldUniforms.uLampSlot.value as number[];
    const four = [lamp(0, 1), lamp(1, 2), lamp(2, 3), lamp(3, 4)];
    s.update(four, 0.05);
    expect(slots.slice(0, 4).filter((v) => v >= 0)).toHaveLength(LAMP_SHADOWS.count);
    const first = slots[0];
    expect(first).toBeGreaterThanOrEqual(0);
    const fade0 = worldUniforms.uLSInfo.value[first].w;
    s.update([four[3], four[0], four[1], four[2]].map((c, i) => ({ ...c, slot: i })), 0.05); // the order changes, the lamps do not
    expect(slots[1]).toBe(first); // lamp 1 (now slot 1) has the same map as before
    expect(worldUniforms.uLSInfo.value[first].w).toBeGreaterThan(fade0);
    for (let i = 0; i < 20; i++) s.update(four, 0.05);
    expect(worldUniforms.uLSInfo.value[first].w).toBe(1);
  });

  it('none cast when shadows are off', () => {
    const s = createLampShadows();
    s.enabled = false;
    s.update([lamp(0, 1)], 0.1);
    expect((worldUniforms.uLampSlot.value as number[]).every((v) => v === -1)).toBe(true);
  });
});
