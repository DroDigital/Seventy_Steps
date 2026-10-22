/**
 * The Elder Sign's Mind section, under the upgrades (round 61: a whole run brings some 170 insight, the Mind's two upgrades cost 14 and no
 * hidden passage wants more than 3, so what was gathered after that had no use): the insight that nothing asks for, offered for Echoes
 * (systems/insight.ts `offerInsight`), all at once or five at a time. What the passages want and the upgrades not yet bought are kept, so an
 * offer never shuts a passage or puts an upgrade out of reach.
 */

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
    if (g.mind.insight >= insightKept(g)) el(panel, 'div', `Insight beyond what the passages and the upgrades ask for can be offered here for ${LORE.echoes} Echoes a point.`, 'opacity:.45;font-style:italic;font-size:12px;line-height:1.5;padding:6px 14px 0');
    return;
  }
  const hint = `Insight beyond what every hidden passage wants and every upgrade still to be bought would cost has no other use. Offered here it is worth ${LORE.echoes} Echoes a point; what is kept is not touched, so no passage shuts.`;
  const all = button(panel, `Offer ${surplus} insight`, () => (offerInsight(g), redraw()), true, hint);
  price(all, `+${loreWorth(surplus)} Echoes`);
  if (surplus > BATCH) price(button(panel, `Offer ${BATCH} insight`, () => (offerInsight(g, BATCH), redraw()), true, hint), `+${loreWorth(BATCH)} Echoes`);
}
