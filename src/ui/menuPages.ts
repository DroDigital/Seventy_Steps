/**
 * Pages the title screen and the pause menu share (Phase 6): the settings, each applied at once and
 * kept, and the controls. Round 12: the settings gained brightness, UI scale, screen shake, invert
 * look, music, effects and ambience volumes, and fullscreen; the keyboard's keys can be rebound on
 * the Controls page (core/bindings.ts), and the buttons each prompt names follow the device in hand.
 */

import { ACTIONS, DEFAULT_KEYS, keyLayout, keyName, rebind, type Action } from '../core/bindings';
import { padReport } from '../core/pads';
import { t } from '../core/i18n';
import { LANGS, type Key } from '../data/lang';
import { RENDER, SETTINGS } from '../data/tuning';
import { desktop } from './desktop';
import { button, el, footer, slider, tabs, title, type Page } from './menuKit';
import { menuKeys } from './menuKeys';
import type { SettingId, Settings } from './settings';

const pct = (v: number): string => `${Math.round(v * 100)}%`;
const onOff = (v: number): string => t(v > 0.5 ? 'val.on' : 'val.off');
/** Each setting's name (a key `set.<id>`), and how its value reads. */
type Slid = Exclude<SettingId, 'language'>;
const SHOW: Record<Slid, (v: number) => string> = {
  fxCap: pct,
  sensitivity: (v) => `×${v.toFixed(2)}`,
  invertY: onOff,
  resolution: (v) => `${Math.round(RENDER.width * v)}×${Math.round(RENDER.height * v)}`,
  brightness: pct,
  fog: (v) => (v > 0 ? pct(v) : t('val.off')),
  shadows: onOff,
  uiScale: (v) => `×${v.toFixed(2)}`,
  shake: pct,
  cutscenes: onOff,
  padSwap: onOff,
  volume: pct,
  music: pct,
  sfx: pct,
  ambience: pct,
  speech: pct,
};
const NAME = (id: SettingId): string => t(`set.${id}` as Key);
/** The settings' tabs, each a few lines that fit the panel, and what each line does (said under the list as it is chosen). */
const TABS: readonly (readonly [Key, readonly Slid[]])[] = [
  ['set.tab.display', ['resolution', 'brightness', 'fog', 'shadows', 'uiScale']],
  ['set.tab.sound', ['volume', 'music', 'sfx', 'ambience', 'speech']],
  ['set.tab.play', ['sensitivity', 'invertY', 'shake', 'fxCap', 'cutscenes']],
];
const HINT = (id: SettingId): string | undefined => {
  const k = `set.hint.${id}` as Key;
  return k in LANGS[0].table ? t(k) : undefined;
};

/** Fullscreen on or off: the desktop shell's window, or the browser's. */
async function fullscreen(on: boolean): Promise<void> {
  if (desktop) return desktop.setFullscreen(on);
  if (on) await document.documentElement.requestFullscreen?.().catch(() => undefined);
  else if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
}
const isFullscreen = async (): Promise<boolean> => (desktop ? desktop.isFullscreen() : !!document.fullscreenElement);

/** Every change goes to `change` (which applies and keeps it); `back` leaves. `at`: the tab it opens on. Controls is the last tab (the keys' table: controlsTab). */
export function settingsPage(s: Settings, change: (id: SettingId, v: number) => void, back: () => void, saveKeys: () => void = () => undefined, at = 0): Page {
  let open = at;
  let waiting: Action | null = null;
  let refused = false; // the last key pressed was one that cannot be taken
  const page: Page = {
    back: () => ((waiting = null), (refused = false), back()),
    keys(e) {
      if (!waiting || e.repeat || e.code === 'Escape') return;
      e.preventDefault();
      refused = !rebind(keyLayout, waiting, e.code);
      if (!refused) saveKeys();
      waiting = null;
      page.redraw?.();
    },
    build(panel) {
      title(panel, t('set.title'));
      tabs(panel, [...TABS.map(([n]) => t(n)), t('set.tab.controls')], open, (i) => ((open = i), (waiting = null), (refused = false), page.redraw?.()), page);
      if (open === TABS.length) return controlsTab(panel, page, () => waiting, (a) => (waiting = a), () => refused, saveKeys, s.padSwap > 0.5, (on) => change('padSwap', on ? 1 : 0));
      const body = el(panel, 'div', '', 'min-height:226px');
      if (open === 0) button(body, `${t('set.language')}: ${LANGS[s.language].name}`, () => (change('language', (s.language + 1) % LANGS.length), page.redraw?.()), true, t('set.hint.language')); // a button, not a slider: the page is drawn anew in the language chosen
      for (const id of TABS[open][1]) slider(body, NAME(id), SETTINGS[id], s[id], (v) => change(id, v), SHOW[id], HINT(id));
      if (open === 0) {
        const b = button(body, t('set.fullscreen'), () => void isFullscreen().then((on) => fullscreen(!on)).then(() => setTimeout(label, 300)), true, t('set.fullscreenHint'));
        const label = (): void => void isFullscreen().then((on) => (b.textContent = t('set.fullscreenState', { state: t(on ? 'val.onLc' : 'val.offLc') })));
        label();
      }
      footer(panel, t('set.footer'), menuKeys(true), page.back);
    },
  };
  return page;
}

const KEYED = (a: Action): string => t(`ctl.${a}` as Key);
const PAD_OF = (a: Action): string => ({ forward: t('ctl.stick'), back: t('ctl.stick'), left: t('ctl.stick'), right: t('ctl.stick'),
  dodge: 'B', shoot: 'X', reload: 'D-pad ←', lock: 'R3', heal: 'Y', item: 'D-pad ↓', throw: 'D-pad ↑', interact: 'A', map: 'View', journal: 'Menu',
} as Record<Action, string>)[a];
/** What cannot be rebound: the mouse's buttons, looking, and the menus' own keys. */
export const fixedControls = (): readonly (readonly [string, string, string])[] => [
  [t('ctl.fixed.attack'), 'LMB / Shift+LMB', 'RB / RT'],
  [t('ctl.fixed.block'), 'RMB / Shift+RMB', 'LB / LT'],
  [t('ctl.fixed.look'), t('ctl.fixed.look.keys'), t('ctl.fixed.look.pad')],
  [t('ctl.fixed.switch'), t('ctl.fixed.switch.keys'), t('ctl.fixed.switch.pad')],
  [t('ctl.fixed.pause'), 'Esc', 'Menu'],
];

/** The controls tab: the actions with their keys (choose one, then press its new key) beside the pad's, and what is fixed. */
function controlsTab(panel: HTMLElement, page: Page, waiting: () => Action | null, wait: (a: Action) => void, refused: () => boolean, save: () => void, swapped: boolean, swap: (on: boolean) => void): void {
  const grid = el(panel, 'div', '', 'display:grid;grid-template-columns:1fr auto auto 1fr auto auto;gap:0 12px;align-items:center;padding:0 10px');
  for (const cell of ['', t('ctl.key'), t('ctl.pad'), '', t('ctl.key'), t('ctl.pad')]) el(grid, 'div', cell, 'opacity:.5;letter-spacing:3px;font-size:10px;padding-bottom:2px');
  const half = Math.ceil(ACTIONS.length / 2);
  const cells = (a: Action | undefined): void => {
    if (!a) return void [0, 1, 2].forEach(() => el(grid, 'div'));
    el(grid, 'div', KEYED(a), 'font-size:12px;white-space:nowrap');
    const b = button(grid, waiting() === a ? '…' : keyName(keyLayout[a]), () => (wait(a), page.redraw?.()));
    b.classList.add('tag');
    b.style.cssText = 'margin:1px 0;padding:1px 6px;min-width:6ch;font-size:12px';
    el(grid, 'div', PAD_OF(a), 'opacity:.55;font-size:11px;white-space:nowrap');
  };
  for (let i = 0; i < half; i++) [ACTIONS[i], ACTIONS[i + half]].forEach(cells);
  el(panel, 'div', fixedControls().map(([what, keys]) => `${what}: ${keys}`).join('   ·   '), 'opacity:.4;font-size:11px;line-height:1.5;margin:8px 10px 0');
  const row = el(panel, 'div', '', 'display:flex;justify-content:space-between;align-items:center;padding:0 14px;margin-top:8px');
  button(row, t('ctl.reset'), () => (Object.assign(keyLayout, DEFAULT_KEYS), save(), page.redraw?.())).classList.add('tag');
  button(row, t('ctl.swap', { state: t(swapped ? 'val.onLc' : 'val.offLc') }), () => (swap(!swapped), page.redraw?.()), false, t('ctl.swapHint')).classList.add('tag');
  el(row, 'div', t('ctl.padReport', { report: padReport() || t('ctl.padNone') }), 'opacity:.45;font-size:11px');
  footer(panel, t(refused() ? 'ctl.refused' : 'ctl.choose'), menuKeys(true), page.back);
}
