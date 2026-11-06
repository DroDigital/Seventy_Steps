/**
 * A dungeon's own look read for one room (round 108; data/dungeonLooks.ts): the look of its kit in its dungeon, the form its pillars
 * take (a boss hall's lore may say otherwise: data/hallLore.ts) and its stone's tint. Render only.
 */

import { lookOf, type DungeonLook, type PillarForm } from '../data/dungeonLooks';
import { DUNGEON_KITS, KITS, type DungeonKit, type KitId } from '../data/kits';
import { kitIdOfRoom, type DungeonLayout, type RoomLayout } from '../world/dungeonKit';
import { loreOf } from './hallLore';
import type { Rgb } from './palette';

/** The look of a room: its dungeon's own, if it is of the dungeon's own kit. */
export const roomLook = (d: DungeonLayout, r: RoomLayout): DungeonLook => lookOf(d.def.id, kitIdOfRoom(d, r), DUNGEON_KITS[d.def.id] ?? 'masonry');

/** What a room's pillars are drawn as. */
export const pillarFormOf = (d: DungeonLayout, r: RoomLayout): PillarForm => loreOf(r)?.pillar ?? roomLook(d, r).pillar;

/** A kit's colour in this dungeon: its own kit's stone tinted by its look. */
export function tinted(d: DungeonLayout, colour: (kit: DungeonKit) => Rgb): (kit: DungeonKit) => Rgb {
  const own: KitId = DUNGEON_KITS[d.def.id] ?? 'masonry';
  const tint = lookOf(d.def.id, own, own).tint;
  return (kit) => {
    const c = colour(kit);
    return tint && kit === KITS[own] ? [Math.min(1, c[0] * tint[0]), Math.min(1, c[1] * tint[1]), Math.min(1, c[2] * tint[2])] : c;
  };
}
