import { describe, expect, it } from 'vitest';
import { PAPER } from '../src/data/paperTuning';
import { PAPER_BURN } from '../src/data/paperSounds';
import { RATE, render } from './soundRender';

describe('the sound of paper burning away', () => {
  const { peak, sec } = render(PAPER_BURN);

  it('is made of layers that begin and end inside the burn', () => {
    for (const l of PAPER_BURN) {
      expect(l.dur).toBeGreaterThan(0);
      expect((l.at ?? 0) + l.dur).toBeLessThanOrEqual(PAPER.burn.total);
    }
  });

  it('is heard, and is not too loud, and lasts about as long as the burn crosses the leaf', () => {
    expect(peak).toBeGreaterThan(-14);
    expect(peak).toBeLessThan(0);
    expect(sec).toBeGreaterThan(PAPER.burn.front * 0.6);
    expect(sec).toBeLessThanOrEqual(PAPER.burn.total);
  });

  it('crackles more at the start than the end: the crackles thin as the fire dies', () => {
    const pops = PAPER_BURN.filter((l) => l.filter?.type === 'highpass' && l.dur < 0.1); // (each a short click: the whoosh, the body and the hiss are long)
    expect(pops.length).toBeGreaterThan(6);
    const at = pops.map((l) => l.at ?? 0);
    const half = PAPER.burn.front / 2;
    expect(at.filter((t) => t < half).length).toBeGreaterThan(at.filter((t) => t >= half).length);
    const gaps = at.slice(1).map((t, k) => t - at[k]);
    expect(gaps[gaps.length - 1]).toBeGreaterThan(gaps[0]); // (the spaces between them widen)
    const alone = render(pops);
    const energy = (from: number, to: number): number => {
      let e = 0;
      for (let i = Math.round(from * RATE); i < Math.min(alone.samples.length, Math.round(to * RATE)); i++) e += alone.samples[i] * alone.samples[i];
      return e;
    };
    expect(energy(0, 0.7)).toBeGreaterThan(energy(0.7, 1.7) * 1.5); // (heard on their own, with no whoosh to carry the start)
  });
});
