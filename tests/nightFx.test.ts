import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { CLOCK, DUNGEON_LIGHT } from '../src/data/tuning';
import { createNightFx, moonDir } from '../src/render/nightFx';
import { worldUniforms } from '../src/render/worldMaterial';
import { dawnOf, phaseOf } from '../src/systems/clock';
import type { Game } from '../src/systems/components';

const v3 = (...c: number[]): THREE.Vector3 => new THREE.Vector3(...c);
const at = (phase: number): number => ((phase - CLOCK.start + 1) % 1) * CLOCK.night; // the seconds of play at which the night stands at `phase`

function rig() {
  const sky = { material: { uniforms: { uMoonDir: { value: v3(0, 1, 0) }, uHorizon: { value: v3(0.1, 0.1, 0.1) }, uZenith: { value: v3(0.05, 0.05, 0.05) } } } };
  const post = { uniforms: { uFogColor: { value: v3(0.1, 0.1, 0.1) } } };
  const fx = createNightFx({ overworld: {} } as unknown as Game, sky as never, post as never);
  /** One frame as the renderer lays it: the lights are set anew, then the night is added. */
  const frame = (time: number, enclosed: boolean): void => {
    worldUniforms.uAmbient.value.set(0.2, 0.2, 0.2);
    worldUniforms.uLightColor.value.set(0.5, 0.5, 0.5);
    sky.material.uniforms.uHorizon.value.set(0.1, 0.1, 0.1);
    sky.material.uniforms.uZenith.value.set(0.05, 0.05, 0.05);
    post.uniforms.uFogColor.value.set(0.1, 0.1, 0.1);
    fx.update(time, enclosed);
  };
  return { fx, sky, post, frame };
}

describe('the night under a roof (round 40)', () => {
  it('greys the open sky in the last hour without throwing (the sky has no uHazeColor)', () => {
    const { sky, frame } = rig();
    const t = at(0.85);
    expect(dawnOf(phaseOf(t))).toBeGreaterThan(0.5);
    expect(() => frame(t, false)).not.toThrow();
    expect(sky.material.uniforms.uHorizon.value.x).toBeGreaterThan(0.1);
    expect(worldUniforms.uAmbient.value.x).toBeGreaterThan(0.2);
  });

  it('keeps a roofed room one light at every hour: no moon course, no grey, the moon dimmed', () => {
    const seen: string[] = [];
    for (const phase of [0.05, 0.3, 0.5, 0.8, 0.9]) {
      const { frame } = rig();
      const t0 = at(phase);
      for (let i = 0; i < 400; i++) frame(t0 + i / 60, true); // long enough for the room's light to take over
      const d = worldUniforms.uLightDir.value;
      seen.push([worldUniforms.uAmbient.value.x, worldUniforms.uLightColor.value.x, d.x, d.y, d.z].map((n) => n.toFixed(3)).join(','));
    }
    expect(new Set(seen).size).toBe(1);
    const [amb, moon] = seen[0].split(',').map(Number);
    expect(amb).toBeCloseTo(0.2, 3);
    expect(moon).toBeCloseTo(0.5 * DUNGEON_LIGHT.moon, 2);
    const still = moonDir(CLOCK.start);
    expect(worldUniforms.uLightDir.value.distanceTo(still)).toBeLessThan(1e-3);
  });

  it('eases between the sky and the room, so a door is no step in the light', () => {
    const { frame } = rig();
    const t = at(0.5);
    frame(t, false);
    const outside = worldUniforms.uLightColor.value.x;
    frame(t + 1 / 60, true);
    const step = worldUniforms.uLightColor.value.x;
    expect(Math.abs(step - outside)).toBeLessThan(0.02);
    for (let i = 2; i < 400; i++) frame(t + i / 60, true);
    expect(worldUniforms.uLightColor.value.x).toBeLessThan(outside * 0.7);
  });
});
