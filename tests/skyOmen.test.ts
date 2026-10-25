import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { OMEN } from '../src/data/skyAir';
import { chanceOf, createSkyOmen, moonSwell, omenAt } from '../src/render/skyOmen';
import { newAtm } from '../src/render/skyForce';
import type { Game } from '../src/systems/components';
import { PASSAGE_NEED } from '../src/systems/veil';

describe('the Alignment (round 78)', () => {
  it('never comes to a steady mind that has gathered no insight', () => {
    for (let t = 0; t < 4 * 3600; t += 2) expect(omenAt(t, 0, 0).amount, String(t)).toBe(0);
    expect(chanceOf(0, 0)).toBe(0);
    expect(chanceOf(0.4, 0)).toBe(0); // (a mind merely uneasy)
  });

  it('is a deterministic function of the render clock, bounded, and no longer than its twenty-eight seconds', () => {
    let [episodes, run, longest, held] = [0, 0, 0, 0];
    for (let t = 0; t < 8 * 3600; t += 0.5) {
      const o = omenAt(t, 1, 0);
      expect(omenAt(t, 1, 0)).toEqual(o);
      expect(o.amount).toBeGreaterThanOrEqual(0);
      expect(o.amount).toBeLessThanOrEqual(1);
      expect(o.elevation).toBeGreaterThanOrEqual(OMEN.elevation[0]);
      expect(o.elevation).toBeLessThanOrEqual(OMEN.elevation[1]);
      if (o.amount > 0) {
        run += 0.5;
        if (o.amount >= 0.999) held += 0.5;
      } else if (run > 0) {
        [episodes, longest, run] = [episodes + 1, Math.max(longest, run), 0];
      }
    }
    expect(longest).toBeLessThanOrEqual(OMEN.last);
    expect(held / episodes).toBeGreaterThan(OMEN.hold - 2); // it holds a dozen seconds
    expect(episodes).toBeGreaterThan(8 * 3600 / OMEN.slot * 0.4); // a worn mind sees it every few minutes
    expect(episodes).toBeLessThanOrEqual(8 * 3600 / OMEN.slot + 1);
  });

  it('comes oftener to a worse mind and to one that has gathered more insight, even a steady one', () => {
    const count = (stress: number, know: number): number => {
      let n = 0;
      for (let slot = 0; slot < 2000; slot++) {
        for (let t = slot * OMEN.slot; t < (slot + 1) * OMEN.slot; t += 1) if (omenAt(t, stress, know).amount > 0.999) { n++; break; }
      }
      return n;
    };
    const [calm, uneasy, worn, steadyWise] = [count(0.1, 0), count(0.6, 0), count(1, 0), count(0, 1)];
    expect(calm).toBe(0);
    expect(uneasy).toBeGreaterThan(0);
    expect(worn).toBeGreaterThan(uneasy);
    expect(steadyWise).toBeGreaterThan(0);
    expect(steadyWise).toBeLessThan(worn);
    expect(chanceOf(1, 0)).toBeCloseTo(OMEN.chance, 6);
  });

  it('swells and sours the moon with the mind, slowly, a little different each night, and not at all in a steady one', () => {
    expect(moonSwell(100, 0)).toBe(0);
    let top = 0;
    const seen = new Set<number>();
    for (let t = 0; t < 6 * 1080; t += 1) {
      const s = moonSwell(t, 1);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(OMEN.swell);
      expect(Math.abs(moonSwell(t + 1, 1) - s)).toBeLessThan(0.01); // slow, and no step at a night's turn
      top = Math.max(top, s);
      if (t % 1080 === 500) seen.add(Math.round(s * 100));
    }
    expect(top).toBeGreaterThan(OMEN.swell * 0.6);
    expect(seen.size).toBeGreaterThan(2); // not the same swelling each night
    expect(moonSwell(500, 0.3)).toBeLessThan(moonSwell(500, 1) + 1e-9);
  });

  function rig(over: { overworld?: boolean; wrong?: number; insight?: number } = {}) {
    const u = { uWrong: { value: over.wrong ?? 0 }, uOmen: { value: 0 }, uOmenAt: { value: new THREE.Vector3() }, uMoonSwell: { value: 0 }, uMoonSour: { value: 0 } };
    const sky = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: u }));
    const g = { overworld: over.overworld === false ? undefined : {}, cutscene: false, mind: { insight: over.insight ?? 0 } } as unknown as Game;
    const atm = newAtm();
    const camera = new THREE.PerspectiveCamera();
    camera.lookAt(0, 0, 1);
    camera.updateMatrixWorld();
    const omen = createSkyOmen(g, sky, atm);
    return { u, atm, g, omen, camera };
  }

  it('settles where the eye looked as an episode begins, near it, and holds there while the eye turns', () => {
    const s = rig({ wrong: 1 });
    let began = -1;
    for (let t = 0; t < 3600 && began < 0; t += 0.5) {
      s.omen.update(s.camera, t, false);
      if (s.u.uOmen.value > 0) began = t;
    }
    expect(began).toBeGreaterThanOrEqual(0);
    const at = s.u.uOmenAt.value.clone();
    expect(at.y).toBeGreaterThan(0.4); // above the horizon
    expect(Math.abs(Math.atan2(at.x, at.z))).toBeLessThanOrEqual(OMEN.lean + 1e-6);
    s.camera.lookAt(1, 0, 0);
    s.camera.updateMatrixWorld();
    s.omen.update(s.camera, began + 1, false);
    expect(s.u.uOmenAt.value.distanceTo(at)).toBeLessThan(1e-6);
  });

  it('is shown to no one under a roof, in the arena or in a cutscene, and the moon swells only in a failing mind', () => {
    const roofed = rig({ wrong: 1 });
    const arena = rig({ wrong: 1, overworld: false });
    const cut = rig({ wrong: 1 });
    (cut.g as { cutscene: boolean }).cutscene = true;
    let seen = 0;
    for (let t = 0; t < 3600; t += 0.5) {
      roofed.omen.update(roofed.camera, t, true);
      arena.omen.update(arena.camera, t, false);
      cut.omen.update(cut.camera, t, false);
      seen += roofed.u.uOmen.value + arena.u.uOmen.value + cut.u.uOmen.value;
    }
    expect(seen).toBe(0);
    expect(arena.u.uMoonSwell.value).toBe(0);
    const steady = rig();
    for (let t = 0; t < 600; t += 1) steady.omen.update(steady.camera, t, false);
    expect(steady.u.uMoonSwell.value).toBe(0);
    expect(steady.u.uMoonSour.value).toBe(0);
    const failing = rig({ wrong: 1 });
    failing.omen.update(failing.camera, 300, false);
    expect(failing.u.uMoonSour.value).toBeCloseTo(OMEN.sour, 6);
  });

  it('is seen by a steady mind that has gathered its insight', () => {
    const s = rig({ insight: PASSAGE_NEED });
    let seen = 0;
    for (let t = 0; t < 3 * 3600; t += 0.5) {
      s.omen.update(s.camera, t, false);
      seen = Math.max(seen, s.u.uOmen.value);
    }
    expect(seen).toBeGreaterThan(0.99);
  });
});
