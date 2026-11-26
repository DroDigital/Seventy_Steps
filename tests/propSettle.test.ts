/**
 * Round 116, what stands on the land meets it. A house's wing and its porch's posts stood 25 cm over level ground (the wing had no footing,
 * the posts began at the wall's foot); and every prop is stood at the height of the ground under its middle, so on a slope its downhill
 * side stood over the air (render/propSettle.ts). Read by casting rays up from the ground through every house's parts, by settling props on
 * made slopes, and by the props the open world plans on its steepest ground.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { HOUSE_LOOKS } from '../src/data/houseLooks';
import { housePieces } from '../src/render/houseMesh';
import { SETTLE, SETTLE_TUNING, settleOnLand } from '../src/render/propSettle';
import { propPieces, solids } from '../src/render/propShapes';
import { chunkContent } from '../src/world/chunks';
import { houseAddons } from '../src/world/houseAddons';
import { propAt, type Prop } from '../src/world/props';
import { surface } from '../src/world/terrain';
import { chunkOf } from '../src/world/worldMap';
import { faces, type Face } from './depthAudit';
import { FaceGrid } from './rayAudit';

const STONE: [number, number, number] = [0.6, 0.6, 0.58];
const GROUND = 0.15; // a prop's mesh stands 0.15 below the ground it is placed on

/** The share of a thing's footprint (m²) where a ray cast up from the ground meets the underside of one of its parts before anything else: it stands over the air there. */
function hovering(geos: readonly THREE.BufferGeometry[], cell = 0.15): { area: number; at: string } {
  const all: Face[] = geos.flatMap((g, i) => faces(g, `part#${i}`));
  const grid = new FaceGrid(all);
  const b = grid.bounds;
  const up = new THREE.Vector3(0, 1, 0);
  let [n, at] = [0, ''];
  for (let x = b.min.x + cell / 2; x < b.max.x; x += cell) {
    for (let z = b.min.z + cell / 2; z < b.max.z; z += cell) {
      const hits = grid.cast(new THREE.Vector3(x, GROUND + 0.005, z), up, 0.6).sort((a, c) => a.t - c.t);
      if (!hits.length || !hits[0].front || hits[0].t <= 0.02) continue;
      if (hits.some((h) => !h.front && h.t <= hits[0].t + 0.01)) continue; // inside a solid whose top another part stands on
      n++;
      at ||= `${hits[0].face.tag} at ${x.toFixed(2)}, ${z.toFixed(2)}, ${hits[0].t.toFixed(2)} m up`;
    }
  }
  return { area: n * cell * cell, at };
}

/** Houses with each part a house may have: a wing, a bay, a porch, a turret (Ulthar's), in each style. */
function houses(): { name: string; p: Prop; region: string }[] {
  const out: { name: string; p: Prop; region: string }[] = [];
  const want = new Set(['wing', 'porch', 'bay', 'plain']);
  for (const style of ['clapboard', 'brick', 'stone', 'hovel'] as const) {
    const left = new Set(want);
    for (let s = 1; s < 300 && left.size; s++) {
      const p: Prop = { ...propAt('house', 0, 0, 0, createRng(s * 7 + 3), 0), style };
      const a = houseAddons(p);
      const has = a.wing ? 'wing' : a.porch ? 'porch' : a.bay ? 'bay' : 'plain';
      if (!left.delete(has)) continue;
      for (const region of ['arkham', 'dreamlands']) out.push({ name: `${style} ${has} (${region}, seed ${p.seed})`, p, region });
    }
  }
  return out;
}

/** A prop's pieces turned and placed as propMeshes.ts places them, in the world. */
function placedPieces(p: Prop): THREE.BufferGeometry[] {
  const pieces = p.kind === 'house' ? housePieces(p, STONE, 'arkham') : propPieces(p, STONE, 'arkham');
  return solids(pieces).map((q) => q.geo.clone().rotateY(p.yaw).translate(p.x, p.y - 0.15, p.z));
}

const lowestY = (geos: readonly THREE.BufferGeometry[]): number => Math.min(...geos.map((g) => (g.computeBoundingBox(), g.boundingBox!.min.y)));

describe('what a house is built of stands on the ground (round 116)', () => {
  it('a house has parts of every kind to look at', () => {
    const names = houses().map((h) => h.name).join('; ');
    for (const part of ['wing', 'porch', 'bay']) expect(names).toContain(part);
  });

  for (const { name, p, region } of houses()) {
    it(`${name}: no part stands over the air`, () => {
      const { area, at } = hovering(solids(housePieces(p, STONE, region)).map((q) => q.geo));
      expect(area, at).toBeLessThan(0.02);
    });
  }

  it("every realm's houses, turrets and widow's walks among them, stand on their footing", () => {
    for (const region of Object.keys(HOUSE_LOOKS)) {
      for (let s = 1; s <= 6; s++) {
        const p = propAt('house', 0, 0, 0, createRng(s * 101 + region.length), 0);
        const { area, at } = hovering(solids(housePieces(p, STONE, region)).map((q) => q.geo), 0.25);
        expect(area, `${region} seed ${s}: ${at}`).toBeLessThan(0.07);
      }
    }
  });
});

describe('a prop on a slope meets the land (render/propSettle.ts)', () => {
  const slope = (k: number) => (x: number, z: number): number => k * z + 0.3 * k * x; // a hillside falling toward −z
  const standing = (kind: Prop['kind'], seed: number, ground: (x: number, z: number) => number, yaw = 0.4): Prop => propAt(kind, 0, ground(0, 0), 0, createRng(seed), yaw);

  it('leaves a prop on level ground, one off the land, a set piece and the kinds too narrow to show it as they were', () => {
    const flat = (): number => 0;
    const house = standing('house', 3, flat);
    expect(settleOnLand(placedPieces(house), house, flat)).toBe(0);
    const raised: Prop = { ...standing('rock', 5, slope(0.3)), y: 1.2 };
    expect(settleOnLand(placedPieces(raised), raised, slope(0.3))).toBe(0);
    for (const kind of ['tree', 'pine', 'bush', 'lamp', 'globe', 'grave'] as const) {
      expect(SETTLE[kind], kind).toBeUndefined();
      const p = standing(kind, 7, slope(0.3));
      expect(settleOnLand(placedPieces(p), p, slope(0.3)), kind).toBe(0);
    }
  });

  for (const kind of ['house', 'ruin', 'rock', 'monolith', 'altar', 'pyramid', 'cone', 'block'] as const) {
    it(`${kind}: its foot goes down into the land all round, and nothing above the foot moves`, () => {
      const ground = slope(0.28);
      const p = standing(kind, 11, ground);
      const before = placedPieces(p);
      const after = before.map((g) => g.clone());
      expect(settleOnLand(after, p, ground)).toBeGreaterThan(0.1);
      for (let k = 0; k < after.length; k++) {
        const [a, b] = [after[k].getAttribute('position'), before[k].getAttribute('position')];
        for (let i = 0; i < a.count; i++) {
          if (b.getY(i) > p.y + SETTLE_TUNING.foot) expect(a.getY(i), `${kind} above the foot`).toBe(b.getY(i));
          else expect(a.getY(i), `${kind} foot at ${a.getX(i).toFixed(2)}, ${a.getZ(i).toFixed(2)}`).toBeLessThanOrEqual(ground(a.getX(i), a.getZ(i)) + SETTLE_TUNING.foot - SETTLE_TUNING.margin + 1e-9);
          expect(a.getX(i)).toBe(b.getX(i));
        }
      }
    });
  }

  for (const kind of ['wall', 'fence', 'log'] as const) {
    it(`${kind}: follows the land along its length, its foot in the ground`, () => {
      const ground = slope(0.22);
      const p = standing(kind, 13, ground, 1.2);
      const geos = placedPieces(p);
      const before = geos.map((g) => g.clone());
      settleOnLand(geos, p, ground);
      for (let k = 0; k < geos.length; k++) {
        const [a, b] = [geos[k].getAttribute('position'), before[k].getAttribute('position')];
        for (let i = 0; i < a.count; i++) {
          const rise = ground(a.getX(i), a.getZ(i)) - p.y;
          const sink = b.getY(i) <= p.y + SETTLE_TUNING.foot ? SETTLE_TUNING.sink : 0;
          expect(a.getY(i) - b.getY(i)).toBeCloseTo(rise - sink, 5); // (positions are 32-bit)
        }
      }
    });
  }
});

describe("the open world's props on its steepest ground (round 116)", () => {
  // The worst a prop of each kind stood over the air before (measured over every region's plan): its kind and where it stands.
  // (Round 127: the dungeons' new ground moved the land's fill; the house, the wall and the pyramid are measured again.)
  const WORST: readonly [Prop['kind'], number, number][] = [
    ['house', 206.9, 585.8], ['wall', 399.6, 723.4], ['ruin', 402.0, 2164.0], ['rock', -1856.1, 2200.0], ['cone', -1747.5, 2094.5], ['pyramid', 33.3, 2165.9],
  ];
  for (const [kind, x, z] of WORST) {
    it(`the ${kind} at ${x}, ${z}: no corner of its footprint stands over the air`, () => {
      const p = chunkContent(chunkOf(x), chunkOf(z)).props.find((q) => q.kind === kind && Math.abs(q.x - x) < 0.1 && Math.abs(q.z - z) < 0.1);
      expect(p, `${kind} at ${x}, ${z}`).toBeDefined();
      const geos = placedPieces(p!);
      const [s, c] = [Math.sin(p!.yaw), Math.cos(p!.yaw)];
      const corners = (p!.d > 0 ? [[-1, -1], [1, -1], [-1, 1], [1, 1]] : [[0, 1], [1, 0], [0, -1], [-1, 0]]).map(([u, v]) => [p!.x + u * p!.w * 0.9 * c + v * (p!.d || p!.w) * 0.9 * s, p!.z - u * p!.w * 0.9 * s + v * (p!.d || p!.w) * 0.9 * c]);
      const gap = Math.max(...corners.map(([cx, cz]) => p!.y - 0.15 - surface(cx, cz)));
      expect(gap, 'it stood over the air there before').toBeGreaterThan(0.3);
      settleOnLand(geos, p!, surface);
      expect(lowestY(geos), 'its foot reaches the lowest ground under it').toBeLessThanOrEqual(Math.min(...corners.map(([cx, cz]) => surface(cx, cz))) - SETTLE_TUNING.margin + 1e-6);
    });
  }
});
