import { describe, expect, it } from 'vitest';
import { ENDING_SCENES, NARRATION_AT } from '../src/data/cutscenesEndings';
import { ENDING_NARRATION } from '../src/data/endingNarration';
import { wordAt } from '../src/data/finale';
import type { EndingId } from '../src/data/endings';
import { MODEL_INFO } from '../src/data/models/index';
import { FINALE_PACK } from '../src/data/models/finalePack';
import { MODEL_PACK } from '../src/data/models/pack';
import { advanceScene } from '../src/render/cinemaPlan';

const inside = (id: EndingId, line: number, word: string): number => {
  const t = wordAt(ENDING_NARRATION[id][line]!, word);
  expect(t, `${id} ${word}`).toBeGreaterThan(0);
  expect(t, `${id} ${word}`).toBeLessThan(ENDING_NARRATION[id][line]!.seconds);
  return NARRATION_AT[id][line]! + t;
};

describe('the endings wait on the word (round 98)', () => {
  it('names each gesture inside the line that says it', () => {
    expect(ENDING_SCENES.seal!.beats.find((b) => b.act === 'Close your hand')).toMatchObject({ at: inside('seal', 1, 'close'), hand: 'close' });
    expect(ENDING_SCENES.seal!.beats.find((b) => b.hand === 'open')!.at).toBeCloseTo(inside('seal', 1, 'lets'), 5);
    expect(ENDING_SCENES.seal!.beats.find((b) => b.act === 'Wake')!.at).toBeCloseTo(inside('seal', 2, 'Wake'), 5);
    expect(ENDING_SCENES.silver_key!.beats.find((b) => b.act === 'Follow')!.at).toBeCloseTo(inside('silver_key', 0, 'follow'), 5);
    expect(ENDING_SCENES.silver_key!.beats.find((b) => b.act === 'Step through')!.at).toBeCloseTo(inside('silver_key', 1, 'wider'), 5);
    const knee = ENDING_SCENES.herald!.beats.find((b) => b.kneel)!;
    expect(knee.at).toBeCloseTo(inside('herald', 1, 'knee'), 5);
    expect(knee.act).toBe('Let the knee bend');
  });

  it('stops the seal on the hand, then on waking, and plays what falls between', () => {
    const scene = ENDING_SCENES.seal!;
    const close = scene.beats.find((b) => b.act === 'Close your hand')!;
    const first = advanceScene(scene, 0, 100, new Set());
    expect(first.act).toBe(close);
    expect(first.t).toBe(close.at);
    expect(first.beats).not.toContain(close);
    const wake = scene.beats.find((b) => b.act === 'Wake')!;
    const second = advanceScene(scene, first.t, 100, new Set([close.at]));
    expect(second.act).toBe(wake);
    expect(second.beats.some((b) => b.hand === 'open')).toBe(true);
    expect(second.beats).not.toContain(wake);
  });

  it('keeps the key, the arch and the clock out of the arenas', () => {
    for (const id of ['fn_key', 'fn_arch', 'fn_clock'] as const) {
      expect(MODEL_PACK[id]).toBe(FINALE_PACK[id]);
      expect(MODEL_INFO[id]).toBeUndefined();
    }
  });
});
