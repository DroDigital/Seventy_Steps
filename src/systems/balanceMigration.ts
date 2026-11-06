/** Preserve the first pre-update NG+ save independently of the rolling corruption-recovery backup. */
import { JOURNEY_BALANCE_VERSION } from '../data/ngPlusTuning';
import type { SaveData, SaveStore } from './save';

export const balanceBackupKey = (key: string, version = JOURNEY_BALANCE_VERSION): string => `${key}-before-journey-balance-${version}`;

export function keepBalanceBackup(store: SaveStore, key: string, raw: string | null, previous: SaveData | null): void {
  if (!raw || !previous || !previous.cycle || (previous.balance ?? 0) >= JOURNEY_BALANCE_VERSION) return;
  const backup = balanceBackupKey(key);
  try {
    if (!store.getItem(backup)) store.setItem(backup, raw);
  } catch {
    // As with the rolling backup, refusal must not prevent saving the player's progress.
  }
}
