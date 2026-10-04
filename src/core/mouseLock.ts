/**
 * When the mouse was last asked for (round 39). Leaving a menu with Esc asks for the mouse in the very key press the
 * browser lets a captured mouse go with; if it grants it, it takes it back at once, and that let-go must not be read
 * as the player leaving the game (ui/pauseMenu.ts). Whoever asks for the mouse says so here.
 */

let askedAt = -1e9;

export const noteLockAsked = (): void => void (askedAt = performance.now());

/** The mouse was asked for within the last `ms`. */
export const lockJustAsked = (ms: number): boolean => performance.now() - askedAt < ms;
