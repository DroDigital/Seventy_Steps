import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loopFrame, type SpriteDirection } from '../src/render/sprites/directional';
import { reviewedClips, reviewedSize, type ReviewedManifest } from '../src/render/sprites/reviewed';

const pack = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest & { frames: { source: string; sourceSha256: string; bounds: number[]; width: number; height: number }[] };
const [human, chaos] = [pack.entities.nyarlathotep!, pack.entities['nyarlathotep#eldritch']!];
const counts = (e: typeof human): Record<string, Record<string, number>> =>
  Object.fromEntries(Object.entries(e.directions).map(([d, v]) => [d, Object.fromEntries(Object.entries(v.actions).map(([a, ids]) => [a, ids!.length]))]));
const frame = (e: typeof human, direction: SpriteDirection, action: 'idle' | 'move' | 'attack' | 'hurt', n: number) => pack.frames[e.directions[direction].actions[action]![n]!]!;

describe("Nyarlathotep drawn again, both forms (the author's 'Redesigned' delivery)", () => {
  it('is the pharaoh in robes and the Crawling Chaos, not the old figure and the old mass: their frames are the delivery\'s', () => {
    expect(frame(human, 'front', 'idle', 0).sourceSha256).toBe('e4c0689efda06abc5f763e4234e857e1370365fe3fa8c5e67a5b699ac247f8d9');
    expect(frame(human, 'left', 'move', 5).sourceSha256).toBe('12d4131bad87d5073406964e57cd1d40326046e4f9a2600873b22912301d72bc');
    expect(frame(chaos, 'front', 'idle', 0).sourceSha256).toBe('5ee8d6165637eed89c4b9e8c626482970da07c968a3558ab5d8b86e2b8172cea');
    expect(frame(chaos, 'left', 'move', 5).sourceSha256).toBe('a03c03c46292ea227462c6b55a881891e7d6a885e8708bd2c2ee4416a418f9d7');
    expect(frame(chaos, 'right', 'move', 5).sourceSha256).toBe('df23d1ab6a35ddbbaf219a1c05eb131f6fff4c74c65eed93b87cb0bd78acf4ec');
  });

  it('keeps the human form\'s counts and its right turned round from its left; the monstrous form walks on six frames in every view', () => {
    expect(counts(human)).toEqual({
      front: { idle: 2, move: 4, attack: 4, hurt: 2 }, back: { idle: 2, move: 4 }, left: { idle: 2, move: 6 }, right: { idle: 2, move: 6 },
    });
    expect(human.directions.right).toMatchObject({ sourceDirection: 'left', mirror: true });
    expect(human.directions.right!.actions).toEqual(human.directions.left!.actions);
    expect(counts(chaos)).toEqual({
      front: { idle: 2, move: 6, attack: 3, hurt: 2 }, back: { idle: 2, move: 6 }, left: { idle: 2, move: 6 }, right: { idle: 2, move: 6 },
    });
    expect(chaos.directions.right).toMatchObject({ sourceDirection: 'right', mirror: false }); // drawn out in files, as it was
    for (let n = 0; n < 6; n++) expect(frame(chaos, 'right', 'move', n).source).toBe(`sprites/nyarlathotep/eldritch/64x64/right/move_${n}.png`);
  });

  it('stands every frame of both on one ground line and on the canvas, at the scale the fights were set for', () => {
    expect([human.scale, chaos.scale]).toEqual([2.6, 6]);
    for (const e of [human, chaos]) {
      for (const view of Object.values(e.directions)) for (const ids of Object.values(view.actions)) for (const id of ids!) {
        const f = pack.frames[id]!;
        expect([f.width, f.height]).toEqual([64, 64]);
        expect(f.bounds[3], f.source).toBe(62);
      }
      const size = reviewedSize(e, pack);
      expect(size.groundOffset).toBeCloseTo(size.height * (1 - 62 / 64), 8);
    }
  });

  it('is played through the adapter on its six-frame side walks, left and right, each frame once over a loop', () => {
    for (const [key, e] of [['nyarlathotep', human], ['nyarlathotep#eldritch', chaos]] as const) {
      const clips = reviewedClips(e, key);
      for (const side of ['left', 'right'] as const) {
        const walk = clips[side]!.move!;
        expect(walk.frames, `${key}/${side}`).toHaveLength(6);
        expect(Array.from({ length: 6 }, (_, i) => loopFrame((i + 0.5) / 6, 6, 1))).toEqual([0, 1, 2, 3, 4, 5]);
      }
      expect(clips.right!.move!.mirror_horizontal).toBe(key === 'nyarlathotep');
    }
  });
});
