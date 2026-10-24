/**
 * What one more level of Vigour, Endurance or Might gives, as the Elder Sign's menu says it (round 71): the figure is the real difference between the
 * next level and the one bought, so past a soft cap (data/playTuning.ts `SOFT_CAP`) it is less than the first levels gave, and the row says so.
 */

import { LEVELS, SOFT_CAP, type LevelId } from '../data/tuning';
import { healthAt, mightAt, nextWorth, staminaAt } from '../systems/levelWorth';

const figure = (n: number): string => String(Math.round(n * 10) / 10);
const percent = (share: number): string => `${Math.round(share * 100)}%`;

/** What the level after `bought` gives, in words. */
export function levelGain(id: LevelId, bought: number): string {
  if (id === 'vigour') return `+${healthAt(bought + 1) - healthAt(bought)} health`;
  if (id === 'endurance') return `+${staminaAt(bought + 1) - staminaAt(bought)} stamina, faster recovery`;
  return `+${figure((mightAt(bought + 1) - mightAt(bought)) * 100)}% damage`;
}

/** What the level after `bought` is worth beside the first ones, when it is worth less (past a soft cap): the chip and the foot's words; none before the first. */
export function softCap(id: LevelId, bought: number): { chip: string; hint: string } | undefined {
  const worth = nextWorth(bought);
  if (bought >= LEVELS[id].max || worth >= 1) return undefined;
  const tiers = [`whole to ${SOFT_CAP[0].after}`, ...SOFT_CAP.map((t, i) => `${percent(t.worth)}${SOFT_CAP[i + 1] ? ` to ${SOFT_CAP[i + 1].after}` : ''}`)].join(', then ');
  return { chip: `soft cap: ${percent(worth)}`, hint: `Levels of one attribute count ${tiers}. This one counts for ${percent(worth)}.` };
}
