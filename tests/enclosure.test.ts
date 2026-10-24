/**
 * The seam that lets a horror's place be any outline (round 66; world/enclosure.ts, sitePads.ts, occupancy.ts, closure.ts): a pad is asked its
 * distance through one function whatever its kind; the fill keeps off a shape; and every enclosure, of whatever kind, keeps the invariants the
 * rest of the world relies on: its gate on its wall, its stake and candle within it, its set clear of it, and no way in but the gate, found by
 * a flood over every place rather than a walk from some sides.
 */
import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/data/arenaHouses';
import { allFogs } from '../src/systems/fogGates';
import { closure, CLOSURE } from '../src/world/closure';
import { chunkContent } from '../src/world/chunks';
import { reach } from '../src/world/arenaDecor';
import { pieceColliders } from '../src/world/arena';
import type { Collider } from '../src/world/colliders';
import { STAKE, within } from '../src/world/enclosure';
import { occupancy } from '../src/world/occupancy';
import { worldLayout } from '../src/world/placements';
import { propCollider } from '../src/world/props';
import { circleFootprint, padBounds, padDistance, polygonFootprint, type Pad } from '../src/world/sitePads';
import { ground } from '../src/world/terrain';
import { chunkOf } from '../src/world/worldMap';

const w = worldLayout();
const arenas = w.arenas.filter((a) => a.house);
const SQUARE = [{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 10 }, { x: 0, z: 10 }];

describe('a pad of any outline', () => {
  it('is asked its distance in one place, whatever its kind', () => {
    const circle: Pad = { kind: 'circle', x: 5, z: 5, radius: 3, blend: 4, level: 1 };
    const rect: Pad = { kind: 'rect', rect: { x0: 0, z0: 0, x1: 10, z1: 10 }, blend: 4, level: 1 };
    expect(padDistance(circle, 5, 9)).toBeCloseTo(1, 9);
    expect(padDistance(circle, 5, 6)).toBeCloseTo(-2, 9);
    expect(padDistance(rect, 13, 5)).toBeCloseTo(3, 9);
    expect(padDistance(rect, 4, 4)).toBe(0);
    const shape: Pad = { kind: 'shape', shape: polygonFootprint(SQUARE), blend: 4, level: 1 };
    expect(padDistance(shape, 13, 5)).toBeCloseTo(3, 9);
    expect(padDistance(shape, 5, 5)).toBeCloseTo(-5, 9);
    expect(padDistance(shape, 13, 14)).toBeCloseTo(5, 9);
  });

  it('a shape is signed, offset by what it grows, and even-odd about a notch', () => {
    const grown = polygonFootprint(SQUARE, 2);
    expect(grown.dist(5, 5)).toBeCloseTo(-7, 9);
    expect(grown.dist(12, 5)).toBeCloseTo(0, 9);
    const L = [{ x: 0, z: 0 }, { x: 10, z: 0 }, { x: 10, z: 4 }, { x: 4, z: 4 }, { x: 4, z: 10 }, { x: 0, z: 10 }]; // an L: the notch is outside
    const f = polygonFootprint(L);
    expect(f.dist(2, 8)).toBeLessThan(0);
    expect(f.dist(8, 2)).toBeLessThan(0);
    expect(f.dist(8, 8)).toBeCloseTo(4, 9);
    expect(polygonFootprint([...L].reverse()).dist(8, 8)).toBeCloseTo(4, 9); // either winding
  });

  it("reaches the chunks its blend does, and a circle's box is as it was", () => {
    const circle: Pad = { kind: 'circle', x: 100, z: 50, radius: 25, blend: 14, level: 0 };
    expect(padBounds(circle)).toEqual({ x0: 100 - 39, z0: 50 - 39, x1: 100 + 39, z1: 50 + 39 });
    expect(padBounds({ kind: 'shape', shape: circleFootprint(0, 0, 10), blend: 4, level: 0 })).toEqual({ x0: -14, z0: -14, x1: 14, z1: 14 });
  });

  it('keeps the fill off a shape and a margin about it, and off nothing else', () => {
    const occ = occupancy({ x0: 0, z0: 0, x1: 200, z1: 200 });
    occ.cover(polygonFootprint([{ x: 50, z: 50 }, { x: 90, z: 50 }, { x: 90, z: 90 }, { x: 50, z: 90 }]), 4);
    expect(occ.free(70, 70)).toBe(false);
    expect(occ.free(48, 70)).toBe(false); // within the margin
    expect(occ.free(40, 70)).toBe(true);
    expect(occ.free(70, 100)).toBe(true);
  });
});

describe('every enclosure keeps what the world relies on', () => {
  it('there is one about every open arena', () => {
    expect(arenas.length).toBe(w.arenas.length);
  });

  it('its gate stands on its wall, in front of the arena, and its box holds every piece of it', () => {
    for (const a of arenas) {
      const e = a.house!;
      expect(Math.abs(e.gap(e.gate)), `${a.bosses[0]}: the gate on the wall`).toBeLessThan(0.01);
      expect((e.gate.x - a.x) * e.front.x + (e.gate.z - a.z) * e.front.z, `${a.bosses[0]}: the gate lies ahead`).toBeGreaterThan(a.radius);
      for (const p of e.props) expect(p.x >= e.rect.x0 && p.x <= e.rect.x1 && p.z >= e.rect.z0 && p.z <= e.rect.z1, `${a.bosses[0]}: ${p.set?.id} in the box`).toBe(true);
      expect(e.piece.name).toBe(`${a.bosses[0]}:house`);
    }
  });

  it('the fallen wake in front of the fog and inside the wall, and the candle beside them', () => {
    for (const a of arenas) {
      const e = a.house!;
      const fog = allFogs().find((f) => f.bosses.includes(a.bosses[0]!))!;
      expect(fog.stake, `${a.bosses[0]}: the fog's stake is the enclosure's`).toEqual(e.stake);
      expect(e.gap(e.stake), `${a.bosses[0]}: the stake clear of the wall`).toBeLessThanOrEqual(-STAKE.wall + 0.01);
      expect(e.gap(fog.candle), `${a.bosses[0]}: the candle within`).toBeLessThan(-HOUSE.margin);
      expect(Math.hypot(e.stake.x - a.x, e.stake.z - a.z), `${a.bosses[0]}: the stake stands outside the fog`).toBeGreaterThan(a.radius + STAKE.ring);
    }
  });

  it('the set is kept within it, clear of it by its margin', () => {
    for (const a of arenas) {
      const e = a.house!;
      for (const d of a.decor) if (!e.props.includes(d) && reach(d) > 0) expect(within(e, d, reach(d) - 0.01), `${a.bosses[0]}: ${d.set?.id}`).toBe(true);
    }
  });

  it('the ground is levelled to its wall and a margin beyond, and its pad is bucketed where it reaches', () => {
    for (const a of arenas) {
      const e = a.house!;
      const pad = e.pad(a.y, 14);
      for (const p of e.props) expect(padDistance(pad, p.x, p.z), `${a.bosses[0]}: ${p.set?.id} on level ground`).toBeLessThanOrEqual(p.set?.id.startsWith('house_') ? -HOUSE.level + 0.01 : 0.01); // (a wall's a margin within the level ground; a place's models stand anywhere on it)
      const b = padBounds(pad);
      expect(w.chunk(chunkOf(b.x0), chunkOf(b.z0)).pads.some((p) => p.kind === pad.kind && p.level === a.y), `${a.bosses[0]}: its pad in its corner chunk`).toBe(true);
    }
  });
});

describe('the closure audit', () => {
  const box = (x0: number, z0: number, x1: number, z1: number): Collider => ({ kind: 'box', min: { x: x0, y: -1, z: z0 }, max: { x: x1, y: 6, z: z1 } });
  const flat = { rect: { x0: 0, z0: 0, x1: 40, z1: 40 }, ground: () => 0, inside: (p: { x: number; z: number }) => p.x > 8 && p.x < 32 && p.z > 8 && p.z < 32, into: { x: 20, z: 20 } };
  const wall = (gap?: [number, number]): Collider[] => [
    box(5, 5, 35, 7), box(5, 33, 35, 35), box(5, 5, 7, 35),
    ...(gap ? [box(33, 5, 35, gap[0]), box(33, gap[1], 35, 35)] : [box(33, 5, 35, 35)]),
  ];

  it('finds no way in through a closed wall, and no way through an open gate unless it is wide enough', () => {
    expect(closure({ ...flat, colliders: wall() }).leak).toBeNull();
    expect(closure({ ...flat, colliders: wall([18, 22]) }).reached, 'a gap of four metres').toBe(true);
    expect(closure({ ...flat, colliders: wall([19.7, 20.3]) }).reached, 'a gap of 0.6: not even a body a little smaller than the investigator\'s').toBe(false);
    expect(closure({ ...flat, colliders: wall([19.2, 20.8]) }).reached, 'a gap of 1.6 m').toBe(true);
  });

  it('finds a leak, and says where', () => {
    const leak = closure({ ...flat, colliders: wall([18, 22]) }).leak;
    expect(leak).not.toBeNull();
    expect(Math.abs(leak!.z - 20)).toBeLessThan(4);
  });

  it('is not stopped by something a body walks over or under, and is by what reaches its height', () => {
    const low: Collider = { kind: 'box', min: { x: 33, y: -1, z: 18 }, max: { x: 35, y: 0.0, z: 22 } };
    expect(closure({ ...flat, colliders: [...wall([18, 22]), low] }).reached, 'a low sill under its feet').toBe(true);
    const lintel: Collider = { kind: 'box', min: { x: 33, y: 2.5, z: 18 }, max: { x: 35, y: 6, z: 22 } };
    expect(closure({ ...flat, colliders: [...wall([18, 22]), lintel] }).reached, 'a lintel above its head').toBe(true);
    const bar: Collider = { kind: 'box', min: { x: 33, y: 0.5, z: 18 }, max: { x: 35, y: 1.2, z: 22 } };
    expect(closure({ ...flat, colliders: [...wall([18, 22]), bar] }).reached, 'a bar across its body').toBe(false);
  });

  it('finds the breach when a stretch of a real wall is missing', () => {
    const a = arenas[0]!;
    const e = a.house!;
    const behind = e.props.find((p) => p.set?.id.startsWith('house_') && Math.abs(e.gap(p)) < 0.01 && (p.x - a.x) * e.front.x + (p.z - a.z) * e.front.z < 0)!; // a piece of the wall behind the arena
    const [kept, gone] = [e.props.filter((p) => Math.hypot(p.x - behind.x, p.z - behind.z) >= 6), e.props.filter((p) => Math.hypot(p.x - behind.x, p.z - behind.z) < 6)];
    const sealed = [...kept.map(propCollider).filter((c): c is Collider => !!c), ...pieceColliders({ ...e.piece, boxes: e.piece.seal!.boxes })];
    const input = { rect: e.rect, ground, inside: (p: { x: number; z: number }) => e.gap(p) <= -HOUSE.margin };
    expect(gone.length, 'a few pieces').toBeGreaterThan(1);
    expect(closure({ ...input, colliders: sealed }).leak, 'a wall with a stretch gone').not.toBeNull();
    expect(closure({ ...input, colliders: [...sealed, ...gone.map(propCollider).filter((c): c is Collider => !!c)] }).leak, 'and whole').toBeNull();
  });

  it('shuts every house, and lets the open gate in to the stake', () => {
    for (const a of arenas) {
      const e = a.house!;
      const near: Collider[] = [];
      for (let cx = chunkOf(e.rect.x0 - CLOSURE.margin - 2); cx <= chunkOf(e.rect.x1 + CLOSURE.margin + 2); cx++) {
        for (let cz = chunkOf(e.rect.z0 - CLOSURE.margin - 2); cz <= chunkOf(e.rect.z1 + CLOSURE.margin + 2); cz++) near.push(...chunkContent(cx, cz).colliders);
      }
      const colliders = [...new Set(near)];
      const input = { rect: e.rect, colliders, ground, inside: (p: { x: number; z: number }) => e.gap(p) <= -HOUSE.margin, into: e.stake };
      const shut = closure({ ...input, colliders: [...colliders, ...pieceColliders({ ...e.piece, boxes: e.piece.seal!.boxes })] });
      expect(shut.leak, `${a.bosses[0]}: sealed, a way in at ${shut.leak?.x.toFixed(1)}, ${shut.leak?.z.toFixed(1)}`).toBeNull();
      expect(closure(input).reached, `${a.bosses[0]}: open, the gate leads to the stake before the fog`).toBe(true);
    }
  }, 120_000);
});
