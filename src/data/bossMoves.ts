/**
 * Every horror's own blows (2026-11-24; data/bossMoveKit.ts): the tables of the bands a horror is met in (data/bossPunish.ts), gathered.
 * Each blow is its horror's alone; the library's blows are the common foes' (and blind Azathoth's own, which no other strikes). Pure data.
 */

import type { OwnIds, OwnSpec } from './bossMoveKit';
import { DEEP_MOVES } from './bossMovesDeep';
import { DREAM_MOVES } from './bossMovesDream';
import { FIRST_MOVES } from './bossMovesFirst';
import { LAST_MOVES } from './bossMovesLast';
import { MIDDLE_MOVES } from './bossMovesMiddle';

export type OwnAttackId = OwnIds<typeof FIRST_MOVES> | OwnIds<typeof MIDDLE_MOVES> | OwnIds<typeof DREAM_MOVES> | OwnIds<typeof DEEP_MOVES> | OwnIds<typeof LAST_MOVES>;

const TABLES: readonly Readonly<Record<string, Readonly<Record<string, OwnSpec>>>>[] = [FIRST_MOVES, MIDDLE_MOVES, DREAM_MOVES, DEEP_MOVES, LAST_MOVES];

/** Every horror's own blows, by id. */
export const OWN_SPECS: Readonly<Record<string, OwnSpec>> = Object.fromEntries(TABLES.flatMap((t) => Object.values(t).flatMap((blows) => Object.entries(blows))));

/** The horror (its roster id) whose each own blow is. */
export const OWNER: Readonly<Record<string, string>> = Object.fromEntries(TABLES.flatMap((t) => Object.entries(t).flatMap(([who, blows]) => Object.keys(blows).map((id) => [id, who]))));

/** The ids of every horror's own blows. */
export const OWN_IDS = Object.keys(OWN_SPECS) as OwnAttackId[];

/** The library blow an attack is built on (a library blow is its own). */
export const baseOf = (id: string): string => OWN_SPECS[id]?.of ?? id;

/** The blow that runs on into `id`, if one does. */
const leadOf = (id: string): string | undefined => Object.keys(OWN_SPECS).find((k) => OWN_SPECS[k].follow === id && k !== id);

/** How an own blow is met: its own line, else the line of the blow that leads into it (a link). */
export function ownTip(id: string): string | undefined {
  for (let at: string | undefined = id, n = 0; at && n < 8; at = leadOf(at), n++) if (OWN_SPECS[at]?.tip) return OWN_SPECS[at].tip;
  return undefined;
}
