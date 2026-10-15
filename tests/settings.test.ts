import { describe, expect, it } from 'vitest';
import { RENDER, SETTINGS } from '../src/data/tuning';
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
  it('defaults to full FX, sensitivity 1, 700 × 394 and every level full', () => {
    expect(defaultSettings()).toEqual({
      fxCap: 1, sensitivity: 1, invertY: 0, resolution: 1.75, brightness: 1, fog: 1, shadows: 1, uiScale: 1, shake: 1, captions: 1, captionBack: 0, flashes: 1, cutscenes: 1, padSwap: 0,
      volume: SETTINGS.volume[3], music: 1, sfx: 1, ambience: 1, speech: 1, language: 0,
    });
    expect([RENDER.width, RENDER.height].map((v) => Math.round(v * defaultSettings().resolution))).toEqual([700, 394]);
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

  it('an older entry starts at the default resolution; versioned choices remain unchanged', () => {
    expect(parseSettings('{"resolution":1}').resolution).toBe(1.75);
    expect(parseSettings('{"resolution":1.5,"v":13}').resolution).toBe(1.75); // the last version's choice, 600 × 338, takes the new default once
    for (const resolution of [0.5, 1, 1.5, 2]) expect(parseSettings(JSON.stringify({ resolution, v: 14 })).resolution).toBe(resolution);
    const store = memoryStore();
    storeSettings(store, { ...defaultSettings(), resolution: 1 });
    expect(loadSettings(store).resolution).toBe(1);
  });
});
