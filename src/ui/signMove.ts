/**
 * The Elder Sign's Arms tab, moving reinforcement: a weapon with levels set into it opens a page of the other weapons,
 * each of which can be given one of them or all it has room for (systems/arms.ts `moveLevels`). Free, and whole: nothing
 * is lost or made, so a weapon found late can be tried with the cane's reinforcement, and the cane have it back.
 */

import { REINFORCE } from '../data/tuning';
import { WEAPONS, type WeaponId } from '../data/weapons';
import { movable, moveLevels } from '../systems/arms';
import type { Game } from '../systems/components';
import { button, el, footer, heading, title, type Page } from './menuKit';
import { menuKeys } from './menuKeys';

const named = (g: Game, id: WeaponId): string => `${WEAPONS[id].name} +${g.player.reinforced[id]}`;

/** The weapons that have levels to give, and someone to give them to. */
const givers = (g: Game): WeaponId[] => g.player.arms.filter((from) => g.player.arms.some((to) => movable(g, from, to) > 0));

/** The section of the tab: one line for each weapon that can give. Nothing at all with fewer than two weapons or no levels set. */
export function moveSection(panel: HTMLElement, g: Game, pick: (from: WeaponId) => void): void {
  const from = givers(g);
  if (!from.length) {
    if (g.player.arms.length > 1) el(panel, 'div', 'Reinforcement set into one weapon can be moved to another here, for nothing.', 'opacity:.4;font-style:italic;margin:10px 14px 0;font-size:13px');
    return;
  }
  heading(panel, 'MOVE REINFORCEMENT').style.margin = '12px 14px 4px';
  for (const id of from) button(panel, `${named(g, id)}  ›`, () => pick(id), true, 'Set its reinforcement into another weapon instead. Free, and it can be moved back.');
}

/** The page for one weapon's levels: where each may go. `back` returns to the tab, which is drawn again. */
export function movePage(g: Game, from: WeaponId, back: () => void): Page {
  const page: Page = {
    back,
    build(p) {
      title(p, `MOVE  ·  ${WEAPONS[from].name.toUpperCase()} +${g.player.reinforced[from]}`);
      const left = (): void => (g.player.reinforced[from] > 0 && givers(g).includes(from) ? redraw() : back());
      const redraw = (): void => page.redraw?.();
      for (const to of g.player.arms) {
        const room = movable(g, from, to);
        if (to === from) continue;
        const [now, full] = [g.player.reinforced[to], g.player.reinforced[to] >= REINFORCE.max];
        const label = `${WEAPONS[to].name} +${now}${full ? '    ·  fully reinforced' : ''}`;
        el(p, 'div', label, 'padding:8px 14px 0');
        if (room > 0) {
          button(p, `Move one level  ·  +${now} → +${now + 1}`, () => (moveLevels(g, from, to, 1), left()), true, `One level out of ${WEAPONS[from].name} into ${WEAPONS[to].name}.`);
          if (room > 1) button(p, `Move ${room} levels  ·  +${now} → +${now + room}`, () => (moveLevels(g, from, to, room), left()), true, `All ${WEAPONS[to].name} has room for.`);
        }
      }
      footer(p, `Levels are moved whole: ${WEAPONS[from].name} gives them up, the other weapon takes them. Nothing is lost.`, menuKeys(), back);
    },
  };
  return page;
}
