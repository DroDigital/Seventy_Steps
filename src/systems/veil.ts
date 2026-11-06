/**
 * What insight holds open (spec §3A): the dungeons' hidden doorways and bridges that show only to a mind with enough of it
 * (hiddenLayer.ts). Insight is also what the Elder Sign's upgrades cost, and spending it shuts again what it held open, so
 * the menus say which passages a purchase would close before it is paid. Pure: the dungeons' data is read, nothing is changed.
 */

import { DUNGEONS } from '../data/dungeons';

export interface Passage {
  dungeon: string; // its dungeon's name
  room: string; // the room it opens into, in words
  need: number; // the insight it shows to
  tome?: string; // what is read in the room beyond (a bridge has none)
}

/** Every doorway and bridge that waits on insight, in the order of the dungeons' data. */
export const PASSAGES: readonly Passage[] = DUNGEONS.flatMap((d) =>
  d.rooms.flatMap((r) => (r.hidden?.minInsight === undefined ? [] : [{ dungeon: d.name, room: r.id.replaceAll('_', ' '), need: r.hidden.minInsight, tome: r.tome?.name }])),
);

/** The most insight any passage wants; also reserved when surplus insight is offered, so later secrets remain affordable. */
export const PASSAGE_NEED = Math.max(0, ...PASSAGES.map((p) => p.need));

/** What is still to be found beyond a passage: a bridge always, a room until its tome has been read (`read`: given, only those unread count). */
const unpassed = (p: Passage, read?: ReadonlySet<string>): boolean => !read || !p.tome || !read.has(p.tome);

/** The passages `insight` holds open (with `read`: those whose tome is still unread, which a mind would lose by spending it). */
export const heldOpen = (insight: number, read?: ReadonlySet<string>): Passage[] => PASSAGES.filter((p) => p.need <= insight && unpassed(p, read));

/** The passages that would shut if `cost` insight were spent with `insight` in hand (none when it cannot be paid: nothing is spent). */
export const closedBy = (insight: number, cost: number, read?: ReadonlySet<string>): Passage[] =>
  cost > insight ? [] : PASSAGES.filter((p) => p.need <= insight && p.need > insight - cost && unpassed(p, read));

const named = (p: Passage): string => `${p.dungeon}: ${p.room}`;

/** A list of passages in words ("The Witch House: closet; University Library: restricted"); empty for none. */
export function listed(ps: readonly Passage[], most = 2): string {
  const shown = ps.slice(0, most).map(named);
  return ps.length > most ? `${shown.join('; ')}; and ${ps.length - most} more` : shown.join('; ');
}
