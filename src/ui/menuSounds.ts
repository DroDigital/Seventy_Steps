/**
 * What the menus sound (round 40: one triangle blip for the focus moving, a choice, a tab and a page, every time): each
 * thing a menu does has its own sound (data/foleySounds.ts UI). The shell says how they are played (ui/shell.ts); a
 * screen that is meant to be silent (the opening's) mutes them while it stands.
 */

export type MenuSoundKind = 'move' | 'choose' | 'back' | 'tab' | 'open' | 'close' | 'tick';

let play: (kind: MenuSoundKind) => void = () => undefined;
let mutes = 0;

/** How a menu sound is played. */
export const setMenuSound = (fn: (kind: MenuSoundKind) => void): void => void (play = fn);

/** A menu does `kind`. */
export const menuSound = (kind: MenuSoundKind): void => void (mutes === 0 && play(kind));

/** Mutes the menus' sounds (true) or lets them be heard again (false): counted, so two screens may ask. */
export const muteMenus = (on: boolean): void => void (mutes = Math.max(0, mutes + (on ? 1 : -1)));
