import { describe, expect, it } from 'vitest';
import { applySurfaceDetail } from '../src/render/surfaceDetail';
import { generateTexture, TEXTURE_KINDS } from '../src/render/textures';
import { createWorldMaterial } from '../src/render/worldMaterial';
import { propMaterial } from '../src/render/propMeshes';

const size = 128;
const flat = (): Uint8Array => {
  const pixels = new Uint8Array(size * size * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([128, 100, 70, (i / 4) % 256], i);
  return pixels;
};
const luma = (pixels: Uint8Array, x: number, y: number): number => pixels[(y * size + x) * 4];

describe('baked surface detail', () => {
  it('leaves the buffer untouched when disabled or given a non-finite strength', () => {
    const original = flat();
    const pixels = flat();
    applySurfaceDetail(pixels, size, size, 7, 0);
    expect(pixels).toEqual(original);
    expect(() => applySurfaceDetail(pixels, size, size, 7, NaN)).toThrow(RangeError);
    expect(() => applySurfaceDetail(pixels, size, size, 7, Infinity)).toThrow(RangeError);
    expect(pixels).toEqual(original);
  });

  it('adds seeded, bounded detail while preserving alpha and the average tone', () => {
    const a = flat();
    const b = flat();
    const c = flat();
    applySurfaceDetail(a, size, size, 7);
    applySurfaceDetail(b, size, size, 7);
    applySurfaceDetail(c, size, size, 8);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    const reds: number[] = [];
    for (let i = 0; i < a.length; i += 4) {
      expect(a[i + 3]).toBe((i / 4) % 256);
      reds.push(a[i]);
    }
    expect(Math.max(...reds) - Math.min(...reds)).toBeGreaterThan(8);
    expect(Math.min(...reds)).toBeGreaterThan(100);
    expect(Math.max(...reds)).toBeLessThan(156);
    expect(reds.reduce((sum, n) => sum + n, 0) / reds.length).toBeCloseTo(128, 0);
  });

  it('wraps without a special edge at the texture boundary', () => {
    const a = flat();
    applySurfaceDetail(a, size, size, 1);
    let seam = 0;
    let interior = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = Math.abs(luma(a, x, y) - luma(a, (x + 1) % size, y));
      const dy = Math.abs(luma(a, x, y) - luma(a, x, (y + 1) % size));
      if (x === size - 1) seam += dx; else interior += dx / (size - 1);
      if (y === size - 1) seam += dy; else interior += dy / (size - 1);
    }
    expect(seam).toBeLessThan(interior * 1.7);
  });

  it.each(TEXTURE_KINDS)('bakes detail into %s world texture', (kind) => {
    expect(generateTexture(kind, 1)).not.toEqual(generateTexture(kind, 1, false));
  });

  it('uses distinct material profiles and preserves alpha for each', () => {
    const stone = flat();
    const wood = flat();
    const snow = flat();
    applySurfaceDetail(stone, size, size, 3, 1, 'stone');
    applySurfaceDetail(wood, size, size, 3, 1, 'wood');
    applySurfaceDetail(snow, size, size, 3, 1, 'snow');
    expect(stone).not.toEqual(wood);
    expect(snow).not.toEqual(stone);
    for (let i = 3; i < stone.length; i += 4) {
      expect(stone[i]).toBe((i - 3) / 4 % 256);
      expect(wood[i]).toBe(stone[i]);
      expect(snow[i]).toBe(stone[i]);
    }
  });

  it('lights opposite sides of a raised stone edge differently', () => {
    const pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const value = x >= 32 && x < 96 ? 170 : 90;
      pixels.set([value, value, value, 255], i);
    }
    applySurfaceDetail(pixels, size, size, 13, 1, 'stone');
    // Both samples began at the same value: the edge facing the baked light is brighter.
    expect(luma(pixels, 32, 64) - luma(pixels, 95, 64)).toBeGreaterThan(12);
  });

  it('shares fabric textures but keeps neutral cloth for glass and self-lit surfaces', () => {
    const fabric = createWorldMaterial({ texture: 'cloth', seed: 23 });
    const another = createWorldMaterial({ texture: 'cloth', seed: 23 });
    const glass = createWorldMaterial({ texture: 'cloth', seed: 23, surface: 'glass' });
    const glow = createWorldMaterial({ texture: 'cloth', seed: 23, emissive: 1 });
    const plain = createWorldMaterial({ texture: 'cloth', seed: 23, neutralCloth: true });
    expect(fabric.uniforms.uMap.value).toBe(another.uniforms.uMap.value);
    expect(glass.uniforms.uMap.value).toBe(glow.uniforms.uMap.value);
    expect(plain.uniforms.uMap.value).toBe(glass.uniforms.uMap.value);
    expect(glass.uniforms.uMap.value).not.toBe(fabric.uniforms.uMap.value);
    expect(glass.uniforms.uMap.value.image.data).toEqual(generateTexture('cloth', 23, false));
  });

  it('uses a neutral texture for metal and a detailed texture for fabric props', () => {
    const same = (a: Uint8Array, b: Uint8Array): boolean => a.length === b.length && a.every((value, i) => value === b[i]);
    expect(same(propMaterial('metal').uniforms.uMap.value.image.data, generateTexture('cloth', 8, false))).toBe(true);
    expect(same(propMaterial('cloth').uniforms.uMap.value.image.data, generateTexture('cloth', 2, true))).toBe(true);
  });
});
