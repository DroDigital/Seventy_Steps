/**
 * The pause menu (Phase 6): Esc, the pad's Start, or losing the captured mouse (switching away)
 * opens it whenever no other menu is open. The world stands still while it is open (main.ts). It
 * offers Resume, the Map, the Journal, Arms, Settings (with the Controls) and a return to the title screen, and in
 * the desktop shell a way out to the desktop (playtest round 12).
 */

import { t } from '../core/i18n';
import { keyLayout } from '../core/bindings';
import { lockJustAsked } from '../core/mouseLock';
import { creditsPage } from './credits';
import { ACCENT, button, createScreen, el, footer, menuOpen, onPadStart, title, type Page } from './menuKit';
import { menuKeys } from './menuKeys';
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

export function createPauseMenu(o: PauseOptions): PauseMenu {
  const screen = createScreen(6);
  let retriedAt = -1e9;
  const resume = (): void => {
    screen.close();
    o.resume();
  };
  const main: Page = {
    back: resume,
    build(p) {
      title(p, t('pause.title'));
      const list = el(p, 'div');
      button(list, t('pause.resume'), resume, true, t('pause.resumeHint'));
      const rule = (): void => void el(list, 'div', '', `height:1px;margin:3px 14px;background:linear-gradient(90deg,transparent,${ACCENT}40 20%,${ACCENT}40 80%,transparent)`);
      rule();
      if (o.map) button(list, t('pause.map'), () => [screen.close(true), o.map!()], true, t('pause.mapHint'));
      if (o.journal) button(list, t('pause.journal'), () => screen.show(o.journal!(() => screen.show(main), (pg) => screen.show(pg))), true, t('pause.journalHint'));
      if (o.arms) button(list, t('pause.arms'), () => screen.show(o.arms!(() => screen.show(main), (pg) => screen.show(pg))), true, t('pause.armsHint'));
      if (o.achievements) button(list, t('pause.achievements'), () => screen.show(o.achievements!(() => screen.show(main))), true, t('pause.achievementsHint'));
      rule();
      button(list, t('menu.settings'), () => screen.show(settingsPage(o.settings, o.change, () => screen.show(main), o.saveKeys)), true, t('pause.settingsHint'));
      button(list, t('menu.credits'), () => screen.show(creditsPage(() => screen.show(main))), true, t('pause.creditsHint'));
      rule();
      button(list, t('pause.quitTitle'), o.quit, true, t('pause.quitTitleHint'));
      if (desktop) button(list, t('pause.quitDesktop'), () => (saveNow(), void desktop!.quit()), true, t('pause.quitDesktopHint')); // the shell only: a browser tab is closed by its own hand
      footer(p, t('pause.resumeHint'), menuKeys());
      p.querySelector<HTMLElement>('.hint')!.style.minHeight = '1.45em'; // every line's hint is one line: no room kept for two
    },
  };
  const pause = (): void => {
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
    if (document.pointerLockElement !== null || !document.hasFocus()) return;
    // Leaving a menu by Esc (this one, the Elder Sign's, a shop's) takes the mouse in the same key press the browser takes it back with (Esc lets a locked mouse go): the lock is let go at once. That is not the player leaving the game; the mouse is taken again a moment later, when the key has risen.
    if (lockJustAsked(RESUME_MS)) {
      if (performance.now() - retriedAt > 3000) { // once: if the browser keeps letting it go, it is the player's hand
        retriedAt = performance.now();
        setTimeout(() => !menuOpen() && !o.held?.() && o.resume(), 150);
      }
      return;
    }
    pause();
  });
  addEventListener('blur', pause);
  onPadStart(pause);
  return {
    get open() {
      return screen.open;
    },
    openJournal,
  };
}
