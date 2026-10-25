/**
 * The line said under the veil (round 24): a lesson for what the investigator has met and not yet been
 * told of it, else Lovecraft's; what has been said is kept in this browser with the hints (ui/hints.ts).
 */

import { t } from '../core/i18n';
import { pickLore } from '../data/loreLines';
import { epigraphKey } from '../data/regionEpigraphs';

export const HINTS_KEY = 'lovecraft-souls-like/hints';
const SHOWN_KEY = 'lovecraft-souls-like/lore-shown';

function read(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

/** The next line to say (and it is remembered as said). */
export function nextLore(): string {
  const shown = read(SHOWN_KEY);
  const line = pickLore(read(HINTS_KEY), shown);
  try {
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown, line]));
  } catch {
    // No storage: the lessons come round again.
  }
  return line;
}

const said = new Set<string>(); // the realms whose epigraph the veil has said this session: their title card does not say it again (ui/realmCards.ts)

/**
 * Round 78: the first journey to a realm says its epigraph under the veil, once in this browser (kept with the lines said); else nothing,
 * and the usual line follows. Without storage to remember it by, nothing: it would be said at every journey there.
 */
export function firstEpigraph(region: string | undefined): string | undefined {
  const key = epigraphKey(region);
  if (!key || !region) return undefined;
  const shown = read(SHOWN_KEY);
  const mark = `epigraph:${region}`;
  if (shown.has(mark)) return undefined;
  try {
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown, mark]));
  } catch {
    return undefined;
  }
  said.add(region);
  return t(key);
}

/** Whether the veil has just said this realm's epigraph (and forgets it: the next time the card may say it). */
export const saidUnderVeil = (region: string): boolean => said.delete(region);
