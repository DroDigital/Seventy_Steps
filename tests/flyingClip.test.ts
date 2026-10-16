import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { flyingClip, type DirectionalClips } from '../src/render/sprites/directional';
import { reviewedClips, type ReviewedEntity } from '../src/render/sprites/reviewed';

const index = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as { entities: Record<string, ReviewedEntity> };
const clipsOf = (key: string): DirectionalClips<number> => reviewedClips(index.entities[key]!, key);

describe('a flyer in the sky flies its own wing-beat where it has one (round 49: the Shantak walked in the air)', () => {
  it('the Shantak flies its eight flight frames from every side, not its walk', () => {
    const clips = clipsOf('shantak');
    for (const dir of ['front', 'back', 'left', 'right'] as const) {
      const clip = flyingClip(clips, dir)!;
      expect(clip.frames).toEqual(clips[dir]!.flight!.frames);
      expect(clip.frames).toHaveLength(8);
    }
  });

  it('a creature with no flight cycle keeps its walk', () => {
    const key = Object.keys(index.entities).find((k) => !clipsOf(k).front?.flight && clipsOf(k).front?.move);
    expect(key).toBeDefined();
    const clips = clipsOf(key!);
    expect(flyingClip(clips, 'front')!.frames).toEqual(clips.front!.move!.frames);
  });

  it('falls back to the walk when a side has no flight, and to nothing when there is no walk either', () => {
    const clips: DirectionalClips<number> = {
      front: { flight: { frames: [1, 2], mirror_horizontal: false }, move: { frames: [3], mirror_horizontal: false } },
      back: { move: { frames: [4], mirror_horizontal: false } },
    };
    expect(flyingClip(clips, 'front')!.frames).toEqual([1, 2]);
    expect(flyingClip(clips, 'back')!.frames).toEqual([4]);
    expect(flyingClip(clips, 'left')).toBeUndefined();
  });
});
