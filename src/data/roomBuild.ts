/** The helpers that write a dungeon's room graph compactly (dungeons.ts, lairs.ts, dungeonsFar.ts; shared in playtest round 24). */

import type { Dir, LinkDef, LinkKind, RoomDef, RoomKind, Veil } from './dungeons';

type Extras = Omit<RoomDef, 'id' | 'kind' | 'from' | 'dir'>;
export const room = (id: string, kind: RoomKind, from: string | undefined, dir: Dir, x: Extras = {}): RoomDef => ({ id, kind, from, dir, ...x });
export const stair = (id: string, from: string, dir: Dir, rise: number, x: Extras = {}): RoomDef => room(id, 'stair', from, dir, { rise, ...x });
/** A second way between two rooms side by side (round 125): a loop, a shortcut opened from `from`, a drop from `from` down into `to`, or a window. */
export const link = (from: string, to: string, kind: LinkKind, hidden?: Veil): LinkDef => ({ from, to, kind, ...(hidden && { hidden }) });
