import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/data/arenaHouses';
import { ARENA_HOUSES } from '../src/data/arenaHousesAll';
import { REGIONS } from '../src/data/regions';
import { SITES } from '../src/data/sites';
import { reach } from '../src/world/arenaDecor';
import { frontOf } from '../src/world/arenaFront';
import type { Collider } from '../src/world/colliders';
import { toBoxFrame } from '../src/world/colliders';
import { allFogs } from '../src/systems/fogGates';
import { worldLayout } from '../src/world/placements';
import { propCollider, propColliders } from '../src/world/props';
import { setPieces } from '../src/render/setShapes';
import { createRng } from '../src/core/rng';
import { propAt } from '../src/world/props';
import { padDistance } from '../src/world/sitePads';
import { ringOf } from './worldHelpers';
import { solids } from '../src/render/propShapes';

const inside = (c: Collider, x: number, z: number): boolean => {
  if (c.kind === 'cylinder') return Math.hypot(x - c.x, z - c.z) <= c.radius;
  if (c.kind === 'box') return x >= c.min.x && x <= c.max.x && z >= c.min.z && z <= c.max.z;
  const p = toBoxFrame(c, x, z);
  return Math.abs(p.x) <= c.hx && Math.abs(p.z) <= c.hz;
};
const arenas = worldLayout().arenas;

describe("a horror's house (round 63: the walls that house an open arena)", () => {
  it('stands about every open arena, and about nothing else', () => {
    for (const a of arenas) expect(a.house, a.bosses[0]).toBeTruthy();
    const names = new Set(arenas.map((a) => a.bosses[0]));
    for (const id of Object.keys(ARENA_HOUSES)) expect(names.has(id), `${id} has no arena`).toBe(true);
  });

  it('faces along an axis, the way a person comes, so its gate is an opening in a straight wall', () => {
    for (const a of arenas) expect(Math.abs(a.front.x) + Math.abs(a.front.z)).toBe(1);
    expect(frontOf([{ region: 'r', x: 100, z: 40 }], 'r', 0, 0)).toEqual({ x: 1, z: 0 });
    expect(frontOf([{ region: 'r', x: -10, z: -60 }], 'r', 0, 0)).toEqual({ x: 0, z: -1 });
  });

  it('is closed all the way round but for its gate: no body finds another way in, from any angle', () => {
    for (const a of arenas) {
      if (a.house!.kind !== 'ring') continue; // (a wall of any other outline is proved by a flood over every place: tests/enclosure.test.ts)
      const plan = ringOf(a);
      const cols = plan.props.map(propCollider).filter((c): c is Collider => !!c);
      const gateAt = Math.atan2(a.front.z, a.front.x);
      for (let t = 0; t < Math.PI * 2; t += 0.2 / plan.radius) {
        const lateral = plan.radius * Math.sin(t - gateAt);
        const toward = Math.cos(t - gateAt) > 0;
        if (toward && Math.abs(lateral) <= a.house!.piece.door!.width / 2 - HOUSE.lap + 0.2) continue; // the gate's own opening (and the edge of it, where the ring curves from a round tower by less than a body's breadth: no crack under 0.4 m lets one through)
        const [x, z] = [a.x + Math.cos(t) * plan.radius, a.z + Math.sin(t) * plan.radius];
        expect(cols.some((c) => inside(c, x, z)), `${a.bosses[0]}: a gap at ${((t * 180) / Math.PI).toFixed(1)}°`).toBe(true);
      }
    }
  });

  it('has a seal that fills its gate, which opens with no puzzle, and no wall piece stands in it', () => {
    for (const a of arenas) {
      const plan = a.house!;
      const d = plan.piece.door!;
      const seal = plan.piece.seal!.boxes[0]!;
      expect(plan.piece.minFound, 'no discovery stands between a body and the gate').toBeUndefined();
      const [along, across] = d.alongX ? [seal[2], seal[3]] : [seal[3], seal[2]];
      expect(along * 2).toBeCloseTo(d.width + HOUSE.lap * 2, 5);
      expect(across * 2).toBeCloseTo(d.thick, 5);
      expect(seal[5] - seal[4]).toBeGreaterThanOrEqual(d.height);
      const cols = plan.props.flatMap(propColliders).filter((c): c is Collider => (c.kind === 'box' ? c.min.y : c.y0) < d.height); // (round 72: a model's own solids, the two towers of a pylon and not the box about them and the gate between) // (a gatehouse's span stands over the opening, clear above any body)
      for (let s = -d.width / 2 + HOUSE.lap + 0.1; s <= d.width / 2 - HOUSE.lap - 0.1; s += 0.4) {
        const [x, z] = [plan.gate.x + (d.alongX ? s : 0), plan.gate.z + (d.alongX ? 0 : s)];
        expect(cols.some((c) => inside(c, x, z)), `${a.bosses[0]}: a piece in the gate`).toBe(false);
      }
    }
  });

  it('has walls no body can climb or step over, and a stake, a candle and a court inside them', () => {
    for (const a of arenas) {
      const plan = a.house!;
      for (const p of plan.props) if (p.set?.id.startsWith('house_')) expect(p.h, `${a.bosses[0]}: ${p.set?.id}`).toBeGreaterThanOrEqual(p.set?.id === 'house_kerb' ? 1.2 : 5); // (a kerb of a river's bank is five times what a mount steps up: nothing climbs it, and nothing is put in the river to be reached over it; the models of a place stand in the court and are asked by tests/bossPlaces.test.ts)
      const dry = plan.dry ?? plan.gap; // (where a river runs, only the island and the ford are ground to stand a thing on)
      const fog = allFogs().find((f) => f.bosses.includes(a.bosses[0]!))!;
      expect(plan.gap(fog.stake), `${a.bosses[0]}: the stake`).toBeLessThan(-HOUSE.margin);
      expect(dry(fog.stake), `${a.bosses[0]}: the stake, on dry ground`).toBeLessThan(-HOUSE.margin);
      expect(plan.gap(fog.candle), `${a.bosses[0]}: the candle`).toBeLessThan(-HOUSE.margin);
      expect(dry(fog.candle), `${a.bosses[0]}: the candle, on dry ground`).toBeLessThan(-HOUSE.margin);
      for (const d of a.decor) {
        if (plan.props.includes(d) || !propCollider(d)) continue;
        expect(dry(d) + reach(d), `${a.bosses[0]}: ${d.set?.id} in the wall`).toBeLessThanOrEqual(-HOUSE.margin + 0.01);
      }
    }
  });

  it('is built of kits that are drawn: every wall and tower named has its shape', () => {
    const rng = createRng(3);
    const ids = new Set<string>();
    for (const h of Object.values(ARENA_HOUSES)) {
      ids.add(`house_${h.wall}`);
      ids.add(`house_tower_${h.tower.kind}`);
    }
    for (const id of ids) {
      const p = { ...propAt('set', 0, 0, 0, rng, 0, [2.3, 1.2, 8]), set: { id, glow: 'purple' as const, lit: 'fire' as const } };
      expect(setPieces(p, [0.5, 0.5, 0.5]).length, id).toBeGreaterThan(0);
    }
  });

  it('takes its ground level a way past its wall', () => {
    for (const a of arenas) {
      const pad = worldLayout().pads.find((p) => p.level === a.y && padDistance(p, a.x, a.z) < -(a.radius + 10));
      expect(pad, a.bosses[0]).toBeTruthy();
      for (const p of a.house!.props) expect(padDistance(pad!, p.x, p.z), `${a.bosses[0]}: ${p.set?.id}`).toBeLessThanOrEqual(p.set?.id.startsWith('house_') ? -HOUSE.level + 0.01 : 0.01); // (a wall's a way within the level ground; a place's models stand anywhere on it)
    }
  });

  it('has a gate in every arena of every region that holds one', () => {
    const regions = new Set(arenas.map((a) => a.region));
    for (const id of regions) expect(REGIONS.some((r) => r.id === id) && !!SITES[id]).toBe(true);
  });

  it('costs the picture little: a house is under 60,000 triangles whole (it is all drawn whenever its chunks are)', () => {
    for (const a of arenas) {
      let tris = 0;
      for (const p of a.house!.props) for (const q of solids(setPieces(p, [0.5, 0.5, 0.5]))) tris += q.geo.index ? q.geo.index.count / 3 : q.geo.attributes.position.count / 3;
      expect(tris, a.bosses[0]).toBeLessThan(60_000);
    }
  });
});
