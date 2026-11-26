import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';
import { crop, pngRgba } from './reviewedPackHelpers';

const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const manifest = (dir: string): ReviewedManifest => JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));

function visiblyChanged(before: Uint8Array, after: Uint8Array): boolean {
  for (let i = 0; i < before.length; i += 4) {
    if (before[i + 3] && (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2])) return true;
  }
  return false;
}

describe.each(['reviewed', 'allies'])('the painted %s sprites', (name) => {
  const originalDir = join('tools/sprites/source', name);
  const fullDir = join('public/creatures', name);
  const demoDir = join('tools/demo/art/creatures', name);
  const original = manifest(originalDir), full = manifest(fullDir), demo = manifest(demoDir);

  it('repaints every registered frame while preserving its silhouette, layout and playback', () => {
    expect(full.entities).toEqual(original.entities);
    expect(full.frames.length).toBe(original.frames.length);
    expect(full.pages.map(p => [p.file, p.width, p.height])).toEqual(original.pages.map(p => [p.file, p.width, p.height]));

    for (const [number, page] of full.pages.entries()) {
      const old = pngRgba(readFileSync(join(originalDir, page.file)));
      const painted = pngRgba(readFileSync(join(fullDir, page.file)));
      // All alpha coverage is included, even translucent edge pixels and the gutters between frames.
      let mismatch = -1;
      for (let i = 3; i < old.rgba.length; i += 4) {
        if (old.rgba[i] !== painted.rgba[i]) { mismatch = i; break; }
      }
      expect(mismatch, page.file).toBe(-1);

      for (const [index, frame] of full.frames.entries()) {
        if (frame.page !== number) continue;
        const originalFrame = original.frames[index];
        expect(frame).toEqual({ ...originalFrame, pixelSha256: frame.pixelSha256 });
        const before = crop(frame, old), after = crop(frame, painted);
        expect(hash(before), frame.source).toBe(originalFrame.pixelSha256);
        expect(hash(after), frame.source).toBe(frame.pixelSha256);
        expect(visiblyChanged(before, after), frame.source).toBe(true);
      }
    }
  }, 120_000);

  it('copies the painted pixels into every frame of the smaller demo', () => {
    const fullByPath = new Map(full.frames.map(frame => [frame.source, frame.pixelSha256]));
    for (const [number, page] of demo.pages.entries()) {
      const painted = pngRgba(readFileSync(join(demoDir, page.file)));
      for (const frame of demo.frames) {
        if (frame.page !== number) continue;
        const actual = hash(crop(frame, painted));
        expect(actual, frame.source).toBe(frame.pixelSha256);
        expect(actual, frame.source).toBe(fullByPath.get(frame.source));
      }
    }
  });
});
