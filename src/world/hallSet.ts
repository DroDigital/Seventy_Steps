/**
 * A dungeon boss hall's set (round 62, asked: "enhance and maximize the visual fidelity and design of all boss arenas"): the open
 * arenas had their sets in round 61 and the halls had a heart, braziers and two rows of one prop; each hall now stands the pieces of
 * its own story (data/hallSets.ts), placed by the arenas' own machinery (arenaSet.ts) about the hall's heart, turned from its entry,
 * and kept off whatever is there already: its walls and buttresses, its pillars, the doorways with a pace of floor before them, what
 * the room's own things stand on (the Elder Sign and its rest, the gate, the tome) and the dressing that is its style's. Pure.
 */

import type { ArenaSet } from '../data/arenaSets';
import { HALL_SETS } from '../data/hallSets';
import { ROOM_SETS } from '../data/roomSets';
import { DUNGEON } from '../data/tuning';
import { reach } from './arenaDecor';
import { arenaSet } from './arenaSet';
import { roomPoint, type RoomLayout } from './dungeonKit';
import { standing, type Part } from './dungeonParts';
import { solidGap } from './candlePlan';
import type { Prop } from './props';
import { DIRS } from './worldMap';

export const HALL = {
  wall: 0.9, // metres a piece stands clear of a wall or a pillar
  door: 2.8, // half the breadth kept before a doorway, besides the piece's own
  doorDepth: 8, // and how far in from the wall
  thing: 2.2, // clear of what the room's own things stand on...
  shrine: 4.2, // ...and of its Elder Sign and its gate, which have stones and a way about them
  dress: 1.6, // clear of the dressing of the style
  roomThing: 1.6, // an ordinary room's, which is small: clear of what stands on its things...
  roomShrine: 3.2, // ...and of its Elder Sign and gate
} as const;

/** Whether a hall has a set of its own, by its first boss. */
export const hasHallSet = (boss: string | undefined): boolean => !!boss && boss in HALL_SETS;

/** Whether an ordinary room (a dungeon's id and its room's, 'library/foyer') has a set of its own (round 74). */
export const hasRoomSet = (key: string): boolean => key in ROOM_SETS;

/** A hall's set as props: its pieces, set about the hall's heart and turned from its entry. `dressing` is what its style already stands in it. */
export const hallProps = (boss: string, r: RoomLayout, parts: readonly Part[], dressing: readonly Prop[]): Prop[] => (HALL_SETS[boss] ? setProps(HALL_SETS[boss], r, parts, dressing) : []);

/** An ordinary room's set (round 74): the same machinery, the fight's circle drawn smaller so that the walls are lined, the middle left to those who cross it. */
export const roomSetProps = (key: string, r: RoomLayout, parts: readonly Part[]): Prop[] => (ROOM_SETS[key] ? setProps(ROOM_SETS[key], r, parts, [], ROOM_INNER) : []);

export const ROOM_INNER = 0.5;

function setProps(set: ArenaSet, r: RoomLayout, parts: readonly Part[], dressing: readonly Prop[], inner?: number): Prop[] {
  const toward = DIRS[r.entry];
  const d = r.def;
  const used = (i: number): boolean => inner === undefined || (i === 1 || i === 2 ? !!d.sign : i === 3 ? !!d.gate : i < 6 ? i === 4 || i === 5 : i - 6 < (d.spawns?.length ?? 0) + (d.ally ? 1 : 0)); // (an ordinary room keeps clear only the spots its own things stand on)
  const things = standing(r).map((u, i) => ({ at: roomPoint(r, ...u), clear: i === 1 || i === 3 ? (inner === undefined ? HALL.shrine : HALL.roomShrine) : inner === undefined ? HALL.thing : HALL.roomThing, i })).filter((t) => used(t.i)); // [centre, sign, rest, gate, tome, ...]
  const doors = r.doors.map((s) => ({ x: r.x + DIRS[s].x * r.half, z: r.z + DIRS[s].z * r.half, ix: -DIRS[s].x, iz: -DIRS[s].z }));
  const solids = dressing.filter((p) => reach(p) > 0);
  const taken = (p: Prop): boolean => {
    const k = reach(p);
    if (p.set?.hung) {
      const [sx, sz] = [Math.cos(p.yaw) * Math.max(p.w, 0.3), -Math.sin(p.yaw) * Math.max(p.w, 0.3)]; // a thing against a wall: its breadth along the wall clear of what is built there (a pillar, a door's jamb), not of the wall itself
      for (const f of [-1, 0, 1]) if (solidGap(parts, p.x + sx * f, p.z + sz * f, r.level) < 0.12) return true;
    } else if (solidGap(parts, p.x, p.z, r.level) < k + HALL.wall) return true;
    for (const d of doors) {
      const [dx, dz] = [p.x - d.x, p.z - d.z];
      const along = dx * d.ix + dz * d.iz; // in from the wall
      const across = Math.abs(-dx * d.iz + dz * d.ix);
      if (along - k < HALL.doorDepth && across - k < HALL.door) return true;
    }
    if (things.some((t) => Math.hypot(p.x - t.at.x, p.z - t.at.z) - k < t.clear)) return true;
    return solids.some((o) => Math.hypot(p.x - o.x, p.z - o.z) - reach(o) - k < HALL.dress);
  };
  return arenaSet(set, { x: r.x, z: r.z, y: r.level, radius: r.half - DUNGEON.wall, front: { x: toward.x, z: toward.z }, well: false, inner }, taken);
}
