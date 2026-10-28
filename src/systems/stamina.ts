/**
 * Stamina rules (spec §3B): regen waits after spending, and a blocked
 * hit that empties the bar breaks the guard. A light attack may spend beyond the bar; other
 * actions require their full cost before they start.
 */

import { STAMINA } from '../data/tuning';
import type { Stamina } from './components';

export type StaminaMode = 'idle' | 'guard' | 'broken' | 'sprint';

/** Entities without stamina (enemies) can always act. */
export const canAfford = (s: Stamina | undefined, cost: number): boolean => !s || s.value >= cost;

export function spend(s: Stamina, cost: number, allowDebt = false): void {
  // Other drains cannot erase a debt or send it further below zero.
  s.value = allowDebt ? s.value - cost : Math.min(s.value, 0) + Math.max(0, s.value - cost);
  s.delay = STAMINA.regenDelay;
}

/** Takes a blocked hit's stamina damage; true when it empties the bar (guard break). */
export function absorb(s: Stamina, amount: number): boolean {
  if (amount <= 0) return false; // a hallucination has no guard pressure, even against an empty bar
  s.value = Math.min(s.value, 0) + Math.max(0, s.value - amount);
  s.delay = Math.max(s.delay, STAMINA.guardDelay); // a block cannot shorten an action's recovery
  return s.value <= 0;
}

/** Sprint drains; recovery waits after spending, slows while guarding, and stops during a guard break. `pace` also scales recovery for a mind Unmoored. */
export function tickStamina(s: Stamina, mode: StaminaMode, dt: number, pace = 1): void {
  if (mode === 'sprint') {
    s.value = Math.min(s.value, 0) + Math.max(0, s.value - STAMINA.sprintDrain * dt);
    s.delay = Math.max(s.delay, STAMINA.sprintDelay); // a short beat after the run ends; the longer one an action has just begun is not cut short by it
    return;
  }
  if (s.delay > 0) {
    s.delay--;
    return;
  }
  if (mode === 'broken') return;
  s.value = Math.min(s.max, s.value + (s.regen ?? STAMINA.regen) * dt * pace * (mode === 'guard' ? STAMINA.guardRegen : 1));
}
