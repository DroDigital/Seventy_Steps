import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REVIEWED_GLINTS } from '../src/data/reviewedLook';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
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

type GlintColor = (typeof REVIEWED_GLINTS)[string];

function frameGlints(pack: ReviewedManifest): Map<number, GlintColor> {
  const colors = new Map<number, GlintColor>();
  for (const [key, entity] of Object.entries(pack.entities)) {
    const color = REVIEWED_GLINTS[key];
    if (!color) continue;
    for (const view of Object.values(entity.directions)) {
      for (const frames of Object.values(view.actions)) {
        for (const frame of frames) colors.set(frame, color);
      }
    }
  }
  return colors;
}

function glintWeight(pixels: Uint8Array, offset: number, [r, g, b]: GlintColor, low: number, high: number): number {
  const distance = Math.hypot(pixels[offset] / 255 - r, pixels[offset + 1] / 255 - g, pixels[offset + 2] / 255 - b);
  const t = Math.max(0, Math.min(1, (distance - low) / (high - low)));
  return 1 - t * t * (3 - 2 * t);
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

    const glints = frameGlints(original);
    const range = /smoothstep\(\s*([\d.]+),\s*([\d.]+),\s*distance\(t\.rgb,\s*vGlint\.rgb\)\)/.exec(SPRITE_FRAG);
    const cutoff = /t\.a < ([\d.]+) \|\| \(shownAs/.exec(SPRITE_FRAG);
    if (!range || !cutoff) throw new Error('Could not find the glint falloff and alpha cutoff in the sprite shader');
    const low = Number(range[1]), high = Number(range[2]), minAlpha = Number(cutoff[1]) * 255;

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

        const color = glints.get(index);
        if (!color) continue;
        // The shader uses the atlas RGB directly as the emissive color.
        for (let i = 0; i < before.length; i += 4) {
          if (before[i + 3] < minAlpha) continue;
          if (before[i] === after[i] && before[i + 1] === after[i + 1] && before[i + 2] === after[i + 2]) continue;
          const originalWeight = glintWeight(before, i, color, low, high);
          const paintedWeight = glintWeight(after, i, color, low, high);
          if (originalWeight || paintedWeight) {
            const pixel = i / 4;
            throw new Error(`${frame.source} at (${pixel % frame.width}, ${Math.floor(pixel / frame.width)}) changed an emissive texel (weight ${originalWeight} → ${paintedWeight})`);
          }
        }
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
