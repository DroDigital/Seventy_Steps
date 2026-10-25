/**
 * The ground's litter belongs to the place (round 78, data/coverKinds.ts, render/coverPieces.ts): only real regions have pieces of their own, no
 * piece is a colour the post pass would take for an anomaly, the pick is by the roll alone, and a chunk's cover is the same each time and costs
 * little more than the ground's own would.
 */
import { describe, expect, it } from 'vitest';
import { PIECE_COLORS, pieceOf, REGION_COVER, type Piece } from '../src/data/coverKinds';
import { getRegion } from '../src/data/regions';
import { groundCover } from '../src/render/groundCover';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';
import { chunkContent } from '../src/world/chunks';

const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
const reads = (c: readonly [number, number, number]): boolean => {
  const [h, s, v] = rgbToHsv(c);
  return s > 0.3 && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < 0.1);
};

/** The first chunk of a region, searched on its tile. */
function chunkOf(id: string): { cx: number; cz: number } {
  const [tx, tz, w, h] = getRegion(id)!.area;
  for (let cz = tz * 8; cz < (tz + h) * 8; cz++) for (let cx = tx * 8; cx < (tx + w) * 8; cx++) if (chunkContent(cx, cz).region?.id === id) return { cx, cz };
  throw new Error(`no chunk of ${id}`);
}

const tris = (cx: number, cz: number): number => {
  const c = chunkContent(cx, cz);
  return Object.values(groundCover(cx, cz, c.region!, c.roads)).reduce((n, g) => n + g.getAttribute('position').count / 3, 0);
};

describe('a region\'s own litter', () => {
  it('belongs to real regions, in shares that leave the ground its own cover', () => {
    for (const [id, pieces] of Object.entries(REGION_COVER)) {
      expect(getRegion(id), id).toBeDefined();
      expect(pieces.reduce((s, p) => s + p.share, 0), id).toBeLessThan(0.3);
      for (const p of pieces) expect(PIECE_COLORS[p.piece].length, `${id} ${p.piece}`).toBeGreaterThan(0);
    }
  });

  it('is of colours the isolation does not take for an anomaly, and muted ones', () => {
    for (const [piece, colors] of Object.entries(PIECE_COLORS) as [Piece, readonly (readonly [number, number, number])[]][]) {
      for (const c of colors) {
        expect(reads(c), piece).toBe(false);
        expect(rgbToHsv(c)[1], `${piece} saturation`).toBeLessThan(0.45);
      }
    }
  });

  it('is picked by the roll alone: a roll past the shares is the ground\'s own, and a region with none has none', () => {
    expect(pieceOf('innsmouth', 0.01)).toBe('wrack');
    expect(pieceOf('innsmouth', 0.5)).toBeNull();
    expect(pieceOf('pnakotus', 0.01)).toBe('rib');
    expect(pieceOf('pnakotus', 0.05)).toBe('sherd');
    expect(pieceOf('kn_yan', 0.1)).toBe('cap');
    expect(pieceOf('hub', 0.01)).toBeNull();
  });

  for (const id of Object.keys(REGION_COVER)) {
    it(`${id}: a chunk's cover is the same each time, and costs a fifth more than the ground's own, or a few hundred faces where that is little`, () => {
      const { cx, cz } = chunkOf(id);
      const [a, b] = [tris(cx, cz), tris(cx, cz)];
      expect(a).toBe(b);
      const own = REGION_COVER[id];
      delete (REGION_COVER as Record<string, unknown>)[id];
      let plain = 0;
      try {
        plain = tris(cx, cz);
      } finally {
        (REGION_COVER as Record<string, unknown>)[id] = own;
      }
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThan(Math.max(plain * 1.25, plain + 240));
      expect(a).not.toBe(plain); // (and it is not the ground's own)
    });
  }
});
