/**
 * Legacy dungeons (spec §3D) as room graphs over the primitive kit: corridor, hall, stair, pit,
 * bridge, well. The first room is the entrance and opens outside on its `dir` side; every other
 * room opens off `from`, on that room's `dir` side. Stairs run straight on, climbing `rise` metres.
 * world/dungeonKit.ts lays a graph out on a grid of 16 m cells; sites.ts says where each one stands. The graphs are dungeonsWaking.ts,
 * dungeonsDeep.ts, dungeonsFar.ts and lairs.ts (round 127: and their links, the second ways that close them into loops).
 */

export const ROOM_KINDS = ['corridor', 'hall', 'stair', 'pit', 'bridge', 'well'] as const;
export type RoomKind = (typeof ROOM_KINDS)[number];

export type Dir = 'n' | 'e' | 's' | 'w';

/** The hidden-layer condition of a bridge's deck, or of the doorway into any other room (spec §3A). */
export interface Veil {
  minInsight?: number;
  maxSanity?: number; // a band floor
  minSeals?: number; // the waking world's seals broken (systems/seals.ts): a door sealed until then (round 12)
  met?: string; // one spoken with first (data/npcs.ts): a door sealed until then (round 123: Nasht and Kaman-Thah keep the way on down from the Cavern of Flame)
}

export interface RoomDef {
  id: string;
  kind: RoomKind;
  from?: string; // the room it opens off (absent for the entrance)
  dir: Dir; // the entrance: the side that opens outside; others: the side of `from` they lie on
  wide?: boolean; // hall only: a great hall of 3 × 3 cells
  rise?: number; // stair only: metres climbed toward the far side (negative descends)
  abyss?: boolean; // stair only: a monumental flight over the void, parapets for walls (round 104: the Stairs of Slumber's; world/abyssStair.ts)
  steps?: number; // stair only: how many steps it is cut into (round 104: the Stairs of Slumber count theirs); else one for every 25 cm of rise
  hidden?: Veil;
  boss?: readonly string[]; // a boss arena
  variant?: 'boss';
  spawns?: readonly string[];
  lurk?: readonly string[]; // round 127: foes lying in wait, unseen, that spring when the investigator comes near (systems/ambush.ts)
  ally?: string;
  allyAt?: readonly [u: number, v: number]; // where its ally stands, across and along the room from its middle (round 123: the Cavern of Flame's priests, at a place of their own); else the room's first spot
  sign?: { id: string; name: string; rest?: readonly [u: number, v: number] }; // an Elder Sign (`rest`: where one rises at it, across and along the room, if not its kind's place: 2026-11-27, the signs moved clear of a corridor's walls kept the place they were risen at, which the land's roads are laid to)
  gate?: { id: string; name: string; to: string };
  tome?: { name: string; insight: number };
  vial?: string; // a Silver Vial lies here (its unique name): one more dose of West's Reagent
  weapon?: string; // a weapon lies here (data/weapons.ts)
  words?: string; // said as the investigator first comes in (round 12: the Seventy Steps were nine unmarked rooms)
  kit?: KitId; // its own look, not its dungeon's (round 13: the Mi-Go's tunnels under Akeley's farm were floored with boards)
}

export interface DungeonDef {
  id: string;
  name: string;
  region: string;
  sealed?: boolean; // no way in from outside: the Stairs of Slumber are reached only in dreams
  rooms: readonly RoomDef[];
  links?: readonly LinkDef[]; // round 127: the second ways between rooms that close the graph into loops (docs/LEVEL_DESIGN.md)
}

/**
 * A second way between two rooms that meet side by side, centred on the side they share (round 127, asked: the dungeons designed
 * as Souls levels are). 'open': a doorway like any other, closing a loop. 'shortcut': a doorway shut by a barred door that opens
 * only from `from`, the far side, and stays open once opened (systems/shortcuts.ts). 'drop': a ledge in `from`'s wall, a short drop
 * into `to` below it that cannot be climbed back. 'window': a barred opening a person looks through and cannot pass.
 */
export type LinkKind = 'open' | 'shortcut' | 'drop' | 'window';

export interface LinkDef {
  from: string; // a shortcut's opening side; a drop's upper room
  to: string;
  kind: LinkKind;
  hidden?: Veil; // an open way that only a mind can see, as a room's doorway
}

import type { KitId } from './kits';
import { DEEP_DUNGEONS } from './dungeonsDeep';
import { FAR_DUNGEONS } from './dungeonsFar';
import { LAIRS } from './lairs';
import { WAKING_DUNGEONS } from './dungeonsWaking';

export { SLUMBER_STEPS } from './dungeonsDeep';

export const DUNGEONS: readonly DungeonDef[] = [...LAIRS, ...WAKING_DUNGEONS, ...DEEP_DUNGEONS, ...FAR_DUNGEONS]; // (round 127: the legacy dungeons in two files, dungeonsWaking.ts and dungeonsDeep.ts)

export const getDungeon = (id: string): DungeonDef | undefined => DUNGEONS.find((d) => d.id === id);
