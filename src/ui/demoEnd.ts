/**
 * The demo's end (round 56): when Keziah Mason has fallen (systems/demo.ts: DemoEnded), and her fall's cutscene and any menu
 * are done, a card (which marks the end told in the save as it shows, not before) says that the stair under the Sleeper's Sign leads into the full game, that the save carries over, and
 * offers the game's page or the rest of Arkham. The world stands still while it is open, as under the pause menu: nothing
 * steps, so nothing left in the arena can hurt the investigator behind it, and the play time does not run (main.ts).
 */

import { t } from '../core/i18n';
import type { Game } from '../systems/components';
import { demoEndShown } from '../systems/demo';
import { openGamePage } from './desktop';
import { button, createScreen, el, footer, menuOpen, title } from './menuKit';

export interface DemoEnd {
  readonly open: boolean;
}

/** `busy`: something else has the screen (a cutscene, a journey): the card waits for it. */
export function createDemoEnd(g: Game, busy: () => boolean): DemoEnd {
  const screen = createScreen(7);
  let waiting: ReturnType<typeof setInterval> | undefined;
  const close = (): void => screen.close();
  const show = (): void => {
    if (busy() || menuOpen()) return;
    clearInterval(waiting);
    waiting = undefined;
    document.exitPointerLock?.();
    demoEndShown(g); // told now that it is seen: a page closed before this shows it again next time
    screen.show({
      back: close,
      build(p) {
        title(p, t('demo.end.title'));
        el(p, 'div', t('demo.end.line'), 'margin:0 6px 10px;line-height:1.55;text-align:center');
        el(p, 'div', t('demo.end.save'), 'margin:0 6px 16px;font-size:12px;opacity:.65;text-align:center');
        const list = el(p, 'div');
        list.className = 'pause';
        button(list, t('demo.end.buy'), openGamePage);
        button(list, t('demo.end.stay'), close);
        footer(p, '');
      },
    });
  };
  g.events.on('DemoEnded', () => void (waiting ??= setInterval(show, 400)));
  return {
    get open() {
      return screen.open;
    },
  };
}
