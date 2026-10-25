import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { HEAT } from '../src/data/skyAir';
import { FEEL } from '../src/render/feel';
import { burstLight, burstOf, createHeatLightning, heatWeather } from '../src/render/heatLightning';
import { newAtm } from '../src/render/skyForce';
import type { Game } from '../src/systems/components';
import { newWeather, type WeatherKind } from '../src/systems/weather';

afterEach(() => void (FEEL.flashes = 1));

/** A small deterministic stream of numbers in 0..1. */
function stream(seed = 7): () => number {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

describe('heat lightning (round 78)', () => {
  it('plays only in a clear sky over a region that knows thunderstorms, never with the Flashes setting off or a ceiling of cloud', () => {
    const clear = { kind: 'clear', amount: 0 };
    expect(heatWeather('dunwich', clear, 0, 1)).toBe(true);
    expect(heatWeather('hub', undefined, 0, 1)).toBe(true);
    expect(heatWeather('dunwich', clear, 0, 0)).toBe(false); // Settings > Flashes off
    expect(heatWeather('dunwich', clear, 0.2, 1)).toBe(false); // the sky is closing
    expect(heatWeather('dunwich', { kind: 'storm', amount: 0.9 }, 0, 1)).toBe(false); // a thunderstorm has lightning.ts
    expect(heatWeather('dunwich', { kind: 'rain', amount: 0.9 }, 0, 1)).toBe(false);
    for (const id of ['dreamlands', 'yuggoth', 'kn_yan', 'beyond', 'court_centre']) expect(heatWeather(id, clear, 0, 1), id).toBe(false); // no storm to be far off
    expect(heatWeather(null, clear, 0, 1)).toBe(false);
  });

  it('is a burst of two to four pulses, none brighter than the strength allows, and dark again after', () => {
    for (let seed = 1; seed < 60; seed++) {
      const b = burstOf(stream(seed));
      expect(b.length).toBeGreaterThanOrEqual(HEAT.pulses[0]);
      expect(b.length).toBeLessThanOrEqual(HEAT.pulses[1]);
      for (const p of b) expect(p.level).toBeLessThanOrEqual(HEAT.strength[1]);
      expect(burstLight(b, -1, 1)).toBe(0);
      expect(burstLight(b, 60, 1)).toBe(0);
      let peak = 0;
      for (let t = 0; t < 12; t += 0.02) peak = Math.max(peak, burstLight(b, t, 1));
      expect(peak).toBeGreaterThan(0.1);
      expect(peak).toBeLessThanOrEqual(1);
      expect(burstLight(b, 0.03, 0)).toBe(0); // the Flashes setting off: not a flicker
    }
  });

  function rig(rnd = stream()) {
    const heat = { value: new THREE.Vector4() };
    const sky = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: { uHeat: heat } }));
    const weather = newWeather();
    const g = { overworld: { weather }, cutscene: false } as unknown as Game;
    const atm = newAtm();
    const camera = new THREE.PerspectiveCamera();
    camera.lookAt(0, 0, 1);
    camera.updateMatrixWorld();
    const h = createHeatLightning(g, sky, atm, rnd);
    const set = (kind: WeatherKind, amount = 0): void => void Object.assign(weather, { kind, want: kind, amount });
    /** Runs `seconds` from `from` in tenths; returns the times at which a new burst began (a light after ten seconds of dark: the pulses of one burst are within six). */
    const run = (from: number, seconds: number, region = 'dunwich', enclosed = false): number[] => {
      const starts: number[] = [];
      let dark = 99;
      for (let i = 0; i < seconds * 10; i++) {
        const t = from + i / 10;
        h.update(camera, t, region, enclosed);
        if (heat.value.y > 0) {
          if (dark >= 10) starts.push(t);
          dark = 0;
        } else dark += 0.1;
      }
      return starts;
    };
    return { heat, atm, g, set, run, camera };
  }

  it('comes every 45 to 130 seconds on a clear night and never twice within 45, and away from where the eye looks', () => {
    const s = rig();
    const starts = s.run(0, 3600);
    expect(starts.length).toBeGreaterThan(20);
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1], `burst ${i}`).toBeGreaterThanOrEqual(HEAT.every[0] - 1);
    // where each burst is: at least HEAT.away from straight ahead (the camera looks toward +z: bearing 0)
    const s2 = rig(stream(3));
    const away: number[] = [];
    let dark = 99;
    for (let i = 0; i < 36000; i++) {
      s2.run(i / 10, 0.1);
      if (s2.heat.value.y > 0) {
        if (dark >= 10) away.push(Math.abs(Math.atan2(Math.sin(s2.heat.value.x), Math.cos(s2.heat.value.x))));
        dark = 0;
      } else dark += 0.1;
    }
    expect(away.length).toBeGreaterThan(20);
    for (const a of away) expect(a).toBeGreaterThanOrEqual(HEAT.away - 0.01);
    expect(s2.heat.value.z).toBeCloseTo(HEAT.width, 6);
  });

  it('keeps off in a storm, with the Flashes setting off, under a roof, in a cutscene and in the dream\'s motes', () => {
    const storm = rig();
    storm.set('storm', 1);
    expect(storm.run(0, 1800)).toHaveLength(0);
    FEEL.flashes = 0;
    expect(rig().run(0, 1800)).toHaveLength(0);
    FEEL.flashes = 1;
    expect(rig().run(0, 1800, 'dunwich', true)).toHaveLength(0);
    expect(rig().run(0, 1800, 'dreamlands')).toHaveLength(0);
    const cut = rig();
    (cut.g as { cutscene: boolean }).cutscene = true;
    expect(cut.run(0, 1800)).toHaveLength(0);
    expect(storm.heat.value.y).toBe(0);
  });

  it('starts the wait afresh after the sky has been shut, so a spell\'s end brings no flash at once', () => {
    const s = rig();
    s.set('storm', 1);
    s.run(0, 100);
    s.set('clear', 0);
    const starts = s.run(100, 60);
    expect(starts.every((t) => t >= 100 + HEAT.first[0] - 0.1)).toBe(true);
  });

  it('can be held for a photograph', () => {
    const s = rig();
    s.atm.force.heat = { az: 1.2, level: 0.6 };
    s.run(0, 1);
    expect(s.heat.value.toArray().slice(0, 3)).toEqual([1.2, 0.6, HEAT.width]);
  });
});
