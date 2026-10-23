/**
 * The Colour's reservoir and the Black Man's river (round 68; world/enclosureBasin.ts, world/enclosureRiver.ts, render/gateLooks.ts): a court
 * walled as a dam and a curving bank, and a court on an island in a river kept between two kerbs, with a ford. That each is shut but for its
 * gate is for the closure flood (tests/enclosure.test.ts) and the walks (tests/houseWalk.test.ts); this holds what is particular to them.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HOUSES } from '../src/data/arenaHousesAll';
import { HOUSE } from '../src/data/arenaHouses';
import { gateKit } from '../src/render/gateLooks';
import { WATER } from '../src/world/enclosureRiver';
import { within } from '../src/world/enclosure';
import { worldLayout } from '../src/world/placements';
import { propCollider } from '../src/world/props';

const w = worldLayout();
const [dam, isle] = [w.arenas.find((a) => a.bosses[0] === 'colour_out_of_space')!, w.arenas.find((a) => a.bosses[0] === 'black_man')!];
const [basin, river] = [dam.house!, isle.house!];
const spec = ARENA_HOUSES.black_man!;
const along = (a: typeof dam, p: { x: number; z: number }): number => (p.x - a.x) * a.house!.front.x + (p.z - a.z) * a.house!.front.z;

describe("the Colour's reservoir", () => {
  it('is a basin: a straight dam across the front with the gate in its middle, a bank behind, and a spillway cut in the dam', () => {
    expect(basin.kind).toBe('basin');
    const spill = basin.props.find((p) => p.set?.id === 'house_spill')!;
    expect(spill).toBeDefined();
    expect(Math.abs(along(dam, spill) - along(dam, basin.gate)), 'in the dam, on the gate\'s line').toBeLessThan(0.01);
    expect(basin.living?.filter((l) => l.kind === 'spill')).toHaveLength(1);
    const behind = basin.props.filter((p) => along(dam, p) < 0);
    expect(behind.length, 'the bank runs back about the court').toBeGreaterThan(12);
    for (const p of basin.props) expect(p.h, p.set?.id).toBeGreaterThanOrEqual(5);
  });

  it('has the fallen wake and the candle inside the bank, a body\'s breadth from the dam', () => {
    expect(within(basin, basin.stake, 0)).toBe(true);
    expect(along(dam, basin.gate) - along(dam, basin.stake)).toBeGreaterThanOrEqual(7);
  });
});

describe("the Black Man's river", () => {
  const r = river.living!.find((l) => l.kind === 'river')!;
  const kerbs = river.props.filter((p) => p.set?.id === 'house_kerb');

  it('is a river: an island, a bed sunk about it, and a ford of dry ground from the gate to the island', () => {
    expect(river.kind).toBe('river');
    expect(r.kind === 'river' && r.inner < r.outer).toBe(true);
    const dry = river.dry!;
    expect(dry(isle), 'the island is dry').toBeLessThan(-HOUSE.margin);
    const start = { x: isle.x + river.front.x * (isle.radius + 20), z: isle.z + river.front.z * (isle.radius + 20) };
    expect(dry(start), 'so is the ford, between its kerbs').toBeLessThan(0);
    const mid = r.kind === 'river' ? (r.inner + r.outer) / 2 : 0; // the river's middle, to the side of the ford
    expect(dry({ x: isle.x - river.front.z * mid, z: isle.z + river.front.x * mid }), 'the river is not').toBeGreaterThan(0);
  });

  it('is kept between kerbs a body cannot climb, laid in rings: the bank\'s, the island\'s and the two of the ford', () => {
    expect(kerbs.length).toBeGreaterThan(30);
    for (const k of kerbs) expect(k.h).toBeGreaterThanOrEqual(1.2);
    expect(spec.river!.depth).toBeGreaterThan(1); // (a bed deeper than a body is tall is not needed: the kerbs hold it)
    expect(kerbs.every((k) => propCollider(k) !== null)).toBe(true);
  });

  it('shapes the land after the level ground: the bed sunk by its depth, then the ford raised across it to the court\'s level', () => {
    const pads = river.under!(isle.y);
    expect(pads).toHaveLength(2);
    expect(pads.map((p) => p.level)).toEqual([isle.y - spec.river!.depth, isle.y]);
    expect(r.kind === 'river' && r.level).toBeCloseTo(spec.river!.depth * WATER, 6); // and the water lies in it, below the land by a share of the depth
  });
});

describe('what shuts a gate (render/gateLooks.ts)', () => {
  const door = (look?: 'slab' | 'sluice' | 'boulder') => gateKit({ ...river.piece, door: { ...river.piece.door!, look } });

  it('a sluice lifts its panel up into the housing over the gate, a boulder sinks into the ground, a slab is drawn into the wall', () => {
    const [sluice, boulder, slab] = [door('sluice'), door('boulder'), door('slab')];
    expect(sluice.lift!).toBeGreaterThan(0);
    expect(boulder.lift!).toBeLessThan(0);
    expect(slab.lift).toBeUndefined();
    for (const k of [sluice, boulder, slab]) expect(k.stone.getAttribute('position').count).toBeGreaterThan(0);
  });

  it('is the look the houses say: the Colour\'s a sluice, the Black Man\'s a boulder', () => {
    expect(ARENA_HOUSES.colour_out_of_space!.gate.look).toBe('sluice');
    expect(spec.gate.look).toBe('boulder');
    expect(basin.piece.door!.look).toBe('sluice');
    expect(river.piece.door!.look).toBe('boulder');
  });
});
