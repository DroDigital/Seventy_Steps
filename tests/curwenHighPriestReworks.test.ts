import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REVIEWED_GROUND } from '../src/data/reviewedLook';
import { resolveDirectionalClip, type SpriteAction, type SpriteDirection } from '../src/render/sprites/directional';
import { reviewedClips, reviewedSize, type ReviewedManifest } from '../src/render/sprites/reviewed';
import { alphaBounds, crop, pngRgba } from './reviewedPackHelpers';

const ASSET_DIR = 'public/creatures/reviewed';
const DIRECTIONS = ['front', 'left', 'back', 'right'] as const;
const TARGETS = ['joseph_curwen', 'high_priest', 'high_priest#eldritch'];
const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const bytes = (value: string): Uint8Array => new TextEncoder().encode(value);

interface ApprovedFrame {
  path: string; sha256: string; pixelSha256: string; bounds: number[];
  direction: SpriteDirection; action: SpriteAction; index: number;
}
interface ApprovedEntity {
  key: string; root: string; width: number; height: number; scale: number;
  directions: Record<SpriteDirection, { actions: Partial<Record<SpriteAction, string[]>> }>;
  frames: ApprovedFrame[];
}
interface SourceEntity {
  key: string; id: string; sprite_scale: number;
  directions: Record<SpriteDirection, {
    source_direction: string; mirror_horizontal: boolean;
    actions: Record<string, { frame_count: number; frames: { name: string; path: string; sha256: string }[] }>;
  }>;
}

/** Pinned from the approved MANIFEST and independent REVIEWED-FRAMES, before the atlas import.
 * Non-target signatures were captured from main at 630e8c1, including decoded pixels.
 */
const fixture = JSON.parse(readFileSync('tests/fixtures/curwen-high-priest-reworks.json', 'utf8')) as {
  delivery: { frameCount: number }; entities: ApprovedEntity[]; nonTargetEntities: Record<string, string>;
};
const pack = JSON.parse(readFileSync(`${ASSET_DIR}/index.json`, 'utf8')) as ReviewedManifest;
const source = JSON.parse(readFileSync(`${ASSET_DIR}/source-index.json`, 'utf8')) as { entities: SourceEntity[] };
const pages = pack.pages.map(page => pngRgba(readFileSync(`${ASSET_DIR}/${page.file}`)));

/** Every RGBA channel participates, including RGB under transparent pixels. */
function mirror(pixels: Uint8Array, width: number, height: number): Uint8Array {
  const reflected = new Uint8Array(pixels.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const from = (y * width + x) * 4;
    reflected.set(pixels.subarray(from, from + 4), (y * width + width - x - 1) * 4);
  }
  return reflected;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) as string;
}

describe('the approved Curwen and High Priest reworks', () => {
  it.each(fixture.entities)('$key preserves every delivered rendered frame, source hash and action order', approved => {
    const entity = pack.entities[approved.key];
    const original = source.entities.find(entry => entry.key === approved.key)!;
    const clips = reviewedClips(entity, approved.key);
    const byPath = new Map(approved.frames.map(frame => [frame.path, frame]));
    expect(approved.frames).toHaveLength(29);
    expect(entity.scale).toBe(approved.scale);
    expect(original.sprite_scale).toBe(approved.scale);
    const reference = pack.frames[entity.directions.front.actions.idle![0]];
    expect(REVIEWED_GROUND[entity.id] ?? reference.bounds[3] / reference.height).toBe(62 / 64);
    expect(reviewedSize(entity, pack)).toEqual({
      width: approved.scale, height: approved.scale, groundOffset: approved.scale * (1 - 62 / 64),
    });

    let rendered = 0;
    for (const direction of DIRECTIONS) {
      const sourceDirection = direction === 'right' ? 'left' : direction;
      const view = entity.directions[direction];
      const sourceView = original.directions[direction];
      expect(view.sourceDirection, `${approved.key}/${direction}`).toBe(sourceDirection);
      expect(view.mirror, `${approved.key}/${direction}`).toBe(direction === 'right');
      expect(sourceView.source_direction).toBe(sourceDirection);
      expect(sourceView.mirror_horizontal).toBe(direction === 'right');
      const wantedActions = direction === 'front' ? ['attack', 'hurt', 'idle', 'move'] : ['idle', 'move'];
      expect(Object.keys(view.actions).sort()).toEqual(wantedActions);
      expect(Object.keys(sourceView.actions).sort()).toEqual(wantedActions);

      for (const action of wantedActions as SpriteAction[]) {
        const wanted = approved.directions[direction].actions[action]!;
        const sources = approved.directions[sourceDirection].actions[action]!;
        const clip = resolveDirectionalClip(clips, direction, action)!;
        expect(wanted.length).toBe(action === 'idle' || action === 'hurt' ? 2 : action === 'attack' ? 3 : 4);
        expect(clip.frames.map(id => pack.frames[id].source)).toEqual(sources);
        expect(clip.mirror_horizontal).toBe(direction === 'right');
        expect(sourceView.actions[action]).toEqual({
          frame_count: sources.length,
          frames: sources.map(path => ({ name: path.split('/').at(-1)!.replace('.png', ''), path, sha256: byPath.get(path)!.sha256 })),
        });
        for (const [index, id] of clip.frames.entries()) {
          const frame = pack.frames[id];
          const sourceFrame = byPath.get(sources[index])!;
          const deliveredFrame = byPath.get(wanted[index])!;
          const pixels = crop(frame, pages[frame.page]);
          const shown = clip.mirror_horizontal ? mirror(pixels, frame.width, frame.height) : pixels;
          expect([frame.width, frame.height], deliveredFrame.path).toEqual([64, 64]);
          expect(frame.sourceSha256, sourceFrame.path).toBe(sourceFrame.sha256);
          expect(frame.pixelSha256, sourceFrame.path).toBe(sourceFrame.pixelSha256);
          expect(hash(pixels), sourceFrame.path).toBe(sourceFrame.pixelSha256);
          expect(frame.bounds, sourceFrame.path).toEqual(sourceFrame.bounds);
          expect(hash(shown), deliveredFrame.path).toBe(deliveredFrame.pixelSha256);
          expect(alphaBounds(shown, 64, 64), deliveredFrame.path).toEqual(deliveredFrame.bounds);
          expect(deliveredFrame.bounds[3], deliveredFrame.path).toBe(62);
          rendered++;
        }
      }
    }
    expect(rendered).toBe(29);
  });

  it('uses the accepted front attack and hurt from all four directions without a mirror', () => {
    for (const approved of fixture.entities) {
      const clips = reviewedClips(pack.entities[approved.key], approved.key);
      for (const direction of DIRECTIONS) for (const action of ['attack', 'hurt'] as const) {
        const clip = resolveDirectionalClip(clips, direction, action)!;
        expect(clip, `${approved.key}/${direction}/${action}`).toEqual(clips.front![action]);
        expect(clip.mirror_horizontal).toBe(false);
        expect(clip.frames.map(id => pack.frames[id].source)).toEqual(approved.directions.front.actions[action]);
      }
    }
  });

  it('contains only the 69 packed sources for the 87 delivered poses, with no obsolete frames reachable', () => {
    expect(fixture.entities.map(entity => entity.key).sort()).toEqual([...TARGETS].sort());
    expect(fixture.entities.flatMap(entity => entity.frames)).toHaveLength(fixture.delivery.frameCount);
    expect(fixture.delivery.frameCount).toBe(87);
    const packedSources: string[] = [];
    for (const approved of fixture.entities) {
      const expected = approved.frames.filter(frame => frame.direction !== 'right').map(frame => frame.path).sort();
      const stored = pack.frames.filter(frame => frame.source.startsWith(`${approved.root}/`)).map(frame => frame.source).sort();
      expect(stored, approved.key).toEqual(expected);
      const reachable = new Set(Object.values(pack.entities[approved.key].directions).flatMap(view =>
        Object.values(view.actions).flatMap(ids => ids.map(id => pack.frames[id].source))));
      expect([...reachable].sort(), approved.key).toEqual(expected);
      packedSources.push(...stored);
    }
    expect(packedSources).toHaveLength(69);
  });

  it('preserves the other 101 source registrations and pixels through index remapping, excluding the later Azathoth rework', () => {
    const keys = Object.keys(pack.entities).filter(key => !TARGETS.includes(key) && key !== 'azathoth').sort();
    expect(keys).toEqual(Object.keys(fixture.nonTargetEntities).filter(key => key !== 'azathoth').sort());
    expect(keys).toHaveLength(101);
    const pixelHashes = new Map<number, string>();
    for (const key of keys) {
      const entity = pack.entities[key];
      // Global numeric frame IDs change when old target frames are removed. The source
      // path is the stable identity; preserve every other field and every ordered action.
      const registration = {
        ...entity,
        directions: Object.fromEntries(Object.entries(entity.directions).map(([direction, view]) => [direction, {
          ...view, actions: Object.fromEntries(Object.entries(view.actions).map(([action, ids]) =>
            [action, ids.map(id => pack.frames[id].source)])),
        }])),
      };
      const frames: Record<string, unknown> = {};
      for (const view of Object.values(entity.directions)) for (const ids of Object.values(view.actions)) for (const id of ids) {
        const frame = pack.frames[id];
        if (!pixelHashes.has(id)) pixelHashes.set(id, hash(crop(frame, pages[frame.page])));
        frames[frame.source] = { ...frame, pageFile: pack.pages[frame.page].file, actualPixelSha256: pixelHashes.get(id) };
      }
      const signature = { registration, sourceRegistration: source.entities.find(entry => entry.key === key), frames };
      expect(hash(bytes(canonical(signature))), key).toBe(fixture.nonTargetEntities[key]);
    }
  });
});
