/**
 * What one more level of Vigour, Endurance or Might gives, as the Elder Sign's menu says it.
 */

import type { LevelId } from '../data/tuning';
import { healthAt, mightAt, staminaAt } from '../systems/levelWorth';

const figure = (n: number): string => String(Math.round(n * 10) / 10);

/** What the level after `bought` gives, in words. */
export function levelGain(id: LevelId, bought: number): string {
  if (id === 'vigour') return `+${healthAt(bought + 1) - healthAt(bought)} health`;
  if (id === 'endurance') return `+${staminaAt(bought + 1) - staminaAt(bought)} stamina, faster recovery`;
  return `+${figure((mightAt(bought + 1) - mightAt(bought)) * 100)}% damage`;
}
