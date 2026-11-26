/**
 * Where each shortcut stands (round 127, asked: the dungeons designed as Souls levels are): a doorway between two rooms shut by a
 * door barred on one side, its `from` side, the deeper one, so that it is found shut on the way in and opened from beyond on the
 * way back (systems/shortcuts.ts keeps which are open; render/shortcutViews.ts draws them). Its seal is the collider that fills the
 * doorway while it is barred. Pure.
 */

import type { Collider } from './colliders';
import { kitIdOfRoom, type DoorLayout, type DungeonLayout } from './dungeonKit';
import type { KitId } from '../data/kits';
import { DUNGEON } from '../data/tuning';
import { yawOfDir } from './worldMap';

export interface ShortcutPlace {
  id: string; // the link's: `<dungeon>:<from>><to>`, kept in the save once opened
  dungeon: string;
  region: string;
  from: string; // the room it is opened from
  to: string;
  x: number; // the doorway's middle
  z: number;
  y: number; // its floor
  yaw: number; // through the doorway, from `from` into `to`
  kit: KitId; // the look of its door: the room it is opened from
  width: number;
  height: number;
}

/** The shortcuts of a placed dungeon. */
export function shortcutsOf(d: DungeonLayout): ShortcutPlace[] {
  return d.doors.filter((o): o is DoorLayout & { link: NonNullable<DoorLayout['link']> } => o.link?.kind === 'shortcut').map((o) => ({
    id: o.link.id, dungeon: d.def.id, region: d.region, from: o.link.from.def.id, to: o.link.to.def.id,
    x: o.x, z: o.z, y: o.level, yaw: yawOfDir(o.link.side), kit: kitIdOfRoom(d, o.link.from), width: DUNGEON.door, height: DUNGEON.lintel,
  }));
}

/** The barred door's body: it fills the doorway, through the wall's thickness, while the bar is across it. */
export function shortcutSeal(s: ShortcutPlace): Collider {
  const { door: D, wall: T, lintel } = DUNGEON;
  const across = Math.abs(Math.sin(s.yaw)) > 0.5; // through the doorway along x: the wall runs along z
  const [hx, hz] = across ? [T / 2 + 0.1, D / 2] : [D / 2, T / 2 + 0.1];
  return { kind: 'box', min: { x: s.x - hx, y: s.y - 0.3, z: s.z - hz }, max: { x: s.x + hx, y: s.y + lintel, z: s.z + hz } };
}

/** Which side of a shortcut a point stands on: its `from` (where its bar is) or its `to`. */
export function sideOf(s: ShortcutPlace, at: { x: number; z: number }): 'from' | 'to' {
  const [fx, fz] = [Math.sin(s.yaw), Math.cos(s.yaw)]; // `from` → `to`
  return (at.x - s.x) * fx + (at.z - s.z) * fz < 0 ? 'from' : 'to';
}

/** A point a pace out from the doorway on `side`, where a person stands to work its bar or try it. */
export function standAt(s: ShortcutPlace, side: 'from' | 'to', pace = 1.4): { x: number; z: number } {
  const k = side === 'from' ? -1 : 1;
  return { x: s.x + Math.sin(s.yaw) * pace * k, z: s.z + Math.cos(s.yaw) * pace * k };
}
