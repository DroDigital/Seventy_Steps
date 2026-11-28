/**
 * What one more level of Vigour, Endurance or Might gives, as the Elder Sign's menu says it.
 */

import { t } from '../core/i18n';
import type { LevelId } from '../data/tuning';
import { healthAt, mightAt, staminaAt } from '../systems/levelWorth';

const figure = (n: number): string => String(Math.round(n * 10) / 10);

/** What the level after `bought` gives, in words. */
export function levelGain(id: LevelId, bought: number, health = 1, stamina = 1): string {
  if (id === 'vigour') return t('gain.health', { n: Math.round(healthAt(bought + 1) * health) - Math.round(healthAt(bought) * health) });
  if (id === 'endurance') return t('gain.stamina', { n: Math.round(staminaAt(bought + 1) * stamina) - Math.round(staminaAt(bought) * stamina) });
  return t('gain.damage', { n: figure((mightAt(bought + 1) - mightAt(bought)) * 100) });
}
