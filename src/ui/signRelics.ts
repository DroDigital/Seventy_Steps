/**
 * The Elder Sign's Relics tab: the two slots and what each holds, and for each a page of the relics found to put in it
 * (systems/relics.ts). A relic worn in the other slot changes places with the one chosen; what is not worn does nothing.
 * Round 52: each relic's effects are figures, green for a gift and red for a price, in place of a paragraph of rules and a line of words.
 */

import { RELICS, type RelicId } from '../data/relics';
import type { Game } from '../systems/components';
import { clearNew } from '../systems/finds';
import { owned, relicEffects, slotsOf, wear } from '../systems/relics';
import { chips } from './menuChips';
import { button, el, footer, heading, title, type Page } from './menuKit';
import { relicGlyph } from './relicGlyphs';

const NUMERALS = ['I', 'II', 'III'];

/** A relic's effects as coloured figures. */
export const effectChips = (parent: HTMLElement, id: RelicId, style = ''): void =>
  chips(parent, relicEffects(id).map((e) => ({ text: e.text, tone: e.good ? 'good' : 'bad' })), style);

/** The tab's body: a line to choose for each slot, and what is kept besides. `pick` opens the page for a slot. */
export function relicsTab(panel: HTMLElement, g: Game, pick: (slot: number) => void): void {
  const [found, slots] = [owned(g), slotsOf(g)];
  clearNew(g, 'relic'); // looked at, here at the Elder Sign where they are changed (round 60)
  heading(panel, `WORN  ·  ${slots.filter(Boolean).length} OF ${slots.length}`).style.marginTop = '0';
  slots.forEach((id, slot) => {
    const b = button(panel, `Slot ${NUMERALS[slot]}  ·  ${id ? RELICS[id].name : 'empty'}  ›`, () => pick(slot), true, id ? RELICS[id].note : 'Nothing worn here.');
    if (id) {
      effectChips(b, id);
      b.prepend(relicGlyph(id));
    }
  });
  const kept = found.filter((id) => !slots.includes(id));
  if (kept.length) el(panel, 'div', `Kept: ${kept.map((id) => RELICS[id].name).join(', ')}`, 'opacity:.5;font-size:12px;line-height:1.5;padding:8px 14px 0');
  if (!found.length) el(panel, 'div', 'A horror slain for good leaves one.', 'opacity:.5;font-style:italic;padding:8px 14px 0;font-size:13px');
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
        const b = button(p, `${RELICS[id].name}${here}`, () => choose(id), true, RELICS[id].note);
        effectChips(b, id);
        b.prepend(relicGlyph(id));
      }
      footer(p, 'A relic worn in the other slot changes places with it.', back);
    },
  };
  return page;
}
