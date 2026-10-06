/**
 * The title's save slots (playtest round 12: one save, in the browser's storage): each slot's line
 * (where the investigator stands, their level, time in the dream, the journey), for choosing one to
 * load or to begin a new game in.
 */

import { t } from '../core/i18n';
import type { Key } from '../data/lang';
import { DEFAULT_DIFFICULTY, isDifficulty } from '../data/tuning';
import { levelsOf } from '../systems/levels';
import { loadSave, slotKey, SLOTS, type SaveStore } from '../systems/save';
import { newerSave } from '../systems/saveVersion';
import { playTime } from '../systems/tally';
import { regionAt } from '../world/worldMap';

/** What a slot holds: its line, and whether this build can load it (a newer build's save is kept, not read: round 47). */
export interface SlotLine {
  readonly line: string;
  readonly loads: boolean;
}

/** What slot `slot` holds, in a line; null when it is empty. */
export function slotLine(store: SaveStore | null, slot: number): SlotLine | null {
  const s = store && loadSave(store, slot);
  if (!s) return store && newerSave(store.getItem(slotKey(slot))) ? { line: t('slot.newer'), loads: false } : null;
  const where = regionAt(s.at.x, s.at.z)?.name ?? t('slot.dream');
  const journey = s.cycle ? `  ·  ${t('slot.journey', { n: s.cycle + 1 })}` : '';
  const hard = isDifficulty(s.difficulty) && s.difficulty !== DEFAULT_DIFFICULTY ? `  ·  ${t(`diff.${s.difficulty}.name` as Key).toLowerCase()}` : ''; // the one it was begun at (round 38)
  return { loads: true, line: `${where}  ·  ${t('slot.level', { n: levelsOf(s.levels) + 1 })}  ·  ${playTime(s.tally?.frames ?? 0)}${journey}${hard}` };
}

/** Every slot's line, first to last. */
export const slotLines = (store: SaveStore | null): (SlotLine | null)[] => Array.from({ length: SLOTS }, (_, k) => slotLine(store, k + 1));
