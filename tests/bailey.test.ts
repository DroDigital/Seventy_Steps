/**
 * Hutchinson's keep (round 67; world/enclosureBailey.ts, render/rodFx.ts): a curtain wall about a rectangle, a gatehouse over the gate and
 * a keep at the back, with a lightning rod on each, and the sky's bolt that falls on them while the investigator is near and not in the fight.
 * That the court is shut but for its gate is for the closure flood (tests/enclosure.test.ts) and the walks (tests/houseWalk.test.ts).
 */
import { describe, expect, it, vi } from 'vitest';
import { ARENA_HOUSES } from '../src/data/arenaHousesAll';
import { ROD } from '../src/data/tuning';
import type { Beams } from '../src/render/beams';
import type { Lightning } from '../src/render/lightning';
import type { BoltPath } from '../src/render/lightningPath';
import type { Particles } from '../src/render/particles';
import { createRodFx } from '../src/render/rodFx';
import type { Game } from '../src/systems/components';
import { propCollider } from '../src/world/props';
import { worldLayout } from '../src/world/placements';

const w = worldLayout();
const arena = w.arenas.find((a) => a.bosses[0] === 'edward_hutchinson')!;
const house = arena.house!;
const spec = ARENA_HOUSES.edward_hutchinson!;
const keep = house.props.find((p) => p.set?.id === 'rn_arch_goth')!; // the donjon's door, under its pointed arch
const gatehouseSpan = house.props.find((p) => p.set?.id === 'cs_wall' && p.y - arena.y >= spec.gate.height && Math.hypot(p.x - house.gate.x, p.z - house.gate.z) < 6)!;

describe("Hutchinson's keep", () => {
  it('is a bailey laid from the packs: a curtain, a donjon behind it and a gatehouse across the gate, with a rod on each (round 71: world/places/hutchinson.ts)', () => {
    expect(house.kind).toBe('place');
    expect(keep).toBeDefined();
    expect(gatehouseSpan).toBeDefined();
    expect(house.rods).toHaveLength(2);
    expect(house.props.filter((p) => p.set?.id === 'cs_wall').length).toBeGreaterThan(20);
    expect(house.props.filter((p) => p.set?.id?.startsWith('cs_tower')).length).toBeGreaterThanOrEqual(10); // four corners, the gate's two, and those along the wall, and the donjon's four
  });

  it('has the donjon at the back with its face on the wall, and the gatehouse spans the gate high enough for a body to pass under', () => {
    const along = (p: { x: number; z: number }): number => (p.x - arena.x) * house.front.x + (p.z - arena.z) * house.front.z;
    expect(along(keep)).toBeLessThanOrEqual(-spec.bailey!.behind - arena.radius + 0.01); // on the back wall's line, not in the court
    const span = propCollider(gatehouseSpan)!;
    expect(span.kind).toBe('obox');
    expect((span as { y0: number }).y0 - arena.y, 'the span clears a standing body').toBeGreaterThanOrEqual(spec.gate.height);
  });

  it('has its rods above what carries them: each at the top of the tallest piece about it, the donjon\'s the taller', () => {
    const [over, atKeep] = [house.rods![0]!, house.rods![1]!];
    for (const rod of [over, atKeep]) {
      const top = Math.max(...house.props.filter((p) => Math.hypot(p.x - rod.x, p.z - rod.z) < 3).map((p) => p.y + p.h));
      expect(rod.y, 'the tip of the rod').toBeGreaterThanOrEqual(top - 0.01);
      expect(rod.y - top, 'and not far over it').toBeLessThan(1.5);
    }
    expect(atKeep.y).toBeGreaterThan(over.y); // the keep is the taller
  });
});

describe('the bolt on the rods', () => {
  const stubs = () => {
    const bolts: unknown[] = [];
    const spawned = vi.fn();
    const strikes = vi.fn();
    const beams = { update: () => undefined, bolt: (...a: unknown[]) => bolts.push(a) } as unknown as Beams;
    const particles = { spawn: spawned, update: () => undefined } as unknown as Particles;
    const lightning = { update: () => undefined, strikeNow: strikes } as unknown as Lightning;
    const fx = createRodFx({ overworld: {} } as unknown as Game, particles, beams, lightning);
    return { fx, bolts, strikes, spawned };
  };
  const near = { x: arena.x + house.front.x * (arena.radius + 30), y: arena.y, z: arena.z + house.front.z * (arena.radius + 30) };
  const run = (fx: ReturnType<typeof stubs>['fx'], at: typeof near, from: number, seconds: number, hidden = false): void => {
    for (let t = from; t < from + seconds; t += 1 / 30) fx.update(at, t, hidden);
  };

  it('falls every few seconds on a court the investigator is near, and every third on the keep', () => {
    const { fx, bolts, strikes } = stubs();
    run(fx, near, 0, 80);
    expect(bolts.length).toBeGreaterThanOrEqual(Math.floor(80 / ROD.every[1]) - 1);
    expect(bolts.length).toBeLessThanOrEqual(Math.ceil(80 / ROD.every[0]) + 1);
    expect(strikes).toHaveBeenCalledTimes(bolts.length);
    const lands = bolts.map((b) => (b as [BoltPath])[0].main.at(-1)!);
    expect(lands.every((v) => house.rods!.some((r) => Math.hypot(r.x - v.x, r.y - v.y, r.z - v.z) < 1e-6)), 'every bolt lands on a rod').toBe(true);
    lands.forEach((v, k) => expect(Math.abs(v.y - house.rods![1]!.y) < 1e-6, `bolt ${k}`).toBe(k % ROD.keepEvery === ROD.keepEvery - 1));
  });

  it('is silent far off, out of sight and in the fight itself', () => {
    const far = { x: arena.x + 1000, y: 0, z: arena.z };
    for (const [at, hidden] of [[far, false], [near, true], [{ x: arena.x, y: arena.y, z: arena.z }, false]] as const) {
      const { fx, bolts } = stubs();
      run(fx, at, 0, 60, hidden);
      expect(bolts.length, `${at.x - arena.x}, ${hidden}`).toBe(0);
    }
  });

  it('does not begin on arrival: a court out of sight does not count its seconds', () => {
    const half = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { fx, bolts } = stubs();
    run(fx, { x: arena.x + 1000, y: 0, z: arena.z }, 0, 120); // a long time away
    run(fx, near, 120, 3); // and it begins part way through its wait: the first falls at half the interval
    expect(bolts.length).toBe(0);
    run(fx, near, 123, 1);
    expect(bolts.length).toBe(1);
    half.mockRestore();
  });
});
