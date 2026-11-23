/**
 * Round 116, the land as thick with growth as its climate allows (data/foliage.ts, render/groundCover.ts, render/understory.ts): the
 * temperate woods and the dream's gardens grow thickest, the marsh its reeds, the desert a little scrub, the caverns and Yuggoth their
 * fungus, and the ice, the void and the gods' courts nothing more; nothing grows inside what stands; a chunk's growth is the same each
 * time and within a budget of corners.
 */
import { describe, expect, it } from 'vitest';
import { CLIMATES, type Under } from '../src/data/foliage';
import { getRegion, REGIONS } from '../src/data/regions';
import { Builder, groundCover } from '../src/render/groundCover';
import { chunkContent } from '../src/world/chunks';
import { propAt, type Prop } from '../src/world/props';
import { createRng } from '../src/core/rng';
import { surface } from '../src/world/terrain';

/** A few chunks of a region's own ground, from the middle row of its tile. */
function chunksOf(id: string, n = 4): { cx: number; cz: number }[] {
  const [tx, tz, w] = getRegion(id)!.area;
  const out: { cx: number; cz: number }[] = [];
  for (let i = 0; i < w * 8 && out.length < n; i++) if (chunkContent(tx * 8 + i, tz * 8 + 4).region?.id === id) out.push({ cx: tx * 8 + i, cz: tz * 8 + 4 });
  return out;
}

const corners = (id: string): number => {
  const cs = chunksOf(id);
  return cs.reduce((sum, { cx, cz }) => {
    const c = chunkContent(cx, cz);
    return sum + Object.values(groundCover(cx, cz, c.region!, c.roads, c.props)).reduce((m, g) => m + g.getAttribute('position').count, 0);
  }, 0) / cs.length;
};

describe("a realm's growth follows its climate (data/foliage.ts)", () => {
  it('every realm says how it grows, and the ice, the void and the gods\' courts grow nothing more', () => {
    for (const r of REGIONS) {
      const c = CLIMATES[r.id];
      expect(c, r.id).toBeDefined();
      expect(c.cover, r.id).toBeGreaterThanOrEqual(0);
      expect(c.under > 0, r.id).toBe(c.kinds.length > 0);
      if (c.kinds.length) expect(c.kinds.reduce((s, [, w]) => s + w, 0), r.id).toBeCloseTo(1, 6);
    }
    for (const id of ['mountains', 'cloud_summit', 'beyond', 'spheres', 'pale_lattice', 'court_centre']) expect(CLIMATES[id].under, id).toBe(0);
  });

  it('what grows suits the land: no leafy shrub in the desert, the marsh or the caverns, reeds in the marsh, fungus underground', () => {
    const kinds = (id: string): Under[] => CLIMATES[id].kinds.map(([k]) => k);
    for (const id of ['pnakotus', 'innsmouth', 'kn_yan', 'yuggoth', 'rlyeh', 'piping_dark']) expect(kinds(id), id).not.toContain('shrub');
    expect(kinds('innsmouth')).toContain('cattails');
    expect(kinds('kn_yan')).toEqual(['stalk']);
    expect(kinds('pnakotus')).toEqual(['scrub']);
    expect(kinds('rlyeh')).toEqual(['kelp']);
    for (const id of ['vermont', 'dunwich', 'dreamlands']) expect(kinds(id), id).toEqual(expect.arrayContaining(['shrub', 'ferns', 'sapling']));
  });

  it('the woods grow thickest and the desert and the ice thinnest', () => {
    const [vermont, dunwich, pnakotus, mountains] = ['vermont', 'dunwich', 'pnakotus', 'mountains'].map(corners);
    expect(vermont).toBeGreaterThan(5 * pnakotus);
    expect(dunwich).toBeGreaterThan(5 * pnakotus);
    expect(pnakotus).toBeGreaterThan(mountains);
    expect(vermont).toBeLessThan(32000); // a budget of corners for a chunk's growth (it was about 7,400 in the Vermont woods before)
  });
});

describe("a chunk's growth (render/groundCover.ts)", () => {
  const [{ cx, cz }] = chunksOf('vermont', 1);
  const c = chunkContent(cx, cz);

  it('is the same each time it is made', () => {
    const [a, b] = [groundCover(cx, cz, c.region!, c.roads, c.props), groundCover(cx, cz, c.region!, c.roads, c.props)];
    expect(a.leaf!.getAttribute('position').array).toEqual(b.leaf!.getAttribute('position').array);
  });

  it('grows nothing inside what stands', () => {
    const [x, z] = [(cx + 0.5) * 64, (cz + 0.5) * 64];
    const barn: Prop = { ...propAt('house', x, surface(x, z), z, createRng(3), 0, [14, 14, 4]), style: 'stone' }; // a great stone house over the chunk's middle
    const cover = groundCover(cx, cz, c.region!, c.roads, [barn]);
    const pos = cover.leaf!.getAttribute('position');
    let inside = 0;
    for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getX(i) - x) < 14 - 1.5 && Math.abs(pos.getZ(i) - z) < 14 - 1.5) inside++;
    expect(inside).toBe(0);
    const open = groundCover(cx, cz, c.region!, c.roads, []).leaf!.getAttribute('position');
    let before = 0;
    for (let i = 0; i < open.count; i++) if (Math.abs(open.getX(i) - x) < 14 - 1.5 && Math.abs(open.getZ(i) - z) < 14 - 1.5) before++;
    expect(before).toBeGreaterThan(100); // (it grew there with nothing standing)
  });

  it('draws a blade on three corners with both its faces, and a lump\'s face on its own', () => {
    const b = new Builder(true);
    b.tri([0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 1], [1, 1, 1], [1, 1, 1], [0, 0, 0.1]);
    b.face([0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 1], [1, 1, 1], [1, 1, 1]);
    const g = b.geometry()!;
    expect(g.getAttribute('position').count).toBe(6);
    expect(Array.from(g.getIndex()!.array)).toEqual([0, 1, 2, 1, 0, 2, 3, 4, 5]);
    expect(Array.from(g.getAttribute('aSway').array as Float32Array).map((v) => +v.toFixed(3))).toEqual([0, 0, 0.1, 0, 0, 0]);
  });
});
