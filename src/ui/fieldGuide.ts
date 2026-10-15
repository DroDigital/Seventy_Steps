/**
 * The Journal's Field Guide: every hint given to this investigator, by the thing it taught, to be read again. The hints
 * are kept in the save (`hint:<id>`, ui/hints.ts), so another save starts with none of them, and a new one is told them as
 * they come up. A hint is read in the words of the language chosen, with the buttons of the device in hand.
 */

import { t } from '../core/i18n';
import { GUIDE, GUIDE_GROUPS, HINT_IDS, hintGiven, type HintId } from '../data/fieldGuide';
import type { Key } from '../data/lang';
import type { Game } from '../systems/components';
import { fill } from './glyphs';
import { BONE } from './hudKit';
import { button, el, footer, heading, type Page } from './menuKit';

/** The hints this save has been given. */
export const given = (g: Game): HintId[] => HINT_IDS.filter((id) => !!g.overworld && hintGiven(g.overworld.told, id));

/** The words of a hint now: the language chosen, the buttons of the device in hand. */
export const hintText = (id: HintId): string => fill(t(`hint.${id}` as Key));

/** The tab's body: a line to open for each hint given, filed by what it is about. */
export function fieldGuideBody(body: HTMLElement, g: Game, show: (p: Page) => void, back: Page): void {
  const have = given(g);
  el(body, 'div', `${have.length} of ${HINT_IDS.length} given`, 'opacity:.45;font-size:12px;letter-spacing:2px;padding:0 14px 6px');
  if (!have.length) el(body, 'div', 'What you are told as you go is kept here, to read again.', 'opacity:.6;padding:0 14px');
  for (const group of GUIDE_GROUPS) {
    const some = have.filter((id) => GUIDE[id].group === group);
    if (!some.length) continue;
    heading(body, `${group.toUpperCase()} · ${some.length}`).style.margin = '12px 14px 4px';
    for (const id of some) button(body, GUIDE[id].title, () => show(guidePage(id, () => show(back))));
  }
}

/** One hint, on a page of its own. */
export function guidePage(id: HintId, back: () => void): Page {
  const page: Page = {
    back,
    build(p) {
      el(p, 'div', GUIDE[id].title.toUpperCase(), `letter-spacing:3px;color:${BONE};margin-bottom:4px`);
      el(p, 'div', GUIDE[id].group, 'opacity:.45;font-size:11px;margin-bottom:14px');
      el(p, 'p', hintText(id), 'font-size:15px;line-height:1.6;margin:0 0 10px');
      footer(p, '', back);
    },
  };
  return page;
}
