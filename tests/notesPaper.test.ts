import { describe, expect, it } from 'vitest';
import { DOCUMENTS, documentSkin, type Document } from '../src/data/documents';
import { buildLeaf, place } from '../src/render/paperStand';

describe('burning paper on notes', () => {
  it('defaults every note to burnt paper and leaves tomes plain unless a skin is set', () => {
    for (const [name, doc] of Object.entries(DOCUMENTS)) {
      expect(documentSkin(doc), name).toBe(doc.kind === 'note' ? 'paper' : 'plain');
    }
    const bare: Document = { kind: 'note', text: ['A clipping left where it will be found.'] };
    expect(documentSkin(bare)).toBe('paper');
    expect(documentSkin({ kind: 'tome', text: ['A bound book.'] })).toBe('plain');
    expect(documentSkin({ ...bare, skin: 'plain' })).toBe('plain');
    expect(documentSkin({ kind: 'tome', text: ['Loose leaves.'], skin: 'paper' })).toBe('paper');
  });

  it('chars the world note and sets embers along the rim of its leaf', () => {
    const leaf = buildLeaf('Arkham Advertiser, October 2nd', { x: 0, y: 0, z: 0 }, 0, 0);
    place(leaf, 2, 0);
    const at = (i: number) => leaf.col.slice(i, i + 3);
    const verts = Array.from({ length: leaf.col.length / 3 }, (_, v) => at(v * 3));
    const paper = verts.some((c) => c[0] > 0.6 && c[1] > 0.55 && c[2] > 0.4);
    const scorched = verts.some((c) => c[0] + c[1] + c[2] < 1);
    const ember = verts.some((c) => c[0] > c[1] + 0.3 && c[0] > 0.9 && c[2] > 0.2);
    expect(paper).toBe(true);
    expect(scorched).toBe(true);
    expect(ember).toBe(true);
    leaf.geo.dispose();
    leaf.mat.dispose();
  });
});
