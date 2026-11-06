import { describe, expect, it } from 'vitest';
import { ENDING_SCENES } from '../src/data/cutscenesEndings';
import { FX } from '../src/data/tuning';
import { sceneLength } from '../src/render/cinemaPlan';
import { allEffectsOn, computeFx, sanityStress } from '../src/render/fx';
import { endingMind, endingSanity } from '../src/render/finaleMind';

const state = (sanity: number, cap = 1) => ({ sanity, cap, anomalyProximity: 0, enabled: allEffectsOn() });

describe('an ending keeps a failing mind through its last fade (round 98)', () => {
  it('climbs and then holds, and never gives back what the mind already lost', () => {
    expect(endingMind(0, 40)).toBe(0);
    expect(endingMind(20, 40)).toBe(1);
    expect(endingMind(40, 40)).toBe(1);
    expect(endingMind(10, 40)).toBeGreaterThan(endingMind(4, 40));
    expect(endingSanity('wake', 30, 10)).toBeNull();
    expect(endingSanity('ending:seal', 0, 25)).toBe(25);
    expect(endingSanity('ending:seal', 0, 0)).toBe(0);
  });

  it('is gone by halfway of every ending and still gone when the picture goes black', () => {
    for (const scene of Object.values(ENDING_SCENES)) {
      const length = sceneLength(scene);
      const black = scene.beats.find((b) => b.fade === 'black')!;
      expect(black.at).toBeGreaterThan(length * 0.5);
      let prev = 100;
      for (let i = 0; i <= 20; i++) {
        const s = endingSanity(scene.id, (length * i) / 20, 100)!;
        expect(s).toBeLessThanOrEqual(prev + 1e-9);
        prev = s;
      }
      expect(endingSanity(scene.id, length * 0.5, 100)).toBe(0);
      expect(endingSanity(scene.id, black.at, 100)).toBe(0);
      expect(endingSanity(scene.id, length, 100)).toBe(0);
      expect(endingSanity(scene.id, length, 12)).toBe(0);
    }
  });

  it('drives the picture, and the accessibility cap still bounds it', () => {
    const length = sceneLength(ENDING_SCENES.herald!);
    const early = endingSanity('ending:herald', length * 0.08, 100)!;
    const late = endingSanity('ending:herald', length * 0.7, 100)!;
    expect(1 - early / 100).toBeGreaterThan(FX.calm);
    expect(late).toBe(0);
    const calm = computeFx(state(100));
    const mad = computeFx(state(late));
    expect(mad.ripple).toBeGreaterThan(calm.ripple);
    expect(mad.strange).toBeGreaterThan(calm.strange);
    expect(mad.desaturate).toBeGreaterThan(calm.desaturate);
    expect(mad.heard).toBeGreaterThan(calm.heard);
    expect(mad.stress).toBe(1);
    expect(computeFx(state(late, 0.25)).stress).toBe(sanityStress(0, 0.25));
  });
});
