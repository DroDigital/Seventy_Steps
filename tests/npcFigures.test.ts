/**
 * Round 116, the people refined (render/bodyKit.ts `loft`, render/npcFigures.ts): their torso, limbs, skull and neck are turned eight or ten
 * sides about where they were cut from blocks, and their hair, beards and moustaches follow the skull. Every turned form faces outward (the
 * world's materials draw front faces only), every person builds sound geometry within a budget of faces and stands as tall and as broad as
 * a person, and no cut of hair covers the eyes.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { NPCS } from '../src/data/npcs';
import { coatForms, coatSkirt, faceForms, foreArm, loft, shin, thigh, upperArm, type Ring } from '../src/render/bodyKit';
import { npcFigure } from '../src/render/npcFigures';

const C: [number, number, number] = [0.5, 0.5, 0.5];

/** Every triangle of `g` faces away from the axis of the loft it belongs to: the vertical line through the middle of its ring at that height (or up and down, at a cap). */
function outward(g: THREE.BufferGeometry, rings: readonly Ring[]): number {
  const pos = g.getAttribute('position');
  const idx = g.getIndex();
  const n = idx ? idx.count : pos.count;
  const at = (i: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(pos, idx ? idx.getX(i) : i);
  const middle = (y: number): THREE.Vector2 => {
    let k = 0;
    while (k + 1 < rings.length - 1 && rings[k + 1].y < y) k++;
    const [a, b] = [rings[k], rings[k + 1]];
    const t = Math.min(1, Math.max(0, (y - a.y) / (b.y - a.y)));
    return new THREE.Vector2((a.x ?? 0) + ((b.x ?? 0) - (a.x ?? 0)) * t, (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * t);
  };
  let wrong = 0;
  for (let i = 0; i < n; i += 3) {
    const [a, b, c] = [at(i), at(i + 1), at(i + 2)];
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (normal.length() < 1e-12) continue;
    const centre = a.clone().add(b).add(c).divideScalar(3);
    const m = middle(centre.y);
    const away = Math.abs(normal.y) > 0.98 * normal.length() ? new THREE.Vector3(0, centre.y - (rings[0].y + rings[rings.length - 1].y) / 2, 0) : new THREE.Vector3(centre.x - m.x, 0, centre.z - m.y);
    if (normal.dot(away) <= 0) wrong++;
  }
  return wrong;
}

describe('a turned form (render/bodyKit.ts loft)', () => {
  const cases: [string, Ring[], number, number][] = [
    ['an ellipse', [{ y: 0, rx: 0.1, rz: 0.06 }, { y: 0.3, rx: 0.08, rz: 0.05 }], 8, 2],
    ['a squircle that leans', [{ y: -0.2, rx: 0.2, rz: 0.12, x: 0.02 }, { y: 0.1, rx: 0.24, rz: 0.13, z: -0.02 }, { y: 0.3, rx: 0.1, rz: 0.08 }], 10, 3.2],
    ['a tapering cone', [{ y: 0, rx: 0.05, rz: 0.05 }, { y: 0.5, rx: 0.01, rz: 0.01 }], 6, 2.4],
  ];
  for (const [name, rings, sides, round] of cases) {
    it(`${name}: closed, flat-shaded, indexed, every face outward`, () => {
      const g = loft(rings, C, sides, round);
      expect(g.getIndex()).not.toBeNull();
      expect(g.getAttribute('color')).toBeDefined();
      expect(g.getAttribute('uv')).toBeDefined();
      const tris = g.getIndex()!.count / 3;
      expect(tris).toBe(sides * 2 * (rings.length - 1) + sides * 2);
      expect(outward(g, rings)).toBe(0);
      g.computeBoundingBox();
      const box = g.boundingBox!;
      expect(box.min.y).toBeCloseTo(rings[0].y, 6);
      expect(box.max.y).toBeCloseTo(rings[rings.length - 1].y, 6);
      expect(box.max.x).toBeLessThanOrEqual(Math.max(...rings.map((r) => (r.x ?? 0) + r.rx)) + 1e-6);
    });
  }

  it("a coat's skirt is two turned halves, each closed on its own side and facing outward, from the belt to the knee", () => {
    for (const side of [1, -1] as const) {
      const g = coatSkirt(side, C);
      const pos = g.getAttribute('position');
      const idx = g.getIndex()!;
      const at = (i: number): THREE.Vector3 => new THREE.Vector3().fromBufferAttribute(pos, idx.getX(i));
      g.computeBoundingBox();
      const box = g.boundingBox!;
      expect(box.min.y).toBeCloseTo(-0.43, 6);
      expect(box.max.y).toBeCloseTo(0.03, 6);
      expect(side > 0 ? box.min.x : -box.max.x).toBeGreaterThan(0); // (on its own side of the middle)
      expect(Math.max(Math.abs(box.min.x), Math.abs(box.max.x))).toBeGreaterThan(0.24); // the hem flares
      const middle = box.getCenter(new THREE.Vector3());
      let wrong = 0;
      for (let i = 0; i < idx.count; i += 3) {
        const [a, b, c] = [at(i), at(i + 1), at(i + 2)];
        const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
        const centre = a.clone().add(b).add(c).divideScalar(3);
        if (n.dot(centre.sub(middle)) <= 0) wrong++;
      }
      expect(wrong).toBe(0);
    }
  });

  it("the people's parts are made of such forms and stand where the blocks stood", () => {
    const parts = [...coatForms(C), ...coatForms(C, { robe: true, belly: 0.05 }), upperArm(C), ...foreArm(C, C, C), thigh(C), ...shin(C, C), ...faceForms(C)];
    for (const g of parts) {
      const pos = g.getAttribute('position');
      for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i))).toBe(true);
    }
    const box = (g: THREE.BufferGeometry): THREE.Box3 => (g.computeBoundingBox(), g.boundingBox!);
    const torso = box(coatForms(C)[0]);
    expect(torso.min.y).toBeCloseTo(-0.01, 3); // the belt...
    expect(torso.max.y).toBeCloseTo(0.64, 3); // ...to the neck
    expect(torso.max.x).toBeGreaterThan(0.24); // the shoulders reach the sleeves (whose joints are 0.27 out)
    expect(box(upperArm(C)).min.y).toBeCloseTo(-0.31, 3);
    expect(box(thigh(C)).min.y).toBeCloseTo(-0.45, 3);
  });
});

describe('every person refined (render/npcFigures.ts)', () => {
  const ids = [...new Set(NPCS.map((n) => n.id))];

  it('there are people to look at', () => expect(ids.length).toBeGreaterThan(10));

  for (const id of ids) {
    it(`${id}: sound geometry within its faces, as tall and as broad as a person, the eyes clear of the hair`, () => {
      const f = npcFigure(id);
      f.root.updateMatrixWorld(true);
      let faces = 0;
      const box = new THREE.Box3();
      f.root.traverse((o) => {
        if (!(o instanceof THREE.Mesh) || !o.visible) return;
        const g = o.geometry as THREE.BufferGeometry;
        const pos = g.getAttribute('position');
        for (let i = 0; i < pos.count; i++) expect(Number.isFinite(pos.getX(i) + pos.getY(i) + pos.getZ(i)), id).toBe(true);
        faces += (g.getIndex()?.count ?? pos.count) / 3;
        box.expandByObject(o);
      });
      expect(faces, `${id} faces`).toBeLessThan(9000);
      const size = box.getSize(new THREE.Vector3());
      expect(size.y, `${id} height`).toBeGreaterThan(1.55);
      expect(size.y, `${id} height`).toBeLessThan(2.4); // (a priest's tall hat, a staff)
      expect(Math.min(size.x, size.z), `${id} girth`).toBeGreaterThan(0.25);
      const eyes = f.loose?.eyes;
      expect(eyes, id).toBeDefined();
      const eye = eyes!.getWorldPosition(new THREE.Vector3());
      const ray = new THREE.Raycaster(eye.clone().add(new THREE.Vector3(0, 0, 0.4)), new THREE.Vector3(0, 0, -1), 0, 0.38); // from in front of the face, back toward the eyes
      const hits = ray.intersectObject(f.root, true).filter((h) => h.object.visible && h.object.parent !== eyes);
      const first = hits[0];
      expect(first === undefined || first.distance > 0.255, `${id}: something stands before the eyes at ${first?.distance.toFixed(3)}`).toBe(true); // (the spectacles' rims stand clear of the middle of each eye)
    });
  }
});
