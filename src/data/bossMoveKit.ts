/**
 * A horror's own blows (2026-11-24; asked: "make sure every boss has a unique attack-moveset because bossfights become repetitive fast").
 * Every horror that fights by a script strikes blows of its own, which no other creature strikes: each is a blow of the shared library
 * (data/attacks.ts, spec §3E) that it is built on, `of`, with the horror's own timing, shape, matter and chain laid over it, and a line
 * on how it is met, read under UNMADE when it was the last (systems/deathNotes.ts). The library's mechanics are the only logic: a blow of
 * its own is data. A `link` is a blow that only ever follows another (its range is none, so no horror chooses it on its own; a chained
 * follow-up shows itself for at least 0.2 s, tests/bossMovesets.test.ts). Nothing of the base's chain is kept: a blow built on the vortex
 * or a chain's head names its own next link. Pure data: no Three.js.
 */

import type { AttackDef } from './attacks';
import type { LibraryId } from './schema';

type Nested = 'bolts' | 'pool' | 'marks' | 'wave' | 'cloud' | 'sweep' | 'barrage' | 'pull';

/** What a blow of its own changes of the blow it is built on: any number, and the nested ones in part. */
export type OwnOver = Partial<Omit<AttackDef, 'kind' | 'follow' | Nested>> & { [K in Nested]?: Partial<NonNullable<AttackDef[K]>> } & { follow?: string };

/** A horror's own blow: the library blow it is built on, what it changes, and (for a blow that may open) how it is met. */
export type OwnSpec = OwnOver & { of: LibraryId; tip?: string };

/** A blow of its own that a horror may open with. */
export const own = (of: LibraryId, over: OwnOver, tip: string): OwnSpec => ({ of, ...over, tip });

/** A blow that only follows another (`follow`): never chosen on its own. Its tip is its own, or the blow that leads into it. */
export const link = (of: LibraryId, over: OwnOver, tip?: string): OwnSpec => ({ of, ...over, range: [0, 0], ...(tip && { tip }) });

/** A table of horrors' own blows: each horror's roster id, then its blows by id. */
export type OwnTable = Readonly<Record<string, Readonly<Record<string, OwnSpec>>>>;

/** The ids of the blows in a table. */
export type OwnIds<T> = { [H in keyof T]: keyof T[H] }[keyof T] & string;
