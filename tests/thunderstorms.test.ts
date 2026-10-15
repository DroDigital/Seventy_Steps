import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LIGHTNING } from '../src/data/tuning';
import { createLightning } from '../src/render/lightning';
import type { PostPass } from '../src/render/postPass';
import { worldUniforms } from '../src/render/worldMaterial';
import { newWeather, type WeatherKind } from '../src/systems/weather';

function storm() {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  const flash = { value: 0 };
  const sky = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: { uFlash: flash } }));
  const mist = new THREE.Vector3();
  const thunder = vi.fn();
  const lightning = createLightning(sky, { uniforms: { uFogColor: { value: mist } } } as unknown as PostPass, thunder);
  const weather = newWeather();
  const set = (kind: WeatherKind, amount = 1): void => void Object.assign(weather, { kind, want: kind, amount });
  const update = (time: number, region = 'dunwich', hidden = false): void => lightning.update(time, region, hidden, weather);
  const first = (LIGHTNING.every.dunwich[0] + LIGHTNING.every.dunwich[1]) / 4;
  const delay = (LIGHTNING.delay[0] + LIGHTNING.delay[1]) / 2;
  return { update, set, first, delay, flash, mist, thunder };
}

afterEach(() => vi.restoreAllMocks());

describe('thunderstorms follow the weather', () => {
  it('keeps clear skies, dream motes and a faint drizzle free of lightning and thunder', () => {
    const s = storm();
    for (const kind of ['clear', 'motes', 'rain'] as const) {
      s.set(kind, kind === 'rain' ? LIGHTNING.storm - 0.01 : 1);
      for (let time = 0; time < 1000; time += 5) s.update(time);
    }
    expect(s.flash.value).toBe(0);
    expect(s.thunder).not.toHaveBeenCalled();
  });

  it.each(['rain', 'gale'] as const)('flashes during a gathered %s and rolls thunder after the strike', (kind) => {
    const s = storm();
    s.set(kind);
    s.update(0);
    s.update(s.first);
    expect(s.flash.value).toBeGreaterThan(0);
    expect(s.thunder).not.toHaveBeenCalled();
    s.update(s.first + s.delay);
    expect(s.flash.value).toBe(0);
    expect(s.thunder).toHaveBeenCalledExactlyOnceWith(0.7);
  });

  it('drops the scheduled strike when the weather clears instead of flashing later in a clear sky', () => {
    const s = storm();
    s.set('rain');
    s.update(0);
    s.set('clear', 0);
    s.update(s.first - 1);
    s.update(s.first);
    s.update(s.first + s.delay);
    expect(s.flash.value).toBe(0);
    expect(s.thunder).not.toHaveBeenCalled();
  });

  it('keeps a dungeon dark during lightning and carries only muffled thunder through its roof', () => {
    const s = storm();
    s.set('rain');
    worldUniforms.uLightColor.value.set(0.1, 0.2, 0.3);
    worldUniforms.uAmbient.value.set(0.02, 0.03, 0.04);
    const moon = worldUniforms.uLightColor.value.clone();
    const ambient = worldUniforms.uAmbient.value.clone();
    s.update(0, 'dunwich', true);
    s.update(s.first, 'dunwich', true);
    expect(s.flash.value).toBe(0);
    expect(worldUniforms.uLightColor.value).toEqual(moon);
    expect(worldUniforms.uAmbient.value).toEqual(ambient);
    expect(s.mist.length()).toBe(0);
    s.update(s.first + s.delay, 'dunwich', true);
    expect(s.thunder).toHaveBeenCalledExactlyOnceWith(0.7 * LIGHTNING.inside);
  });

  it('leaves the old strike and its pending thunder behind when travelling to another realm', () => {
    const s = storm();
    s.set('rain');
    s.update(0);
    s.update(s.first);
    expect(s.flash.value).toBeGreaterThan(0);
    s.update(s.first + 0.01, 'dreamlands');
    expect(s.flash.value).toBe(0);
    s.update(s.first + s.delay, 'dreamlands');
    expect(s.thunder).not.toHaveBeenCalled();
  });
});
