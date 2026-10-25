/** Round 78: the weather in each land's own matter (data/weatherSkins.ts, render/weather.ts). */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { REGION_IDS } from '../src/data/regions';
import { WEATHER } from '../src/data/tuning';
import { DEFAULT_SKIN, SKINS, bedKind, skinOf } from '../src/data/weatherSkins';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { weatherHaze, windOf, windOfSkin, createWeatherFx } from '../src/render/weather';
import { worldUniforms } from '../src/render/worldMaterial';
import { createWorldGame } from '../src/systems/game';

/** The sky over `region`: its spell of `kind` for `seconds`, and what it threw up and drew. */
function sky(region: string, kind: 'rain' | 'storm' | 'gale' | 'motes', seconds = 20) {
  const g = createWorldGame();
  g.overworld!.region = region;
  const born: ParticleSpec[] = [];
  const scene = new THREE.Scene();
  const fx = createWeatherFx(scene, g, { spawn: (p: ParticleSpec) => born.push(p) } as unknown as Particles);
  Object.assign(g.overworld!.weather, { kind, want: kind, amount: 1 });
  const camera = new THREE.PerspectiveCamera();
  for (let i = 0; i < seconds * 60; i++) fx.update(camera, i / 60, false);
  const lines = scene.children.find((o) => o instanceof THREE.LineSegments) as THREE.LineSegments;
  return { born, lines, wet: worldUniforms.uWet.value as number, fx, g, camera };
}
const isLeaf = (p: ParticleSpec): boolean => p.shape === 'shard' && p.size === 0.11;

describe('the weather in each land\'s own matter (round 78)', () => {
  it('names real regions, and keeps the default what the weather has always been', () => {
    for (const id of Object.keys(SKINS)) expect(REGION_IDS, id).toContain(id);
    expect(skinOf('hub')).toBe(DEFAULT_SKIN);
    expect(skinOf(null)).toBe(DEFAULT_SKIN);
    expect(skinOf('providence')).toBe(DEFAULT_SKIN);
    expect(DEFAULT_SKIN).toMatchObject({ precip: 'rain', dust: [0.38, 0.36, 0.32], cloud: [0.34, 0.32, 0.28], wet: 1, streak: [0.58, 0.64, 0.72], fleck: null });
    for (const s of [DEFAULT_SKIN, ...Object.values(SKINS)]) {
      for (const c of [s.dust, s.cloud, s.streak, s.motes.a, s.motes.aEnd, s.motes.b, s.motes.bEnd, ...(s.fleck?.colors ?? [])]) for (const v of c) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(1);
      expect(s.wet).toBeGreaterThanOrEqual(0);
      expect(s.wet).toBeLessThanOrEqual(1);
    }
  });

  it('draws the hub\'s gale as ever: leaves, the grey dust, rain streaks in rain', () => {
    const { born, lines } = sky('hub', 'gale');
    expect(born.filter(isLeaf).length).toBeGreaterThan(10);
    expect(born.some((p) => p.shape === 'streak' && p.color.join() === '0.38,0.36,0.32')).toBe(true);
    expect(born.some((p) => p.shape === 'wisp' && p.color.join() === '0.34,0.32,0.28')).toBe(true);
    expect(lines.visible).toBe(false); // a gale has no rain
    const rain = sky('hub', 'rain');
    expect(rain.lines.visible).toBe(true);
    expect(rain.wet).toBeGreaterThan(0.9);
    expect(rain.lines.material).toBeInstanceOf(THREE.ShaderMaterial);
    ((rain.lines.material as THREE.ShaderMaterial).uniforms.uColor.value.toArray() as number[]).forEach((v, i) => expect(v).toBeCloseTo([0.58, 0.64, 0.72][i]!, 5));
  });

  it('makes the Mountains\' gale a ground blizzard and its storm a whiteout: snow, no leaves, no puddles', () => {
    const gale = sky('mountains', 'gale');
    expect(gale.lines.visible).toBe(true); // snow driven past the lens
    expect((gale.lines.material as THREE.ShaderMaterial).uniforms.uColor.value.x).toBeGreaterThan(0.8);
    expect(gale.born.filter(isLeaf)).toHaveLength(0);
    expect(gale.born.some((p) => p.shape === 'disc' && p.color[0] > 0.8)).toBe(true); // flakes on the wind
    expect(gale.born.some((p) => p.shape === 'streak' && p.color[0] > 0.8)).toBe(true); // strands of it
    expect(gale.wet).toBe(0);
    const storm = sky('mountains', 'storm');
    expect(storm.lines.visible).toBe(true);
    expect(storm.wet).toBe(0); // rain would have wet it through; snow does not
    expect(storm.born.filter((p) => p.shape === 'spark' && p.size === 0.05)).toHaveLength(0); // no drops where it lands
    expect(storm.born.filter(isLeaf)).toHaveLength(0);
  });

  it('makes Pnakotus\' storm a sandstorm, dry and with no rain in it', () => {
    const storm = sky('pnakotus', 'storm');
    expect(storm.lines.visible).toBe(true);
    expect((storm.lines.material as THREE.ShaderMaterial).uniforms.uColor.value.x).toBeCloseTo(0.78, 2);
    expect(storm.wet).toBe(0);
    expect(storm.born.filter(isLeaf)).toHaveLength(0);
    expect(storm.born.some((p) => p.shape === 'spark' && p.size === 0.05)).toBe(false);
    expect(sky('pnakotus', 'gale').lines.visible).toBe(false); // a gale there is the dust alone
  });

  it('throws Arkham\'s ash and Innsmouth\'s spray in a gale, where the rest throw leaves', () => {
    const ash = sky('arkham', 'gale').born;
    expect(ash.filter(isLeaf)).toHaveLength(0);
    expect(ash.some((p) => p.shape === 'shard' && p.size < 0.1 && p.color[0] > 0.35)).toBe(true);
    const spray = sky('innsmouth', 'gale').born;
    expect(spray.filter(isLeaf)).toHaveLength(0);
    expect(spray.some((p) => p.shape === 'disc')).toBe(true);
    expect(sky('arkham', 'rain').wet).toBeGreaterThan(0.9); // the heath is wet in rain as ever
  });

  it('wets no ground under snow or sand, and still wets what takes rain', () => {
    expect(sky('mountains', 'rain').wet).toBe(0);
    expect(sky('vermont', 'rain').wet).toBeGreaterThan(0.9);
  });

  it('makes the Dreamlands\' motes petals among lights, and Yuggoth\'s spores', () => {
    const dream = sky('dreamlands', 'motes').born;
    expect(dream.some((p) => p.shape === 'petal')).toBe(true);
    expect(dream.some((p) => p.shape === 'wisp')).toBe(true);
    const yuggoth = sky('yuggoth', 'motes').born;
    expect(yuggoth.some((p) => p.shape === 'petal')).toBe(false);
    expect(yuggoth.some((p) => p.color[0] === 0.92)).toBe(true);
    expect(sky('hub', 'motes').born.some((p) => p.shape === 'petal')).toBe(false);
  });

  it('drives snow and sand harder and shorter than rain, and leaves what bends the trees alone', () => {
    for (const kind of ['rain', 'storm', 'gale'] as const) expect(windOfSkin(DEFAULT_SKIN, kind, 0.7)).toEqual(windOf(kind, 0.7));
    const [rain, snow, sand] = [windOf('storm', 1), windOfSkin(SKINS.mountains!, 'storm', 1), windOfSkin(SKINS.pnakotus!, 'storm', 1)];
    expect(snow.slant).toBeGreaterThan(rain.slant * 8); // driven sideways
    expect(snow.fall).toBeLessThan(rain.fall / 3);
    expect(snow.length).toBeLessThan(rain.length / 4);
    expect(sand.slant).toBeGreaterThan(snow.slant);
    expect(snow.sway).toBe(rain.sway);
    expect(windOfSkin(SKINS.mountains!, 'gale', 1).slant).toBeLessThan(snow.slant); // a gale is a flurry, a storm a whiteout
  });

  it('closes the world in as the land\'s own, and as ever where it has none', () => {
    const [near, far] = [20, 100];
    const at = (region: string, kind: 'gale' | 'storm') => {
      const s = sky(region, kind, 1);
      const fx = { fogNear: near, fogFar: far };
      weatherHaze(fx, { kind, amount: 1 }, false);
      void s;
      return fx;
    };
    const hub = at('hub', 'gale');
    expect(hub.fogFar).toBeCloseTo(far * (1 - WEATHER.haze.gale!), 5);
    const blizzard = at('mountains', 'gale');
    expect(blizzard.fogFar).toBeLessThan(hub.fogFar);
    expect(at('hub', 'storm').fogFar).toBeCloseTo(far * (1 - WEATHER.haze.storm!), 5); // the hub's skin takes the weather back
    const none = { fogNear: near, fogFar: far };
    weatherHaze(none, { kind: 'storm', amount: 1 }, true);
    expect(none).toEqual({ fogNear: near, fogFar: far }); // not under a roof
  });

  it('hears the bed of snow and sand as the wind alone', () => {
    expect(bedKind('mountains', 'storm')).toBe('gale');
    expect(bedKind('mountains', 'rain')).toBe('gale');
    expect(bedKind('mountains', 'gale')).toBe('gale');
    expect(bedKind('pnakotus', 'storm')).toBe('gale');
    expect(bedKind('hub', 'storm')).toBe('storm');
    expect(bedKind('arkham', 'rain')).toBe('rain');
    expect(bedKind('mountains', 'clear')).toBe('clear');
    expect(bedKind(null, 'motes')).toBe('motes');
  });
});
