/**
 * The ground the places shape and what they do now and then (round 75; world/places/water.ts, render/poolMesh.ts, render/signalFx.ts): the tide basin of Martin's Beach,
 * the lagoon and the raised door of R'lyeh, the lake of Ib, the shrine's plateau and the pits of Yig, the slime channels of Nug; the lights that run through the courts of the
 * Gate, the Ancient Ones, the Pipers, Azathoth and the Other Gods, and the arcs between the pylons of Yaddith. That the court is shut is for tests/enclosure.test.ts.
 */
import { describe, expect, it, vi } from 'vitest';
import type { V3 } from '../src/core/geom';
import { SIGNAL } from '../src/data/lifeTuning';
import type { Beams } from '../src/render/beams';
import type { BoltPath } from '../src/render/lightningPath';
import type { Particles } from '../src/render/particles';
import { poolMesh } from '../src/render/poolMesh';
import { createSignalFx } from '../src/render/signalFx';
import type { Game } from '../src/systems/components';
import { allFogs } from '../src/systems/fogGates';
import type { Pool, Signal } from '../src/world/enclosure';
import { SURFACE } from '../src/world/places/water';
import { worldLayout } from '../src/world/placements';
import { padDistance, polygonFootprint } from '../src/world/sitePads';
import { ground } from '../src/world/terrain';

const w = worldLayout();
const arenaOf = (boss: string) => w.arenas.find((a) => a.bosses[0] === boss)!;
const SHAPED = ['martins_beach_horror', 'cthulhu', 'bokrug', 'yig', 'nug'] as const;
const SIGNALLED = ['zkauba', 'other_gods', 'daemon_pipers', 'yog_sothoth', 'azathoth', 'ancient_ones'] as const;
const poolsOf = (boss: string): Pool[] => (arenaOf(boss).house!.living ?? []).filter((l): l is Pool => l.kind === 'pool');

describe('the ground the places shape', () => {
  it('is shaped by five places, and only the eleven that were asked have anything laid in it', () => {
    const shaped = w.arenas.filter((a) => a.house?.under).map((a) => a.bosses[0]).filter((b) => !['black_man', 'colour_out_of_space'].includes(b!)); // (the Black Man's river is round 68's)
    expect([...shaped].sort()).toEqual([...SHAPED].sort());
    expect(poolsOf('martins_beach_horror')).toHaveLength(1);
    expect(poolsOf('cthulhu')).toHaveLength(1);
    expect(poolsOf('bokrug')).toHaveLength(1);
    expect(poolsOf('nug')).toHaveLength(2);
    expect(poolsOf('yig')).toHaveLength(0);
  });

  it('keeps the fight\'s circle and its fog level, and every pad of it clear of the gate, the stake and the candle', () => {
    for (const boss of SHAPED) {
      const a = arenaOf(boss);
      const e = a.house!;
      const fog = allFogs().find((f) => f.bosses.includes(boss))!;
      for (const pad of e.under!(a.y)) {
        for (let k = 0; k < 72; k++) {
          const th = (k / 72) * 2 * Math.PI;
          const [x, z] = [a.x + Math.cos(th) * (a.radius + 1.5), a.z + Math.sin(th) * (a.radius + 1.5)];
          expect(padDistance(pad, x, z), `${boss}: the fog's ring at ${k}`).toBeGreaterThanOrEqual(pad.blend - 0.05);
        }
        for (const [what, at] of [['gate', e.gate], ['stake', e.stake], ['candle', fog.candle]] as const) expect(padDistance(pad, at.x, at.z), `${boss}: the ${what}`).toBeGreaterThan(pad.blend + 0.5);
      }
    }
  });

  it('sinks a pool\'s bed under the level no deeper than a body wades, brings its bank to the level again before the wall, and keeps its surface between', () => {
    for (const boss of ['martins_beach_horror', 'cthulhu', 'bokrug', 'nug'] as const) {
      const a = arenaOf(boss);
      for (const p of poolsOf(boss)) {
        const fp = polygonFootprint(p.pts);
        const [lo, bankLevel] = [{ v: Infinity }, { v: -Infinity }];
        for (let x = fp.bounds.x0 - p.bank - 2; x <= fp.bounds.x1 + p.bank + 2; x += 1) {
          for (let z = fp.bounds.z0 - p.bank - 2; z <= fp.bounds.z1 + p.bank + 2; z += 1) {
            const d = fp.dist(x, z);
            if (d < -0.6) lo.v = Math.min(lo.v, ground(x, z));
            if (d > p.bank + 0.3 && d < p.bank + 1.3 && a.house!.gap({ x, z }) < -3) bankLevel.v = Math.max(bankLevel.v, Math.abs(ground(x, z) - a.y));
          }
        }
        expect(a.y - lo.v, `${boss}: its depth`).toBeGreaterThan(0.8);
        expect(a.y - lo.v, `${boss}: a body wades it`).toBeLessThanOrEqual(1.25);
        expect(p.y, `${boss}: the surface under the level`).toBeLessThan(a.y - 0.2);
        expect(p.y, `${boss}: and over the bed`).toBeGreaterThan(lo.v + 0.3);
        expect(bankLevel.v, `${boss}: the ground is the court's again past the bank`).toBeLessThan(0.1);
        for (const pt of p.pts) expect(a.house!.gap(pt), `${boss}: the bank is within the wall`).toBeLessThan(-p.bank - 0.5);
      }
    }
  });

  it('raises the plateau of Yig\'s shrine and the platform of the Great Door, and sinks Yig\'s four pits, as high and as deep as it says', () => {
    const [yig, rlyeh] = [arenaOf('yig'), arenaOf('cthulhu')];
    const high = (a: typeof yig): V3[] => a.house!.under!(a.y).filter((p) => p.level > a.y + 0.2).map((p) => { const b = p.kind === 'shape' ? p.shape.bounds : { x0: 0, z0: 0, x1: 0, z1: 0 }; return { x: (b.x0 + b.x1) / 2, y: p.level, z: (b.z0 + b.z1) / 2 }; });
    for (const [a, rise] of [[yig, 1.0], [rlyeh, 1.4]] as const) {
      const [top] = high(a);
      expect(top, a.bosses[0]).toBeDefined();
      expect(ground(top!.x, top!.z), `${a.bosses[0]}: the rise`).toBeCloseTo(a.y + rise, 1);
    }
    expect(yig.house!.under!(yig.y).filter((p) => p.level < yig.y - 0.5)).toHaveLength(4);
  });

  it('stands every piece the ground leaves higher or lower on that ground, and none of them over water at the court\'s level', () => {
    for (const boss of SHAPED) {
      const a = arenaOf(boss);
      const e = a.house!;
      const pads = e.under!(a.y).map((p) => (p.kind === 'shape' ? { fp: p.shape, level: p.level } : null)).filter((p) => p !== null);
      for (const p of e.props) {
        const on = [...pads].reverse().find((q) => q!.fp.dist(p.x, p.z) < -0.4); // (the pad laid last that holds it: a causeway lies over the pool it crosses)
        if (!on) continue;
        expect(p.y, `${boss}: ${p.set?.id} is not buried`).toBeGreaterThanOrEqual(on.level - 0.4);
        if (on.level < a.y - 0.2) expect(Math.abs(p.y - a.y), `${boss}: ${p.set?.id} is not left at the court's level over the sunk ground`).toBeGreaterThan(0.2);
      }
    }
  });

  it('keeps what stands in the court off the water: the court\'s own set, the stake and the candle are on dry ground', () => {
    for (const boss of SHAPED) {
      const a = arenaOf(boss);
      const e = a.house!;
      const fog = allFogs().find((f) => f.bosses.includes(boss))!;
      expect(e.dry, boss).toBeDefined();
      for (const [what, at] of [['stake', e.stake], ['candle', fog.candle]] as const) expect(e.dry!(at), `${boss}: the ${what}`).toBeLessThan(0);
      for (const p of poolsOf(boss)) {
        const fp = polygonFootprint(p.pts);
        for (let x = fp.bounds.x0; x <= fp.bounds.x1; x += 1.5) {
          for (let z = fp.bounds.z0; z <= fp.bounds.z1; z += 1.5) {
            if (fp.dist(x, z) > -0.6) continue;
            const causeway = boss === 'martins_beach_horror' && Math.abs((x - a.x) * -a.house!.front.z + (z - a.z) * a.house!.front.x) < 2.6; // (Martin's causeway crosses the middle of its basin: dry)
            if (!causeway) expect(e.dry!({ x, z }), `${boss}: water is not dry (${x.toFixed(0)}, ${z.toFixed(0)})`).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});

describe('the water\'s sheet', () => {
  it('is a mesh at the surface over the whole of the pool and its bank, of a size a court can afford', () => {
    for (const boss of ['martins_beach_horror', 'cthulhu', 'bokrug', 'nug'] as const) {
      for (const p of poolsOf(boss)) {
        const mesh = poolMesh(p);
        const pos = mesh.geometry.getAttribute('position');
        expect(pos.count, boss).toBeGreaterThan(30);
        expect(pos.count, `${boss}: a court's water is cheap`).toBeLessThan(12000);
        for (let i = 0; i < pos.count; i += 17) expect(pos.getY(i), `${boss}: flat`).toBeCloseTo(p.y, 5);
        const fp = polygonFootprint(p.pts);
        const seen = Array.from({ length: pos.count }, (_, i) => fp.dist(pos.getX(i), pos.getZ(i)));
        expect(Math.min(...seen), `${boss}: it covers the pool`).toBeLessThan(-0.5);
        expect(Math.max(...seen), `${boss}: and stops at the bank`).toBeLessThan(p.bank + 2.5);
        expect(mesh.geometry.getAttribute('color').count).toBe(pos.count);
        expect(mesh.name).toBe('pool');
      }
    }
  });

  it('is the water\'s: the surface of a pool lies SURFACE of its depth under the level, wherever the court stands', () => {
    for (const boss of ['martins_beach_horror', 'cthulhu', 'bokrug', 'nug'] as const) {
      const a = arenaOf(boss);
      for (const p of poolsOf(boss)) expect(p.y, boss).toBeCloseTo(a.y - SURFACE * (boss === 'nug' ? 0.9 : boss === 'bokrug' || boss === 'cthulhu' ? 1.2 : 1.1), 5);
    }
  });
});

describe('what the courts do now and then', () => {
  const signalsOf = (boss: string): readonly Signal[] => arenaOf(boss).house!.signals ?? [];

  it('is a signal for six places, a chase or an arc, each laid in the air above its own court', () => {
    for (const boss of SIGNALLED) {
      const a = arenaOf(boss);
      expect(signalsOf(boss).length, boss).toBeGreaterThanOrEqual(1);
      for (const s of signalsOf(boss)) {
        expect(s.at.length, `${boss}: points`).toBeGreaterThanOrEqual(s.kind === 'chase' ? 3 : 2);
        expect(s.every[0], boss).toBeGreaterThanOrEqual(2);
        expect(s.every[0]).toBeLessThanOrEqual(s.every[1]);
        for (const p of [...s.at, ...(s.last ? [s.last.at] : [])]) {
          expect(Math.hypot(p.x - a.x, p.z - a.z), `${boss}: within the court's reach`).toBeLessThan(a.radius + 100);
          expect(p.y - a.y, `${boss}: in the air`).toBeGreaterThan(2);
          expect(p.y - a.y, `${boss}: not in the clouds`).toBeLessThan(60);
        }
      }
    }
    expect(w.arenas.filter((a) => a.house?.signals).map((a) => a.bosses[0]).sort()).toEqual([...SIGNALLED].sort());
  });

  it('draws the storm of the Other Gods to four spires, taller than the wall about them, any of them in turn', () => {
    const a = arenaOf('other_gods');
    expect(a.house!.rods).toHaveLength(4);
    for (const r of a.house!.rods!) expect(r.y - a.y).toBeGreaterThan(24);
  });

  const stubs = () => {
    const bolts: unknown[][] = [];
    const spawned = vi.fn();
    const beams = { update: () => undefined, bolt: (...x: unknown[]) => bolts.push(x) } as unknown as Beams;
    const particles = { spawn: spawned, update: () => undefined } as unknown as Particles;
    return { fx: createSignalFx({ overworld: {} } as unknown as Game, particles, beams), bolts, spawned };
  };
  const run = (fx: ReturnType<typeof stubs>['fx'], at: V3, from: number, seconds: number, hidden = false): void => {
    for (let t = from; t < from + seconds; t += 1 / 30) fx.update(at, t, hidden);
  };
  const nearTo = (boss: string): V3 => { const a = arenaOf(boss); return { x: a.x + a.house!.front.x * (a.radius + 30), y: a.y, z: a.z + a.house!.front.z * (a.radius + 30) }; };
  const joins = (b: unknown[], p: V3, q: V3): boolean => {
    const main = (b[0] as BoltPath).main;
    const [h, t] = [main[0]!, main.at(-1)!];
    return Math.hypot(h.x - p.x, h.y - p.y, h.z - p.z) < 1e-6 && Math.hypot(t.x - q.x, t.y - q.y, t.z - q.z) < 1e-6;
  };

  it('runs a light from point to point of a chase, in order, a thread between each, and flares at its end', () => {
    for (const boss of ['ancient_ones', 'azathoth', 'other_gods', 'yog_sothoth', 'daemon_pipers'] as const) {
      const { fx, bolts, spawned } = stubs();
      run(fx, nearTo(boss), 0, 200);
      const chases = signalsOf(boss).filter((s) => s.kind === 'chase');
      expect(bolts.length, `${boss}: threads were drawn`).toBeGreaterThan(0);
      expect(spawned.mock.calls.length, `${boss}: puffs let go`).toBeGreaterThan(0);
      for (const b of bolts) expect(chases.some((s) => s.at.some((p, i) => i > 0 && joins(b, s.at[i - 1]!, p))), `${boss}: a thread joins two neighbours`).toBe(true);
    }
  });

  it('leaps an arc between two of the points of Yaddith, and not from a point to itself', () => {
    const { fx, bolts } = stubs();
    run(fx, nearTo('zkauba'), 0, 60);
    const [fast] = signalsOf('zkauba');
    expect(bolts.length).toBeGreaterThanOrEqual(Math.floor(60 / fast!.every[1]) - 1);
    for (const b of bolts) expect(signalsOf('zkauba').some((s) => s.at.some((p) => s.at.some((q) => p !== q && joins(b, p, q)))), 'a bolt joins two points').toBe(true);
  });

  it('is silent far off and out of sight, and does not begin on arrival', () => {
    const a = arenaOf('yog_sothoth');
    for (const [at, hidden] of [[{ x: a.x + 3000, y: 0, z: a.z }, false], [nearTo('yog_sothoth'), true]] as const) {
      const { fx, bolts } = stubs();
      run(fx, at, 0, 120, hidden);
      expect(bolts.length, `${at.x - a.x}, ${hidden}`).toBe(0);
    }
    const half = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { fx, bolts } = stubs();
    run(fx, nearTo('yog_sothoth'), 0, 3);
    expect(bolts.length, 'the first seconds are quiet').toBe(0);
    half.mockRestore();
    expect(SIGNAL.near).toBeGreaterThan(100);
  });
});
