/**
 * Where to rise (round 45): a fall that a lit candle reaches (systems/candles.ts) does not wake the investigator at once.
 * Under the veil that has fallen over UNMADE, a small menu asks: at the candle before the horror's fog, a few steps
 * from it, or at the Elder Sign last rested at, to level and mend. A menu screen (menuKit.ts: mouse, keys or pad); it
 * is left only by choosing. Without this screen the candle is where they rise (death.ts).
 */

import { t } from '../core/i18n';
import { getEntity } from '../data/registry';
import { signPlace } from '../systems/checkpoints';
import type { Game } from '../systems/components';
import { riseAt } from '../systems/death';
import { gatePlan } from '../world/gatePlan';
import { worldLayout } from '../world/placements';
import { createScreen, footer, option, title, type Page } from './menuKit';
import { menuKeys } from './menuKeys';

export interface RiseMenu {
  readonly open: boolean;
}

export function createRiseMenu(g: Game): RiseMenu {
  const screen = createScreen(10, 'transparent', 'left:50%;top:78%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:40vh;overflow-x:hidden;overflow-y:auto;text-align:center'); // above the veil (z 8), whose black it stands on, in its lower half (the Elder Sign is drawn above)
  g.player.ask = true;
  const choose = (where: 'candle' | 'sign'): void => (screen.close(true), riseAt(g, where));
  g.events.on('RiseChoice', ({ wall }) => {
    const boss = gatePlan(worldLayout()).fogs.find((f) => f.id === wall)?.bosses.map((b) => getEntity(b)?.name).find(Boolean);
    const sign = g.overworld ? signPlace(g.overworld.sign)?.name : undefined;
    const page: Page = {
      build(panel) {
        title(panel, t('rise.title'));
        option(panel, t('rise.candle'), () => choose('candle'), true, '', boss ? t('rise.candleBoss', { boss }) : t('rise.candleFog'));
        option(panel, sign ? t('rise.signNamed', { sign }) : t('rise.sign'), () => choose('sign'), true, '', t('rise.signHint'));
        footer(panel, t('rise.footer'), menuKeys().filter((k) => k[1] !== t('keys.back')));
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
