import { describe, expect, it } from 'vitest';
import { createFrameStats } from '../src/core/frameStats';
import { LADDER, nextRung, QUALITY, rungOf } from '../src/render/autoQuality';
import { AUTO_KEY, createAutoQuality, firstLaunch } from '../src/ui/autoQualityRun';
import { defaultSettings, SETTINGS_KEY } from '../src/ui/settings';
import type { Shell } from '../src/ui/shell';

const feed = (ms: number[]) => {
  const s = createFrameStats(600);
  for (const m of ms) s.push(m);
  return s.summary();
};

describe('frame statistics', () => {
  it('a steady 60 fps reads 60, with nothing to be low about', () => {
    const r = feed(Array(300).fill(1000 / 60));
    expect(r.fps).toBeCloseTo(60, 3);
    expect(r.low).toBeCloseTo(60, 3);
    expect(r.worst).toBeCloseTo(16.67, 1);
  });

  it('stutters show in the 1% low and the worst frame, not in the average', () => {
    const r = feed([...Array(297).fill(16), 120, 120, 120]);
    expect(r.fps).toBeGreaterThan(55);
    expect(r.low).toBeLessThan(10);
    expect(r.worst).toBe(120);
  });

  it('forgets the oldest frames, and leaves out pauses over two seconds and bad numbers', () => {
    const s = createFrameStats(10);
    for (let i = 0; i < 10; i++) s.push(100);
    for (let i = 0; i < 10; i++) s.push(10);
    for (const bad of [NaN, -1, 0, 5000]) s.push(bad);
    expect(s.summary().frames).toBe(10);
    expect(s.summary().fps).toBeCloseTo(100, 3);
    s.clear();
    expect(s.summary().frames).toBe(0);
  });
});

describe('the quality ladder', () => {
  it('starts at the default picture and every rung is no sharper than the one above', () => {
    expect(LADDER[0]).toEqual({ resolution: 1.5, fog: 1, shadows: 1 });
    for (let i = 1; i < LADDER.length; i++) {
      expect(LADDER[i].resolution).toBeLessThanOrEqual(LADDER[i - 1].resolution);
      expect(LADDER[i].fog).toBeLessThanOrEqual(LADDER[i - 1].fog);
      expect(LADDER[i].shadows).toBeLessThanOrEqual(LADDER[i - 1].shadows);
    }
    expect(rungOf(LADDER[3])).toBe(3);
    expect(rungOf({ resolution: 2, fog: 1, shadows: 1 })).toBe(0);
  });

  it('steps down one rung when slow, two when poor, none when smooth or unmeasured, and stops at the last', () => {
    const at = (fps: number, frames = 300) => ({ frames, fps, low: fps, p95: 0, worst: 0 });
    expect(nextRung(0, at(QUALITY.smooth + 5))).toBe(0);
    expect(nextRung(0, at(40))).toBe(1);
    expect(nextRung(0, at(20))).toBe(2);
    expect(nextRung(0, at(10, 2))).toBe(0);
    expect(nextRung(LADDER.length - 1, at(5))).toBe(LADDER.length - 1);
  });
});

describe('first-launch picture', () => {
  function launch() {
    const kept = new Map<string, string>();
    const settings = defaultSettings();
    const store = {
      getItem: (key: string) => kept.get(key) ?? null,
      setItem: (key: string, value: string) => void kept.set(key, value),
      removeItem: (key: string) => void kept.delete(key),
    };
    const shell = { settings, store, change: (id, value) => { settings[id] = value; } } as Shell;
    const stats = createFrameStats();
    const notices: string[] = [];
    const quality = createAutoQuality(shell, stats, (text) => notices.push(text), firstLaunch(store));
    const measuredAt = 1000 + (QUALITY.warm + QUALITY.measure) * 1000;
    quality.tick(1000);
    quality.tick(1000 + QUALITY.warm * 1000);
    const frames = (fps: number) => { for (let i = 0; i < 300; i++) stats.push(1000 / fps); };
    return { settings, store, quality, measuredAt, frames, notices };
  }

  it('keeps 600 × 338 when the default picture runs smoothly', () => {
    const run = launch();
    run.frames(60);
    run.quality.tick(run.measuredAt);
    expect(run.settings).toEqual(defaultSettings());
    expect(run.store.getItem(AUTO_KEY)).toBe('1');
    expect(run.notices).toEqual([]);
  });

  it('measures the new default and removes shadows before reducing its resolution', () => {
    const run = launch();
    run.frames(40);
    run.quality.tick(run.measuredAt);
    expect(run.settings).toEqual({ ...defaultSettings(), shadows: 0 });
    run.frames(60);
    run.quality.tick(run.measuredAt + (1.5 + QUALITY.measure) * 1000);
    expect(run.settings.resolution).toBe(1.5);
    expect(run.store.getItem(AUTO_KEY)).toBe('1');
    expect(run.notices).toHaveLength(1);
  });

  it('leaves a saved resolution choice out of first-launch tuning', () => {
    const run = launch();
    run.store.setItem(SETTINGS_KEY, JSON.stringify({ ...defaultSettings(), resolution: 2, v: 15 }));
    expect(firstLaunch(run.store)).toBe(false);
  });
});

import { SPOTS, verdict } from '../src/ui/bench';
import { signPlace } from '../src/systems/checkpoints';

describe('the benchmark', () => {
  it('visits real signs, and says in words how it went', () => {
    for (const s of SPOTS) expect(signPlace(s.sign), s.sign).toBeDefined();
    const row = (fps: number, low: number) => [{ what: 'x', fps, low, worst: 0 }];
    expect(verdict(row(60, 55))).toContain('Smooth');
    expect(verdict(row(45, 30))).toContain('Playable');
    expect(verdict(row(20, 10))).toContain('Too slow');
  });
});
