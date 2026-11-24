/**
 * The developer console is hidden (2026-11-24, asked): Ctrl+Alt+Shift+D, anywhere, reveals a
 * "Developer console" option in Settings › Play, and pressing it again hides the option and turns
 * the console off. Only with the option on does < open the console (ui/developerConsole.ts).
 */

import { redrawMenu } from './menuKit';
import { menuSound } from './menuSounds';
import type { SettingId, Settings } from './settings';

type Chord = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey' | 'repeat'>;

/** Ctrl+Alt+Shift+D, by the key's place (any layout), held down once. */
export const isRevealChord = (e: Chord): boolean => e.code === 'KeyD' && e.ctrlKey && e.altKey && e.shiftKey && !e.metaKey && !e.repeat;

/** The changes a press of the chord makes: shown, or hidden with the console turned off. */
export function revealChanges(s: Pick<Settings, 'devRevealed'>): readonly (readonly [SettingId, number])[] {
  return s.devRevealed > 0.5 ? [['devRevealed', 0], ['devConsole', 0]] : [['devRevealed', 1]];
}

/** Whether < may open the developer console now. */
export const devConsoleOn = (s: Pick<Settings, 'devRevealed' | 'devConsole'>): boolean => s.devRevealed > 0.5 && s.devConsole > 0.5;

/** Listens for the chord; installed before any menu, so its capture listener hears it first. */
export function installDevReveal(settings: Settings, change: (id: SettingId, v: number) => void): void {
  addEventListener('keydown', (e) => {
    if (!isRevealChord(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    for (const [id, v] of revealChanges(settings)) change(id, v);
    menuSound(settings.devRevealed > 0.5 ? 'open' : 'close');
    redrawMenu(); // an open Settings page shows (or loses) the line at once
  }, true);
}
