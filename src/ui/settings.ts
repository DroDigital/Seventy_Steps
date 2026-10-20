/**
 * The player's settings (Phase 6): the FX intensity cap, look sensitivity, resolution scale and
 * volume, kept in localStorage apart from the save. Every value is clamped into its range (including
 * optional higher resolutions) and snapped to its step; a missing or bad value takes its default. Pure: no DOM.
 */

import { HIGH_RESOLUTIONS, SETTINGS } from '../data/tuning';
import type { SaveStore } from '../systems/save';

export type SettingId = keyof typeof SETTINGS;
export type Settings = Record<SettingId, number>;

export const SETTINGS_KEY = 'lovecraft-souls-like/settings';
export const SETTING_IDS = Object.keys(SETTINGS) as SettingId[];
/** Before 15, higher resolutions had no immersion warning: return those to the standard maximum once. 16: steps of 160 × 90 (a kept choice snaps to the nearest). 17: 800 × 450 is the default (a picture kept at 640 × 360, the default before, goes to it once). */
const VERSION = 17;
const OLD_DEFAULT = 1.6; // 640 × 360

export function defaultSettings(): Settings {
  return Object.fromEntries(SETTING_IDS.map((id) => [id, SETTINGS[id][3]])) as Settings;
}

/** `v` clamped into the setting's range and snapped to its step; not a number: the default. */
export function clampSetting(id: SettingId, v: unknown): number {
  const [min, standardMax, step, fallback] = SETTINGS[id];
  const max = id === 'resolution' ? Math.max(standardMax, ...HIGH_RESOLUTIONS) : standardMax;
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  const snapped = min + Math.round((Math.min(max, Math.max(min, v)) - min) / step + 1e-9) * step; // (a tie goes up, whatever the float error)
  return Number(Math.min(max, snapped).toFixed(6));
}

export function parseSettings(json: string | null): Settings {
  let raw: unknown = null;
  try {
    raw = json ? JSON.parse(json) : null;
  } catch {
    // A broken entry: the defaults.
  }
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const s = Object.fromEntries(SETTING_IDS.map((id) => [id, clampSetting(id, r[id])])) as Settings;
  // Keep a choice made since version 13 (snapped to today's steps above); 13 and 14's higher ones were made without the warning, so they, and anything older, take the default.
  const warned = r.v === VERSION || r.v === 16 || r.v === 15;
  const prior = r.v === 13 || r.v === 14;
  if (!warned && (!prior || s.resolution > SETTINGS.resolution[1])) s.resolution = SETTINGS.resolution[3];
  if (r.v !== VERSION && s.resolution === OLD_DEFAULT) s.resolution = SETTINGS.resolution[3]; // the old default was kept by every save of settings, chosen or not; a lower choice (a slow machine's, the first launch's) is kept
  return s;
}

export function loadSettings(store: Pick<SaveStore, 'getItem'> | null): Settings {
  try {
    return parseSettings(store?.getItem(SETTINGS_KEY) ?? null);
  } catch {
    return defaultSettings();
  }
}

export function storeSettings(store: Pick<SaveStore, 'setItem'> | null, s: Settings): void {
  try {
    store?.setItem(SETTINGS_KEY, JSON.stringify({ ...s, v: VERSION }));
  } catch {
    // Storage refused: the settings last until the page closes.
  }
}
