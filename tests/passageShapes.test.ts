/**
 * The shapes of the secret passages (round 61): every hidden doorway and bridge in the world builds a frame, runes and a slab, or a
 * row of slabs, of the size it is meant to have, with no number in them that is not one.
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { bridgeKit, doorKit } from '../src/render/passageShapes';
import { worldLayout } from '../src/world/placements';

const all = worldLayout().pieces;
const doors = all.filter((p) => p.door);
const bridges = all.filter((p) => p.bridge);
const bounds = (g: THREE.BufferGeometry): THREE.Box3 => (g.computeBoundingBox(), g.boundingBox!);
const finite = (g: THREE.BufferGeometry): boolean => Array.from(g.getAttribute('position').array).every(Number.isFinite);

describe('the hidden passages of the world have what they need to be drawn (round 61)', () => {
  it('has both doorways and bridges, each carrying its measures', () => {
    expect(doors.length).toBeGreaterThan(5);
    expect(bridges.length).toBeGreaterThan(0);
    for (const d of doors) expect(d.door!.width).toBeGreaterThan(1);
    for (const b of bridges) expect(b.bridge!.half).toBeGreaterThan(1);
    for (const p of [...doors, ...bridges]) expect(p.seal, p.name).toBeDefined(); // every one has something to open
  });

  it('builds every doorway: a frame wider than its opening and taller than its lintel, runes on both faces, a slab that fills the opening', () => {
    for (const p of doors) {
      const kit = doorKit(p);
      const { width, height, thick } = p.door!;
      for (const g of [kit.stone, kit.glow, kit.slab, kit.slabGlow]) expect(finite(g), p.name).toBe(true);
      const frame = bounds(kit.stone);
      expect(frame.max.x - frame.min.x).toBeGreaterThan(width + 0.5);
      expect(frame.max.y).toBeGreaterThan(height);
      const slab = bounds(kit.slab);
      expect(slab.max.x - slab.min.x).toBeCloseTo(width, 5); // it fills the opening, no more
      expect(slab.max.z - slab.min.z).toBeCloseTo(thick, 5); // and is as thick as the wall
      expect(slab.min.y).toBeLessThan(0); // a little below the floor, as the seal is
      const runes = bounds(kit.glow);
      expect(runes.min.z).toBeLessThan(-thick / 2); // carved on both faces of the wall
      expect(runes.max.z).toBeGreaterThan(thick / 2);
      const outline = bounds(kit.slabGlow);
      expect(outline.max.x - outline.min.x).toBeLessThan(width); // the outline lies within the slab
      expect(outline.max.z).toBeGreaterThan(thick / 2); // standing out of its faces
    }
  });

  it('builds every bridge as slabs end to end from brink to brink, edged with light', () => {
    for (const p of bridges) {
      const segs = bridgeKit(p);
      const { half, width } = p.bridge!;
      expect(segs.length).toBeGreaterThanOrEqual(6);
      const first = bounds(segs[0].stone);
      const last = bounds(segs[segs.length - 1].stone);
      expect(first.min.x).toBeCloseTo(-half, 1);
      expect(last.max.x).toBeCloseTo(half, 1);
      for (const s of segs) {
        expect(finite(s.stone) && finite(s.glow), p.name).toBe(true);
        expect(bounds(s.stone).max.z - bounds(s.stone).min.z).toBeCloseTo(width, 5);
      }
      for (let i = 1; i < segs.length; i++) expect(segs[i].u).toBeGreaterThan(segs[i - 1].u); // in order
    }
  });
});
