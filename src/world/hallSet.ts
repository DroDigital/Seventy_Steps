/**
 * A dungeon boss hall's set (round 62, asked: "enhance and maximize the visual fidelity and design of all boss arenas"): the open
 * arenas had their sets in round 61 and the halls had a heart, braziers and two rows of one prop; each hall now stands the pieces of
 * its own story (data/hallSets.ts), placed by the arenas' own machinery (arenaSet.ts) about the hall's heart, turned from its entry,
 * and kept off whatever is there already: its walls and buttresses, its pillars, the doorways with a pace of floor before them, what
 * the room's own things stand on (the Elder Sign and its rest, the gate, the tome) and the dressing that is its style's. Pure.
 */

import { HALL_SETS } from '../data/hallSets';
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
} as const;

/** Whether a hall has a set of its own, by its first boss. */
export const hasHallSet = (boss: string | undefined): boolean => !!boss && boss in HALL_SETS;

/** A hall's set as props: its pieces, set about the hall's heart and turned from its entry. `dressing` is what its style already stands in it. */
export function hallProps(boss: string, r: RoomLayout, parts: readonly Part[], dressing: readonly Prop[]): Prop[] {
  const set = HALL_SETS[boss];
  if (!set) return [];
  const toward = DIRS[r.entry];
  const things = standing(r).map((u, i) => ({ at: roomPoint(r, ...u), clear: i === 1 || i === 3 ? HALL.shrine : HALL.thing })); // [centre, sign, rest, gate, tome, ...]
  const doors = r.doors.map((d) => ({ x: r.x + DIRS[d].x * r.half, z: r.z + DIRS[d].z * r.half, ix: -DIRS[d].x, iz: -DIRS[d].z }));
  const solids = dressing.filter((p) => reach(p) > 0);
  const taken = (p: Prop): boolean => {
    const k = reach(p);
    if (solidGap(parts, p.x, p.z, r.level) < k + HALL.wall) return true;
    for (const d of doors) {
      const [dx, dz] = [p.x - d.x, p.z - d.z];
      const along = dx * d.ix + dz * d.iz; // in from the wall
      const across = Math.abs(-dx * d.iz + dz * d.ix);
      if (along - k < HALL.doorDepth && across - k < HALL.door) return true;
    }
    if (things.some((t) => Math.hypot(p.x - t.at.x, p.z - t.at.z) - k < t.clear)) return true;
    return solids.some((o) => Math.hypot(p.x - o.x, p.z - o.z) - reach(o) - k < HALL.dress);
  };
  return arenaSet(set, { x: r.x, z: r.z, y: r.level, radius: r.half - DUNGEON.wall, front: { x: toward.x, z: toward.z }, well: false }, taken);
}
