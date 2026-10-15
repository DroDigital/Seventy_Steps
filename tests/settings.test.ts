import { describe, expect, it } from 'vitest';
import { HIGH_RESOLUTIONS, RENDER, SETTINGS } from '../src/data/tuning';
import { clampSetting, defaultSettings, loadSettings, parseSettings, SETTINGS_KEY, storeSettings } from '../src/ui/settings';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('settings', () => {
  it('defaults to full FX, sensitivity 1, 600 × 338 and every level full', () => {
    expect(defaultSettings()).toEqual({
      fxCap: 1, sensitivity: 1, invertY: 0, resolution: 1.5, brightness: 1, fog: 1, shadows: 1, uiScale: 1, shake: 1, captions: 1, captionBack: 0, flashes: 1, cutscenes: 1, padSwap: 0,
      volume: SETTINGS.volume[3], music: 1, sfx: 1, ambience: 1, speech: 1, language: 0,
    });
    expect([RENDER.width, RENDER.height].map((v) => Math.round(v * defaultSettings().resolution))).toEqual([600, 338]);
    expect(SETTINGS.resolution[1]).toBe(defaultSettings().resolution);
  });

  it('clamps into range and snaps to the step', () => {
    expect(clampSetting('fxCap', 1.7)).toBe(1);
    expect(clampSetting('fxCap', -3)).toBe(0);
    expect(clampSetting('fxCap', 0.33)).toBe(0.35);
    expect(clampSetting('resolution', 1.1)).toBe(1);
    expect(clampSetting('resolution', 1.2)).toBe(1.25);
    expect(clampSetting('sensitivity', 0.1)).toBe(0.25);
    expect(clampSetting('volume', Number.NaN)).toBe(SETTINGS.volume[3]);
    expect(clampSetting('volume', '0.5')).toBe(SETTINGS.volume[3]);
  });

  it('a broken, partial or hostile entry parses to sane settings', () => {
    expect(parseSettings(null)).toEqual(defaultSettings());
    expect(parseSettings('{not json')).toEqual(defaultSettings());
    expect(parseSettings('[1,2]')).toEqual(defaultSettings());
    expect(parseSettings('{"fxCap":0.4,"resolution":9,"extra":1}')).toEqual({ ...defaultSettings(), fxCap: 0.4 });
  });

  it('keeps settings apart from the save, and survives a store that refuses', () => {
    const store = memoryStore();
    const s = { ...defaultSettings(), fxCap: 0.5, sensitivity: 1.5 };
    storeSettings(store, s);
    expect(store.getItem(SETTINGS_KEY)).not.toBeNull();
    expect(loadSettings(store)).toEqual(s);
    const refusing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
    expect(() => storeSettings(refusing, s)).not.toThrow();
    expect(loadSettings(refusing)).toEqual(defaultSettings());
    expect(loadSettings(null)).toEqual(defaultSettings());
  });

  it('returns older high resolutions to the standard maximum without disturbing other settings', () => {
    expect(parseSettings('{"resolution":1}').resolution).toBe(1.5);
    for (const version of [13, 14]) {
      for (const resolution of [0.5, 0.75, 1, 1.25, 1.5]) expect(parseSettings(JSON.stringify({ resolution, v: version })).resolution).toBe(resolution);
      for (const resolution of HIGH_RESOLUTIONS) {
        const chosen = { ...defaultSettings(), resolution, fxCap: 0.4, brightness: 1.25, fog: 0.5 };
        expect(parseSettings(JSON.stringify({ ...chosen, v: version }))).toEqual({ ...chosen, resolution: 1.5 });
      }
    }
    const store = memoryStore();
    storeSettings(store, { ...defaultSettings(), resolution: 1 });
    expect(loadSettings(store).resolution).toBe(1);
  });

  it('accepts optional higher resolutions and preserves them after an explicit choice', () => {
    expect(HIGH_RESOLUTIONS.map((scale) => [RENDER.width, RENDER.height].map((v) => Math.round(v * scale)))).toEqual([[700, 394], [800, 450]]);
    const store = memoryStore();
    for (const resolution of HIGH_RESOLUTIONS) {
      expect(clampSetting('resolution', resolution)).toBe(resolution);
      storeSettings(store, { ...defaultSettings(), resolution });
      expect(JSON.parse(store.getItem(SETTINGS_KEY)!).v).toBe(15);
      expect(loadSettings(store).resolution).toBe(resolution);
    }
    expect(clampSetting('resolution', 99)).toBe(2);
  });
});
