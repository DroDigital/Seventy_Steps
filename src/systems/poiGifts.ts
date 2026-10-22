/**
 * The gifts for the land's secrets found (round 68, "greater incentives" to explore): each time the count of points of interest found, in all
 * the realms together, reaches one of `POI.gifts`, the investigator is given its star-stones and Echoes worth some levels at the price of the
 * next, once; kept in the save among what was told (`poigift:<n>`). Pure: no Three.js.
 */

import { t } from '../core/i18n';
import { POIS, poiKey } from '../data/pois';
import { POI } from '../data/tuning';
import type { Game } from './components';
import { nextLevelCost } from './levels';

export const giftKey = (at: number): string => `poigift:${at}`;

/** How many of the secrets of the land are found. */
export const secretsFound = (g: Pick<Game, 'overworld'>): number => POIS.reduce((n, p) => n + (g.overworld?.told.has(poiKey(p.id)) ? 1 : 0), 0);

/** The next gift not yet given, and how many secrets it asks of those found (for the map's heading). */
export const nextGift = (g: Pick<Game, 'overworld'>): (typeof POI.gifts)[number] | undefined => POI.gifts.find((x) => !g.overworld?.told.has(giftKey(x.at)));

/** Gives every gift the count has reached and has not given (one found can reach only one, but a save of an older round may owe several). */
export function giveGifts(g: Game): void {
  const ow = g.overworld;
  if (!ow) return;
  const found = secretsFound(g);
  for (const gift of POI.gifts) {
    if (found < gift.at || ow.told.has(giftKey(gift.at))) continue;
    ow.told.add(giftKey(gift.at));
    const echoes = gift.levels * nextLevelCost(g);
    g.player.echoes += echoes;
    g.player.stones += gift.stones; // (not `giveStones`: it would say its own notice over this one)
    g.events.emit('Echoes', { change: 'earned', amount: echoes, total: g.player.echoes });
    g.events.emit('Notice', { text: t('n.poiGift', { found: gift.at, echoes, stones: gift.stones ? t('n.poiGiftStones', { n: gift.stones }) : '' }) });
  }
}
