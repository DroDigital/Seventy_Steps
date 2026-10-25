/**
 * Round 78, the night's turns announced: as the long night passes into its next hour a small quiet card (no band, high on the screen)
 * names it. The last hour says that the morning will not come; its end, when the grey is gone and the lamps are lit anew, that the night
 * turns (systems/clock.ts: the dream never reaches morning). Keyed on the hour only, never on the sky's own curve, so the sky can change
 * and this not. A vigil that hurries the night shows the new hour's card at once. Nothing is announced under a roof, in a fight with a horror,
 * over a menu, a cutscene or the veil, or on loading; a card that cannot be shown yet waits (and the banner keeps it behind any other card up).
 */

import type { Key } from '../data/lang';
import { CARD, HOUR } from '../data/uiMood';
import { SIM } from '../data/tuning';
import { hourOf, phaseOf, type Hour } from '../systems/clock';
import { t } from '../core/i18n';
import { engagedFights } from '../systems/bossFight';
import type { Game } from '../systems/components';
import { roofedAt } from '../world/terrain';

/** What is announced: the deep of the night begun, the last hour begun, the night turned. */
export type HourCard = 'deep' | 'waning' | 'turn';

/** The card for a change of hour (none for no change, nor for the first look). The gloaming is only ever reached by the turn. */
export function hourChange(prev: Hour | null, next: Hour): HourCard | null {
  if (prev === null || prev === next) return null;
  return next === 'deep' ? 'deep' : next === 'waning' ? 'waning' : 'turn';
}

/** The words of each card: its name and the line under it, if any. */
export const HOUR_CARDS: Readonly<Record<HourCard, readonly [title: Key, note: Key | null]>> = {
  deep: ['hour.deep', null],
  waning: ['hour.waning', 'hour.waningNote'],
  turn: ['hour.turn', 'hour.turnNote'],
};

/** The hour's name for the minimap's small clock, in the language chosen. */
export const HOUR_LABEL: Readonly<Record<Hour, Key>> = { gloaming: 'hour.gloaming', deep: 'hour.deep', waning: 'hour.waning' };

export interface HourCards {
  /** Each frame: looks at the hour and shows a card for a change of it, when it may be shown. */
  update(): void;
}

/** `show` puts a card up (its title, its note); `allowed` says the screen is the world's. */
export function createHourCards(g: Game, show: (title: string, note: string) => void, allowed: () => boolean): HourCards {
  let last: Hour | null = null;
  let pending: { card: HourCard; at: number } | null = null;
  const born = performance.now();
  return {
    update() {
      if (!g.overworld) return;
      const hour = hourOf(phaseOf(g.frame / SIM.hz));
      const change = performance.now() - born < HOUR.settle * 1000 ? null : hourChange(last, hour);
      last = hour;
      const now = performance.now();
      if (change) pending = { card: change, at: now };
      if (!pending) return;
      if (now - pending.at > CARD.stale * 1000) return void (pending = null); // (an hour that went by under a roof is not announced after it)
      const at = g.ecs.c.transform.get(g.player.id)!.pos;
      if (!allowed() || roofedAt(at.x, at.z) || engagedFights(g).length) return;
      const [title, note] = HOUR_CARDS[pending.card];
      pending = null;
      show(t(title), note ? t(note) : '');
    },
  };
}
