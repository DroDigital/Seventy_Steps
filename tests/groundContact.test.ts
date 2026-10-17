import { describe, expect, it } from 'vitest';
import { GROUND_CONTACT } from '../src/data/fxTuning';
import { createRng } from '../src/core/rng';
import { chunkContent } from '../src/world/chunks';
import { contactsNearChunk, contactsOf, edgeDistance, markAt } from '../src/world/groundContact';
import { makeProp } from '../src/world/props';
import { terrainJob } from '../src/render/terrainMesh';
import type * as THREE from 'three';

const prop = (kind: Parameters<typeof makeProp>[0], x: number, z: number, size?: readonly [number, number, number], yaw = 0) => makeProp(kind, x, z, createRng(5), yaw, size);

describe('where things meet the ground (round 54)', () => {
  it('marks what stands solid on the land, and leaves out what is walked through or too slim to mark', () => {
    const cs = contactsOf([prop('tree', 0, 0, [0.3, 0, 7]), prop('rock', 5, 0, [1.5, 0, 1.2]), prop('house', 20, 0, [4, 3, 6], 0.4), prop('bush', 9, 9), prop('lamp', 12, 0), prop('fence', 14, 0, [3, 0.05, 1]), prop('firepit', 16, 0)]);
    expect(cs.map((c) => c.round)).toEqual([true, true, false]); // a tree, a stone, a house; not a bush, a lamp post, a fence, a fire pit
    expect(cs[2]!.reach).toBeGreaterThan(cs[0]!.reach); // a house touches the ground farther out than a trunk
    for (const c of cs) expect(c.reach).toBeLessThanOrEqual(GROUND_CONTACT.reachMax);
  });

  it('the distance to a footprint is to its edge, round or turned', () => {
    const [tree, house] = contactsOf([prop('tree', 0, 0, [0.3, 0, 7]), prop('house', 20, 0, [4, 3, 6], Math.PI / 2)]);
    expect(edgeDistance(tree!, 1, 0)).toBeCloseTo(1 - tree!.hx);
    expect(edgeDistance(tree!, 0, 0)).toBeLessThan(0);
    // Turned a quarter, the house's long half side (4) lies along z as its local x: 4 m out in z is the wall, 3 m out in x is the other.
    expect(edgeDistance(house!, 20, 4)).toBeCloseTo(0, 5);
    expect(edgeDistance(house!, 23, 0)).toBeCloseTo(0, 5);
    expect(edgeDistance(house!, 25, 0)).toBeCloseTo(2, 5);
  });

  it('is strongest at the foot and falls smoothly to nothing at its reach: no ring, no halo', () => {
    const cs = contactsOf([prop('rock', 0, 0, [1.5, 0, 1.2])]);
    const edge = cs[0]!.hx;
    let last = Infinity;
    for (let d = 0; d <= cs[0]!.reach; d += 0.1) {
      const m = markAt(cs, edge + d, 0);
      expect(m.dark).toBeLessThanOrEqual(last + 1e-9);
      last = m.dark;
      expect(m.dark).toBeGreaterThanOrEqual(0);
      expect(m.dark).toBeLessThanOrEqual(1);
    }
    expect(markAt(cs, edge + 0.01, 0).dark).toBeGreaterThan(0.9);
    expect(markAt(cs, edge + cs[0]!.reach + 0.01, 0)).toEqual({ dark: 0, soil: 0 });
    expect(markAt(cs, edge + cs[0]!.reach * 0.3, 0).soil).toBeGreaterThan(markAt(cs, edge + cs[0]!.reach * 0.9, 0).soil); // earth nearer, grass farther
  });

  it('two things close together take the strongest mark, not their sum: no black pool', () => {
    const [a, b] = [prop('rock', 0, 0, [1, 0, 0.8]), prop('rock', 1.6, 0, [1, 0, 0.8])];
    const both = markAt(contactsOf([a, b]), 0.8, 0);
    const one = markAt(contactsOf([a]), 0.8, 0);
    expect(both.dark).toBeLessThanOrEqual(1);
    expect(both.dark).toBeGreaterThanOrEqual(one.dark);
  });

  it('the earth has an irregular edge: the same distance, different bearings, different soil', () => {
    const cs = contactsOf([prop('rock', 0, 0, [1.5, 0, 1.2])]);
    const d = cs[0]!.hx + cs[0]!.reach * 0.45;
    const soils = Array.from({ length: 24 }, (_, k) => markAt(cs, Math.cos(k * 0.26) * d, Math.sin(k * 0.26) * d).soil);
    expect(Math.max(...soils) - Math.min(...soils)).toBeGreaterThan(0.1);
  });

  it('every kind of prop that stands solid casts the moon\'s shadow onto the terrain', async () => {
    const src = await import('node:fs').then((fs) => fs.readFileSync('src/render/propMeshes.ts', 'utf8'));
    const casts = /const CASTS[^\[]*\[([^\]]*)\]/.exec(src)?.[1] ?? '';
    for (const mat of ['stone', 'wood', 'leaf', 'clapboard', 'brick', 'shingle']) expect(casts, mat).toContain(`'${mat}'`); // trees (wood, leaf), rocks (stone), houses (clapboard, brick, shingle)
  });

  it('the terrain about a house is darker than the open ground, in its vertices', () => {
    // A chunk of the hub with a house in it: the vertex colours within three metres of its walls against those six to nine metres out.
    let found: { cx: number; cz: number; x: number; z: number; hx: number; hz: number; yaw: number } | null = null;
    for (let cz = 4; cz < 10 && !found; cz++) {
      for (let cx = 0; cx < 12 && !found; cx++) {
        const house = chunkContent(cx, cz).props.find((p) => p.kind === 'house');
        if (house) found = { cx, cz, x: house.x, z: house.z, hx: house.w, hz: house.d, yaw: house.yaw };
      }
    }
    expect(found).not.toBeNull();
    const f = found!;
    let mesh: THREE.Mesh | null = null;
    const job = terrainJob(f.cx, f.cz, (m) => (mesh = m));
    while (!job.next().done);
    expect(mesh).not.toBeNull();
    const pos = (mesh as unknown as THREE.Mesh).geometry.getAttribute('position');
    const col = (mesh as unknown as THREE.Mesh).geometry.getAttribute('color');
    const near: number[] = [];
    const far: number[] = [];
    const cs = contactsNearChunk(f.cx, f.cz).filter((c) => !c.round && c.x === f.x && c.z === f.z);
    expect(cs).toHaveLength(1);
    for (let i = 0; i < pos.count; i++) {
      const d = edgeDistance(cs[0]!, pos.getX(i), pos.getZ(i));
      const light = col.getX(i) + col.getY(i) + col.getZ(i);
      if (d > 0.2 && d < 1.2) near.push(light);
      else if (d > 6 && d < 9) far.push(light);
    }
    const mean = (a: number[]): number => a.reduce((s, v) => s + v, 0) / a.length;
    expect(near.length).toBeGreaterThan(3);
    expect(mean(near)).toBeLessThan(mean(far) * 0.85);
  });
});
