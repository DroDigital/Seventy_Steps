/**
 * The line of keys at the foot of a menu page (round 36), named for the device in hand: how to choose,
 * to take, to go back, and, on a page with tabs, to change them.
 */

import { deviceInUse } from '../core/device';
import { t } from '../core/i18n';
import { glyph } from './glyphs';

export function menuKeys(tabbed = false, choose = t('keys.choose')): readonly (readonly [string, string])[] {
  const pad = deviceInUse() === 'pad';
  const keys: [string, string][] = [[pad ? 'D-pad' : '↑ ↓', choose], [pad ? 'A' : 'Enter', t('keys.select')], [glyph('back'), t('keys.back')]];
  if (tabbed) keys.splice(2, 0, [pad ? 'LB RB' : 'PgUp PgDn', t('keys.tabs')]);
  return keys;
}
