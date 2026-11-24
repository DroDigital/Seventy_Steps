/**
 * Round 117, the dungeons' props and the arenas' built pieces reviewed: each thing on a hall's wall in every way it can be built stays
 * on its own stretch of the wall and within reach of it, a torch's plate lies on the wall (it hung 10 cm off it), a brazier's legs lean
 * in to its bowl, and R'lyeh's leaning slab keeps its foot in the ground at both ends (one corner of it stood in the air).
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { brazier } from '../src/render/dungeonFurniture';
import { sconce } from '../src/render/sconces';
import { slab } from '../src/render/setShapesStone';
import { setPieces } from '../src/render/setShapes';
import { solids } from '../src/render/propShapes';
import { SET_KITS } from '../src/data/setKits';
import type { Prop } from '../src/world/props';

const C: [number, number, number] = [0.6, 0.6, 0.58];
const points = (g: THREE.BufferGeometry): THREE.Vector3[] => {
  const pos = g.getAttribute('position');
  return Array.from({ length: pos.count }, (_, i) => new THREE.Vector3().fromBufferAttribute(pos, i));
};

describe('the dungeons\' props and the arenas\' built pieces (round 117)', () => {
  it('hangs a torch\'s plate on the wall\'s face, its flame where it was', () => {
    for (const across of [1, -1]) for (const alongX of [true, false]) {
      const s = sconce({ x: 0, z: 0, across, alongX, floor: 0 }, 1);
      const out = points(s.iron).map((p) => (alongX ? p.z : p.x) * across - 0.5); // metres out from the face
      expect(Math.min(...out)).toBeGreaterThan(-0.005);
      expect(Math.min(...out)).toBeLessThan(0.005);
      expect(((alongX ? s.light.z : s.light.x) * across - 0.5)).toBeCloseTo(0.33, 2);
    }
  });

  it('stands a brazier\'s legs on the floor, leaning in to meet under its bowl', () => {
    const b = brazier(0, 0, 0);
    const all = b.iron.flatMap(points);
    expect(Math.min(...all.map((p) => p.y))).toBeGreaterThan(-0.01);
    for (const p of all) if (p.y > 0.85 && p.y < 0.92) expect(Math.hypot(p.x, p.z)).toBeLessThan(0.25); // under the bowl, the legs are gathered in
    expect(b.at).toEqual({ x: 0, y: 1.7, z: 0 });
  });

  it('keeps a leaning slab\'s foot in the ground at both its ends', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const k = SET_KITS.slab;
      const p = { kind: 'set', x: 0, y: 0, z: 0, w: k.w, d: k.d, h: k.h, yaw: 0, seed, set: { id: 'slab', scale: 1, round: false } } as unknown as Prop;
      const stone = slab(p).find((q) => q.mat === 'stone')!.geo!;
      const foot = points(stone).filter((q) => q.y < 0.6); // its foot, and what lies about it
      for (const end of [-1, 1]) {
        const far = Math.max(...foot.map((q) => q.x * end));
        expect(Math.min(...foot.filter((q) => q.x * end > far - 0.3).map((q) => q.y)), `seed ${seed} end ${end}`).toBeLessThan(0);
      }
    }
  });

  it('builds every built set piece sound', () => {
    for (const [id, k] of Object.entries(SET_KITS)) for (let seed = 1; seed <= 8; seed++) {
      const p = { kind: 'set', x: 0, y: 0, z: 0, w: k.w, d: k.d, h: k.h, yaw: 0, seed, set: { id, scale: 1, round: !!k.round, glow: 'green', lit: 'fire' } } as unknown as Prop;
      const pieces = solids(setPieces(p, C));
      expect(pieces.length, id).toBeGreaterThan(0);
      for (const q of pieces) for (const v of points(q.geo)) expect(Number.isFinite(v.x + v.y + v.z), id).toBe(true);
    }
  });
});
