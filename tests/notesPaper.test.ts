import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DOCUMENTS, documentSkin, type Document } from '../src/data/documents';
import { buildFigure } from '../src/render/figures';

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

  it('chars the world note and sets two embers on the sheet', () => {
    const figure = buildFigure('note');
    const colors: number[] = [];
    figure.root.traverse(o => {
      if (!(o instanceof THREE.Mesh)) return;
      const color = o.geometry.getAttribute('color');
      if (!color) return;
      for (let i = 0; i < color.count; i++) colors.push(color.getX(i), color.getY(i), color.getZ(i));
    });
    const dark = colors.some((_, i) => i % 3 === 0 && colors[i] < 0.12 && colors[i + 1] < 0.12 && colors[i + 2] < 0.12);
    const ember = colors.some((_, i) => i % 3 === 0 && colors[i] > colors[i + 1] + 0.08 && colors[i] > 0.25 && colors[i + 2] > colors[i + 1]);
    expect(dark).toBe(true);
    expect(ember).toBe(true);
    figure.root.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
  });
});
