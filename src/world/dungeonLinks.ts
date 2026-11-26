/**
 * A dungeon's second ways (round 125, asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md): doorways laid
 * between rooms that meet side by side, once the room tree is placed, closing it into loops. A link joins two rooms only where the
 * side they share is centred on both, as every doorway of the kit is (a corridor's lanes, a hall's plan, its pillars and its set
 * keep to the middle of a side). No link touches a boss's room: its one doorway keeps its fog. A shortcut's two floors meet level; a
 * drop's upper floor stands a drop above its lower (LINK); a window may join floors a little apart. Pure.
 */

import type { Dir, LinkDef, LinkKind } from '../data/dungeons';
import { LINK } from '../data/tuning';
import type { DoorLayout, RoomLayout } from './dungeonKit';
import { DIRS, OPPOSITE } from './worldMap';

export interface LinkLayout {
  kind: LinkKind;
  id: string; // `<dungeon>:<from>><to>`: what the save keeps of an opened shortcut (systems/shortcuts.ts)
  from: RoomLayout; // a shortcut's opening side, a drop's upper room
  to: RoomLayout;
  side: Dir; // the side of `from` it is on
  drop: number; // metres `from`'s floor stands above `to`'s in the doorway (0 but for a drop or a window)
}

/** The side of `a` on which `b` lies, when the two meet on it centred (a wide hall meets another room only in the middle of a side). */
export function sideBetween(a: RoomLayout, b: RoomLayout): Dir | null {
  const step = (a.size - 1) / 2 + (b.size - 1) / 2 + 1;
  const [di, dj] = [b.i - a.i, b.j - a.j];
  for (const s of ['n', 'e', 's', 'w'] as const) if (di === DIRS[s].x * step && dj === DIRS[s].z * step) return s;
  return null;
}

/** A room's floor where it meets its `side`: a stair's far end stands its rise above its foot. */
export const edgeLevel = (r: RoomLayout, side: Dir): number => r.level + (r.def.kind === 'stair' && side === r.axis ? r.rise : 0);

/** Why a link cannot be laid, or null when it can. */
function fault(l: LinkDef, a: RoomLayout, b: RoomLayout, side: Dir, drop: number): string | null {
  for (const [r, s] of [[a, side], [b, OPPOSITE[side]]] as const) {
    if (r.def.boss) return `${r.def.id} is a boss's room, which keeps one doorway and its fog`;
    if ((r.def.kind === 'stair' || r.def.kind === 'bridge') && s !== r.axis) return `a ${r.def.kind} is joined only at its far end`;
    if (r.doors.includes(s) || r.windows.includes(s)) return `${r.def.id} has a way on its ${s} side already`;
  }
  if (l.hidden && l.kind !== 'open') return 'only an open way can be hidden';
  if (l.kind === 'drop') return drop < LINK.dropLeast - 1e-6 || drop > LINK.dropMost + 1e-6 ? `a drop falls ${LINK.dropLeast} to ${LINK.dropMost} m (this one ${drop.toFixed(2)})` : null;
  if (l.kind === 'window') return Math.abs(drop) > LINK.windowMost + 1e-6 ? `a window joins floors at most ${LINK.windowMost} m apart` : null;
  return Math.abs(drop) > 1e-6 ? `a ${l.kind} way joins floors that meet level (they are ${drop.toFixed(2)} m apart)` : null;
}

/** Lays `defs` among the placed rooms: each passable one a doorway in `doors`, each window in `windows`; what cannot be laid is said in `errors`. */
export function layLinks(dungeon: string, defs: readonly LinkDef[], byId: ReadonlyMap<string, RoomLayout>, doors: DoorLayout[], windows: DoorLayout[], errors: string[]): void {
  for (const l of defs) {
    const tag = `${l.from}>${l.to}`;
    const [a, b] = [byId.get(l.from), byId.get(l.to)];
    if (!a || !b || a === b) {
      errors.push(`${tag}: links ${a && b ? 'a room to itself' : 'an unknown room'}`);
      continue;
    }
    const side = sideBetween(a, b);
    if (!side) {
      errors.push(`${tag}: the rooms do not meet side by side, centred`);
      continue;
    }
    const back = OPPOSITE[side];
    const drop = edgeLevel(a, side) - edgeLevel(b, back);
    const why = fault(l, a, b, side, drop);
    if (why) {
      errors.push(`${tag}: ${why}`);
      continue;
    }
    const d = DIRS[side];
    const link: LinkLayout = { kind: l.kind, id: `${dungeon}:${tag}`, from: a, to: b, side, drop };
    const door: DoorLayout = { x: a.x + d.x * a.half, z: a.z + d.z * a.half, side, a, b, level: Math.max(edgeLevel(a, side), edgeLevel(b, back)), link, ...(l.hidden && { hidden: l.hidden }) };
    if (l.kind === 'window') {
      a.windows.push(side);
      b.windows.push(back);
      windows.push(door);
    } else {
      a.doors.push(side);
      b.doors.push(back);
      doors.push(door);
    }
  }
}
