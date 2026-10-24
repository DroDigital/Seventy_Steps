import { describe, expect, it } from 'vitest';
import { PSX_DETAIL, PSX_SIZE } from '../src/data/psxDetail';
import { generateTexture, TEXTURE_SIZE } from '../src/render/textures';

const pattern = (name: string): Uint8Array => Uint8Array.from(atob(PSX_DETAIL[name]), (c) => c.charCodeAt(0));
const luma = (px: Uint8Array, i: number): number => (0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2]) / 255;

describe('the PS1 surface patterns (round 74: the PSX Dungeon of Goblinatron, baked by tools/psx/bake_psx_textures.py)', () => {
  it.each(['stone', 'slab', 'wood'])('%s is 64 × 64 bytes of brightness about 100, with a joint, grain or grout to it', (name) => {
    const p = pattern(name);
    expect(p.length).toBe(PSX_SIZE * PSX_SIZE);
    const mean = p.reduce((a, b) => a + b, 0) / p.length;
    expect(mean).toBeGreaterThan(97);
    expect(mean).toBeLessThan(103);
    const sd = Math.sqrt(p.reduce((a, b) => a + (b - mean) ** 2, 0) / p.length);
    expect(sd).toBeGreaterThan(8); // a pattern, not a flat colour
  });

  it.each(['stone', 'slab', 'wood'] as const)('is what the world %s texture is drawn from: its own average light kept, its structure the pattern\'s, started in another place by another seed', (kind) => {
    const a = generateTexture(kind, 1);
    const b = generateTexture(kind, 2);
    const mean = (px: Uint8Array): number => Array.from({ length: TEXTURE_SIZE * TEXTURE_SIZE }, (_, i) => luma(px, i)).reduce((x, y) => x + y, 0) / (TEXTURE_SIZE * TEXTURE_SIZE);
    expect(Math.abs(mean(a) - mean(b))).toBeLessThan(0.08); // the same material's light, from either seed
    expect(a).not.toEqual(b);
    // the pattern repeats twice across: a row of the left half is the right half's, unless the grain (a twelfth of it) is told apart
    let same = 0;
    for (let x = 0; x < TEXTURE_SIZE / 2; x++) {
      const i = 5 * TEXTURE_SIZE + x;
      if (Math.abs(luma(a, i) - luma(a, i + TEXTURE_SIZE / 2)) < 0.08) same++;
    }
    expect(same).toBeGreaterThan(TEXTURE_SIZE / 2 * 0.7);
  });
});
