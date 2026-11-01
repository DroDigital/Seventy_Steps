/**
 * What one more level of Vigour, Endurance or Might gives, as the Elder Sign's menu says it.
 */

import type { LevelId } from '../data/tuning';
import { healthAt, mightAt, staminaAt } from '../systems/levelWorth';

const figure = (n: number): string => String(Math.round(n * 10) / 10);

/** What the level after `bought` gives, in words. */
export function levelGain(id: LevelId, bought: number, health = 1, stamina = 1): string {
  if (id === 'vigour') return `+${Math.round(healthAt(bought + 1) * health) - Math.round(healthAt(bought) * health)} health`;
  if (id === 'endurance') return `+${Math.round(staminaAt(bought + 1) * stamina) - Math.round(staminaAt(bought) * stamina)} stamina, faster recovery`;
  return `+${figure((mightAt(bought + 1) - mightAt(bought)) * 100)}% damage`;
}
