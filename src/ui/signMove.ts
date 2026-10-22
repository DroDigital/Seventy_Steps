/**
 * The Elder Sign's Arms tab, moving reinforcement: a weapon with levels set into it opens a page of the other weapons,
 * each of which can be given one of them or all it has room for (systems/arms.ts `moveLevels`). Whole, nothing lost or made, but
 * paid for in Echoes (round 61: it was free, and a bare weapon was always better set up by a move than by stones, which went
 * unspent): each level costs `REINFORCE.moveEchoes` Echoes for each star-stone it would cost to set in afresh, so the stones a boss
 * leaves are best set into the weapon they are for.
 */

import { REINFORCE } from '../data/tuning';
import { WEAPONS, type WeaponId } from '../data/weapons';
import { affordableMoves, movable, moveCost, moveLevels } from '../systems/arms';
import type { Game } from '../systems/components';
import { price, resources } from './menuChips';
import { button, el, footer, heading, option, title, type Page } from './menuKit';

const named = (g: Game, id: WeaponId): string => `${WEAPONS[id].name} +${g.player.reinforced[id]}`;

/** The weapons that have levels to give, and someone to give them to. */
const givers = (g: Game): WeaponId[] => g.player.arms.filter((from) => g.player.arms.some((to) => movable(g, from, to) > 0));

/** The section of the tab: one line for each weapon that can give. Nothing at all with fewer than two weapons or no levels set. */
export function moveSection(panel: HTMLElement, g: Game, pick: (from: WeaponId) => void): void {
  const from = givers(g);
  if (!from.length) {
    if (g.player.arms.length > 1) el(panel, 'div', 'Reinforcement set into one weapon can be moved to another here, for Echoes. Star-stones set into a weapon itself cost none.', 'opacity:.4;font-style:italic;margin:10px 14px 0;font-size:13px');
    return;
  }
  heading(panel, 'MOVE REINFORCEMENT').style.margin = '12px 14px 4px';
  for (const id of from) button(panel, `${named(g, id)}  ›`, () => pick(id), true, 'Set its reinforcement into another weapon instead. Each level costs Echoes, in a move or in a move back; stones set into the other weapon directly cost none.');
}

/** The page for one weapon's levels: where each may go. `back` returns to the tab, which is drawn again. */
export function movePage(g: Game, from: WeaponId, back: () => void): Page {
  const page: Page = {
    back,
    build(p) {
      title(p, `MOVE  ·  ${WEAPONS[from].name.toUpperCase()} +${g.player.reinforced[from]}`);
      resources(p, [{ label: 'ECHOES', value: g.player.echoes, hot: true }, { label: '★ STAR-STONES', value: g.player.stones }]);
      const left = (): void => (g.player.reinforced[from] > 0 && givers(g).includes(from) ? redraw() : back());
      const redraw = (): void => page.redraw?.();
      for (const to of g.player.arms) {
        const room = movable(g, from, to);
        if (to === from) continue;
        const [now, full] = [g.player.reinforced[to], g.player.reinforced[to] >= REINFORCE.max];
        const label = `${WEAPONS[to].name} +${now}${full ? '    ·  fully reinforced' : ''}`;
        el(p, 'div', label, 'padding:8px 14px 0');
        for (const n of room > 1 ? [1, room] : room > 0 ? [1] : []) {
          const cost = moveCost(g, to, n);
          const ok = affordableMoves(g, from, to, n) === n;
          const b = option(p, n === 1 ? `Move one level  ·  +${now} → +${now + 1}` : `Move ${n} levels  ·  +${now} → +${now + n}`, () => (moveLevels(g, from, to, n), left()), ok, `Not enough Echoes: ${cost}, and you carry ${g.player.echoes}.`, n === 1 ? `One level out of ${WEAPONS[from].name} into ${WEAPONS[to].name}.` : `All ${WEAPONS[to].name} has room for.`);
          price(b, `${cost} Echoes`, ok ? 'ok' : 'no');
        }
      }
      footer(p, `Levels are moved whole: ${WEAPONS[from].name} gives them up, the other weapon takes them, and each costs ${REINFORCE.moveEchoes} Echoes for each star-stone it would take to set in afresh.`, back);
    },
  };
  return page;
}
