/**
 * What is said aloud, as it is shown (round 47, accessibility): its size and, if asked for, a dark band behind it,
 * for every line the game shows as it is spoken (a cutscene's caption, a talk, what is overheard, a horror's last
 * words on the banner). Two CSS variables on the page, set from the settings (ui/shell.ts); the places that show
 * such words read them, so a change applies at once, even to a line on screen.
 */

/** Sets the size (× the line's own) and the band (on or off). */
export function applyCaptions(size: number, band: boolean): void {
  const style = document.documentElement.style;
  style.setProperty('--caption', size.toFixed(2));
  style.setProperty('--caption-bg', band ? 'rgba(0,0,0,.72)' : 'transparent');
}

/** A size of `px` UI pixels, at the captions' scale (and the UI's, where `ui`). */
export const captionSize = (px: number, ui = false): string => `calc(${px}px * var(--caption, 1)${ui ? ' * var(--ui, 1)' : ''})`;

/** The style of an inline run of words that takes the band: it follows each line of a wrapped caption. */
export const CAPTION_BAND = 'background:var(--caption-bg, transparent);padding:.08em .45em;border-radius:2px;-webkit-box-decoration-break:clone;box-decoration-break:clone';
