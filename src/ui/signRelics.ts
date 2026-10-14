/**
 * The Elder Sign's Relics tab: the two slots and what each holds, and for each a page of the relics found to put in it
 * (systems/relics.ts). A relic worn in the other slot changes places with the one chosen; what is not worn does nothing.
 */

import { RELICS } from '../data/relics';
import type { Game } from '../systems/components';
import { effectsOf, owned, slotsOf, wear } from '../systems/relics';
import { button, el, footer, title, type Page } from './menuKit';
import { menuKeys } from './menuKeys';

const NUMERALS = ['I', 'II', 'III'];

/** The tab's body: a line to choose for each slot, and what is kept besides. `pick` opens the page for a slot. */
export function relicsTab(panel: HTMLElement, g: Game, pick: (slot: number) => void): void {
  const [found, slots] = [owned(g), slotsOf(g)];
  el(panel, 'div', `Two relics are worn at a time; each is a gift with a price. Those kept do nothing until they are worn. Relics found: ${found.length}.`, 'opacity:.6;font-size:13px;line-height:1.5;padding:0 14px 8px');
  slots.forEach((id, slot) => {
    const name = id ? RELICS[id].name : 'empty';
    button(panel, `Slot ${NUMERALS[slot]}  ·  ${name}  ›`, () => pick(slot), true, id ? RELICS[id].note : 'Nothing worn here.', id ? effectsOf(id) : '');
  });
  const kept = found.filter((id) => !slots.includes(id));
  if (kept.length) el(panel, 'div', `Kept: ${kept.map((id) => RELICS[id].name).join(', ')}.`, 'opacity:.5;font-size:12px;line-height:1.5;padding:8px 14px 0');
  if (!found.length) el(panel, 'div', 'A horror slain for good leaves one. The first two found are worn at once.', 'opacity:.5;font-style:italic;padding:8px 14px 0;font-size:13px');
}

/** The page for one slot: nothing, or any relic found. `back` returns to the tab, which is drawn again. */
export function slotPage(g: Game, slot: number, back: () => void): Page {
  const page: Page = {
    back,
    build(p) {
      title(p, `RELIC  ·  SLOT ${NUMERALS[slot]}`);
      const slots = slotsOf(g);
      const choose = (id: Parameters<typeof wear>[2]): void => void (wear(g, slot, id), back());
      button(p, `Wear nothing${slots[slot] === null ? '    ·  as it is' : ''}`, () => choose(null), true, 'Take what is worn here off. It is kept.');
      for (const id of owned(g)) {
        const at = slots.indexOf(id);
        const here = at === slot ? '    ·  worn here' : at >= 0 ? `    ·  worn in slot ${NUMERALS[at]}` : '';
        button(p, `${RELICS[id].name}${here}`, () => choose(id), true, RELICS[id].note, effectsOf(id));
      }
      footer(p, 'Choose what to wear here. A relic worn in the other slot changes places with it.', menuKeys(), back);
    },
  };
  return page;
}
