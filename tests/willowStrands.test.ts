/**
 * 2026-11-24: a willow's strands hung in the air under its crown (fixed heights the jagged, flattened dome often did not reach).
 * Every strand's top now lies inside the crown's underside, in every willow drawn.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { undersideAt } from '../src/render/crownUnder';
import { join } from '../src/render/propKit';
import { propPieces, solids } from '../src/render/propShapes';
import { propOfForm } from './propForms';

/** The geometry's triangles gathered into the bodies they make, by the corners they share. */
function bodies(g: THREE.BufferGeometry): THREE.BufferGeometry[] {
  const flat = g.index ? g.toNonIndexed() : g;
  const pos = flat.getAttribute('position');
  const key = (i: number) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  const root = new Map<string, string>();
  const find = (k: string): string => { let r = k; while (root.get(r) !== r) r = root.get(r)!; root.set(k, r); return r; };
  for (let i = 0; i < pos.count; i++) if (!root.has(key(i))) root.set(key(i), key(i));
  for (let t = 0; t < pos.count; t += 3) for (const j of [1, 2]) root.set(find(key(t + j)), find(key(t)));
  const groups = new Map<string, number[]>();
  for (let t = 0; t < pos.count; t += 3) { const r = find(key(t)); groups.set(r, [...(groups.get(r) ?? []), t]); }
  return [...groups.values()].map((tris) => {
    const out = new Float32Array(tris.length * 9);
    tris.forEach((t, n) => { for (let j = 0; j < 9; j++) out[n * 9 + j] = (pos.array as Float32Array)[t * 3 + j]; });
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(out, 3));
  });
}

describe('a willow\'s strands', () => {
  it('hang from inside its crown', () => {
    let strands = 0;
    for (let nth = 0; nth < 8; nth++) {
      const found = propOfForm('tree', 'trees', 'willow', nth);
      if (!found) break;
      const leaf = solids(propPieces(found.p, [0.6, 0.6, 0.58], found.region)).find((q) => q.mat === 'leaf')!;
      const parts = bodies(leaf.geo).map((g) => { g.computeBoundingBox(); return g; });
      const thin = (g: THREE.BufferGeometry) => { const b = g.boundingBox!; return b.max.x - b.min.x < 0.4 && b.max.z - b.min.z < 0.4; };
      const crown = join(parts.filter((g) => !thin(g)));
      for (const s of parts.filter(thin)) {
        const b = s.boundingBox!;
        const [x, z] = [(b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2];
        const span = undersideAt(crown, x, z);
        expect(span, `willow ${nth}: a strand with no crown over it`).not.toBeNull();
        expect(b.max.y, `willow ${nth}: a strand's top under the crown`).toBeGreaterThan(span![0]);
        expect(b.max.y, `willow ${nth}: a strand's top through the crown`).toBeLessThan(span![1]);
        strands++;
      }
    }
    expect(strands).toBeGreaterThan(50);
  });
});
