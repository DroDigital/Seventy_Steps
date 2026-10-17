import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { serveFrom } from '../desktop/serve.js';
import { ENTITIES, variantOf } from '../src/data/registry';
import {
  attackFrame, directionForAngle, lastFrame, loopFrame, reactionFrame, resolveDirectionalClip, spriteDirection,
  type DirectionalClips,
} from '../src/render/sprites/directional';
import { reviewedClips, reviewedSize, type ReviewedManifest } from '../src/render/sprites/reviewed';

const ASSET_DIR = 'public/creatures/reviewed';
const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const read = (name: string): Uint8Array => readFileSync(`${ASSET_DIR}/${name}`);
const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);
const DIRECTIONS = ['front', 'back', 'left', 'right'] as const;
const FIRST_LATER_PAGE = 4; // the library's four pages, then a page for each later delivery (tools/add_reviewed_frames.py)
/** What the author drew after the library: the colossi's stoop and its in-between pose, the bosses' left and back attack and hurt, and the Shantak's flight cycle (round 48). */
const later = (assetGroup: string, direction: string, action: string): boolean =>
  action === 'stoop' || action === 'stoop_mid' || action === 'flight' || (assetGroup === 'bosses' && (direction === 'left' || direction === 'back') && (action === 'attack' || action === 'hurt'));

interface Frame {
  source: string; sourceSha256: string; pixelSha256: string;
  page: number; x: number; y: number; width: number; height: number; bounds: number[];
}
interface SourceEntity {
  key: string; id: string; sprite_scale: number;
  directions: Record<string, {
    source_direction: string; mirror_horizontal: boolean;
    actions: Record<string, { frame_count: number; frames: { name: string; path: string; sha256: string }[] }>;
  }>;
}
interface Pack {
  sourceIndexSha256: string; entityCount: number; frameCount: number; filter: string; mipmaps: boolean;
  pages: { file: string; width: number; height: number; sha256: string; pngBytes: number }[];
  frames: Frame[];
  entities: Record<string, {
    id: string; assetGroup: string; scale: number; page: number;
    directions: Record<string, { sourceDirection: string; mirror: boolean; actions: Record<string, number[]> }>;
  }>;
}

/** Decode the committed PNGs independently, so a packed frame cannot quietly change pixels. */
function pngRgba(bytes: Uint8Array): { width: number; height: number; rgba: Uint8Array } {
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

function crop(frame: Frame, page: ReturnType<typeof pngRgba>): Uint8Array {
  const pixels = new Uint8Array(frame.width * frame.height * 4);
  for (let y = 0; y < frame.height; y++) {
    const start = ((frame.y + y) * page.width + frame.x) * 4;
    pixels.set(page.rgba.subarray(start, start + frame.width * 4), y * frame.width * 4);
  }
  return pixels;
}

function alphaBounds(pixels: Uint8Array, width: number, height: number): number[] {
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!pixels[(y * width + x) * 4 + 3]) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
  }
  return [x0, y0, x1, y1];
}

describe('reviewed creature artwork imported into the game', () => {
  const pack = JSON.parse(text(read('index.json'))) as Pack;
  const source = JSON.parse(text(read('source-index.json'))) as { entity_count: number; unique_png_count: number; entities: SourceEntity[] };

  it('covers all 105 reviewed entries and leaves the seven allies to their own atlas', () => {
    const expected = ENTITIES.filter((d) => d.tier !== 'ally').flatMap((d) => [d.id, ...(['eldritch', 'boss'] as const).filter((v) => variantOf(d, v)).map((v) => `${d.id}#${v}`)]);
    expect(Object.keys(pack.entities).sort()).toEqual(expected.sort());
    expect(Object.keys(pack.entities).sort()).toEqual(source.entities.map((e) => e.key).sort());
    expect(pack.entityCount).toBe(105);
    expect(source.entity_count).toBe(105);
    expect(ENTITIES.filter((d) => !pack.entities[d.id]).map((d) => d.id).sort()).toEqual([
      'algol_light_being', 'cats_of_ulthar', 'nasht_kaman_thah', 'nodens', 'pickman', 'tritons', 'yithian_archivist',
    ]);
  });

  it('uses every exact registered action, frame order, frame count, scale and mirror choice', () => {
    expect(hash(read('source-index.json'))).toBe(pack.sourceIndexSha256);
    let scopes = 0, mirrors = 0;
    for (const original of source.entities) {
      const imported = pack.entities[original.key];
      expect(imported.id).toBe(original.id);
      expect(imported.scale).toBe(original.sprite_scale);
      expect(Object.keys(imported.directions).sort()).toEqual([...DIRECTIONS].sort());
      for (const direction of DIRECTIONS) {
        const old = original.directions[direction], current = imported.directions[direction];
        expect(current.sourceDirection, `${original.key}/${direction}`).toBe(old.source_direction);
        expect(current.mirror, `${original.key}/${direction}`).toBe(old.mirror_horizontal);
        mirrors += Number(current.mirror);
        expect(Object.keys(current.actions).sort()).toEqual(Object.keys(old.actions).sort());
        for (const [action, registration] of Object.entries(old.actions)) {
          scopes++;
          const frames = current.actions[action].map((id) => pack.frames[id]);
          expect(frames.length, `${original.key}/${direction}/${action}`).toBe(registration.frame_count);
          expect(frames.map((f) => f.source)).toEqual(registration.frames.map((f) => f.path));
          expect(frames.map((f) => f.sourceSha256)).toEqual(registration.frames.map((f) => f.sha256));
          // A later delivery's frames are on a page of their own, after the library's.
          if (later(imported.assetGroup, direction, action)) expect(frames.every((f) => f.page >= FIRST_LATER_PAGE && f.page !== imported.page), `${original.key}/${direction}/${action}`).toBe(true);
          else expect(frames.every((f) => f.page === imported.page), `${original.key}/${direction}/${action}`).toBe(true);
        }
      }
    }
    expect(scopes).toBe(1104); // 1,050 of the library, the stoop and its in-between pose of seven colossi (14), the bosses' left and back attack and hurt (36), and the Shantak's flight in its four views (4)
    expect(mirrors).toBe(81); // 82 of the library; 'Umr at-Tawil was drawn again whole, and his right is his own
    expect(new Set(pack.frames.map((f) => f.source)).size).toBe(2760);
    expect(pack.frameCount).toBe(source.unique_png_count);
    expect(pack.frameCount).toBe(2760); // 2,577 of the library, the stoop's fourteen and the seven in-between frames, the bosses' 126, 'Umr at-Tawil's four right-hand frames, and the Shantak's 32 flight frames
  });

  it('preserves all 2728 native canvases, RGBA pixels, bounds and the fixed Winged Hybrid pose', () => {
    expect(pack.filter).toBe('nearest');
    expect(pack.mipmaps).toBe(false);
    const pages = pack.pages.map((page) => {
      const bytes = read(page.file);
      expect(hash(bytes), page.file).toBe(page.sha256);
      expect(bytes.length).toBe(page.pngBytes);
      const decoded = pngRgba(bytes);
      expect([decoded.width, decoded.height]).toEqual([page.width, page.height]);
      expect(Math.max(page.width, page.height)).toBeLessThanOrEqual(2048);
      return decoded;
    });
    const sizes = new Map<string, number>();
    for (const frame of pack.frames) {
      const page = pages[frame.page];
      expect(frame.x).toBeGreaterThanOrEqual(1);
      expect(frame.y).toBeGreaterThanOrEqual(1);
      expect(frame.x + frame.width).toBeLessThan(page.width);
      expect(frame.y + frame.height).toBeLessThan(page.height);
      const pixels = crop(frame, page);
      expect(hash(pixels), frame.source).toBe(frame.pixelSha256);
      expect(alphaBounds(pixels, frame.width, frame.height), frame.source).toEqual(frame.bounds);
      const size = `${frame.width}x${frame.height}`;
      sizes.set(size, (sizes.get(size) ?? 0) + 1);
    }
    expect(Object.fromEntries(sizes)).toEqual({ '64x64': 2366, '128x128': 352, '128x160': 42 });
    const winged = pack.entities.winged_hybrid.directions.left.actions.move;
    expect(winged).toHaveLength(6);
    expect(pack.frames[winged[3]].sourceSha256).toBe('6910daf44dc5bb1f72a39f8d0e033bf4f8f1832dc81fe487c0d290ae182b476f');
    expect(pack.entities.winged_hybrid.directions.right.actions.move).toEqual(winged);
    expect(pack.entities.winged_hybrid.directions.right.mirror).toBe(true);
    expect(pack.entities.innsmouth_hybrid.directions.right.mirror).toBe(false);
    expect(pack.entities.rhan_tegoth.directions.right.mirror).toBe(false);
    expect(pack.entities.yeb.directions.right.mirror).toBe(false);
    expect(pack.entities.umr_at_tawil.directions.right.mirror).toBe(false); // drawn again whole: his right is no longer his left turned round
    expect(pack.entities.umr_at_tawil.directions.right.actions.move).not.toEqual(pack.entities.umr_at_tawil.directions.left.actions.move);
  });

  it('selects all authored scopes through the runtime adapter and keeps one fixed canvas scale', () => {
    const manifest = pack as unknown as ReviewedManifest;
    for (const [key, entity] of Object.entries(manifest.entities)) {
      const clips = reviewedClips(entity, key), size = reviewedSize(entity, manifest);
      const idle = manifest.frames[entity.directions.front.actions.idle![0]];
      expect(size.width / size.height, key).toBeCloseTo(idle.width / idle.height, 8);
      expect(size.groundOffset, key).toBeCloseTo(size.height * (1 - idle.bounds[3] / idle.height), 8);
      if (entity.assetGroup === 'bosses') expect(size.height * (idle.bounds[3] - idle.bounds[1]) / idle.height, key).toBeCloseTo(entity.scale, 8);
      else expect(size.height, key).toBe(entity.scale);
      for (const direction of DIRECTIONS) for (const action of ['idle', 'move', 'attack', 'hurt'] as const) {
        const authored = key === 'innsmouth_hybrid' && direction === 'left' ? 'right'
          : key === 'innsmouth_hybrid' && direction === 'right' ? 'left' : direction;
        const frameIds = entity.directions[authored].actions[action];
        const clip = resolveDirectionalClip(clips, direction, action)!;
        // A boss drawn in combat from its left has its right the left's, mirrored once; else the front's, as before.
        const mirrored = !frameIds && direction === 'right' && !!entity.directions.left.actions[action];
        const sourceDirection = frameIds ? authored : mirrored ? 'left' : 'front';
        expect(clip.frames, `${key}/${direction}/${action}`).toEqual(entity.directions[sourceDirection].actions[action]);
        expect(clip.mirror_horizontal).toBe(mirrored ? !entity.directions.left.mirror : entity.directions[sourceDirection].mirror);
      }
    }
  });

  it('corrects the reversed base Innsmouth side labels without changing its eldritch variant', () => {
    const manifest = pack as unknown as ReviewedManifest;
    const base = manifest.entities.innsmouth_hybrid;
    const clips = reviewedClips(base, 'innsmouth_hybrid');
    for (const action of ['idle', 'move'] as const) {
      expect(clips.left![action]!.frames).toEqual(base.directions.right.actions[action]);
      expect(clips.right![action]!.frames).toEqual(base.directions.left.actions[action]);
      expect(clips.left![action]!.mirror_horizontal).toBe(false);
      expect(clips.right![action]!.mirror_horizontal).toBe(false);
    }
    const eldritch = manifest.entities['innsmouth_hybrid#eldritch'];
    const unchanged = reviewedClips(eldritch, 'innsmouth_hybrid#eldritch');
    for (const direction of DIRECTIONS) for (const action of ['idle', 'move'] as const) {
      expect(unchanged[direction]![action]!.frames).toEqual(eldritch.directions[direction].actions[action]);
      expect(unchanged[direction]![action]!.mirror_horizontal).toBe(eldritch.directions[direction].mirror);
    }
  });

  it('serves every committed page and both indexes through the desktop protocol and packages them', async () => {
    const serve = serveFrom('public');
    const prefix = ASSET_DIR.slice('public'.length);
    for (const file of ['index.json', 'source-index.json', ...pack.pages.map((p) => p.file)]) {
      expect(file).not.toContain('..');
      const response = await serve(new Request(`app://seventy-steps${prefix}/${file}`));
      expect(response.status, file).toBe(200);
      expect(response.headers.get('content-type')).toBe(file.endsWith('.png') ? 'image/png' : 'application/json');
      expect(hash(new Uint8Array(await response.arrayBuffer()))).toBe(hash(read(file)));
    }
    const config = JSON.parse(readFileSync('package.json', 'utf8')) as { build: { files: string[] } };
    expect(config.build.files).toContain('dist/**');
    expect(config.build.files.some((pattern) => pattern.startsWith('!dist/'))).toBe(false);
  });
});

describe('authored directional animation selection', () => {
  it('faces the viewer, including side signs and reversed creature headings', () => {
    const at = { x: 3, z: 7 };
    const cameras = [{ x: 3, z: 17 }, { x: 13, z: 7 }, { x: 3, z: -3 }, { x: -7, z: 7 }];
    expect(cameras.map((camera) => spriteDirection(0, at, camera))).toEqual(['front', 'left', 'back', 'right']);
    expect(cameras.map((camera) => spriteDirection(Math.PI, at, camera))).toEqual(['back', 'right', 'front', 'left']);
    const radians = (degrees: number): number => degrees * Math.PI / 180;
    expect(directionForAngle(radians(48), 'front')).toBe('front');
    expect(directionForAngle(radians(56), 'front')).toBe('left');
    expect(directionForAngle(radians(-48), 'front')).toBe('front');
    expect(directionForAngle(radians(-56), 'front')).toBe('right');
  });

  it('shows every pose in accepted 2/4/6/8 frame loops without padding or a held wrap pose', () => {
    for (const count of [2, 4, 6, 8]) {
      const cycle = 0.8;
      expect(Array.from({ length: count }, (_, i) => loopFrame((i + 0.5) * cycle / count, count, cycle))).toEqual(Array.from({ length: count }, (_, i) => i));
      expect(loopFrame(cycle - 0.000001, count, cycle)).toBe(count - 1);
      expect(loopFrame(cycle, count, cycle)).toBe(0);
      expect(lastFrame(count)).toBe(count - 1);
      expect(reactionFrame(100, 30, count)).toBe(count - 1);
    }
  });

  it('uses registered mirroring once, keeps independent right views, and uses front combat art', () => {
    const clips: DirectionalClips<string> = {
      front: { attack: { frames: ['attack0', 'attack1', 'attack2'], mirror_horizontal: false }, hurt: { frames: ['hurt0', 'hurt1'], mirror_horizontal: false } },
      left: { move: { frames: ['left0', 'left1'], mirror_horizontal: false } },
      right: { move: { frames: ['right0', 'right1'], mirror_horizontal: false } },
    };
    expect(resolveDirectionalClip(clips, 'right', 'move')).toBe(clips.right!.move);
    expect(resolveDirectionalClip(clips, 'back', 'move')).toBeUndefined();
    expect(resolveDirectionalClip(clips, 'right', 'attack')).toBe(clips.front!.attack);
    expect(resolveDirectionalClip(clips, 'left', 'hurt')).toBe(clips.front!.hurt);
    clips.right!.move = { frames: ['left0', 'left1'], mirror_horizontal: true };
    expect(resolveDirectionalClip(clips, 'right', 'move')!.mirror_horizontal).toBe(true);
  });

  it('keeps attacks synchronized to their strike windows and advances every authored pose once', () => {
    expect([0, 9, 10, 19, 20, 29].map((frame) => attackFrame(frame, 30, 10, 20, 3))).toEqual([0, 0, 1, 1, 2, 2]);
    for (const count of [2, 3, 4, 6, 8]) {
      const frames = Array.from({ length: 90 }, (_, frame) => attackFrame(frame, 90, 30, 60, count));
      expect([...new Set(frames)]).toEqual(Array.from({ length: count }, (_, i) => i));
      expect(frames.every((frame, i) => i === 0 || frame >= frames[i - 1])).toBe(true);
    }
  });
});
