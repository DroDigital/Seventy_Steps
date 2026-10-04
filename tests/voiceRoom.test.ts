import { describe, expect, it } from 'vitest';
import { impulseOf } from '../src/render/audio/voiceRoom';
import { CAST } from '../src/data/speechCast';

const fake = (rate = 8000): BaseAudioContext =>
  ({ sampleRate: rate, createBuffer: (n: number, len: number, r: number) => { const d = Array.from({ length: n }, () => new Float32Array(len)); return { numberOfChannels: n, length: len, sampleRate: r, getChannelData: (c: number) => d[c] }; } }) as unknown as BaseAudioContext;

describe('the voice room (round 39)', () => {
  it('makes a stereo impulse that dies away, differently in each ear, and is kept', () => {
    const ctx = fake();
    const b = impulseOf(ctx, 2);
    const [l, r] = [b.getChannelData(0), b.getChannelData(1)];
    const peak = (d: Float32Array, a: number, z: number): number => d.slice(a, z).reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    expect(l.every(Number.isFinite)).toBe(true);
    expect(peak(l, 8000 * 1.8, l.length)).toBeLessThan(peak(l, 0, 8000 * 0.3) * 0.1);
    expect(l).not.toEqual(r);
    expect(impulseOf(ctx, 2)).toBe(b);
  });
  it('is the narrator who sits in it, and no one else yet', () => {
    expect(CAST['narrator:intro'].room).toBe(true);
    expect(Object.entries(CAST).filter(([, v]) => v.room).length).toBe(1);
  });
});
