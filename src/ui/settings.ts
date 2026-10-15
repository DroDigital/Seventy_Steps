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
/** Before 15, higher resolutions had no immersion warning: return those to the standard maximum once. */
const VERSION = 15;

export function defaultSettings(): Settings {
  return Object.fromEntries(SETTING_IDS.map((id) => [id, SETTINGS[id][3]])) as Settings;
}

/** `v` clamped into the setting's range and snapped to its step; not a number: the default. */
export function clampSetting(id: SettingId, v: unknown): number {
  const [min, standardMax, step, fallback] = SETTINGS[id];
  const max = id === 'resolution' ? Math.max(standardMax, ...HIGH_RESOLUTIONS) : standardMax;
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  const snapped = min + Math.round((Math.min(max, Math.max(min, v)) - min) / step) * step;
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
  // Keep versions 13 and 14's lower choices; older entries still take the default, as they did before.
  const prior = r.v === 13 || r.v === 14;
  if (r.v !== VERSION && (!prior || s.resolution > SETTINGS.resolution[1])) s.resolution = SETTINGS.resolution[3];
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
