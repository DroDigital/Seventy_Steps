/**
 * What runs beside the game, apart from it (round 46), gathered so main.ts stays one thing: the frame meter (F3), the picture set
 * for the computer on a first launch, the benchmark (`?bench`) and the trailer's tour (`?trailer`). `tick` once a picture, at its
 * start; `update` with the renderer's counts at its end.
 */

import type { Game } from '../systems/components';
import type { SaveStore } from '../systems/save';
import { createAutoQuality, firstLaunch } from './autoQualityRun';
import { startBench } from './bench';
import { createPerf, createReadout } from './perfMeter';
import type { Shell } from './shell';
import { startTrailer } from './trailer';

export interface ExtrasOptions {
  arena: boolean;
  debug: boolean;
  fresh?: boolean;
  intro?: boolean;
  bench?: boolean;
  perf?: boolean;
  trailer?: boolean;
  hold?: number;
}

export interface Extras {
  tick(): void;
  update(draws: number, triangles: number): void;
  /** The trailer has the picture to itself: no HUD. */
  readonly hidesHud: boolean;
}

export function createExtras(game: Game, shell: Shell, store: SaveStore | null, o: ExtrasOptions): Extras {
  const perf = createPerf(!!o.perf);
  const readout = createReadout();
  const auto = createAutoQuality(shell, perf.stats, (text) => game.events.emit('Notice', { text }), !o.arena && !o.debug && !o.bench && (!!o.intro || !o.fresh) && firstLaunch(store)); // a first launch's picture is set for the computer
  const bench = o.bench && !o.arena ? startBench(game, perf.stats, readout) : null;
  const trailer = o.trailer && !o.arena && !bench ? startTrailer(game, o.hold) : null;
  return {
    tick() {
      const now = performance.now();
      perf.frame();
      auto.tick(now);
      bench?.tick(now);
      trailer?.tick(now);
    },
    update: perf.update,
    hidesHud: !!trailer,
  };
}
