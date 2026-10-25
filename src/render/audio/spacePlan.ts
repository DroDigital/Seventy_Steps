/**
 * Which room the investigator's ears are in (round 78): the kit of the dungeon room they stand in (its stone, its roof), the
 * room's shape (a corridor is close, a wide hall opens, a pit rings), the region's own air (the Outer Dark is an endless
 * faint hall), and a horror's fog closed about a fight. Pure: data/acoustics.ts holds the rows, audio/space.ts plays them.
 */

import { KIT_SPACE, REGION_SPACE, ROOM_SHAPE, SPACE, SPACES, WIDE_HALL, type SpaceId, type SpaceRow } from '../../data/acoustics';
import type { RoomKind } from '../../data/dungeons';
import type { KitId } from '../../data/kits';

export interface SpaceInput {
  kit: KitId | null; // the dungeon room's kit (null: outside)
  kind: RoomKind | null; // and its shape
  wide: boolean; // a great hall
  region: string | null;
  fighting: boolean; // a horror's fight is engaged
}

/** The space a place is: a dungeon room's kit, else the region's air. */
export const spaceIdOf = (i: Pick<SpaceInput, 'kit' | 'region'>): SpaceId => (i.kit ? KIT_SPACE[i.kit] : REGION_SPACE[i.region ?? ''] ?? 'open');

/** The row to play for where the investigator stands: the place's, shaped by its room, and drawn toward a sealed hall in a fight. */
export function spaceOf(i: SpaceInput): SpaceRow {
  const base = SPACES[spaceIdOf(i)];
  const shape = i.kit && i.kind ? ROOM_SHAPE[i.kind] : null;
  const wide = i.kit && i.wide ? WIDE_HALL : 1;
  let [room, hall, dark] = [base.room * (shape?.room ?? 1), base.hall * (shape?.hall ?? 1) * wide, base.dark * (shape?.dark ?? 1)];
  let [pre, bed] = [base.pre, base.bed];
  if (i.fighting) {
    const f = SPACES.fight;
    [room, hall, dark, pre, bed] = [Math.max(room, f.room), Math.max(hall, f.hall), Math.min(dark, f.dark), Math.max(pre, f.pre), Math.max(bed, f.bed)];
  }
  return { room, hall: Math.min(hall, SPACE.hallMost), dark, pre, bed };
}
