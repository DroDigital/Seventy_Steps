/**
 * The demo's creature art (tools/demo/art, written by tools/demo/pack_art.py) against the full game's atlases (public/creatures): the
 * demo holds the kept creatures and no other, each named as the demo names it, each frame the source's frame pixel for pixel (by the
 * hash both indexes keep), and each page the file its index says, at the size it says. Run in the demo's mode (`vitest --mode demo`).
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { KEEP } from '../../src/data/demoContent.ts';
import { ENTITIES } from '../../src/data/registry.ts';

interface Atlas {
  entityCount: number;
  frameCount: number;
  pages: { file: string; width: number; height: number; sha256: string; pngBytes?: number }[];
  frames: { source: string; pixelSha256: string; page: number; x: number; y: number; width: number; height: number }[];
  entities: Record<string, { id: string; name: string }>;
}

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const json = (path: string): Atlas => JSON.parse(readFileSync(join(ROOT, path), 'utf8')) as Atlas;
const demoBase = 'tools/demo/art/creatures/reviewed';
const demoAllies = 'tools/demo/art/creatures/allies';
const base = json(`${demoBase}/index.json`);
const allies = json(`${demoAllies}/index.json`);
const fullBase = json('public/creatures/reviewed/index.json');
const fullAllies = json('public/creatures/allies/index.json');
const demoAll = { ...base.entities, ...allies.entities };
const fullFrames = new Map([...fullBase.frames, ...fullAllies.frames].map((f) => [f.source, f.pixelSha256]));

describe("the demo's creature art", () => {
  it('holds exactly the kept creatures the full atlases have art for', () => {
    const full = new Set([...Object.keys(fullBase.entities), ...Object.keys(fullAllies.entities)]);
    expect(Object.keys(demoAll).sort()).toEqual(KEEP.entities.filter((id) => full.has(id)).sort());
  });

  it('names each creature as the demo names it', () => {
    for (const [id, entity] of Object.entries(demoAll)) expect(entity.name, id).toBe(ENTITIES.find((e) => e.id === id)?.name);
  });

  it('holds each frame as the full atlas has it, pixel for pixel', () => {
    for (const frame of [...base.frames, ...allies.frames]) expect(fullFrames.get(frame.source), frame.source).toBe(frame.pixelSha256);
  });

  it('holds each page as its index says: the file, its hash and its size', () => {
    for (const dir of [demoBase, demoAllies]) {
      const atlas = json(`${dir}/index.json`);
      for (const page of atlas.pages) {
        const bytes = readFileSync(join(ROOT, dir, page.file));
        expect(createHash('sha256').update(bytes).digest('hex'), page.file).toBe(page.sha256);
        const ihdr = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); // the PNG's IHDR: width and height, big-endian, after the signature
        expect([ihdr.getUint32(16), ihdr.getUint32(20)], page.file).toEqual([page.width, page.height]);
        if (page.pngBytes !== undefined) expect(bytes.length, page.file).toBe(page.pngBytes);
      }
      for (const frame of atlas.frames) {
        const page = atlas.pages[frame.page];
        expect(page && frame.x >= 0 && frame.y >= 0 && frame.x + frame.width <= page.width && frame.y + frame.height <= page.height, frame.source).toBe(true);
      }
    }
  });
});
