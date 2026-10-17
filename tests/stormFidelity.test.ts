import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import type { V3 } from '../src/core/geom';
import { STORM_MIX, STRIKE_CRACK, STRIKE_WARN, thunderRoll } from '../src/data/stormSounds';
import { LIGHTNING, SKY_STRIKE, WEATHER } from '../src/data/tuning';
import { createStormAudio } from '../src/render/audio/stormAudio';
import { levelsOf } from '../src/render/audio/weatherBed';
import type { Beams } from '../src/render/beams';
import { createLightning } from '../src/render/lightning';
import { boltPath } from '../src/render/lightningPath';
import type { Particles, ParticleSpec } from '../src/render/particles';
import { createSkyStrikeFx } from '../src/render/skyStrikeFx';
import { streaksAt, weatherHaze, windOf } from '../src/render/weather';
import { createGroundFx } from '../src/render/groundFx';
import { createGame } from '../src/systems/game';
import { newWeather } from '../src/systems/weather';
import { render } from './soundRender';
import type { PostPass } from '../src/render/postPass';
import type { Sound } from '../src/data/sounds';

const seeded = (): (() => number) => {
  let n = 7;
  return () => ((n = (n * 1103515245 + 12345) % 2147483648) / 2147483648);
};

describe('a bolt of lightning has a shape (round 52)', () => {
  it('runs from the cloud to its mark, wandering and coming back, and forks that leave it part of the way down', () => {
    const top = { x: 3, y: 90, z: -4 };
    const ground = { x: 10, y: 2, z: 5 };
    const path = boltPath(top, ground, seeded(), { segments: 14, sway: 5, forks: 3 });
    expect(path.main).toHaveLength(15);
    expect(path.main[0]).toEqual(top);
    expect(path.main.at(-1)).toEqual(ground);
    for (let i = 1; i < path.main.length; i++) expect(path.main[i]!.y).toBeLessThan(path.main[i - 1]!.y); // always down
    const sideways = path.main.map((p, i) => Math.hypot(p.x - (top.x + (ground.x - top.x) * (i / 14)), p.z - (top.z + (ground.z - top.z) * (i / 14))));
    expect(Math.max(...sideways)).toBeGreaterThan(1); // it wanders...
    expect(Math.max(...sideways.slice(-2))).toBeLessThan(sideways.reduce((m, v) => Math.max(m, v), 0) + 1e-9); // ...and settles
    expect(path.forks.length).toBeGreaterThan(0);
    expect(path.forks.length).toBeLessThanOrEqual(3);
    for (const fork of path.forks) {
      expect(path.main).toContainEqual(fork[0]);
      expect(fork.at(-1)!.y).toBeLessThan(fork[0]!.y);
      expect(fork.at(-1)!.y).toBeGreaterThan(ground.y - 1); // a fork gives out before the ground, or at most on it
      for (const p of fork) for (const n of [p.x, p.y, p.z]) expect(Number.isFinite(n)).toBe(true);
    }
    expect(boltPath(top, ground, seeded())).toEqual(boltPath(top, ground, seeded())); // the same stream, the same bolt
    expect(boltPath(top, ground, seeded())).not.toEqual(boltPath(top, ground, () => 0.9));
  });
});

describe('thunder is made to its distance (round 52)', () => {
  const heard = (s: Sound) => render(s);
  it('near it cracks and booms; far it only rolls, longer and lower, with no crack in it', () => {
    const near = thunderRoll(0);
    const far = thunderRoll(1);
    expect(near.some((l) => l.src === 'noise' && l.filter?.type === 'highpass')).toBe(true);
    expect(far.some((l) => l.src === 'noise' && l.filter?.type === 'highpass')).toBe(false);
    expect(heard(far).sec).toBeGreaterThan(heard(near).sec);
    for (const f of [0, 0.3, 0.6, 1]) {
      const r = heard(thunderRoll(f));
      expect(r.rms, `far ${f}`).toBeGreaterThan(-30);
      expect(r.rms, `far ${f}`).toBeLessThan(-12);
      expect(r.peak, `far ${f}`).toBeLessThan(2);
      expect(r.sec, `far ${f}`).toBeLessThan(5.5);
    }
  });

  it('the ring\'s crackle lasts as long as the warning and builds, and the bolt\'s crack is sharp and brief', () => {
    const warn = heard(STRIKE_WARN);
    expect(warn.sec).toBeGreaterThan(1.2);
    expect(warn.sec).toBeLessThan(SKY_STRIKE.warn / 60 + 0.2);
    expect(warn.rms).toBeGreaterThan(-34);
    expect(warn.rms).toBeLessThan(-16);
    const crack = heard(STRIKE_CRACK);
    expect(crack.sec).toBeLessThan(1);
    expect(crack.rms).toBeGreaterThan(-26);
    expect(crack.peak).toBeLessThan(2);
    const early = render(STRIKE_WARN.map((l) => ({ ...l, dur: Math.min(l.dur, 0.4) })).filter((l) => (l.at ?? 0) < 0.4));
    expect(early.rms).toBeLessThan(warn.rms + 0.1); // (what comes late is louder: it builds)
  });

  it('plays the ring where it stands, and the crack where the bolt falls, and the thunder is the sky\'s', () => {
    const g = createGame();
    const heardAt: { key: string; at: V3 | null | undefined }[] = [];
    const samples: string[] = [];
    createStormAudio(g, (key, _s, o) => (heardAt.push({ key, at: o?.at }), true), (set) => (samples.push(set), true));
    const at = { x: 4, y: 0, z: 9 };
    g.events.emit('StrikeWarned', { at, radius: 3.4, frames: 90 });
    g.events.emit('StrikeLanded', { at, radius: 3.4 });
    expect(heardAt.map((h) => h.key)).toEqual(['storm:warn', 'storm:crack']);
    expect(heardAt.every((h) => h.at === at || (h.at && h.at.x === 4))).toBe(true);
    expect(samples).toEqual(['boom']);
    expect(STORM_MIX.crack).toBeGreaterThan(0);
  });
});

describe('the weather bed is fuller (round 52)', () => {
  it('rain, a storm and a gale each have their own mix; under a roof it is dull and a third as loud', () => {
    const rain = levelsOf('rain', 1, false);
    const storm = levelsOf('storm', 1, false);
    const gale = levelsOf('gale', 1, false);
    expect(rain.rain).toBe(1);
    expect(rain.gale).toBeLessThan(0.2);
    expect(storm.rain).toBe(1);
    expect(storm.gale).toBeGreaterThan(0.4);
    expect(storm.howl).toBeGreaterThan(0.3);
    expect(gale.rain).toBe(0);
    expect(gale.gale).toBe(1);
    expect(gale.howl).toBe(1);
    expect(levelsOf('motes', 1, false)).toMatchObject({ rain: 0, patter: 0, gale: 0, howl: 0 });
    expect(levelsOf('clear', 0, false)).toMatchObject({ rain: 0, gale: 0 });
    const roofed = levelsOf('storm', 1, true);
    expect(roofed.rain).toBeCloseTo(storm.rain * 0.33, 5);
    expect(roofed.cutoff).toBeLessThan(1000);
    expect(storm.cutoff).toBeGreaterThan(10000);
    expect(levelsOf('rain', 0.5, false).rain).toBeCloseTo(0.5, 5);
    expect(levelsOf('rain', 9, false).rain).toBe(1);
  });
});

describe('rain and wind are drawn to the weather (round 52)', () => {
  it('a storm falls harder, slants more and bends the trees further than rain; a gale blows without the rain', () => {
    const rain = windOf('rain', 1);
    const storm = windOf('storm', 1);
    expect(storm.slant).toBeGreaterThan(rain.slant);
    expect(storm.fall).toBeGreaterThan(rain.fall);
    expect(storm.sway).toBeGreaterThan(rain.sway);
    expect(storm.length).toBeGreaterThan(rain.length);
    expect(windOf('gale', 1).sway).toBeGreaterThan(storm.sway * 0.9);
    expect(windOf('clear', 0)).toEqual({ slant: 0.2, fall: 15, sway: 1, length: 0.5 });
    expect(streaksAt(1, WEATHER.rainStorm)).toBeGreaterThan(streaksAt(1, WEATHER.rain));
  });

  it('rain and storm draw the fog in as they gather and let it out as they pass; clear skies, motes and a roof leave it alone', () => {
    const open = () => ({ fogNear: 20, fogFar: 60 });
    const f = open();
    weatherHaze(f, { kind: 'storm', amount: 1 }, false);
    expect(f.fogFar).toBeCloseTo(60 * (1 - WEATHER.haze.storm), 5);
    expect(f.fogNear).toBeLessThan(20);
    const half = open();
    weatherHaze(half, { kind: 'storm', amount: 0.5 }, false);
    expect(half.fogFar).toBeGreaterThan(f.fogFar);
    expect(half.fogFar).toBeLessThan(60);
    const rain = open();
    weatherHaze(rain, { kind: 'rain', amount: 1 }, false);
    expect(rain.fogFar).toBeGreaterThan(f.fogFar);
    for (const w of [{ kind: 'clear' as const, amount: 0 }, { kind: 'motes' as const, amount: 1 }, undefined]) {
      const x = open();
      weatherHaze(x, w, false);
      expect(x).toEqual(open());
    }
    const roofed = open();
    weatherHaze(roofed, { kind: 'storm', amount: 1 }, true);
    expect(roofed).toEqual(open());
  });
});

describe('a thunderstorm flashes in every region, and a bolt on the ground lights the sky (round 52)', () => {
  function rig() {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const flash = { value: 0 };
    const sky = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: { uFlash: flash } }));
    const thunder = vi.fn();
    const onFlash = vi.fn();
    const lightning = createLightning(sky, { uniforms: { uFogColor: { value: new THREE.Vector3() } } } as unknown as PostPass, thunder, onFlash);
    const weather = newWeather();
    return { lightning, flash, thunder, onFlash, weather };
  }

  it('flashes in a storm over a region that never had lightning, and draws a bolt for it; rain there stays quiet', () => {
    const r = rig();
    Object.assign(r.weather, { kind: 'storm', want: 'storm', amount: 1 });
    r.lightning.update(0, 'hub', false, r.weather);
    const first = (LIGHTNING.stormEvery[0] + LIGHTNING.stormEvery[1]) / 4;
    r.lightning.update(first, 'hub', false, r.weather);
    expect(r.flash.value).toBeGreaterThan(0);
    expect(r.onFlash).toHaveBeenCalledTimes(1);
    const quiet = rig();
    Object.assign(quiet.weather, { kind: 'rain', want: 'rain', amount: 1 });
    for (let t = 0; t < 600; t += 5) quiet.lightning.update(t, 'hub', false, quiet.weather);
    expect(quiet.flash.value).toBe(0);
    expect(quiet.thunder).not.toHaveBeenCalled();
  });

  it('a ground strike falling between a flash and its thunder does not take that thunder away (round 52)', () => {
    const r = rig();
    r.lightning.update(10, 'hub', false, r.weather); // clear: nothing rolls of its own
    r.lightning.strikeNow(1); // far off: its thunder is seconds away
    r.lightning.update(11, 'hub', false, r.weather);
    r.lightning.strikeNow(0); // overhead, a moment later: its thunder is at once
    r.lightning.update(11.1, 'hub', false, r.weather);
    expect(r.thunder).toHaveBeenCalledTimes(1);
    r.lightning.update(10 + LIGHTNING.delay[1] + 0.1, 'hub', false, r.weather);
    expect(r.thunder).toHaveBeenCalledTimes(2); // the far one still rolls in
  });

  it('a storm that is gathering (not yet at the old threshold) flashes already; a bolt seen indoors is not drawn', () => {
    const r = rig();
    Object.assign(r.weather, { kind: 'storm', want: 'storm', amount: LIGHTNING.stormGather + 0.01 });
    r.lightning.update(0, 'arkham', true, r.weather);
    r.lightning.update(100, 'arkham', true, r.weather);
    expect(r.onFlash).not.toHaveBeenCalled();
    expect(r.flash.value).toBe(0);
  });

  it('strikeNow lights the sky and the thunder is on its heels when the bolt is overhead, later when it is far', () => {
    const r = rig();
    r.lightning.update(10, 'hub', false, r.weather);
    r.lightning.strikeNow(0);
    r.lightning.update(10.01, 'hub', false, r.weather);
    expect(r.flash.value).toBeGreaterThan(0);
    expect(r.thunder).not.toHaveBeenCalled();
    r.lightning.update(10.06, 'hub', false, r.weather);
    expect(r.thunder).toHaveBeenCalledTimes(1);
    expect(r.thunder.mock.calls[0]![0]).toBeCloseTo(1, 5);
    const far = rig();
    far.lightning.update(10, 'hub', false, far.weather);
    far.lightning.strikeNow(1);
    far.lightning.update(11, 'hub', false, far.weather);
    expect(far.thunder).not.toHaveBeenCalled();
    far.lightning.update(10 + LIGHTNING.delay[1] + 0.01, 'hub', false, far.weather);
    expect(far.thunder.mock.calls[0]![0]).toBeCloseTo(0.4, 5);
    vi.restoreAllMocks();
  });
});

describe('the ring and the bolt are drawn (round 52)', () => {
  it('a ring is a telegraph that fills over the warning, with sparks rising as it nears; the bolt is a forked line, a burst, a scar, a shock ring and a flash', () => {
    const g = createGame();
    const specs: ParticleSpec[] = [];
    const particles = { spawn: (p: ParticleSpec) => void specs.push(p), update: () => undefined } as Particles;
    const ground = createGroundFx();
    const bolts: unknown[] = [];
    const beams = { bolt: (...args: unknown[]) => void bolts.push(args), update: () => undefined } as unknown as Beams;
    const struck = vi.fn();
    const fx = createSkyStrikeFx(g, particles, ground, beams, { update: () => undefined, strikeNow: struck });
    fx.update(0);
    g.events.emit('StrikeWarned', { at: { x: 2, y: 1, z: 3 }, radius: 3.4, frames: 90 });
    expect(ground.count()).toBe(1);
    const before = specs.length;
    for (let i = 1; i <= 60; i++) fx.update(i / 60);
    expect(specs.length).toBeGreaterThan(before + 60); // sparks, thickening
    const early = specs.slice(before, before + 20).length;
    const late = specs.slice(-20).length;
    expect(late).toBeGreaterThanOrEqual(early);
    expect(bolts).toHaveLength(0);
    g.events.emit('StrikeLanded', { at: { x: 2, y: 1, z: 3 }, radius: 3.4 });
    expect(bolts).toHaveLength(1);
    expect(struck).toHaveBeenCalledWith(0);
    expect(ground.count()).toBeGreaterThanOrEqual(3); // the ring's own, the scar and the shock ring
    expect(specs.length).toBeGreaterThan(before + 150);
    for (const p of specs) for (const n of [p.x, p.y, p.z, p.life, p.size]) expect(Number.isFinite(n)).toBe(true);
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 2, 0);
    camera.lookAt(0, 2, 10);
    camera.updateMatrixWorld();
    fx.distant(0.5, camera);
    expect(bolts).toHaveLength(2);
    const [path] = bolts[1] as [{ main: V3[] }];
    const base = path.main.at(-1)!;
    expect(Math.hypot(base.x, base.z)).toBeGreaterThan(80); // far off
    expect(path.main[0]!.y).toBeGreaterThan(base.y + 100); // out of a high cloud
  });
});
