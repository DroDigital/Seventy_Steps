/**
 * The pad's buttons, named once (round 45). The Gamepad API's standard mapping numbers them by place:
 * 0 is the south face button (A), 1 the east (B). Every reader of a pad (the game's input, the menus,
 * the intro, the cutscenes, the map) takes its indices from here, and the prompts name them from the
 * same table (ui/glyphs.ts), so a button can no longer mean one thing in one place and another elsewhere.
 * A pad that reports its A and B the other way round (a Nintendo-style layout, a driver that names
 * buttons by their printed label) is mended by one switch, `setPadSwap` (Settings › Controls, kept with
 * the settings), applied where the pad is read (core/pads.ts), so every reader follows it at once.
 */

export const PAD_BUTTON = {
  a: 0, b: 1, x: 2, y: 3,
  lb: 4, rb: 5, lt: 6, rt: 7,
  select: 8, start: 9, l3: 10, r3: 11,
  up: 12, down: 13, left: 14, right: 15,
} as const;
export type PadButtonName = keyof typeof PAD_BUTTON;

let swap = false;
/** Whether A and B are read the other way round (the player's setting). */
export const setPadSwap = (on: boolean): void => void (swap = on);
export const padSwapped = (): boolean => swap;

/** The buttons as the game should read them: A and B exchanged when the switch is on; the list is not changed. */
export function faceSwapped<T>(buttons: readonly T[], on: boolean = swap): readonly T[] {
  if (!on || buttons.length <= PAD_BUTTON.b) return buttons;
  const out = [...buttons];
  [out[PAD_BUTTON.a], out[PAD_BUTTON.b]] = [out[PAD_BUTTON.b], out[PAD_BUTTON.a]];
  return out;
}
