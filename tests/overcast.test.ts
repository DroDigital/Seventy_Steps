import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { OVERCAST, VEIL } from '../src/data/skyAir';
import { LIGHTNING, SKY } from '../src/data/tuning';
import { bankShare, createOvercast, flashOf, overcastOf, slew, veilAt } from '../src/render/overcast';
import { createLightning } from '../src/render/lightning';
import { newAtm } from '../src/render/skyForce';
import { worldUniforms } from '../src/render/worldMaterial';
import type { Game } from '../src/systems/components';
import { newWeather, type WeatherKind } from '../src/systems/weather';

const v3 = (...c: number[]): THREE.Vector3 => new THREE.Vector3(...c);

/** A sky, a post pass and a game with weather; `frame` lays the frame's lights anew, as the renderer does, then lets the overcast dim them. */
function rig(overworld = true) {
  const uniforms = { uHorizon: { value: v3(0.1, 0.1, 0.1) }, uZenith: { value: v3(0.05, 0.05, 0.05) }, uFogColor: { value: v3(0.2, 0.2, 0.2) }, uOpen: { value: 1 }, uClouds: { value: 0.5 }, uMoon: { value: 0.034 }, uFlash: { value: 0 }, uOver: { value: 0 }, uVeil: { value: 0 } };
  const sky = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms }));
  const post = { uniforms: { uFogColor: { value: v3(0.1, 0.1, 0.1) }, uFogAir: { value: new THREE.Vector4(0.01, 1, 0.8, 0) } } };
  const weather = newWeather();
  const g = { overworld: overworld ? { weather } : undefined } as unknown as Game;
  const atm = newAtm();
  const over = createOvercast(g, sky, post as never, atm);
  const set = (kind: WeatherKind, amount = 1): void => void Object.assign(weather, { kind, want: kind, amount });
  const frame = (time: number, enclosed = false): void => {
    worldUniforms.uLightColor.value.set(0.5, 0.5, 0.5);
    worldUniforms.uAmbient.value.set(0.2, 0.2, 0.2);
    worldUniforms.uFogColor.value.set(0.2, 0.2, 0.2);
    uniforms.uHorizon.value.set(0.1, 0.1, 0.1);
    uniforms.uZenith.value.set(0.05, 0.05, 0.05);
    uniforms.uFogColor.value.set(0.2, 0.2, 0.2);
    post.uniforms.uFogColor.value.set(0.1, 0.1, 0.1);
    post.uniforms.uFogAir.value.z = 0.8;
    over.update(time, enclosed);
  };
  const run = (from: number, seconds: number, enclosed = false): number => {
    let t = from;
    for (let i = 0; i < seconds * 10; i++) frame((t += 0.1), enclosed);
    return t;
  };
  return { uniforms, post, weather, atm, set, frame, run };
}

describe('the cloud ceiling of the weather (round 80)', () => {
  it('is closed by rain and storm, less by a gale, and by no clear sky or dream-motes', () => {
    expect(overcastOf('clear', 0)).toBe(0);
    expect(overcastOf('motes', 1)).toBe(0);
    expect(overcastOf('storm', 1)).toBe(1);
    expect(overcastOf('rain', 1)).toBeCloseTo(OVERCAST.kinds.rain, 5);
    expect(overcastOf('gale', 1)).toBeCloseTo(OVERCAST.kinds.gale, 5);
    expect(overcastOf('storm', 0.3)).toBeGreaterThan(0);
    expect(overcastOf('storm', 0.3)).toBeLessThan(overcastOf('storm', 0.6)); // it closes as the spell gathers...
    expect(overcastOf('storm', OVERCAST.gather)).toBe(1); // ...before the rain is at its hardest
    expect(overcastOf(undefined, 1)).toBe(0);
  });

  it('closes in seconds and opens over some forty', () => {
    const s = rig();
    s.set('storm');
    const t = s.run(0, OVERCAST.rise + 1);
    expect(s.atm.over).toBe(1);
    s.set('clear', 0);
    const t2 = s.run(t, OVERCAST.fall / 2);
    expect(s.atm.over).toBeGreaterThan(0.4);
    expect(s.atm.over).toBeLessThan(0.6);
    s.run(t2, OVERCAST.fall / 2 + 1);
    expect(s.atm.over).toBe(0);
    expect(slew(0, 1, 1, 6, 40)).toBeCloseTo(1 / 6, 6);
    expect(slew(1, 0, 1, 6, 40)).toBeCloseTo(1 - 1 / 40, 6);
  });

  it('dims the moon and ambient, sky and mist, but never the moon below four tenths of itself', () => {
    const s = rig();
    s.set('storm');
    s.run(0, 12);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5 * (1 - OVERCAST.moon), 4);
    expect(worldUniforms.uLightColor.value.x).toBeGreaterThanOrEqual(0.5 * 0.4 - 1e-6);
    expect(worldUniforms.uAmbient.value.x).toBeCloseTo(0.2 * (1 - OVERCAST.ambient), 4);
    expect(s.uniforms.uHorizon.value.x).toBeCloseTo(0.1 * (1 - OVERCAST.sky), 4);
    expect(s.uniforms.uFogColor.value.x).toBeCloseTo(0.2 * (1 - OVERCAST.sky), 4);
    expect(worldUniforms.uFogColor.value.x).toBeCloseTo(0.2 * (1 - OVERCAST.sky), 4); // the land fades into what the sky does
    expect(s.post.uniforms.uFogAir.value.z).toBeCloseTo(0.8 * (1 - OVERCAST.lobe), 4); // the mist loses its lobe on the moon's side
    expect(s.uniforms.uOver.value).toBe(1);
    expect(OVERCAST.moon).toBeLessThanOrEqual(0.6);
  });

  it('leaves everything alone in a clear sky, under a roof and in the arena, and sets the lights anew each frame', () => {
    const s = rig();
    s.run(0, 2);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5, 6);
    expect(s.uniforms.uOver.value).toBe(0);
    s.set('storm');
    s.run(2, 12);
    s.uniforms.uOpen.value = 0; // a dungeon's walls
    s.frame(14.2, true);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5, 6);
    expect(s.post.uniforms.uFogAir.value.z).toBeCloseTo(0.8, 6);
    s.uniforms.uOpen.value = 1;
    s.set('clear', 0);
    const t = s.run(14.2, OVERCAST.fall + 2);
    s.frame(t + 0.1);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5, 6); // (the dimming was not kept)
    const arena = rig(false);
    arena.run(0, 12);
    expect(arena.atm.over).toBe(0);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5, 6);
  });

  it("reads a strike back off the sky's flash exactly as lightning.ts lays it (so the dimming can leave the flash whole)", () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const flash = { value: 0 };
    const sky = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: { uFlash: flash } }));
    const mist = v3(0, 0, 0);
    const lightning = createLightning(sky, { uniforms: { uFogColor: { value: mist } } } as never, () => undefined);
    worldUniforms.uLightColor.value.set(0, 0, 0);
    worldUniforms.uAmbient.value.set(0, 0, 0);
    lightning.update(0, 'dunwich', false, undefined);
    lightning.strikeNow(0.3);
    lightning.update(0.01, 'dunwich', false, undefined);
    const f = flashOf(flash.value);
    expect(f).toBeGreaterThan(0.1);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(LIGHTNING.light * f, 6);
    expect(worldUniforms.uAmbient.value.x).toBeCloseTo(LIGHTNING.light * 0.5 * f, 6);
    expect(mist.x).toBeCloseTo(LIGHTNING.mist * f, 6);
    vi.restoreAllMocks();
  });

  it('keeps a lightning flash at its whole strength on top of the dimmed light', () => {
    const s = rig();
    s.atm.force = { over: 1, snap: true };
    const f = 0.8;
    s.uniforms.uFlash.value = 0.085 * LIGHTNING.sky * f;
    worldUniforms.uLightColor.value.set(0.5, 0.5, 0.5).addScalar(LIGHTNING.light * f);
    worldUniforms.uAmbient.value.set(0.2, 0.2, 0.2).addScalar(LIGHTNING.light * 0.5 * f);
    s.post.uniforms.uFogColor.value.set(0.1, 0.1, 0.1).addScalar(LIGHTNING.mist * f);
    const over = createOvercast({ overworld: { weather: s.weather } } as unknown as Game, { material: { uniforms: s.uniforms } } as never, s.post as never, s.atm);
    over.update(1, false); // (not the rig's frame, which would lay the lights anew)
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5 * (1 - OVERCAST.moon) + LIGHTNING.light * f, 4);
    expect(worldUniforms.uAmbient.value.x).toBeCloseTo(0.2 * (1 - OVERCAST.ambient) + LIGHTNING.light * 0.5 * f, 4);
    expect(s.post.uniforms.uFogColor.value.x).toBeCloseTo(0.1 * (1 - OVERCAST.sky) + LIGHTNING.mist * f, 4);
  });
});

describe('the bank of cloud across the moon (round 80)', () => {
  it('is a deterministic, bounded schedule: banks of 24 to 48 seconds, with clear nights between', () => {
    let [banks, inBank, len, longest, shortest] = [0, false, 0, 0, Infinity];
    for (let t = 0; t < 6 * 3600; t += 0.5) {
      const v = veilAt(t);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(veilAt(t)).toBe(v);
      if (v > 0 && !inBank) [inBank, len] = [true, 0];
      if (v > 0) len += 0.5;
      if (v === 0 && inBank) {
        [inBank, banks, longest, shortest] = [false, banks + 1, Math.max(longest, len), Math.min(shortest, len)];
      }
    }
    expect(banks).toBeGreaterThan(40); // about one in each slot of four and a third minutes...
    expect(banks).toBeLessThan((6 * 3600) / VEIL.slot + 1); // ...never more than one
    expect(longest).toBeLessThanOrEqual(VEIL.last[1] + 1);
    expect(shortest).toBeGreaterThanOrEqual(VEIL.last[0] * 0.6); // (its first and last half-second are zero)
  });

  it('gives the Mountains, Pnakotus and Yuggoth none, and a realm with no moon none', () => {
    const share = (id: string): number => bankShare(id in SKY.regions ? (SKY.regions[id].clouds ?? SKY.base.clouds) : SKY.base.clouds, SKY.regions[id]?.moon ?? SKY.base.moon);
    for (const id of ['mountains', 'pnakotus', 'yuggoth', 'kn_yan', 'beyond']) expect(share(id), id).toBe(0);
    for (const id of ['hub', 'arkham', 'dunwich', 'innsmouth', 'rlyeh']) expect(share(id), id).toBe(1);
    expect(share('dreamlands')).toBeGreaterThan(0);
  });

  it('dims the moonlight on the ground by less than a full overcast, and gives way to a ceiling', () => {
    const s = rig();
    s.atm.force.veil = 1;
    s.run(0, 1);
    expect(worldUniforms.uLightColor.value.x).toBeCloseTo(0.5 * (1 - OVERCAST.moon * VEIL.light), 4);
    expect(worldUniforms.uLightColor.value.x).toBeGreaterThan(0.5 * (1 - OVERCAST.moon));
    expect(s.uniforms.uVeil.value).toBe(1);
    s.set('storm');
    s.run(1, 12);
    expect(s.uniforms.uVeil.value).toBe(0); // under cloud already, the bank is not seen
  });
});
