import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { HOURS, HOUR_COLOURS } from '../src/data/hours';
import { REGIONS } from '../src/data/regions';
import { CLOCK } from '../src/data/tuning';
import { moonDir } from '../src/render/nightFx';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';
import { createSkyHours, oppositeOf } from '../src/render/skyHours';
import { newAtm } from '../src/render/skyForce';
import { worldUniforms } from '../src/render/worldMaterial';
import { afterglowOf, dawnOf, falseDawnOf, NIGHT, phaseOf, skyTurnOf } from '../src/systems/clock';
import type { Game } from '../src/systems/components';

afterEach(() => void (NIGHT.hurried = 0));

const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
/** The same test as tests/palette.test.ts: whether a colour would be taken for an anomaly by the post pass's colour isolation. */
const reads = (c: readonly [number, number, number]): boolean => {
  const [h, s, v] = rgbToHsv(c);
  return s > 0.3 && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < 0.1);
};
const at = (phase: number): number => ((phase - CLOCK.start + 1) % 1) * CLOCK.night; // the seconds of play at which the night stands at `phase`

describe('the afterglow and the false dawn (round 78)', () => {
  it('is whole at the turn of the night, thins over the gloaming, is none in the deep, and gathers again before the turn', () => {
    expect(afterglowOf(0)).toBe(1);
    expect(afterglowOf(1)).toBe(1); // (continuous across the wrap)
    expect(afterglowOf(0.14)).toBe(0);
    for (let p = 0.14; p <= 0.97; p += 0.01) expect(afterglowOf(p), String(p)).toBe(0);
    let before = 1;
    for (let p = 0; p <= 0.14; p += 0.005) {
      expect(afterglowOf(p)).toBeLessThanOrEqual(before + 1e-9);
      before = afterglowOf(p);
    }
    let after = 0;
    for (let p = 0.975; p <= 1; p += 0.001) {
      expect(afterglowOf(p)).toBeGreaterThanOrEqual(after - 1e-9);
      after = afterglowOf(p);
    }
    for (let p = 0; p <= 1; p += 0.001) expect(Math.abs(afterglowOf(p + 0.001) - afterglowOf(p))).toBeLessThan(0.08);
  });

  it('has a false dawn that is the last hour\'s grey: none in the gloaming or the deep, most at the turn of the hour, sunk back at the turn', () => {
    expect(falseDawnOf).toBe(dawnOf);
    expect(falseDawnOf(0.3)).toBe(0);
    expect(falseDawnOf(0.88)).toBeGreaterThan(0.7);
    expect(falseDawnOf(1)).toBe(0);
    expect(falseDawnOf(0)).toBe(0);
  });

  it('lies away from where the moon rose, and the false dawn away from where it sets, on the far side of the sky from each other', () => {
    const rose = moonDir(0);
    const set = moonDir(1);
    expect(oppositeOf(0)).toBeCloseTo(Math.atan2(rose.x, rose.z) + Math.PI, 6);
    expect(oppositeOf(1)).toBeCloseTo(Math.atan2(set.x, set.z) + Math.PI, 6);
    expect(Math.abs(oppositeOf(1) - oppositeOf(0))).toBeGreaterThan(1);
  });
});

describe('the wheel of the stars (round 78)', () => {
  it('turns steadily, and does not jump at the turn of the night or a whole circle', () => {
    let last = skyTurnOf(0);
    let total = 0;
    for (let s = 1; s <= 4 * CLOCK.night; s += 1) {
      const now = skyTurnOf(s);
      const step = ((now - last + 3 * Math.PI) % (2 * Math.PI)) - Math.PI; // the way round, the short way
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(0.002);
      expect(now).toBeGreaterThanOrEqual(0);
      expect(now).toBeLessThan(2 * Math.PI);
      total += step;
      last = now;
    }
    expect(total).toBeCloseTo((4 * HOURS.turn), 1);
  });

  it("turns in sight in a vigil's called hour, ninety times as fast", () => {
    const before = skyTurnOf(100);
    NIGHT.hurried = 90 * 10; // ten seconds of the call
    expect(skyTurnOf(100) - before).toBeGreaterThan(0.4);
    NIGHT.hurried = 0;
    expect(phaseOf(0)).toBeCloseTo(CLOCK.start, 6);
  });
});

describe('the hours\' colours (round 78)', () => {
  it('belong to realms that exist, and none to the Dark: K\'n-yan, Yuggoth, the Beyond and the Outer Dark have no common night', () => {
    for (const id of Object.keys(HOUR_COLOURS)) expect(REGIONS.some((r) => r.id === id), id).toBe(true);
    for (const id of ['kn_yan', 'yuggoth', 'beyond', 'cloud_summit', 'black_wood', 'pale_lattice', 'piping_dark', 'spheres', 'court_centre']) expect(HOUR_COLOURS[id], id).toBeUndefined();
    for (const id of ['hub', 'arkham', 'dunwich', 'innsmouth', 'providence', 'vermont', 'mountains', 'pnakotus', 'dreamlands', 'rlyeh']) expect(HOUR_COLOURS[id], id).toBeDefined();
  });

  it('are warm and low in saturation, and none reads as an anomaly hue to the post pass\'s colour isolation', () => {
    for (const [id, c] of Object.entries(HOUR_COLOURS)) {
      expect(reads(c.glow), `${id} glow`).toBe(false);
      expect(reads(c.dawn), `${id} dawn`).toBe(false);
      for (const x of [...c.glow, ...c.dawn]) expect(x >= 0 && x <= 1).toBe(true);
      expect(c.glow[0], `${id}: a dusk is warm`).toBeGreaterThanOrEqual(c.glow[2] - 0.05);
      expect(rgbToHsv(c.dawn)[1], `${id}: a false dawn is pale`).toBeLessThan(0.3);
    }
    expect(HOURS.band).toBeLessThanOrEqual(0.5); // nothing brighter than a thin band (it thins to a third of itself at eleven degrees): round 35 took a bright gloaming away
    expect(HOURS.cone.band).toBeLessThanOrEqual(0.5);
  });
});

describe('the sky\'s hours as they are laid (round 78)', () => {
  function rig(region: string | null = 'dunwich', overworld = true) {
    const u = { uOpen: { value: 1 }, uHour: { value: new THREE.Vector4() }, uHourGlow: { value: new THREE.Vector3() }, uHourDawn: { value: new THREE.Vector3() }, uTurn: { value: 0 } };
    const sky = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.ShaderMaterial({ uniforms: u }));
    const post = { uniforms: { uFogColor: { value: new THREE.Vector3(0.1, 0.1, 0.1) } } };
    const atm = newAtm();
    const hours = createSkyHours({ overworld: overworld ? {} : undefined } as unknown as Game, sky, post as never, atm);
    const run = (phase: number, seconds: number, where = region): void => {
      for (let i = 0; i < seconds * 10; i++) {
        worldUniforms.uAmbient.value.set(0.2, 0.2, 0.2);
        post.uniforms.uFogColor.value.set(0.1, 0.1, 0.1);
        hours.update(at(phase) + i / 10, where, false);
      }
    };
    return { u, post, atm, run };
  }

  it('lays an afterglow at the turn, nothing in the deep, and a false dawn in the waning hour, each in the realm\'s colour', () => {
    const s = rig();
    s.run(0.02, 20);
    expect(s.u.uHour.value.x).toBeGreaterThan(0.8);
    expect(s.u.uHour.value.y).toBe(0);
    expect(s.u.uHourGlow.value.x).toBeCloseTo(HOUR_COLOURS.dunwich.glow[0] * HOURS.band, 2);
    expect(worldUniforms.uAmbient.value.x).toBeGreaterThan(0.2); // a hint of warmth on the nearest ground...
    expect(worldUniforms.uAmbient.value.x).toBeLessThan(0.2 + HOURS.tint * 1.01); // ...and no more
    s.run(0.5, 30);
    expect(s.u.uHour.value.x).toBeCloseTo(0, 2);
    expect(s.u.uHour.value.y).toBeCloseTo(0, 2);
    expect(worldUniforms.uAmbient.value.x).toBeCloseTo(0.2, 6);
    s.run(0.88, 30);
    expect(s.u.uHour.value.y).toBeGreaterThan(0.7);
    expect(s.u.uHour.value.x).toBeCloseTo(0, 2);
    expect(s.post.uniforms.uFogColor.value.z).toBeGreaterThan(0.1);
  });

  it('has none in a realm without a common night, fading out in the colours it had, and none in the arena', () => {
    const s = rig();
    s.run(0.02, 20);
    s.run(0.02, 20, 'yuggoth');
    expect(s.u.uHour.value.x).toBeLessThan(0.02);
    expect(rig(null, false).u.uTurn.value).toBe(0);
    const arena = rig('dunwich', false);
    arena.run(0.02, 20);
    expect(arena.u.uHour.value.x).toBe(0);
    expect(arena.u.uTurn.value).toBe(0);
  });

  it('lets the stars stand still where time is stopped (the Pale Lattice), and wheel on from where they stood', () => {
    const wheeled = (region: string, seconds: number): number => {
      const s = rig(region);
      s.run(0.3, seconds);
      return s.u.uTurn.value;
    };
    const free = wheeled('dunwich', 260) - wheeled('dunwich', 60);
    expect(free).toBeGreaterThan(0.1);
    expect(Math.abs(wheeled('pale_lattice', 260) - wheeled('pale_lattice', 60))).toBeLessThan(free * 0.1);
  });

  it('wheels the stars with the night', () => {
    const s = rig();
    s.run(0.3, 1);
    const a = s.u.uTurn.value;
    s.run(0.6, 1);
    expect(s.u.uTurn.value).not.toBe(a);
  });
});
