import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { serveFrom } from '../desktop/serve.js';
import { ALLIES } from '../src/data/entities/allies';
import { reviewedClips, reviewedSize, type ReviewedArt, type ReviewedEntity, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { ALLIED_ART_KEYS, mergeReviewedArt, validateAlliedManifest, validateReviewedManifest } from '../src/render/sprites/reviewedMerge';

const directions = ['front', 'left', 'back', 'right'] as const;
const actions = ['idle', 'move', 'attack', 'hurt'] as const;
const counts = { idle: 2, move: 6, attack: 3, hurt: 2 };
function entity(id: string): ReviewedEntity {
  return { id, name: id, assetGroup: 'sprites', scale: 2.4, scaleUnit: 'canvas-height-metres', page: 0,
    directions: Object.fromEntries(directions.map(direction => [direction, {
      sourceDirection: direction === 'right' ? 'left' : direction, mirror: direction === 'right',
      actions: Object.fromEntries(actions.map(action => [action, Array.from({ length: action === 'move' && ['algol_light_being', 'yithian_archivist'].includes(id) ? 4 : counts[action] }, (_, index) => index)])),
    }])) as ReviewedEntity['directions'],
  };
}
function pack(ids: string[]): ReviewedArt {
  const frames = Array.from({ length: 13 }, (_, index) => ({ source: `frame-${index}.png`, sourceSha256: `source-${index}`, pixelSha256: `pixels-${index}`, width: 64, height: 64, bounds: [1, 1, 63, 62] as [number, number, number, number], page: 0, x: index * 64, y: 0 }));
  const manifest: ReviewedManifest = { format: 'seventy-steps-reviewed-atlas-v1', entityCount: ids.length, frameCount: frames.length,
    pages: [{ file: ids.length === 7 ? 'allies-0.png' : 'creatures-0.png', width: 832, height: 64, sha256: 'unchanged' }],
    frames, entities: Object.fromEntries(ids.map(id => [id, entity(id)])),
  };
  return { manifest, pages: [{ tag: ids.length === 7 ? 'new-ally-pixels' : 'old-reviewed-pixels' } as unknown as HTMLImageElement] };
}
const base = () => pack(Array.from({ length: 105 }, (_, n) => `existing-${n}`));
const allies = () => pack([...ALLIED_ART_KEYS]);

describe('separate authored ally atlas', () => {
  it('merges all seven allies while keeping every existing frame, page and entity unchanged', () => {
    const original = base(), added = allies();
    const before = JSON.stringify(original.manifest), addedBefore = JSON.stringify(added.manifest);
    const combined = mergeReviewedArt(original, added);
    expect(combined.manifest.entityCount).toBe(112);
    expect(combined.manifest.frameCount).toBe(26);
    expect(JSON.stringify(original.manifest)).toBe(before);
    expect(JSON.stringify(added.manifest)).toBe(addedBefore);
    expect(combined.pages[0]).toBe(original.pages[0]);
    expect(combined.pages[1]).toBe(added.pages[0]);
    expect(combined.manifest.frames.slice(0, 13)).toEqual(original.manifest.frames);
    for (const [key, entry] of Object.entries(original.manifest.entities)) expect(combined.manifest.entities[key]).toBe(entry);
  });

  it('offsets ally pages and frame ids once, preserving source hashes and mirroring', () => {
    const combined = mergeReviewedArt(base(), allies());
    const entry = combined.manifest.entities.nodens;
    expect(entry.page).toBe(1);
    const clip = reviewedClips(entry, 'nodens').right!.move!;
    expect(clip.frames).toEqual([13, 14, 15, 16, 17, 18]);
    expect(clip.mirror_horizontal).toBe(true);
    expect(combined.manifest.frames[clip.frames[0]]).toEqual({ ...allies().manifest.frames[0], page: 1 });
    expect(reviewedSize(entry, combined.manifest)).toEqual(reviewedSize(allies().manifest.entities.nodens, allies().manifest));
  });

  it('requires every ally action and all four directions with the intended frame counts', () => {
    const valid = allies().manifest;
    expect(() => validateAlliedManifest(valid)).not.toThrow();
    valid.entities.nodens.directions.back.actions.move = [0, 1];
    expect(() => validateAlliedManifest(valid)).toThrow('nodens/back/move');
    const missing = allies().manifest;
    delete (missing.entities.pickman.directions as Partial<ReviewedEntity['directions']>).left;
    expect(() => validateAlliedManifest(missing)).toThrow('pickman/left');
  });

  it('rejects wrong roster keys and duplicate entries across packs', () => {
    const wrong = allies(); wrong.manifest.entities.stranger = wrong.manifest.entities.nodens; delete wrong.manifest.entities.nodens;
    expect(() => validateAlliedManifest(wrong.manifest)).toThrow('roster');
    const old = base(); old.manifest.entities.nodens = old.manifest.entities['existing-0']; delete old.manifest.entities['existing-0'];
    expect(() => mergeReviewedArt(old, allies())).toThrow('same creature: nodens');
  });

  it('rejects broken frame references and out-of-page rectangles', () => {
    const invalid = allies().manifest;
    invalid.entities.nodens.directions.front.actions.attack = [0, 1, 999];
    expect(() => validateReviewedManifest(invalid, 7)).toThrow('invalid frame');
    const outside = allies().manifest;
    outside.frames[0].x = 900;
    expect(() => validateReviewedManifest(outside, 7)).toThrow('outside');
  });
});

const ASSET_DIR = 'public/creatures/allies';
const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const read = (name: string): Uint8Array => readFileSync(`${ASSET_DIR}/${name}`);
const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

interface PackedFrame {
  source: string; sourceSha256: string; pixelSha256: string;
  page: number; x: number; y: number; width: number; height: number; bounds: number[];
}
interface Packed {
  sourceIndexSha256: string; entityCount: number; frameCount: number; filter: string; mipmaps: boolean;
  pages: { file: string; width: number; height: number; sha256: string }[];
  frames: PackedFrame[];
  entities: Record<string, ReviewedEntity>;
}

function pngRgba(bytes: Uint8Array): { width: number; height: number; rgba: Uint8Array } {
  const u32 = (at: number): number => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(at);
  const width = u32(16), height = u32(20);
  const chunks: Uint8Array[] = [];
  for (let at = 8; at < bytes.length;) {
    const length = u32(at);
    if (text(bytes.subarray(at + 4, at + 8)) === 'IDAT') chunks.push(bytes.subarray(at + 8, at + 8 + length));
    at += length + 12;
  }
  const compressed = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) { compressed.set(chunk, offset); offset += chunk.length; }
  const raw = inflateSync(compressed), stride = width * 4;
  const rgba = new Uint8Array(width * height * 4);
  const paeth = (a: number, b: number, c: number): number => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const at = y * stride + x;
      const left = x >= 4 ? rgba[at - 4] : 0, up = y ? rgba[at - stride] : 0, corner = y && x >= 4 ? rgba[at - stride - 4] : 0;
      const prediction = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, corner) : 0;
      rgba[at] = (raw[y * (stride + 1) + x + 1] + prediction) & 255;
    }
  }
  return { width, height, rgba };
}

describe('committed allied artwork', () => {
  const pack = JSON.parse(text(read('index.json'))) as Packed;
  const source = JSON.parse(text(read('source-index.json'))) as {
    entity_count: number; unique_png_count: number; logical_frame_count: number;
    entities: { key: string; sprite_scale: number; directions: Record<string, { source_direction: string; mirror_horizontal: boolean; actions: Record<string, { frame_count: number; frames: { path: string; sha256: string }[] }> }> }[];
  };
  const reviewed = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

  it('keeps the seven allies beside the untouched 105-creature atlas', () => {
    expect(() => validateReviewedManifest(reviewed, 105)).not.toThrow();
    expect(() => validateAlliedManifest(pack as unknown as ReviewedManifest)).not.toThrow();
    const combined = mergeReviewedArt(
      { manifest: reviewed, pages: reviewed.pages.map(() => ({}) as HTMLImageElement) },
      { manifest: pack as unknown as ReviewedManifest, pages: [{} as HTMLImageElement] },
    );
    expect(combined.manifest.entityCount).toBe(112);
    expect(combined.manifest.entities.nodens.page).toBe(reviewed.pages.length);
    expect(combined.pages).toHaveLength(reviewed.pages.length + 1);
    for (const [key, entry] of Object.entries(reviewed.entities)) expect(combined.manifest.entities[key]).toBe(entry);
    const nodens = reviewedClips(combined.manifest.entities.nodens, 'nodens');
    expect(nodens.right!.move!.mirror_horizontal).toBe(true);
    expect(nodens.right!.move!.frames).toEqual(nodens.left!.move!.frames);
    const yith = reviewedClips(combined.manifest.entities.yithian_archivist, 'yithian_archivist');
    expect(yith.right!.move!.mirror_horizontal).toBe(false);
    expect(yith.right!.move!.frames).not.toEqual(yith.left!.move!.frames);
    expect(yith.right!.attack!.frames).toHaveLength(3);
    expect(nodens.front!.move!.frames).toHaveLength(6);
    expect(yith.front!.move!.frames).toHaveLength(4);
  });

  it('matches every source registration, scale, mirror and packed pixel', () => {
    expect(hash(read('source-index.json'))).toBe(pack.sourceIndexSha256);
    expect(pack.entityCount).toBe(7);
    expect(pack.frameCount).toBe(272);
    expect(source.unique_png_count).toBe(272);
    expect(source.logical_frame_count).toBe(348);
    expect(pack.filter).toBe('nearest');
    expect(pack.mipmaps).toBe(false);
    expect(Object.keys(pack.entities).sort()).toEqual([...ALLIED_ART_KEYS].sort());
    expect(ALLIES.map((ally) => [ally.id, ally.sprite!.scale])).toEqual(source.entities.map((entry) => [entry.key, entry.sprite_scale]));
    const pageBytes = read(pack.pages[0].file);
    expect(hash(pageBytes)).toBe(pack.pages[0].sha256);
    const page = pngRgba(pageBytes);
    expect([page.width, page.height]).toEqual([pack.pages[0].width, pack.pages[0].height]);
    for (const frame of pack.frames) {
      const pixels = new Uint8Array(frame.width * frame.height * 4);
      for (let y = 0; y < frame.height; y++) pixels.set(page.rgba.subarray(((frame.y + y) * page.width + frame.x) * 4, ((frame.y + y) * page.width + frame.x + frame.width) * 4), y * frame.width * 4);
      expect(hash(pixels), frame.source).toBe(frame.pixelSha256);
      expect(frame.width).toBe(64);
      expect(frame.height).toBe(64);
    }
    for (const original of source.entities) {
      const imported = pack.entities[original.key];
      expect(imported.scale).toBe(original.sprite_scale);
      for (const direction of directions) {
        const old = original.directions[direction], current = imported.directions[direction];
        expect(current.mirror, `${original.key}/${direction}`).toBe(old.mirror_horizontal);
        expect(current.sourceDirection).toBe(old.source_direction);
        for (const [action, registration] of Object.entries(old.actions)) {
          const frames = current.actions[action as typeof actions[number]]!.map((id) => pack.frames[id]);
          expect(frames.length).toBe(registration.frame_count);
          expect(frames.map((frame) => frame.source)).toEqual(registration.frames.map((frame) => frame.path));
          expect(frames.map((frame) => frame.sourceSha256)).toEqual(registration.frames.map((frame) => frame.sha256));
        }
      }
    }
  });

  it('serves the ally atlas through the desktop package', async () => {
    const serve = serveFrom('public');
    for (const file of ['index.json', 'source-index.json', 'allies-0.png']) {
      const response = await serve(new Request(`app://seventy-steps/creatures/allies/${file}`));
      expect(response.status, file).toBe(200);
      expect(hash(new Uint8Array(await response.arrayBuffer()))).toBe(hash(read(file)));
    }
  });
});
