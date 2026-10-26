import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CLOCK } from '../src/data/tuning';
import { paneLit } from '../src/render/paneLife';
import { createSpillPlans, planSpill } from '../src/render/spillPlan';
import { LAMP_SLOTS } from '../src/render/shaders/world';
import { createWindowSpill } from '../src/render/windowSpill';
import { createWorldLights, LIGHT_VIEW, type LightSpot } from '../src/render/worldLights';
import { createWorldMaterial, worldUniforms } from '../src/render/worldMaterial';
import type { Game } from '../src/systems/components';
import type { Collider, CollisionWorld } from '../src/world/colliders';

const flat = (colliders: Collider[] = [], ground: CollisionWorld['ground'] = () => 0): CollisionWorld => ({ colliders, off: new Set(), ground, contain: () => undefined });
const win = (x: number, y = 2, pane = 0.05, z = 0): LightSpot & { glass: { x: number; y: number; z: number } } => ({ x, y, z: z + 0.52, kind: 'window', glass: { x, y, z }, pane });
const night = (phase: number): number => ((phase - CLOCK.start + 1) % 1) * CLOCK.night;
const eye = new THREE.Vector3(0, 1.7, 10);
const windows = worldUniforms.uLampWindows.value;

function rig(world: CollisionWorld | null = flat()) {
  const g = { world } as unknown as Game;
  const spill = createWindowSpill(g);
  const lights = createWorldLights();
  const frame = (time: number, on = true, from = eye, at = from): void => {
    lights.update(from, time, null, at);
    spill.update(time, on);
  };
  return { lights, frame, g };
}

describe('window illumination on receiving surfaces', () => {
  it('derives the outward direction, glass offset and height from the actual pane and local ground', () => {
    expect(planSpill(win(0), flat())).toEqual({ nx: 0, nz: 1, offset: 0.52, height: 2 });
    expect(planSpill(win(0, 4), flat([], () => 1))!.height).toBe(3);
    const side = { ...win(0), x: -0.52, z: 0 };
    expect(planSpill(side, flat())).toEqual({ nx: -1, nz: 0, offset: 0.52, height: 2 });
    expect(planSpill(win(0, 9), flat())).toBeNull();
    expect(planSpill(win(0, 0.1), flat())).toBeNull();
    expect(planSpill({ ...win(0), z: 0 }, flat())).toBeNull();
  });

  it('keeps light reaching the first obstacle instead of stopping before the object it should illuminate', () => {
    const tree: Collider = { kind: 'cylinder', x: 0, z: 1.1, radius: 0.4, y0: 0, y1: 6 };
    const wall: Collider = { kind: 'box', min: { x: -3, y: 0, z: 2 }, max: { x: 3, y: 4, z: 2.2 } };
    const s = win(0);
    expect(planSpill(s, flat([tree, wall]))).toEqual(planSpill(s, flat()));
  });

  it('caches geometry for a pane within its world and recomputes it when the world changes', () => {
    let asks = 0;
    const world = flat([], () => (asks++, 0));
    const plans = createSpillPlans();
    const s = win(0);
    const a = plans(s, world);
    expect(plans(s, world)).toBe(a);
    expect(asks).toBe(1);
    expect(plans(s, flat([], () => 1))!.height).toBe(1);
  });

  it('uses the surface light slots and pane intensity for ground, props and characters', () => {
    const { lights, frame } = rig();
    const t = night(0.3);
    lights.add(1, [win(-2), win(2), { x: 3, y: 2, z: 0.5, kind: 'torch' }]);
    frame(t);
    LIGHT_VIEW.seen.forEach(({ s }, i) => expect(windows[i].w > 0).toBe(s.kind === 'window'));
    expect(windows.filter((w) => w.w > 0)).toHaveLength(2);
    const prop = createWorldMaterial({ texture: 'stone' });
    const body = createWorldMaterial({ texture: 'flesh', character: 'creature' });
    expect(prop.uniforms.uLampWindows).toBe(worldUniforms.uLampWindows);
    expect(body.uniforms.uLampWindows).toBe(prop.uniforms.uLampWindows);
    expect(prop.fragmentShader).toContain('windowLightAt');
    prop.dispose();
    body.dispose();
  });

  it('follows investigator lighting selection when the camera sees different windows, with no independent bright patches', () => {
    const { lights, frame } = rig();
    lights.add(1, Array.from({ length: 40 }, (_, i) => win(i * 2)));
    frame(night(0.3), true, new THREE.Vector3(60, 1.7, 4), new THREE.Vector3(0, 1.7, 4));
    expect(LIGHT_VIEW.visible[0].s.x).toBe(60);
    expect(LIGHT_VIEW.seen[0].s.x).toBe(0);
    expect(windows).toHaveLength(LAMP_SLOTS);
    for (let i = 0; i < windows.length; i++) {
      expect(windows[i].w > 0).toBe(worldUniforms.uLamps.value[i].w > 0);
      expect(worldUniforms.uLamps.value[i].x).toBe(LIGHT_VIEW.seen[i].s.x);
    }
  });

  it('goes out and returns with the source pane rather than retaining a separate glow', () => {
    const { lights, frame } = rig();
    lights.add(1, [win(0, 2, 0.95)]);
    const dark = night(0.9);
    expect(paneLit(0.95, dark)).toBe(0);
    frame(dark);
    expect(worldUniforms.uLampColors.value[0].length()).toBe(0);
    frame(night(0.05));
    expect(windows[0].w).toBe(2);
    expect(worldUniforms.uLampColors.value[0].length()).toBeGreaterThan(0);
  });

  it('clears projection data indoors, without a world, and when slots are removed or reused', () => {
    const { lights, frame, g } = rig();
    const t = night(0.3);
    lights.add(1, [win(0)]);
    frame(t);
    expect(windows[0].w).toBe(2);
    frame(t, false);
    expect(windows.every((w) => w.w === 0)).toBe(true);
    frame(t);
    (g as unknown as { world: CollisionWorld | null }).world = null;
    frame(t);
    expect(windows.every((w) => w.w === 0)).toBe(true);
    g.world = flat();
    lights.remove(1);
    lights.add(2, [{ x: 0, y: 2, z: 1, kind: 'lamp' }]);
    frame(t);
    expect(windows.every((w) => w.w === 0)).toBe(true);
    lights.remove(2);
    frame(t);
    expect(windows.every((w) => w.w === 0)).toBe(true);
  });
});
