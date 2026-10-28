/**
 * The three endings (spec §5, Phase 5): wake and seal the Gate · pass through with 'Umr at-Tawil ·
 * become Nyarlathotep's herald. 'Umr at-Tawil offers the second when it yields, in two steps
 * (signatures/umr.ts). The other two are done in the world before the Court's Elder Sign once
 * Azathoth slumbers: the silver key, and the tall man aside (systems/finale.ts). An ending closes
 * the dream: the world remembers which (it is saved), and the investigator may walk on in it. Pure.
 */

import type { EndingId } from '../data/endings';
import type { Game } from './components';

/** The Elder Sign in Azathoth's Court, where the court's two endings are chosen. */
export const COURT_SIGN = 'beyond_court';

/** Azathoth slumbers: its piping has been outlasted. */
export const courtOpen = (g: Game): boolean => !!g.overworld?.slain.has('boss:azathoth');

/** The dream has been brought to an ending (it is saved: the world remembers which). */
export const ended = (g: Game): boolean => !!g.overworld?.ending;

/** The endings on offer when resting at this Elder Sign: none once the dream has ended (round 55: the Court went on offering them, and a second choice told another and overwrote the first). */
export const courtEndings = (g: Game, sign: string): EndingId[] => (sign === COURT_SIGN && courtOpen(g) && !ended(g) ? ['seal', 'herald'] : []);

const UMR = 'umr_at_tawil'; // the Guide's roster id (signatures/umr.ts)

/**
 * Whether the boss of this fight (its roster id) has been parted from in peace: the Guide, once the investigator has gone through the Gate with it. It takes
 * no part in anything more: it hunts no more, and the fight and its fog are let go of (brain.ts, bossFight.ts), so the walk on that the card offers is a
 * walk on and not a stay in its ring. Read from the ending, so a save keeps it (round 55).
 */
export const parted = (g: Game, fightId: string | undefined): boolean => fightId === UMR && g.overworld?.ending === 'silver_key';

/** The dream ends, once: a second ending is not told (round 55: it replayed the scene and the card, overwrote the first and counted twice). */
export function endGame(g: Game, id: EndingId): void {
  if (ended(g)) return;
  if (g.overworld) g.overworld.ending = id;
  g.events.emit('Ending', { id });
}
