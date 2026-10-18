/**
 * The pause menu (Phase 6): Esc, the pad's Start, or leaving the game (switching away)
 * opens it whenever no other menu is open. The world stands still while it is open (main.ts). It
 * offers Resume, the Map, the Journal, Arms, Settings (with the Controls) and a return to the title screen, and in
 * the desktop shell a way out to the desktop (playtest round 12).
 */

import { t } from '../core/i18n';
import { keyLayout } from '../core/bindings';
import { lockJustAsked } from '../core/mouseLock';
import { creditsPage } from './credits';
import { button, createScreen, el, footer, menuOpen, onPadStart, title, type Page } from './menuKit';
import { saveNow } from './autosave';
import { desktop } from './desktop';
import { settingsPage } from './menuPages';
import type { SettingId, Settings } from './settings';

export interface PauseOptions {
  settings: Settings;
  change(id: SettingId, v: number): void;
  saveKeys?: () => void; // keeps the keyboard's layout when rebound
  resume(): void; // after closing: recapture the mouse
  map?: () => void; // opens the map (not in the arena)
  journal?: (back: () => void, show: (p: Page) => void) => Page; // the journal's page (not in the arena)
  arms?: (back: () => void, show: (p: Page) => void) => Page; // the weapons owned
  achievements?: (back: () => void) => Page; // the achievements, earned or not (round 12)
  quit(): void;
  held?: () => boolean; // something has the screen (a cutscene, round 20): the pause menu keeps out of it
}

export interface PauseMenu {
  readonly open: boolean;
  openJournal(): void; // the journal at its own key: leaving it returns to the game, not to the pause menu
}

const RESUME_MS = 1000; // how soon after the mouse was asked for (by any menu closing) a let-go is the browser's own Esc, not a pause
const FOCUS_MS = 150; // a brief window-focus change is not leaving the game

export function createPauseMenu(o: PauseOptions): PauseMenu {
  const screen = createScreen(6, '#050506b3'); // the world shows through a little more than behind the others' dim (70% dark, not 87%): its vitals and minimap stay crisp, which a blur of it would take
  let retriedAt = -1e9;
  let locked = document.pointerLockElement !== null;
  let focusTimer: ReturnType<typeof setTimeout> | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelFocusCheck = (): void => {
    clearTimeout(focusTimer);
    focusTimer = undefined;
  };
  const cancelRetry = (): void => {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  };
  const resume = (): void => {
    cancelFocusCheck();
    cancelRetry();
    screen.close();
    o.resume();
  };
  const main: Page = {
    back: resume,
    build(p) {
      title(p, t('pause.title'));
      const list = el(p, 'div');
      list.className = 'pause'; // centred lines, each on a plaque of its own (ui/menuParts.ts)
      button(list, t('pause.resume'), resume);
      const gap = (): void => void el(list, 'div', '', 'height:14px'); // the groups are told apart by space, not by faint rules
      gap();
      if (o.map) button(list, t('pause.map'), () => [screen.close(true), o.map!()]);
      if (o.journal) button(list, t('pause.journal'), () => screen.show(o.journal!(() => screen.show(main), (pg) => screen.show(pg))));
      if (o.arms) button(list, t('pause.arms'), () => screen.show(o.arms!(() => screen.show(main), (pg) => screen.show(pg))));
      if (o.achievements) button(list, t('pause.achievements'), () => screen.show(o.achievements!(() => screen.show(main))));
      gap();
      button(list, t('menu.settings'), () => screen.show(settingsPage(o.settings, o.change, () => screen.show(main), o.saveKeys)));
      button(list, t('menu.credits'), () => screen.show(creditsPage(() => screen.show(main))));
      gap();
      button(list, t('pause.quitTitle'), o.quit).classList.add('exit'); // the ways out are dimmer, and light ash-red when chosen
      if (desktop) button(list, t('pause.quitDesktop'), () => (saveNow(), void desktop!.quit())).classList.add('exit'); // the shell only: a browser tab is closed by its own hand
      footer(p, ''); // (no foot: the lines are what they say, and a menu is used by the keys and the mouse without a word of how; round 49)
    },
  };
  const pause = (): void => {
    cancelFocusCheck();
    cancelRetry();
    if (!menuOpen() && !o.held?.()) screen.show(main);
  };
  const openJournal = (): void => {
    if (menuOpen() || o.held?.() || !o.journal) return;
    document.exitPointerLock?.();
    screen.show(o.journal(resume, (pg) => screen.show(pg)));
  };
  addEventListener('keydown', (e) => e.code === keyLayout.journal && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && openJournal());
  addEventListener('keydown', (e) => e.code === 'Escape' && !e.repeat && pause());
  document.addEventListener('pointerlockchange', () => {
    const wasLocked = locked;
    locked = document.pointerLockElement !== null;
    if (locked) cancelRetry();
    if (locked || !wasLocked || !document.hasFocus() || menuOpen() || o.held?.()) return;
    // Leaving a menu by Esc (this one, the Elder Sign's, a shop's) takes the mouse in the same key press the browser takes it back with (Esc lets a locked mouse go): the lock is let go at once. That is not the player leaving the game; the mouse is taken again a moment later, when the key has risen.
    if (lockJustAsked(RESUME_MS)) {
      if (performance.now() - retriedAt > 3000) { // once: if the browser keeps letting it go, it is the player's hand
        retriedAt = performance.now();
        retryTimer = setTimeout(() => {
          retryTimer = undefined;
          if (document.hasFocus() && document.visibilityState === 'visible' && document.pointerLockElement === null && !menuOpen() && !o.held?.()) o.resume();
        }, 150);
      }
      return;
    }
    pause();
  });
  addEventListener('blur', () => {
    cancelFocusCheck();
    cancelRetry();
    if (menuOpen() || o.held?.()) return;
    focusTimer = setTimeout(() => {
      focusTimer = undefined;
      if (!document.hasFocus() || document.visibilityState === 'hidden') pause();
    }, FOCUS_MS);
  });
  addEventListener('focus', cancelFocusCheck);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pause();
    else if (document.hasFocus()) cancelFocusCheck();
  });
  onPadStart(pause);
  return {
    get open() {
      return screen.open;
    },
    openJournal,
  };
}
