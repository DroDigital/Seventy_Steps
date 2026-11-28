/**
 * The Elder Sign's Mind section, under the upgrades (round 61: a whole run brings some 170 insight, the Mind's two upgrades cost 14 and no
 * hidden passage wants more than 3, so what was gathered after that had no use): the insight that nothing asks for, offered for Echoes
 * (systems/insight.ts `offerInsight`), all at once or five at a time. What the passages want and the upgrades not yet bought are kept, so an
 * offer never shuts a passage or puts an upgrade out of reach.
 */

import { t } from '../core/i18n';
import { LORE } from '../data/tuning';
import type { Game } from '../systems/components';
import { insightKept, loreWorth, offerInsight, surplusInsight } from '../systems/insight';
import { price } from './menuChips';
import { button, el } from './menuKit';

const BATCH = 5;

/** The offer: a line for all the surplus, one for five points of it, or, with none, a word on what insight is for once the Mind is grown. `redraw` draws the tab again. */
export function loreSection(panel: HTMLElement, g: Game, redraw: () => void): void {
  const surplus = surplusInsight(g);
  if (surplus <= 0) {
    if (g.mind.insight >= insightKept(g)) el(panel, 'div', t('lore.note', { n: LORE.echoes }), 'opacity:.45;font-style:italic;font-size:12px;line-height:1.5;padding:6px 14px 0');
    return;
  }
  const hint = t('lore.hint', { n: LORE.echoes });
  const all = button(panel, t('lore.offer', { n: surplus }), () => (offerInsight(g), redraw()), true, hint);
  price(all, t('lore.worth', { n: loreWorth(surplus) }));
  if (surplus > BATCH) price(button(panel, t('lore.offer', { n: BATCH }), () => (offerInsight(g, BATCH), redraw()), true, hint), t('lore.worth', { n: loreWorth(BATCH) }));
}
