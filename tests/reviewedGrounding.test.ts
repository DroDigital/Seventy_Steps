import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getEntity } from '../src/data/registry';
import { reviewedSize, type ReviewedFrame, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { crop, pngRgba } from './reviewedPackHelpers';

const folder = 'public/creatures/reviewed';
const manifest = JSON.parse(readFileSync(`${folder}/index.json`, 'utf8')) as ReviewedManifest;
const entity = manifest.entities.yog_sothoth;
const reference = manifest.frames[entity.directions.front.actions.idle![0]];
const pages = manifest.pages.map((page) => pngRgba(readFileSync(`${folder}/${page.file}`)));

/** Last row of the connected body, excluding the detached sparks around it. */
function bodyFoot(frame: ReviewedFrame): number {
  const pixels = crop(frame, pages[frame.page]);
  const seen = new Uint8Array(frame.width * frame.height);
  let largest = 0, foot = -1;
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || pixels[start * 4 + 3] <= 128) continue;
    const group = [start];
    seen[start] = 1;
    let bottom = 0;
    for (let at = 0; at < group.length; at++) {
      const [x, y] = [group[at] % frame.width, Math.floor(group[at] / frame.width)];
      bottom = Math.max(bottom, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const [nx, ny] = [x + dx, y + dy];
        if (nx < 0 || nx >= frame.width || ny < 0 || ny >= frame.height) continue;
        const next = ny * frame.width + nx;
        if (seen[next] || pixels[next * 4 + 3] <= 128) continue;
        seen[next] = 1;
        group.push(next);
      }
    }
    if (group.length > largest) [largest, foot] = [group.length, bottom];
  }
  return foot;
}

describe('Yog-Sothoth\'s reviewed ground registration', () => {
  it('grounds the physical spheres in every pose and view while preserving the canvas scale', () => {
    const size = reviewedSize(entity, manifest);
    const pixel = entity.scale / (reference.bounds[3] - reference.bounds[1]);
    expect(size.height).toBeCloseTo(reference.height * pixel, 9);
    expect(size.width).toBeCloseTo(reference.width * pixel, 9);
    const ids = new Set(Object.values(entity.directions).flatMap((view) => Object.values(view.actions).flatMap((frames) => frames ?? [])));
    expect(ids.size).toBe(23);
    for (const id of ids) {
      const frame = manifest.frames[id];
      const foot = bodyFoot(frame);
      expect(foot, frame.source).toBe(111);
      const worldY = (1 - foot / frame.height) * size.height - size.groundOffset;
      expect(worldY, frame.source).toBeCloseTo(0, 9);
    }
  });

  it('aligns the seven hit sphere heights and radii with the painted front idle', () => {
    // Independently read sphere circles, in native pixels: centre y and radius.
    const circles = [[37, 9.5], [55, 18], [55, 17], [70, 22.5], [88, 18.5], [87.5, 19], [100, 11]];
    const hit = getEntity('yog_sothoth')!.assembly!.hit!;
    const size = reviewedSize(entity, manifest);
    const pixel = size.height / reference.height;
    expect(hit).toHaveLength(circles.length);
    for (let i = 0; i < circles.length; i++) {
      const [y, radius] = circles[i];
      const [, up, r] = hit[i];
      const worldY = (1 - y / reference.height) * size.height - size.groundOffset;
      expect(Math.abs(worldY - up * entity.scale)).toBeLessThan(pixel);
      expect(Math.abs(radius * pixel - r * entity.scale)).toBeLessThan(pixel);
    }
  });
});
