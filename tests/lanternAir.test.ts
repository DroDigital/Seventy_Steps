/** Round 80: motes in the lantern's light (render/lanternAir.ts, data/lanternMotes.ts). */
import * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { LANTERN_MOTES as M } from '../src/data/lanternMotes';
import { createLanternAir, rateAt } from '../src/render/lanternAir';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { worldUniforms } from '../src/render/worldMaterial';
import { createWorldGame } from '../src/systems/game';

function glow(seconds: number, o: { enclosed?: boolean; light?: number; wind?: number; camera?: THREE.Vector3 } = {}) {
  const g = createWorldGame();
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  worldUniforms.uLanternPos.value.set(me.x + 0.3, me.y + 0.9, me.z + 0.25);
  worldUniforms.uLanternColor.value.set(1, 0.82, 0.58).multiplyScalar(o.light ?? 1.15);
  worldUniforms.uWind.value = o.wind ?? 1;
  const born: ParticleSpec[] = [];
  const air = createLanternAir(g, { spawn: (p: ParticleSpec) => born.push(p) } as unknown as Particles);
  const camera = new THREE.PerspectiveCamera();
  camera.position.copy(o.camera ?? new THREE.Vector3(me.x, me.y + 3, me.z - 4));
  for (let i = 0; i < seconds * 60; i++) air.update(camera, i / 60, o.enclosed ?? false);
  return { born, me, camera };
}

describe('motes in the lantern\'s light (round 80)', () => {
  beforeEach(() => void (worldUniforms.uWind.value = 1));

  it('thins to nothing as the flame goes out, and in a gale', () => {
    expect(rateAt(1.15, 1, false)).toBe(M.rate.open);
    expect(rateAt(1.15, 1, true)).toBe(M.rate.roofed);
    expect(rateAt(0.6, 1, false)).toBeLessThan(M.rate.open);
    expect(rateAt(0.2, 1, false)).toBe(0);
    expect(rateAt(1.15, 3, false)).toBe(0);
    expect(M.rate.roofed).toBeGreaterThan(M.rate.open);
  });

  it('hangs specks within reach of the lantern, clear of the lens and above the floor', () => {
    const { born, me, camera } = glow(20);
    expect(born.length).toBeGreaterThan(60);
    const lamp = worldUniforms.uLanternPos.value;
    for (const p of born) {
      const d = Math.hypot(p.x - lamp.x, p.z - lamp.z);
      expect(d).toBeLessThanOrEqual(M.reach[1] + 1e-6);
      expect(p.y).toBeGreaterThanOrEqual(me.y + 0.1 - 1e-6);
      expect(Math.hypot(p.x - camera.position.x, p.y - camera.position.y, p.z - camera.position.z)).toBeGreaterThanOrEqual(M.lens);
      expect(p.glow).toBeFalsy(); // not self-lit: the lantern lights them, so they show only in its pool
      expect(p.size).toBeGreaterThanOrEqual(M.size[0]);
      expect(p.size).toBeLessThanOrEqual(M.size[1]);
    }
  });

  it('hangs and lifts outdoors, and settles in a crypt, where there are more', () => {
    const open = glow(20);
    const roofed = glow(20, { enclosed: true });
    for (const p of open.born) expect(p.gravity).toBeLessThan(0);
    for (const p of roofed.born) expect(p.gravity).toBeGreaterThan(0);
    expect(roofed.born.length).toBeGreaterThan(open.born.length * 1.4);
  });

  it('is none when the lantern is out or the wind is up, and none at the lens', () => {
    expect(glow(10, { light: 0 }).born).toHaveLength(0);
    expect(glow(10, { wind: 2.5 }).born).toHaveLength(0);
    const near = glow(10, { camera: new THREE.Vector3(0, 0, 0) });
    for (const p of near.born) expect(Math.hypot(p.x, p.y, p.z)).toBeGreaterThanOrEqual(M.lens);
  });
});
