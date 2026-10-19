/**
 * The desktop shell's bridge (desktop/preload.cjs), present only when the game runs in it: quitting
 * to the desktop, the window's fullscreen, and (round 12) saves kept as files. On the web it is absent,
 * and what needs it is not offered.
 */

import { GAME_PAGE } from '../data/links';

export interface Desktop {
  deck?: boolean; // on a Steam Deck (round 47): a first launch takes larger text
  edition?: 'full' | 'demo'; // the pack's edition (round 56: data/edition.ts reads it)
  quit(): Promise<void>;
  setFullscreen(on: boolean): Promise<void>;
  isFullscreen(): Promise<boolean>;
  store?: { get(key: string): string | null; set(key: string, value: string): boolean; remove(key: string): boolean }; // files (round 12)
  writeLog?(report: string): Promise<string | null>; // a crash report kept in the logs folder (round 46); its path
  openLogs?(): Promise<void>; // the logs folder, shown
  openPage?(): Promise<void>; // the game's page, in the player's browser (round 56)
  achieve?(id: string): Promise<boolean>; // an achievement earned, for Steam's (round 12)
  ownsAutomobileDlc?(): Promise<boolean>; // current Steam ownership + installation of the cosmetic automobile; absent on web
  ownsChariotDlc?(): Promise<boolean>; // the spectral chariot, read the same way
}

export const desktop: Desktop | undefined = (globalThis as { desktop?: Desktop }).desktop;

/** The game's page (data/links.ts): in the shell, the player's browser; on the web, a new tab. */
export function openGamePage(): void {
  if (desktop?.openPage) void desktop.openPage();
  else window.open(GAME_PAGE, '_blank', 'noopener');
}
