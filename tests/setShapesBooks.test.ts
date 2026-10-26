import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SET_KITS } from '../src/data/setKits';
import { setPieces } from '../src/render/setShapes';
import type { Prop } from '../src/world/props';
import { solids } from '../src/render/propShapes';

const triangles = (g: THREE.BufferGeometry): number => (g.index ? g.index.count : g.getAttribute('position').count) / 3;

const KITS = ['bookcase', 'bookcase_low', 'bookshelf', 'bookpile'] as const;
const prop = (id: string, seed = 5, tint?: [number, number, number]): Prop => {
  const k = SET_KITS[id]!;
  return { kind: 'set', x: 0, y: 0, z: 0, w: k.w, d: k.d, h: k.h, yaw: 0, seed, set: { id, scale: 1, tint } };
};
const box = (id: string, seed = 5): THREE.Box3 => {
  const b = new THREE.Box3();
  for (const piece of solids(setPieces(prop(id, seed), [0.8, 0.8, 0.8]))) b.union(new THREE.Box3().setFromBufferAttribute(piece.geo.getAttribute('position') as THREE.BufferAttribute));
  return b;
};

describe("a reading room's built furniture (round 79: the shelf pack's licence forbids its assets, so the cases are made in code)", () => {
  it.each(KITS)('draws %s in wood and cloth, with a body', (id) => {
    const pieces = solids(setPieces(prop(id), [0.8, 0.8, 0.8]));
    expect(pieces.length).toBeGreaterThan(0);
    for (const p of pieces) expect(['wood', 'cloth']).toContain(p.mat);
    expect(pieces.reduce((n, p) => n + triangles(p.geo), 0)).toBeGreaterThan(50);
  });

  it.each(KITS)('keeps %s within its kit box, so its collider is the whole of it', (id) => {
    const [k, b] = [SET_KITS[id]!, box(id)];
    expect(b.max.x).toBeLessThanOrEqual(k.w + 0.01);
    expect(b.min.x).toBeGreaterThanOrEqual(-k.w - 0.01);
    expect(b.max.z).toBeLessThanOrEqual(k.d + 0.01);
    expect(b.min.z).toBeGreaterThanOrEqual(-k.d - 0.01);
    expect(b.max.y).toBeLessThanOrEqual(k.h + 0.01);
  });

  it('stands a case on the floor and fills it with books', () => {
    expect(box('bookcase').min.y).toBeCloseTo(0, 2);
    const books = solids(setPieces(prop('bookcase'), [0.8, 0.8, 0.8])).find((p) => p.mat === 'cloth')!;
    expect(triangles(books.geo) / 12).toBeGreaterThan(30); // spines (a box each), five shelves of them
  });

  it('is the same for the same seed, and not for another', () => {
    const count = (seed: number): number => solids(setPieces(prop('bookcase', seed), [0.8, 0.8, 0.8])).reduce((n, p) => n + p.geo.getAttribute('position').count, 0);
    expect(count(5)).toBe(count(5));
    expect(new Set([1, 2, 3, 4, 5, 6].map(count)).size).toBeGreaterThan(1);
  });

  it("leans the wood toward a set's tint (the restricted room is darker than the foyer)", () => {
    const wood = (tint?: [number, number, number]): number => {
      const c = solids(setPieces(prop('bookcase', 5, tint), [0.8, 0.8, 0.8])).find((p) => p.mat === 'wood')!.geo.getAttribute('color');
      return c.getX(0) + c.getY(0) + c.getZ(0);
    };
    expect(wood([0.1, 0.1, 0.1])).toBeLessThan(wood());
  });
});
