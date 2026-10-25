/** Round 78: each realm's own air (render/ambientAir.ts, data/airFields.ts, render/airKinds.ts). */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { AIR_FIELD, AIR_FIELDS, type AirKind } from '../src/data/airFields';
import { FOGS } from '../src/data/fogs';
import { REGION_IDS } from '../src/data/regions';
import { createAmbientAir, rateOf } from '../src/render/ambientAir';
import { gustAt, KINDS, toneOf } from '../src/render/airKinds';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { createWorldGame } from '../src/systems/game';
import { worldLayout } from '../src/world/placements';

const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
/** Whether a colour would be taken for an anomaly by the post pass's colour isolation (the rule of tests/palette.test.ts). */
const reads = (c: readonly [number, number, number]): boolean => {
  const [h, s, v] = rgbToHsv(c);
  return s > 0.3 && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < 0.1);
};
const calm = { dark: 1, mist: 1, gust: 0.5, rain: 0, shake: 1 };

/** The air of `region` over `seconds` seen by a camera about the investigator, and what was born. */
function breathe(region: string, seconds: number, set: (g: ReturnType<typeof createWorldGame>) => void = () => {}, hidden = false) {
  const g = createWorldGame();
  g.overworld!.region = region;
  set(g);
  const born: ParticleSpec[] = [];
  const air = createAmbientAir(g, { spawn: (p: ParticleSpec) => born.push(p) } as unknown as Particles);
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(me.x, me.y + 3, me.z - 4);
  camera.updateMatrixWorld();
  for (let i = 0; i < seconds * 60; i++) air.update(camera, i / 60, hidden);
  return { born, air, g, me, camera };
}

describe('each realm\'s air (round 78)', () => {
  it('gives every realm a field of its own, and no other', () => {
    for (const id of REGION_IDS) expect(AIR_FIELDS[id], id).toBeDefined();
    for (const id of Object.keys(AIR_FIELDS)) expect(REGION_IDS, id).toContain(id);
  });

  it('keeps every field within the rate the pool can spare, and the anomaly hues to a trickle', () => {
    for (const [id, layers] of Object.entries(AIR_FIELDS)) {
      expect(layers.length, id).toBeGreaterThan(0);
      expect(layers.length, id).toBeLessThanOrEqual(3);
      expect(layers.reduce((n, l) => n + l.rate, 0), id).toBeLessThanOrEqual(AIR_FIELD.maxRate);
      expect(layers.filter((l) => l.anomaly).reduce((n, l) => n + l.rate, 0), id).toBeLessThanOrEqual(AIR_FIELD.anomalyRate);
      for (const l of layers) expect(KINDS[l.kind], `${id} ${l.kind}`).toBeDefined();
    }
  });

  it('wears no colour the picture would take for an anomaly, but where it is meant to', () => {
    for (const [id, layers] of Object.entries(AIR_FIELDS)) {
      for (const l of layers) {
        const c = toneOf(id, l);
        for (const v of c) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(1);
        if (!l.anomaly) expect(reads(c), `${id} ${l.kind} ${c.map((v) => v.toFixed(2))}`).toBe(false);
      }
    }
    expect(Object.values(AIR_FIELDS).flat().filter((l) => l.anomaly).length).toBeLessThanOrEqual(2); // the heath's spark and Yuggoth's spore
  });

  it('flies every kind of speck as a finite thing that lives, and lets the fallers fall and the rest hang or rise', () => {
    const r = ((): (() => number) => { let n = 3; return () => ((n = (n * 1103515245 + 12345) % 2147483648) / 2147483648); })();
    const kinds = Object.keys(KINDS) as AirKind[];
    for (const k of kinds) {
      for (let i = 0; i < 20; i++) {
        const b = KINDS[k](r, { x: 0.5, z: 0.2, gust: i / 20 }, undefined);
        for (const v of [b.lift, b.clear, b.spec.life, b.spec.size, b.spec.vx ?? 0, b.spec.vy ?? 0, b.spec.vz ?? 0]) expect(Number.isFinite(v), k).toBe(true);
        expect(b.spec.life, k).toBeGreaterThan(0.5);
        expect(b.lift, k).toBeGreaterThanOrEqual(0);
        if (b.falls) expect(b.spec.gravity ?? 0, k).toBeGreaterThan(0);
      }
    }
    const used = new Set(Object.values(AIR_FIELDS).flat().map((l) => l.kind));
    expect(kinds.filter((k) => !used.has(k)), 'a recipe no field uses').toEqual([]);
  });

  it('is born about the investigator on a ring, clear of the lens, mostly where the camera looks', () => {
    const { born, me, camera } = breathe('arkham', 12);
    expect(born.length).toBeGreaterThan(60);
    const [r0, r1] = AIR_FIELD.ring;
    let ahead = 0;
    for (const p of born) {
      const d = Math.hypot(p.x - me.x, p.z - me.z);
      expect(d).toBeGreaterThanOrEqual(r0 - 1e-6);
      expect(d).toBeLessThanOrEqual(r1 + 1e-6);
      expect(Math.hypot(p.x - camera.position.x, p.y - camera.position.y, p.z - camera.position.z)).toBeGreaterThan(2.3);
      if (p.z > me.z) ahead++; // the camera looks along +z from behind them (a default camera looks down -z, so this is the "behind" half)
    }
    expect(ahead / born.length).toBeLessThan(0.5); // the default camera looks down -z: most are born there
  });

  it('is none under a roof or with no overworld, and none while hidden', () => {
    expect(breathe('arkham', 5, () => {}, true).born).toHaveLength(0);
    expect(breathe('arkham', 5, (g) => void (g.overworld = undefined)).born).toHaveLength(0);
  });

  it('drifts with the realm\'s wind, rolled by the gusts', () => {
    for (const id of ['mountains', 'innsmouth', 'pnakotus']) {
      const { born } = breathe(id, 12);
      const [wx, wz] = FOGS[id]!.wind;
      const kinds = new Set(AIR_FIELDS[id]!.map((l) => l.kind));
      const stream = born.filter((p) => p.shape === 'streak');
      expect(kinds.has('streamer') || kinds.has('brine') || kinds.has('dust'), id).toBe(true);
      expect(stream.length, id).toBeGreaterThan(5);
      const mean = (f: (p: ParticleSpec) => number): number => stream.reduce((n, p) => n + f(p), 0) / stream.length;
      expect(Math.sign(mean((p) => p.vx ?? 0)), id).toBe(Math.sign(wx));
      expect(Math.sign(mean((p) => p.vz ?? 0)), id).toBe(Math.sign(wz));
      expect(mean((p) => Math.hypot(p.vx ?? 0, p.vz ?? 0)), id).toBeGreaterThan(Math.hypot(wx, wz)); // faster than the mist: it streams
    }
    expect(gustAt(0, 0, 0)).toBeCloseTo(0.5, 5);
    for (let i = 0; i < 50; i++) expect(gustAt(i * 7.3, i * 11, -i * 5)).toBeGreaterThanOrEqual(0);
  });

  it('lets leaves fall to rest on the ground, and rain wash the dry from the air', () => {
    const { born } = breathe('vermont', 20);
    const leaves = born.filter((p) => p.shape === 'shard' && (p.floor ?? -Infinity) > -Infinity);
    expect(leaves.length).toBeGreaterThan(5);
    for (const p of leaves) expect(p.y).toBeGreaterThanOrEqual(p.floor!);
    const wet = breathe('vermont', 20, (g) => Object.assign(g.overworld!.weather, { kind: 'rain', want: 'rain', amount: 1 }));
    expect(wet.born.filter((p) => p.shape === 'shard' && (p.floor ?? -Infinity) > -Infinity)).toHaveLength(0); // the leaves are washed from it
    expect(wet.born.length).toBeGreaterThan(5); // (the spores are not)
  });

  it('is rate-limited by the hour, the mist, the gusts and the rain, and by the camera shake for what streaks', () => {
    const l = (o: object) => ({ kind: 'mote' as const, tone: 'mist' as const, rate: 4, ...o });
    expect(rateOf(l({}), calm)).toBe(4);
    expect(rateOf(l({ by: 'dark' }), { ...calm, dark: 0 })).toBeCloseTo(1, 5);
    expect(rateOf(l({ by: 'mist' }), { ...calm, mist: 0 })).toBe(0); // the Fog setting at none: no wisps
    expect(rateOf(l({ by: 'gust' }), { ...calm, gust: 1 })).toBeGreaterThan(rateOf(l({ by: 'gust' }), { ...calm, gust: 0 }));
    expect(rateOf(l({ dry: true }), { ...calm, rain: 1 })).toBe(0);
    expect(rateOf(l({ fast: true }), { ...calm, shake: 0 })).toBe(0);
    expect(rateOf(l({ fast: true }), calm)).toBe(4);
  });

  it('sees the fall go up when the mind has gone far enough, and writes nothing to the game', () => {
    const calmAsh = breathe('arkham', 12).born.filter((p) => p.shape === 'shard');
    expect(calmAsh.length).toBeGreaterThan(20);
    for (const p of calmAsh) expect(p.gravity).toBeGreaterThan(0);
    const mad = breathe('arkham', 12, (g) => void (g.mind.sanity = 10));
    const rising = mad.born.filter((p) => p.shape === 'shard');
    expect(rising.length).toBeGreaterThan(20);
    for (const p of rising) expect(p.gravity).toBeLessThan(0);
    expect(mad.g.mind.sanity).toBe(10);
  });

  it('keeps to its share of the pool, and stands down in a court with an air of its own', () => {
    const { air } = breathe('court_centre', 40);
    expect(air.alive).toBeLessThanOrEqual(AIR_FIELD.alive);
    const court = worldLayout().arenas.find((a) => a.air)!;
    expect(court).toBeDefined();
    const { born } = breathe(court.region, 8, (g) => {
      const p = g.ecs.c.transform.get(g.player.id)!.pos;
      [p.x, p.z] = [court.x, court.z];
    });
    expect(born).toHaveLength(0);
  });

  it('warms a still\'s air at once, from nothing', () => {
    const { air, camera } = breathe('arkham', 0.1);
    air.warm(camera, 1, 14);
    expect(air.alive).toBeGreaterThan(60);
    expect(air.alive).toBeLessThanOrEqual(AIR_FIELD.alive);
  });
});
