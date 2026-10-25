import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ZONES } from '../src/data/bossTuning';
import { REVIEWED_BODY, REVIEWED_EYES, REVIEWED_GLINTS } from '../src/data/reviewedLook';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';
import { crop, pngRgba } from './reviewedPackHelpers';

const manifest = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

describe('what the renderer adds to the reviewed art (tools/reviewed_look.py)', () => {
  it('puts every eye inside the form it belongs to, with a colour', () => {
    for (const [key, [x, y, spread, ...rgb]] of Object.entries(REVIEWED_EYES)) {
      const entity = manifest.entities[key];
      expect(entity, key).toBeDefined();
      const frame = manifest.frames[entity.directions.front.actions.idle![0]];
      const [x0, y0, x1, y1] = frame.bounds;
      expect(x * frame.width, key).toBeGreaterThanOrEqual(x0);
      expect(x * frame.width, key).toBeLessThanOrEqual(x1);
      expect(y * frame.height, key).toBeGreaterThanOrEqual(y0);
      expect(y * frame.height, key).toBeLessThanOrEqual(y0 + (y1 - y0) * 0.6); // in the head
      expect(spread).toBeGreaterThan(0);
      expect(spread).toBeLessThanOrEqual(0.07 + 1e-9);
      for (const c of rgb) expect(c).toBeGreaterThanOrEqual(0);
      for (const c of rgb) expect(c).toBeLessThanOrEqual(1);
    }
    expect(Object.keys(REVIEWED_EYES).length).toBeGreaterThanOrEqual(8);
  });
});

describe('the painted body of a boss form (tools/reviewed_look.py)', () => {
  const bosses = Object.entries(manifest.entities).filter(([, e]) => e.assetGroup === 'bosses').map(([key]) => key);

  it('is measured for every boss form, in three bands, each a plausible share of its height', () => {
    expect(Object.keys(REVIEWED_BODY).sort()).toEqual(bosses.sort());
    for (const [key, bands] of Object.entries(REVIEWED_BODY)) {
      expect(bands, key).toHaveLength(3);
      for (const half of bands) {
        expect(half, key).toBeGreaterThan(0);
        expect(half, key).toBeLessThan(0.6);
      }
    }
  });

  it('is cut into the bands the fight has: the tool and the zones name the same heights', () => {
    const tool = readFileSync('tools/reviewed_look.py', 'utf8');
    expect(Number(/^LEGS_TOP = ([\d.]+)/m.exec(tool)?.[1])).toBe(ZONES.legs.top);
    expect(Number(/^TORSO_TOP = ([\d.]+)/m.exec(tool)?.[1])).toBe(ZONES.torso.top);
  });
});

describe('the marks that keep their light in the dark (round 83: tools/reviewed_look.py, shaders/sprite.ts)', () => {
  const pages = new Map<number, ReturnType<typeof pngRgba>>();
  const pageOf = (n: number) => {
    if (!pages.has(n)) pages.set(n, pngRgba(readFileSync(`public/creatures/reviewed/${manifest.pages[n].file}`)));
    return pages.get(n)!;
  };
  /** The texels of the exact colour `rgb` (0..1) in each frame a form has. */
  const holding = (key: string, rgb: readonly number[]): number[] => {
    const want = rgb.map((c) => Math.round(c * 255));
    const counts: number[] = [];
    for (const view of Object.values(manifest.entities[key].directions)) {
      for (const indexes of Object.values(view.actions)) {
        for (const index of indexes) {
          const frame = manifest.frames[index];
          const px = crop(frame, pageOf(frame.page));
          let n = 0;
          for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 200 && Math.abs(px[i] - want[0]) + Math.abs(px[i + 1] - want[1]) + Math.abs(px[i + 2] - want[2]) <= 3) n++;
          counts.push(n);
        }
      }
    }
    return counts;
  };

  it('are the exact colour of a few texels of the form they name: in its frames, never a body\'s colour', () => {
    expect(Object.keys(REVIEWED_GLINTS).length).toBeGreaterThanOrEqual(15);
    for (const [key, rgb] of Object.entries(REVIEWED_GLINTS)) {
      expect(manifest.entities[key], key).toBeDefined();
      for (const c of rgb) expect(c >= 0 && c <= 1, key).toBe(true);
      const counts = holding(key, rgb);
      expect(Math.max(...counts), key).toBeGreaterThan(0); // the colour is in the art
      expect(Math.max(...counts), key).toBeLessThanOrEqual(16); // and is a few texels of it, never a field
    }
  }, 120000);

  it('are kept alight by the sprite shader, in the colour drawn, only until the eye can no longer pick them out', () => {
    expect(SPRITE_FRAG).toMatch(/distance\(t\.rgb, vGlint\.rgb\)/);
    expect(SPRITE_FRAG).toMatch(/lit \* \(1\.0 - smoothstep\(uEyeRange\.x, uEyeRange\.y, vDist\)\)/);
  });
});
