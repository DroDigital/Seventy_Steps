import { describe, expect, it } from 'vitest';
import { STINGERS, type Sound } from '../src/data/sounds';
import { createVarier, varied } from '../src/render/audio/vary';
import { render } from './soundRender';

const seeded = (n: number): (() => number) => {
  let s = n;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

describe('variation: no sound plays twice the same (round 40)', () => {
  it('changes nothing at amount 0', () => {
    for (const s of Object.values(STINGERS)) expect(varied(s as Sound, seeded(1), 0, 1).map((l) => [l.hz, l.dur, l.gain, l.filter?.hz])).toEqual((s as Sound).map((l) => [l.hz, l.dur, l.gain, l.filter?.hz]));
  });

  it('keeps a sound in tune with itself: one pitch for every layer, so a chord stays a chord', () => {
    const chord = STINGERS.levelUp;
    const v = varied(chord, seeded(7), 1);
    const ratios = chord.filter((l) => l.hz && l.src !== 'noise').map((l, i) => v.filter((x) => x.hz && x.src !== 'noise')[i].hz! / l.hz!);
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 9);
    expect(Math.abs(ratios[0] - 1)).toBeLessThanOrEqual(0.045 + 1e-9);
  });

  it('stays near what was written: levels within ~1.5 dB, starts within a few ms, lengths within 5%', () => {
    const rand = seeded(5);
    for (let n = 0; n < 40; n++) {
      for (const [id, s] of Object.entries(STINGERS)) {
        const v = varied(s as Sound, rand, 1);
        (s as Sound).forEach((l, i) => {
          expect(Math.abs(20 * Math.log10(v[i].gain / l.gain)), id).toBeLessThanOrEqual(1.2 + 1e-9);
          expect(Math.abs((v[i].at ?? 0) - (l.at ?? 0)), id).toBeLessThanOrEqual(0.006 + 1e-9);
          expect(Math.abs(v[i].dur / l.dur - 1), id).toBeLessThanOrEqual(0.05 + 1e-9);
        });
      }
    }
  });

  it('is drawn anew each time, never at the last play\'s pitch, and renders differently', () => {
    const vary = createVarier(seeded(3));
    const plays = Array.from({ length: 12 }, () => vary('hit', STINGERS.hit));
    for (let i = 1; i < plays.length; i++) expect(Math.abs(plays[i][1].hz! - plays[i - 1][1].hz!) / STINGERS.hit[1].hz!, `play ${i}`).toBeGreaterThanOrEqual(0.012 - 1e-6);
    const [a, b] = [render(plays[0]), render(plays[1])];
    expect(a.samples.some((s, i) => Math.abs(s - (b.samples[i] ?? 0)) > 1e-4)).toBe(true);
  });

  it('never gives a layer a start before the sound or a length it cannot play', () => {
    const rand = seeded(9);
    for (const s of Object.values(STINGERS)) for (const l of varied(s as Sound, rand, 2)) {
      expect(l.at ?? 0).toBeGreaterThanOrEqual(0);
      expect(l.dur).toBeGreaterThan(0);
      expect(l.gain).toBeGreaterThan(0);
      expect(Number.isFinite(l.hz ?? 1)).toBe(true);
    }
  });

  it('a sound made of the same recipe renders to nearly the same loudness each time: it varies, it does not jump', () => {
    const rand = seeded(13);
    const base = render(STINGERS.hit).rms;
    for (let n = 0; n < 30; n++) expect(Math.abs(render(varied(STINGERS.hit, rand, 1.5)).rms - base)).toBeLessThan(3);
  });
});
