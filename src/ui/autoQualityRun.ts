/**
 * Setting the picture for the computer (round 46; the ladder is render/autoQuality.ts): on a first launch, with no settings
 * kept and no choice made before, the first seconds are measured and the picture steps down until it runs smoothly. Called
 * once a picture. A player who changes a setting meanwhile is left alone. Where it changed anything, it says so once, and
 * Settings › Display holds what it chose.
 */

import type { FrameStats } from '../core/frameStats';
import { LADDER, nextRung, QUALITY, rungOf } from '../render/autoQuality';
import type { SaveStore } from '../systems/save';
import { SETTINGS_KEY } from './settings';
import type { Shell } from './shell';

export const AUTO_KEY = 'lovecraft-souls-like/autoquality';
const MOST = 4; // steps at most

/** Whether this launch is the first, and the picture is the game's to set. */
export function firstLaunch(store: SaveStore | null): boolean {
  try {
    return !!store && store.getItem(AUTO_KEY) === null && store.getItem(SETTINGS_KEY) === null;
  } catch {
    return false;
  }
}

export interface AutoQuality {
  tick(now: number): void;
}

export function createAutoQuality(shell: Shell, stats: FrameStats, tell: (text: string) => void, active: boolean): AutoQuality {
  if (!active) return { tick() {} };
  const start = rungOf({ resolution: shell.settings.resolution, fog: shell.settings.fog, shadows: shell.settings.shadows });
  let rung = start;
  let steps = 0;
  let from = 0;
  let warm: number = QUALITY.warm;
  let done = false;
  const finish = (): void => {
    done = true;
    try {
      shell.store?.setItem(AUTO_KEY, '1');
    } catch {
      // Storage refused: it measures again next time.
    }
    if (rung !== start) tell('PICTURE SET FOR THIS COMPUTER · SETTINGS › DISPLAY');
  };
  const intervened = (): boolean => {
    const r = LADDER[rung];
    return shell.settings.resolution !== r.resolution || shell.settings.fog !== r.fog || shell.settings.shadows !== r.shadows;
  };
  return {
    tick(now) {
      if (done) return;
      if (!from) return void ((from = now), stats.clear());
      const t = (now - from) / 1000;
      if (t < warm) return stats.clear(); // the world is made, and shaders compile, in these seconds
      if (t < warm + QUALITY.measure) return;
      if (intervened()) return void (done = true); // they have their own say
      const to = steps < MOST ? nextRung(rung, stats.summary()) : rung;
      if (to === rung) return finish();
      rung = to;
      steps++;
      shell.change('resolution', LADDER[to].resolution);
      shell.change('fog', LADDER[to].fog);
      shell.change('shadows', LADDER[to].shadows);
      [from, warm] = [now, 1.5];
      stats.clear();
    },
  };
}
