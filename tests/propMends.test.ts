/**
 * Round 117, the props reviewed: what was found wrong and mended stays mended (a fire pit's stones heaped on one spot, a stump's root
 * turned into the stump, a crown's top clump hanging over its trunk, a column's drums with sky between them, a grave's plot tipped with
 * its stone), and the ruins, walls and fences come in the forms of their realm.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng';
import { PROP_LOOKS } from '../src/data/propLooks';
import { propPieces, solids } from '../src/render/propShapes';
import { propAt } from '../src/world/props';
import { propOfForm } from './propForms';

const C: [number, number, number] = [0.6, 0.6, 0.58];
const pieces = (kind: Parameters<typeof propOfForm>[0], key: Parameters<typeof propOfForm>[1], form: string, nth = 0) => {
  const { p, region } = propOfForm(kind, key, form, nth)!;
  return { p, parts: solids(propPieces(p, C, region)) };
};
const points = (g: THREE.BufferGeometry): THREE.Vector3[] => {
  const pos = g.getAttribute('position');
  return Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
};

describe('the props reviewed (round 117)', () => {
  it('a fire pit\'s stones lie in a ring about it', () => {
    for (let s = 1; s <= 4; s++) {
      const p = propAt('firepit', 0, 0, 0, createRng(s * 977), 0);
      const stone = solids(propPieces(p, C)).find((q) => q.mat === 'stone')!;
      const quarters = new Set(points(stone.geo).filter((v) => Math.hypot(v.x, v.z) > p.w * 0.9).map((v) => Math.floor(((Math.atan2(v.x, v.z) + Math.PI) / (Math.PI * 2)) * 4) % 4));
      expect(quarters.size).toBe(4);
    }
  });

  it('a stump\'s roots leave its foot and go into the ground', () => {
    for (const form of ['cut', 'broken', 'hollow', 'fungal']) {
      const { p, parts } = pieces('stump', 'stumps', form);
      const wood = parts.filter((q) => q.mat === 'wood').flatMap((q) => points(q.geo));
      expect(wood.some((v) => Math.hypot(v.x, v.z) > p.w * 1.6 && v.y < 0), form).toBe(true);
    }
  });

  it('a crown\'s top clump is held up by its leader', () => {
    for (const form of ['oak', 'maple', 'birch']) {
      for (let n = 0; n < 6; n++) {
        const { p, parts } = pieces('tree', 'trees', form, n);
        const wood = points(parts.find((q) => q.mat === 'wood')!.geo);
        const leaves = parts.find((q) => q.mat === 'leaf');
        if (!leaves) continue;
        const crownTop = Math.max(...points(leaves.geo).filter((v) => Math.hypot(v.x, v.z) < 0.5).map((v) => v.y), 0);
        if (crownTop < p.h * 0.85) continue; // no top clump drawn on this one
        expect(Math.max(...wood.filter((v) => Math.hypot(v.x, v.z) < 0.4).map((v) => v.y)), `${form} ${n}`).toBeGreaterThan(crownTop - 2.4);
      }
    }
  });

  it('a column of drums has no sky between its drums', () => {
    const ray = new THREE.Raycaster();
    for (let n = 0; n < 4; n++) {
      const { p, parts } = pieces('pillar', 'pillars', 'drums', n);
      const mesh = new THREE.Mesh(parts[0].geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
      const top = Math.max(...points(parts[0].geo).map((v) => v.y));
      for (let y = 0.4; y < top - 0.1; y += 0.02) {
        ray.set(new THREE.Vector3(-5, y, 0.01), new THREE.Vector3(1, 0, 0));
        expect(ray.intersectObject(mesh).length, `drums ${n} at ${y.toFixed(2)} of ${p.h.toFixed(2)}`).toBeGreaterThan(0);
      }
    }
  });

  it('a grave\'s plot lies level before its leaning stone', () => {
    for (const form of ['round', 'shoulder', 'peak', 'tablet']) {
      const { p, parts } = pieces('grave', 'graves', form);
      const before = points(parts[0].geo).filter((v) => v.z > p.d * 2.5);
      expect(before.length, form).toBeGreaterThan(0);
      for (const v of before) expect(v.y, form).toBeGreaterThan(-0.01), expect(v.y, form).toBeLessThan(0.11);
    }
  });

  it('ruins, field walls and fences come in their realm\'s forms', () => {
    const ruins = new Set(Object.values(PROP_LOOKS).map((l) => JSON.stringify(l.ruins)));
    expect(ruins.size).toBeGreaterThan(8);
    expect(Object.keys(PROP_LOOKS.vermont.ruins)).toContain('chimney');
    expect(Object.keys(PROP_LOOKS.dreamlands.ruins)).toContain('arch');
    expect(Object.keys(PROP_LOOKS.providence.fences)).toContain('picket');
    const shapes = new Set(['wall', 'gable', 'chimney', 'arch', 'colonnade', 'slabs'].map((f) => pieces('ruin', 'ruins', f).parts.reduce((s, q) => s + q.geo.getAttribute('position').count, 0)));
    expect(shapes.size).toBe(6);
  });
});
