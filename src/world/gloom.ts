/**
 * How dark a roofed room is kept (round 58: "navigation relies primarily on the player's lantern"): each kit has its own gloom (data/kits.ts: a
 * crypt, a cellar and a mine are black, a library and a church have their candles), a corridor, a stair, a pit and a well are darker than the
 * halls they join, and the rooms that must be read (an Elder Sign's refuge, a horror's arena) are lit more than their kit. 0 is the light a
 * roofed room had (DUNGEON_LIGHT.dark of the night's darkness), 1 the deepest the dark goes. Pure.
 */

import type { RoomDef, RoomKind } from '../data/dungeons';
import type { DungeonKit } from '../data/kits';
import { DUNGEON_LIGHT } from '../data/lifeTuning';
import { kitOfRoom } from './dungeonKit';
import { dungeonRoomAt } from './terrain';

/** What each kind of room adds to its kit's gloom: the narrow ways are darker, the great halls (and their sconces) a little less. */
const BY_KIND: Readonly<Record<RoomKind, number>> = { corridor: 0.1, stair: 0.06, pit: 0.1, well: 0.1, bridge: 0, hall: -0.08 };

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** The gloom of a room of this kit. */
export function roomGloom(kit: DungeonKit, def: RoomDef): number {
  let g = kit.gloom + BY_KIND[def.kind] + (def.kind === 'hall' && def.wide ? -0.08 : 0);
  if (def.sign) g = Math.min(g, DUNGEON_LIGHT.refuge); // an Elder Sign is a place to rest in, and to be seen resting
  if (def.boss) g = Math.min(g, DUNGEON_LIGHT.arena); // a horror's arena is read by what it throws, and its braziers
  return clamp01(g);
}

/** The gloom of the room at (x, z): 0 where there is none (open ground, open ruins). */
export function gloomAt(x: number, z: number): number {
  const d = dungeonRoomAt(x, z);
  return d ? roomGloom(kitOfRoom(d.layout, d.room), d.room.def) : 0;
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/** The share of the night's darkness a room of this gloom takes (the open sky is its own: render/realmLook.ts). */
export const darkShare = (gloom: number): number => lerp(DUNGEON_LIGHT.dark, DUNGEON_LIGHT.deep, clamp01(gloom));

/** The share of the moon's light that reaches a room of this gloom. */
export const moonShare = (gloom: number): number => lerp(DUNGEON_LIGHT.moon, DUNGEON_LIGHT.moonDeep, clamp01(gloom));

/** The darkness with the eye taken into account: where the lantern has gone out (`lantern` 0: render/lanternLife.ts) it widens, and the dark is `DUNGEON_LIGHT.adapt` less of what it was. */
export const adapted = (dark: number, lantern: number): number => dark * (1 - DUNGEON_LIGHT.adapt * (1 - clamp01(lantern)));
