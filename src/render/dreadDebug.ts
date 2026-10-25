/**
 * Debug hooks for the picture of dread (round 78): with `?debug`, `window.dread` holds the pressure at a value, lays a pair of eyes
 * where asked and sends a shock, for photographing what is otherwise a matter of luck and of time. Nothing here is in play.
 */

import type { Game } from '../systems/components';
import type { DarkEyes } from './darkEyes';
import { PRESSURE_DEBUG } from './pressure';
import { WATCHING } from './watchers';

export interface DreadDebug {
  pressure(n: number): void; // 0..1 holds the pressure; negative lets the game have it
  eyes(metres?: number, offset?: number): { x: number; y: number; z: number } | null; // where the pair hangs (null: they were taken away)
  watcher(metres?: number, offset?: number): void; // a watcher this far off, this many radians off the heading (π: behind); needs a mind that is failing
  shock(amount?: number): void; // a sudden loss of this much (display only: nothing is taken)
  peek(): { eyes: number; watchers: number; nearest: number }; // what is out now: pairs of eyes, watchers standing, the nearest's distance (-1: none)
}

/** Puts the hooks on `window` if the page is the debug one (its `game` is `g`); true once done. */
export function installDreadDebug(g: Game, eyes: DarkEyes): boolean {
  if (typeof window === 'undefined' || (window as unknown as { game?: Game }).game !== g) return false;
  const hooks: DreadDebug = {
    pressure: (n) => void (PRESSURE_DEBUG.force = n),
    eyes: (metres = 30, offset = 0.5) => eyes.force(metres, offset),
    watcher: (metres = 50, offset = Math.PI) => void (WATCHING.call = { metres, offset }),
    shock: (amount = 10) => void g.events.emit('SanityLost', { amount, sanity: g.mind.sanity }),
    peek: () => ({ eyes: eyes.out, watchers: WATCHING.count, nearest: WATCHING.nearest }),
  };
  Object.assign(window, { dread: hooks });
  return true;
}
