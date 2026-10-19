/** The reviewed pack's PNG pages, decoded by hand so a test reads the pixels the game will (no image library). */
import { expect } from 'vitest';
import { inflateSync } from 'node:zlib';

const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/** Decode the committed PNGs independently, so a packed frame cannot quietly change pixels. */
export function pngRgba(bytes: Uint8Array): { width: number; height: number; rgba: Uint8Array } {
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const u32 = (at: number): number => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(at);
  const width = u32(16), height = u32(20);
  expect([...bytes.subarray(24, 29)]).toEqual([8, 6, 0, 0, 0]); // RGBA8, lossless, non-interlaced.
  const chunks: Uint8Array[] = [];
  for (let at = 8; at < bytes.length;) {
    const length = u32(at), name = text(bytes.subarray(at + 4, at + 8));
    if (name === 'IDAT') chunks.push(bytes.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const compressed = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { compressed.set(chunk, offset); offset += chunk.length; }
  const raw = inflateSync(compressed), stride = width * 4;
  expect(raw.length).toBe(height * (stride + 1));
  const rgba = new Uint8Array(width * height * 4);
  const paeth = (a: number, b: number, c: number): number => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    expect(filter).toBeLessThanOrEqual(4);
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x;
      const left = x >= 4 ? rgba[at - 4] : 0;
      const up = y ? rgba[at - stride] : 0;
      const corner = y && x >= 4 ? rgba[at - stride - 4] : 0;
      const prediction = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, corner) : 0;
      rgba[at] = (raw[y * (stride + 1) + x + 1] + prediction) & 255;
    }
  }
  return { width, height, rgba };
}

export interface FrameRect { x: number; y: number; width: number; height: number }

export function crop(frame: FrameRect, page: ReturnType<typeof pngRgba>): Uint8Array {
  const pixels = new Uint8Array(frame.width * frame.height * 4);
  for (let y = 0; y < frame.height; y++) {
    const start = ((frame.y + y) * page.width + frame.x) * 4;
    pixels.set(page.rgba.subarray(start, start + frame.width * 4), y * frame.width * 4);
  }
  return pixels;
}

export function alphaBounds(pixels: Uint8Array, width: number, height: number): number[] {
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!pixels[(y * width + x) * 4 + 3]) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
  }
  return [x0, y0, x1, y1];
}
