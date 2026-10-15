/** Standard retro resolutions, with sharper pictures kept behind an explicit, warned choice. */

import { t } from '../core/i18n';
import { HIGH_RESOLUTIONS, RENDER, SETTINGS } from '../data/tuning';
import { ACCENT, button, el, slider } from './menuParts';
import type { SettingId, Settings } from './settings';

const picture = (scale: number): string => `${Math.round(RENDER.width * scale)}×${Math.round(RENDER.height * scale)}`;
let nextId = 0;

/** One disclosure per settings page; rebuilding it keeps whether the player opened the optional choices. */
export function createResolutionSetting(): (parent: HTMLElement, settings: Settings, change: (id: SettingId, value: number) => void, redraw: () => void) => void {
  let expanded = false;
  const id = `higher-resolutions-${++nextId}`;
  return (parent, settings, change, redraw) => {
    const standard = SETTINGS.resolution[1];
    const higher = settings.resolution > standard;
    const choose = (scale: number): void => {
      change('resolution', scale);
      redraw();
    };
    if (higher) {
      button(parent, t('set.resolutionActive', { resolution: picture(settings.resolution) }), () => choose(standard), true, t('set.resolutionRestore'), t('set.resolutionRestore'));
    } else {
      slider(parent, t('set.resolution'), SETTINGS.resolution, settings.resolution, (value) => change('resolution', value), picture, t('set.hint.resolution'));
    }
    const toggle = button(parent, t('set.resolutionHigher'), () => { expanded = !expanded; redraw(); }, true, t('set.resolutionWarning'));
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-controls', id);
    const choices = el(parent, 'div');
    choices.id = id;
    choices.hidden = !expanded;
    const warning = (box: HTMLElement): void => {
      const text = el(box, 'p', t('set.resolutionWarning'), `margin:6px 14px 10px;font-size:12px;line-height:1.5;color:${ACCENT}`);
      text.setAttribute('role', 'alert');
    };
    if (expanded) {
      warning(choices);
      for (const scale of HIGH_RESOLUTIONS) {
        const option = button(choices, t('set.resolutionUse', { resolution: picture(scale) }), () => choose(scale), true, t('set.resolutionWarning'));
        option.setAttribute('aria-pressed', String(settings.resolution === scale));
      }
    } else if (higher) warning(parent); // the active override remains explained even with its choices collapsed
  };
}
