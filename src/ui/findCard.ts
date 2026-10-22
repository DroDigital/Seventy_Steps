/**
 * The card for what has come into the investigator's hands (round 60: "many users obtain weapons and relics without sufficient
 * awareness of the process or inventory status"). A weapon was picked up by walking over it, with a line that faded, and a
 * relic put on by itself, with a price on the mind, when a horror fell; neither said what it was, what it did against what was
 * already carried, where to use it, or how much more there was to find. Now, once the investigator is free (no scene, no
 * fight, nobody hunting close by), a card opens over the held world: what it is, the figures against what is in hand, where
 * it came from, how many are found of how many, and what to do with it. A weapon is taken up at once or kept; a relic worn is
 * kept so or taken off. The world stands still while it is open. A menu screen (menuKit.ts: mouse, keys or pad).
 */

import { RELICS, RELIC_IDS, RELIC_SLOTS, type RelicId } from '../data/relics';
import { WEAPON_IDS, WEAPONS, type WeaponId } from '../data/weapons';
import { equip } from '../systems/arms';
import type { Game } from '../systems/components';
import { due, free, temperOf, weaponFigureList } from '../systems/finds';
import type { GameEvents } from '../systems/gameEvents';
import { owned, relicEffects, slotsOf, wear } from '../systems/relics';
import { fill } from './glyphs';
import { chips } from './menuChips';
import { button, createScreen, el, footer, menuOpen, title, type Page } from './menuKit';
import { ACCENT, BRIGHT } from './menuParts';
import { effectChips } from './signRelics';
import { relicGlyph } from './relicGlyphs';
import { weaponGlyph } from './weaponGlyphs';

export interface FindCard {
  readonly open: boolean;
  /** Opens the next card waiting, if the investigator is free and it has waited its moment. */
  update(): void;
}

type Found = GameEvents['Found'];

const NUMERALS = ['I', 'II', 'III'];

/** The card's head: the mark, the name large, and who gave it. */
function head(panel: HTMLElement, mark: SVGSVGElement, name: string, from: string): void {
  const row = el(panel, 'div', '', 'display:flex;align-items:center;justify-content:center;gap:4px;margin:4px 0 2px');
  mark.style.cssText += ';margin-right:12px;width:36px;height:36px';
  row.append(mark);
  el(row, 'div', name, `font-size:22px;letter-spacing:2px;color:${BRIGHT}`);
  if (from) el(panel, 'div', from, 'text-align:center;opacity:.55;font-size:13px;margin-bottom:2px');
}

const sentence = (panel: HTMLElement, text: string, style = ''): HTMLElement => el(panel, 'div', text, `text-align:center;line-height:1.5;padding:0 14px;${style}`);

export function createFindCard(g: Game, busy: () => boolean = () => false): FindCard {
  const screen = createScreen(4, '#050506cc');
  const queue: (Found & { at: number })[] = [];
  g.events.on('Found', (f) => void queue.push({ ...f, at: performance.now() }));

  const weaponPage = (id: WeaponId, from: string | undefined): Page => {
    const w = WEAPONS[id];
    const page: Page = {
      back: () => screen.close(),
      build(panel) {
        title(panel, 'WEAPON FOUND');
        head(panel, weaponGlyph(id, 40), w.name, from ? `From ${from}` : '');
        sentence(panel, w.note, 'font-style:italic;opacity:.8;margin:6px 0 8px');
        const figures = weaponFigureList(g, id);
        chips(panel, figures, 'justify-content:center;margin:0 14px 4px');
        const temper = temperOf(id);
        if (temper) sentence(panel, temper, 'opacity:.7;font-size:13px');
        const hand = WEAPONS[g.player.weapon].name;
        const carried = g.player.arms.length;
        sentence(panel, `${hand} is in hand.   You carry ${carried} of ${WEAPON_IDS.length} weapons.`, 'opacity:.5;font-size:12px;margin-top:10px');
        button(panel, 'Take it up now', () => (equip(g, id), g.events.emit('Notice', { text: `IN HAND · ${w.name.toUpperCase()}` }), screen.close()), true, 'The weapon in hand is set aside. Your reinforcement stays with the weapon it was set into.');
        button(panel, 'Keep it for later', () => screen.close(), true, fill('It is kept. Take it up any time from {pause} · Arms.'));
        footer(panel, fill('Take it up any time from {pause} · Arms.'), () => screen.close());
      },
    };
    return page;
  };

  const relicPage = (id: RelicId, from: string | undefined, worn: boolean): Page => {
    const r = RELICS[id];
    const page: Page = {
      back: () => screen.close(),
      build(panel) {
        title(panel, 'RELIC FOUND');
        head(panel, relicGlyph(id), r.name, from ? `Left by ${from}` : '');
        sentence(panel, r.note, 'font-style:italic;opacity:.8;margin:6px 0 8px');
        if (relicEffects(id).length) effectChips(panel, id, 'justify-content:center;margin:0 14px 4px');
        const at = slotsOf(g).indexOf(id);
        sentence(panel, at >= 0 ? `Worn in slot ${NUMERALS[at]} of ${RELIC_SLOTS}.` : `Both slots are full, so it is kept, not worn.`, `color:${ACCENT};margin-top:8px`);
        sentence(panel, `Two relics are worn at a time, and every one worn has its price. You have found ${owned(g).length} of ${RELIC_IDS.length}. Change what you wear at any Elder Sign.`, 'opacity:.5;font-size:12px;margin-top:6px');
        if (worn && at >= 0) {
          button(panel, 'Keep it worn', () => screen.close(), true, 'Its gifts and its price are yours until you change them at an Elder Sign.');
          button(panel, 'Take it off', () => (wear(g, at, null), screen.close()), true, 'It is kept, and does nothing. Wear it again at an Elder Sign.');
        } else button(panel, 'Understood', () => screen.close(), true, 'Choose what to wear at any Elder Sign: its Relics tab.');
        footer(panel, 'Relics are changed at an Elder Sign.', () => screen.close());
      },
    };
    return page;
  };

  return {
    get open() {
      return screen.open;
    },
    update() {
      if (screen.open || menuOpen() || busy() || !free(g)) return;
      const next = due(queue, performance.now());
      if (!next) return;
      queue.shift();
      screen.show(next.kind === 'weapon' ? weaponPage(next.id as WeaponId, next.from) : relicPage(next.id as RelicId, next.from, !!next.worn));
    },
  };
}
