/**
 * The Colour's reservoir and the Black Man's river (round 68; world/enclosureBasin.ts, world/enclosureRiver.ts): a court
 * walled as a dam and a curving bank, and a court on an island in a river kept between two kerbs, with a ford. That each is shut but for its
 * gate is for the closure flood (tests/enclosure.test.ts) and the walks (tests/houseWalk.test.ts); this holds what is particular to them.
 */
import { describe, expect, it } from 'vitest';
import { ARENA_HOUSES } from '../src/data/arenaHousesAll';
import { HOUSE } from '../src/data/arenaHouses';
import { GATE_STYLES } from '../src/data/gateStyles';
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
    for (const p of basin.props) if (p.set?.id.startsWith('house_')) expect(p.h, p.set?.id).toBeGreaterThanOrEqual(5); // (the farmhouse and its yard, round 71, are the packs' models in the court)
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

describe('what shuts a gate (data/gateStyles.ts)', () => {
  it('is the style of the horror: the Colour\'s sluice boards and the Black Man\'s boulder sink into the ground', () => {
    expect(GATE_STYLES.colour_out_of_space!.motion).toBe('sink');
    expect(GATE_STYLES.black_man!.motion).toBe('sink');
    expect(basin.piece.door!.style).toBe('colour_out_of_space');
    expect(river.piece.door!.style).toBe('black_man');
  });

  it('opens away from the court it is come to from: out is the side of the wall the front is on', () => {
    for (const [a, p] of [[dam, basin.piece], [isle, river.piece]] as const) {
      const d = p.door!;
      expect(d.out, a.bosses[0]).toBe((d.alongX ? a.house!.front.z : a.house!.front.x) >= 0 ? 1 : -1);
    }
  });
});
