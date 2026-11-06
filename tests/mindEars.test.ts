import { describe, expect, it } from 'vitest';
import { MIND_EARS, MIND_SOUNDS } from '../src/data/mindSounds';
import { gutterGain, kindleGain, lanternGain, LANTERN_LIFE } from '../src/render/lanternLife';
import { createMindEars, lanternStep, ringAfter, ringLevel, ringStrike, type LanternCue, type LanternEar } from '../src/render/audio/mindEars';
import type { AtmAudioContext } from '../src/render/audio/atmosphereAudio';
import { MIND_TIDE, tideOf } from '../src/render/audio/mindTide';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';
import { render } from './soundRender';

const db = (v: number): number => 20 * Math.log10(v);

describe('the ringing (round 80)', () => {
  it('begins at the Uneasy line, creeps up with the stress and never passes its ceiling, a good way under a whisper', () => {
    expect(ringLevel(0)).toBe(0);
    expect(ringLevel(MIND_EARS.ring.from)).toBe(0);
    expect(ringLevel(0.5)).toBeGreaterThan(0);
    expect(ringLevel(0.8)).toBeGreaterThan(ringLevel(0.5));
    expect(ringLevel(1)).toBeCloseTo(MIND_EARS.ring.ceiling, 8);
    expect(ringLevel(5)).toBeCloseTo(MIND_EARS.ring.ceiling, 8);
    expect(db(MIND_EARS.ring.ceiling)).toBeLessThanOrEqual(-45); // a whisper's takes peak some twenty dB over it
    expect(MIND_EARS.ring.mix[0] + MIND_EARS.ring.mix[1]).toBeCloseTo(1); // the two sines sum to a peak of one, as the ceiling is
  });

  it('a heavy blow rings it a moment more, a scratch or a steady mind not at all, and the sum has a hard ceiling', () => {
    expect(ringStrike(0.02, 1)).toBe(0); // a scratch
    expect(ringStrike(0.5, 0.1)).toBe(0); // a steady mind: its ears are its own
    expect(ringStrike(0.2, 0.9)).toBeGreaterThan(0);
    expect(ringStrike(0.6, 1)).toBeLessThanOrEqual(MIND_EARS.ring.struck.add);
    expect(db(ringLevel(1) + ringStrike(1, 1))).toBeLessThan(-36);
    const add = ringStrike(0.5, 1);
    expect(ringAfter(add, -1)).toBe(0);
    expect(ringAfter(add, MIND_EARS.ring.struck.attack)).toBeGreaterThan(add * 0.6); // up at once
    expect(ringAfter(add, MIND_EARS.ring.struck.decay)).toBeLessThan(add * 0.06); // and gone in a second or two
  });
});

describe('the tide (round 80)', () => {
  it('closes the high end only when Unmoored, never past its depth, and in a slow swell', () => {
    expect(tideOf(3, 0.8)).toBe(0);
    expect(tideOf(3, 0)).toBe(0);
    const xs = Array.from({ length: 700 }, (_, i) => tideOf(i / 100, 1));
    expect(Math.min(...xs)).toBeCloseTo(0, 2);
    expect(Math.max(...xs)).toBeLessThanOrEqual(MIND_EARS.tide.depth + 1e-9);
    expect(Math.max(...xs)).toBeGreaterThan(MIND_EARS.tide.depth * 0.95);
    expect(tideOf(1, 0.91)).toBeLessThan(tideOf(1, 1) + 1e-9); // in over a stretch of the stress
    expect(MIND_TIDE.muffle).toBe(0); // (and is asked for by nobody before the audio part writes it)
  });
});

/** The cues heard as the lantern's own gain runs `gains`, one a frame, from lit (or dark). */
function heard(gains: readonly number[], dark = false): LanternCue[] {
  const ear: LanternEar = { armed: !dark, dark };
  return gains.flatMap((x) => lanternStep(ear, x) ?? []);
}
const frames = (f: (age: number) => number, seconds: number): number[] => Array.from({ length: Math.round(seconds * 60) + 1 }, (_, i) => f(i / 60));
const dips = (xs: number[]): number => xs.reduce((n, x, i) => n + (i > 0 && xs[i - 1] > 0.6 && x < 0.3 ? 1 : 0), 0);

describe('the lantern heard (round 80)', () => {
  it('spits at each dip as it gutters, and dies once with a hiss, and nothing when it burns steady', () => {
    const xs = frames(gutterGain, LANTERN_LIFE.gutter + 0.2);
    const cues = heard(xs);
    expect(cues.filter((c) => c === 'spit').length).toBeGreaterThanOrEqual(Math.max(2, dips(xs))); // a spit for each of the dips the picture shows (and for the slower ones it draws too)
    expect(cues.filter((c) => c === 'spit').length).toBeLessThanOrEqual(dips(xs) + 3);
    expect(cues.filter((c) => c === 'out')).toHaveLength(1);
    expect(cues[cues.length - 1]).toBe('out');
    expect(cues).not.toContain('catch');
    expect(heard(Array(600).fill(1))).toEqual([]);
    expect(heard(Array(600).fill(0), true)).toEqual([]); // a game begun dark (loaded Unmoored) is not heard going out
  });

  it('catches with one whump as it kindles, and spits no more than it stutters', () => {
    const cues = heard(frames(kindleGain, LANTERN_LIFE.kindle + 0.2), true);
    expect(cues.filter((c) => c === 'catch')).toHaveLength(1);
    expect(cues[0]).toBe('catch');
    expect(cues.filter((c) => c === 'spit').length).toBeLessThanOrEqual(2);
    expect(cues).not.toContain('out');
  });

  it('follows the real lantern through a fall and a climb: spits, out, dark for a long while, catching once', () => {
    const g = createWorldGame();
    const log: string[] = [];
    const ears = createMindEars({ g, e: {}, recipe: (name: string) => { log.push(name); } } as unknown as AtmAudioContext);
    const tick = (n: number): void => {
      for (let i = 0; i < n; i++) {
        g.frame += 1;
        ears.update(0, false);
      }
    };
    setSanity(g, 10); // Unmoored
    tick(60 * 3);
    expect(log.filter((c) => c === 'mind:lanternOut')).toHaveLength(1);
    expect(log.filter((c) => c === 'mind:lanternSpit').length).toBeGreaterThanOrEqual(2);
    tick(60 * 600);
    expect(log.filter((c) => c === 'mind:lanternOut')).toHaveLength(1); // out it stays, silent
    setSanity(g, 25); // Fractured
    tick(60 * 4);
    expect(log.filter((c) => c === 'mind:lanternKindle')).toHaveLength(1);
    expect(log.indexOf('mind:lanternKindle')).toBeGreaterThan(log.indexOf('mind:lanternOut'));
  });

  it('dims and brightens with sanity within the lit bands without making lifecycle sounds', () => {
    const g = createWorldGame();
    const log: string[] = [];
    const ears = createMindEars({ g, e: {}, recipe: (name: string) => { log.push(name); } } as unknown as AtmAudioContext);
    const full = lanternGain(g);
    for (let sanity = 100; sanity >= 15; sanity--) {
      setSanity(g, sanity);
      g.frame += 1;
      ears.update(0, false);
    }
    expect(lanternGain(g)).toBeLessThan(full);
    for (let sanity = 15; sanity <= 100; sanity++) {
      setSanity(g, sanity);
      g.frame += 1;
      ears.update(0, false);
    }
    expect(lanternGain(g)).toBe(full);
    expect(log).toEqual([]);
  });

  it('every sound of it is quiet and not silent: its peak, with the gain it is played at, is under a whisper\'s best and over -40 dBFS', () => {
    const L = MIND_EARS.lantern;
    for (const [sound, gain] of [[MIND_SOUNDS.lanternSpit, L.spit], [MIND_SOUNDS.lanternOut, L.died], [MIND_SOUNDS.lanternKindle, L.kindled], [MIND_SOUNDS.breath, 0.8]] as const) {
      const peak = render(sound).peak + db(gain);
      expect(peak).toBeLessThan(-18);
      expect(peak).toBeGreaterThan(-40);
    }
    expect(render(MIND_SOUNDS.lanternSpit).sec).toBeLessThan(0.4); // a spit is short
    expect(render(MIND_SOUNDS.lanternOut).sec).toBeLessThan(1.2);
    expect(render(MIND_SOUNDS.lanternKindle).sec).toBeLessThan(1.4);
  });
});
