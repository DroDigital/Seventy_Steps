/**
 * Autosave (spec §3D: save/load as localStorage JSON): every WORLD.saveSeconds while the
 * investigator lives, after resting, travelling and rising again from death, and when the page is
 * hidden. Where the browser refuses storage (a private window, a full quota) the game plays on unsaved.
 */

import { desktop } from './desktop';
import { WORLD } from '../data/tuning';
import type { Game } from '../systems/components';
import { saveGame, type SaveStore } from '../systems/save';

/** The page's localStorage, or null where it is unavailable. */
export function browserStore(): SaveStore | null {
  let local: Storage | null = null;
  try {
    local = window.localStorage ?? null;
  } catch {
    // No browser storage (a private window, or refused).
  }
  const readLocal = (key: string): string | null => {
    try {
      return local?.getItem(key) ?? null;
    } catch {
      return null; // A profile can expose localStorage while refusing its reads: the title still opens.
    }
  };
  const files = desktop?.store;
  if (!files) return local && { getItem: readLocal, setItem: (key, value) => local!.setItem(key, value), removeItem: (key) => local!.removeItem(key) };
  return { // the desktop shell keeps them as files (round 12); what the browser's storage held before is taken over on first reading
    getItem(key) {
      const got = files.get(key);
      if (got !== null || !local) return got;
      const old = readLocal(key);
      if (old !== null) {
        try {
          files.set(key, old);
        } catch {
          // The old value still works this session and stays in the browser for a later migration.
        }
      }
      return old;
    },
    setItem: (key, value) => void files.set(key, value),
    removeItem: (key) => void (files.remove(key), local?.removeItem(key)),
  };
}

let flush: (() => void) | null = null;
let halted = false;

/** Stops saving for good: a frame threw (main.ts), and what it left behind may not be sound. */
export function haltAutosave(): void {
  halted = true;
}

/** Saves at once, if a game is being autosaved (before quitting to the desktop, before a crash screen). */
export function saveNow(): void {
  flush?.();
}

export function startAutosave(g: Game, store: SaveStore): void {
  const save = (): void => {
    if (halted || g.ecs.c.dead.has(g.player.id) || g.ecs.c.actor.get(g.player.id)?.move === 'death' || g.player.falling) return; // broken, or mid-death (a fall's included, which does not mark the investigator dead): the respawn saves
    try {
      saveGame(g, store);
    } catch {
      // Storage refused: play on unsaved.
    }
  };
  flush = save;
  g.events.on('Rested', save);
  g.events.on('Travelled', save);
  g.events.on('Respawned', save);
  g.events.on('Ending', save); // the ending is kept at once (round 55: it reached the disk on the next interval, and a kill before it put the investigator back at the Court with both endings offered)
  addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save());
  setInterval(save, WORLD.saveSeconds * 1000);
}
