/**
 * A merchant's wares (playtest round 12), after the last line of their talk: each with its price,
 * what is left of it and what it is for; choosing one buys it (systems/trade.ts). A menu screen
 * (menuKit.ts); the investigator takes no input while it is open, as at an Elder Sign.
 */

import { SHOPS, WARES } from '../data/wares';
import type { Game } from '../systems/components';
import { buy, canBuy, carried, hasRoom, stockLeft } from '../systems/trade';
import { fill } from './glyphs';
import { createScreen, footer, option, title, type Page } from './menuKit';
import { chips, price, resources } from './menuChips';

export interface ShopMenu {
  readonly open: boolean;
}

export function createShopMenu(g: Game): ShopMenu {
  const screen = createScreen(3, '#050506cc');
  g.events.on('Trade', ({ shop, name }) => {
    const wares = SHOPS[shop] ?? [];
    const page: Page = {
      back: () => screen.close(),
      build(panel) {
        title(panel, name.toUpperCase());
        resources(panel, [{ label: 'ECHOES', value: g.player.echoes, hot: true }]);
        for (const id of wares) {
          const w = WARES[id];
          const left = stockLeft(g, id);
          const ok = canBuy(g, id);
          const room = hasRoom(g, id);
          const why = left === 0 ? 'Sold out.' : !room ? 'No room to carry it.' : 'Not enough Echoes.';
          const c = carried(g, id); // what a pocket holds, before it is asked (round 24)
          const b = option(panel, left === undefined || left === 0 ? w.name : `${w.name}  ·  ${left} left`, () => (buy(g, id), page.redraw?.()), ok, why, fill(w.note)); // round 38: still a line to choose, so that what it is can be read, and why it cannot be bought
          if (c) chips(b, [{ text: `Carried ${c.have} of ${c.most} ${c.unit}`, tone: 'dim' }]);
          if (left === 0) price(b, 'SOLD OUT', 'max');
          else if (!room) price(b, 'NO ROOM', 'no'); // (a full pocket said nothing, round 24)
          else price(b, `${w.price} Echoes`, ok ? 'ok' : 'no');
        }
        footer(panel, '', () => screen.close());
      },
    };
    screen.show(page);
  });
  return {
    get open() {
      return screen.open;
    },
  };
}
