import { describe, expect, it } from 'vitest';
import { brightnessGamma, HIGH_RESOLUTIONS, RENDER, SETTINGS } from '../src/data/tuning';
import { CALIBRATED_KEY, clampSetting, defaultSettings, isCalibrated, loadSettings, markCalibrated, parseSettings, SETTINGS_KEY, storeSettings } from '../src/ui/settings';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe('settings', () => {
  it('defaults to full FX, sensitivity 1, 800 × 450 and every sound level full (round 61, asked: all five sliders at 100%)', () => {
    expect(defaultSettings()).toEqual({
      fxCap: 1, sensitivity: 1, invertY: 0, resolution: 2, brightness: 1, fog: 1, relight: 0, shadows: 1, font: 0, uiScale: 1, shake: 1, captions: 1, captionBack: 0, flashes: 1, cutscenes: 1, questTracker: 1, quietWalk: 1, camera: 0, padSwap: 0,
      volume: 1, music: 1, sfx: 1, ambience: 1, speech: 1, language: 0,
    });
    expect([RENDER.width, RENDER.height].map((v) => Math.round(v * defaultSettings().resolution))).toEqual([800, 450]);
    // the standard steps are 320 × 180 to 800 × 450, the default the sharpest of them (round 58, asked; it was 640 × 360, which is drawn a whole number of times over on a 720p, 1080p, 1440p and 4K screen: 800 × 450 is not on any of them)
    expect([0.8, 1.2, 1.6, 2].map((scale) => clampSetting('resolution', scale))).toEqual([0.8, 1.2, 1.6, 2]);
    expect(SETTINGS.resolution[1]).toBe(defaultSettings().resolution);
    for (const screen of [720, 1080, 1440, 2160]) expect((screen / (RENDER.height * 1.6)) % 1).toBe(0); // 640 × 360 still is
  });

  it('makes the old 85% look the new 100% baseline and lets the player brighten it', () => {
    expect(SETTINGS.brightness).toEqual([0.9, 1.9, 0.05, 1]);
    expect(brightnessGamma(defaultSettings().brightness)).toBeCloseTo(1 / 0.85);
    expect(brightnessGamma(1.5)).toBeLessThan(brightnessGamma(1));
    const old = (brightness: number) => parseSettings(JSON.stringify({ brightness, v: 21 })).brightness;
    expect(old(1)).toBe(1); // the former default follows the new default
    expect(old(0.9)).toBe(1.05);
    expect(old(0.85)).toBe(1);
    expect(old(1.25)).toBe(1.45); // a brighter choice is retained approximately
    expect(old(0.7)).toBe(0.9); // the new slider starts at 90%
    const store = memoryStore();
    storeSettings(store, { ...defaultSettings(), brightness: 1.5 });
    expect(loadSettings(store).brightness).toBe(1.5);
  });

  it('shows the brightness card once: kept in the store, and never on a launch with no store to keep it in', () => {
    const store = memoryStore();
    expect(isCalibrated(store)).toBe(false);
    markCalibrated(store);
    expect(isCalibrated(store)).toBe(true);
    expect(store.getItem(CALIBRATED_KEY)).not.toBeNull();
    expect(isCalibrated(null)).toBe(true);
    const refusing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
    expect(isCalibrated(refusing)).toBe(true);
    expect(() => markCalibrated(refusing)).not.toThrow();
  });

  it('clamps into range and snaps to the step', () => {
    expect(clampSetting('fxCap', 1.7)).toBe(1);
    expect(clampSetting('fxCap', -3)).toBe(0);
    expect(clampSetting('fxCap', 0.33)).toBe(0.35);
    expect(clampSetting('resolution', 1.1)).toBe(1.2);
    expect(clampSetting('resolution', 0.9)).toBe(0.8);
    expect(clampSetting('resolution', 1.5)).toBe(1.6);
    expect(clampSetting('sensitivity', 0.1)).toBe(0.25);
    expect(clampSetting('volume', Number.NaN)).toBe(SETTINGS.volume[3]);
    expect(clampSetting('volume', '0.5')).toBe(SETTINGS.volume[3]);
  });

  it('moves a camera look saved before the Long lens was taken out: Long lens to Classic, Tight shoulder to its new place, the rest kept', () => {
    const saved = (camera: number, v: number) => JSON.stringify({ camera, v });
    expect(parseSettings(saved(2, 19)).camera).toBe(0); // Long lens: Classic
    expect(parseSettings(saved(3, 19)).camera).toBe(2); // Tight shoulder
    expect(parseSettings(saved(1, 19)).camera).toBe(1); // Low hero
    expect(parseSettings(saved(0, 18)).camera).toBe(0); // the original Classic choice is preserved
    expect(parseSettings(saved(2, 20)).camera).toBe(0); // round 82's numbering: 2 was the Long lens
    expect(parseSettings(saved(2, 21)).camera).toBe(2); // this version's own 2 is Tight shoulder
    expect(SETTINGS.camera[1]).toBe(2);
    const store = memoryStore();
    storeSettings(store, { ...defaultSettings(), camera: 2 });
    expect(loadSettings(store).camera).toBe(2); // kept as it was stored
  });

  it('a broken, partial or hostile entry parses to sane settings', () => {
    expect(parseSettings(null)).toEqual(defaultSettings());
    expect(parseSettings('{not json')).toEqual(defaultSettings());
    expect(parseSettings('[1,2]')).toEqual(defaultSettings());
    expect(parseSettings('{"fxCap":0.4,"resolution":9,"extra":1}')).toEqual({ ...defaultSettings(), fxCap: 0.4 });
  });

  it('keeps settings apart from the save, and survives a store that refuses', () => {
    const store = memoryStore();
    const s = { ...defaultSettings(), fxCap: 0.5, sensitivity: 1.5, font: 1 };
    storeSettings(store, s);
    expect(store.getItem(SETTINGS_KEY)).not.toBeNull();
    expect(loadSettings(store)).toEqual(s);
    const refusing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
    expect(() => storeSettings(refusing, s)).not.toThrow();
    expect(loadSettings(refusing)).toEqual(defaultSettings());
    expect(loadSettings(null)).toEqual(defaultSettings());
  });

  it('returns older high resolutions to the standard maximum without disturbing other settings', () => {
    expect(parseSettings('{"resolution":1}').resolution).toBe(defaultSettings().resolution);
    for (const version of [13, 14, 15]) {
      // a lower choice is kept, at the nearest of today's steps (the one that snaps to 640 × 360, the old default, goes to the new: round 58)
      for (const [resolution, now] of [[0.5, 0.8], [0.75, 0.8], [1, 1.2], [1.25, 1.2], [1.5, 2]]) expect(parseSettings(JSON.stringify({ resolution, v: version })).resolution).toBe(now);
    }
    expect(parseSettings(JSON.stringify({ resolution: 2, v: 15 })).resolution).toBe(2); // made after the warning: kept
    for (const version of [13, 14]) {
      for (const resolution of HIGH_RESOLUTIONS) {
        const chosen = { ...defaultSettings(), resolution, fxCap: 0.4, brightness: 1.25, fog: 0.5 };
        expect(parseSettings(JSON.stringify({ ...chosen, v: version }))).toEqual({ ...chosen, brightness: 1.45, resolution: defaultSettings().resolution });
      }
    }
    const store = memoryStore();
    storeSettings(store, { ...defaultSettings(), resolution: 1.2 });
    expect(loadSettings(store).resolution).toBe(1.2);
  });

  it('accepts optional higher resolutions and preserves them after an explicit choice', () => {
    expect(HIGH_RESOLUTIONS.map((scale) => [RENDER.width, RENDER.height].map((v) => Math.round(v * scale)))).toEqual([[960, 540]]);
    const store = memoryStore();
    for (const resolution of HIGH_RESOLUTIONS) {
      expect(clampSetting('resolution', resolution)).toBe(resolution);
      storeSettings(store, { ...defaultSettings(), resolution });
      expect(JSON.parse(store.getItem(SETTINGS_KEY)!).v).toBe(22);
      expect(loadSettings(store).resolution).toBe(resolution);
    }
    expect(clampSetting('resolution', 99)).toBe(2.4);
  });

  it('moves a picture kept at 640 × 360, the old default, to 800 × 450 once, and keeps every other choice (round 58)', () => {
    const kept = (resolution: number, v: number) => parseSettings(JSON.stringify({ ...defaultSettings(), resolution, v })).resolution;
    expect(kept(1.6, 16)).toBe(2); // the old default, kept by every save
    expect(kept(1.6, 15)).toBe(2);
    expect(kept(1.2, 16)).toBe(1.2); // a slow machine's choice, or the first launch's
    expect(kept(0.8, 16)).toBe(0.8);
    expect(kept(2.4, 16)).toBe(2.4); // a sharper choice
    expect(kept(2, 16)).toBe(2);
    expect(kept(1.6, 17)).toBe(1.6); // chosen since: a person who wants 640 × 360 keeps it
    // a first launch that stopped on a lowered rung (shadows off, the fog thinned) is a machine that missed the target at 640 × 360: it is not moved up
    const tuned = (extra: object, v: number) => parseSettings(JSON.stringify({ ...defaultSettings(), resolution: 1.6, ...extra, v })).resolution;
    for (const v of [15, 16]) {
      expect(tuned({ shadows: 0 }, v), `shadows off, v${v}`).toBe(1.6);
      expect(tuned({ shadows: 0, fog: 0.75 }, v), `shadows off, thinner fog, v${v}`).toBe(1.6);
      expect(tuned({ fog: 0.5 }, v), `fog thinned, v${v}`).toBe(1.6);
      expect(tuned({}, v), `untouched, v${v}`).toBe(2);
    }
    expect(tuned({ shadows: 0, fxCap: 0.4, brightness: 1.25 }, 16)).toBe(1.6); // the rest of the profile is what it was
    // (and a save from before the warning took the default of the day; a marked one still takes the old one, as it did)
    expect(parseSettings(JSON.stringify({ ...defaultSettings(), resolution: 1.2, shadows: 0, v: 12 })).resolution).toBe(1.6);
    expect(parseSettings(JSON.stringify({ ...defaultSettings(), resolution: 1.2, v: 12 })).resolution).toBe(2);
    const store = memoryStore();
    storeSettings(store, { ...defaultSettings(), resolution: 1.6 });
    expect(loadSettings(store).resolution).toBe(1.6);
  });

  it('moves a sound level kept at an earlier default (before round 60: 0.7 and four at 1; round 60: 0.5, 0.5, 1, 0.45, 0.55) to the new full mix once, and keeps every other choice', () => {
    const round59 = { ...defaultSettings(), volume: 0.7, music: 1, sfx: 1, ambience: 1, speech: 1 };
    const round60 = { ...defaultSettings(), volume: 0.5, music: 0.5, sfx: 1, ambience: 0.45, speech: 0.55 };
    const mix = (base: object, o: object, v: number) => { const s = parseSettings(JSON.stringify({ ...base, ...o, v })); return [s.volume, s.music, s.sfx, s.ambience, s.speech]; };
    expect(mix(round59, {}, 17)).toEqual([1, 1, 1, 1, 1]); // the old defaults, kept by every save
    expect(mix(round60, {}, 18)).toEqual([1, 1, 1, 1, 1]); // round 60's, kept by every save since
    expect(mix(round60, { volume: 0.4, music: 0.3 }, 18)).toEqual([0.4, 0.3, 1, 1, 1]); // chosen: kept
    expect(mix(round60, { sfx: 0.8, ambience: 0.5, speech: 0.5 }, 18)).toEqual([1, 1, 0.8, 0.5, 0.5]); // (a level that is not a default of any time is a choice)
    expect(mix(round59, {}, 18)).toEqual([0.7, 1, 1, 1, 1]); // 0.7 chosen since round 60: a person who wants it quieter keeps it
    expect(mix(round60, { volume: 0.6 }, 19)).toEqual([0.6, 0.5, 1, 0.45, 0.55]); // and nothing is moved again
    expect(parseSettings(JSON.stringify({ ...round59, resolution: 1.6, v: 17 })).resolution).toBe(1.6); // 17's choice of picture is still its own
  });

  it('defaults to Classic while preserving saved camera choices', () => {
    const camera = (o: object, v: number) => parseSettings(JSON.stringify({ ...defaultSettings(), ...o, v })).camera;
    expect(defaultSettings().camera).toBe(0);
    expect(parseSettings(null).camera).toBe(0);
    expect(parseSettings(JSON.stringify({ volume: 0.5, v: 19 })).camera).toBe(0);
    for (const version of [19, 20]) {
      expect(camera({ camera: 0 }, version)).toBe(0);
      expect(camera({ camera: 1 }, version)).toBe(1);
      expect(camera({ camera: 2 }, version)).toBe(0); // removed Long lens
      expect(camera({ camera: 3 }, version)).toBe(2); // Tight shoulder's new index
    }
    for (const choice of [0, 1, 2]) expect(camera({ camera: choice }, 21)).toBe(choice);
    const store = memoryStore();
    storeSettings(store, { ...defaultSettings(), camera: 1 });
    expect(loadSettings(store).camera).toBe(1);
  });
});
