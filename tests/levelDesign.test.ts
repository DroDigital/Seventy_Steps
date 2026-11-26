/**
 * The dungeons as Souls levels (round 127, asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md), read as graphs:
 * the tree's doorways go both ways, an open link both ways, a shortcut both ways once opened and not at all before, a drop one way, down.
 * Every legacy dungeon and lair has a shortcut or a drop; every shortcut can be come to from beyond without insight, and opening it brings
 * its far side two rooms or more nearer the dungeon's Elder Sign (or its door, where it has none); nothing drops anyone where they cannot
 * walk out of; something lies in wait in each; and what the people say of the places stays true.
 */
import { describe, expect, it } from 'vitest';
import { DUNGEONS } from '../src/data/dungeons';
import type { DungeonLayout, RoomLayout } from '../src/world/dungeonKit';
import { layoutDungeon } from '../src/world/dungeonKit';
import { echoCaches } from '../src/world/caches';
import { DIRS } from '../src/world/worldMap';

/** The Stairs of Slumber keep their one descent (the tale counts its steps), and 'Umr's hall is across the span north of the First Gate (the quest's words): no shortcut in either. */
const ONE_WAY = new Set(['slumber', 'ultimate_void']);

const laid = new Map(DUNGEONS.map((d) => [d.id, layoutDungeon(d, { x: 0, z: 0 }, 0)]));
const roomOf = (d: DungeonLayout, id: string): RoomLayout => d.rooms.find((r) => r.def.id === id)!;

/** Each room's ways on, by what is open and what the mind sees. */
function ways(d: DungeonLayout, o: { opened: ReadonlySet<string>; insight: boolean }): Map<string, string[]> {
  const out = new Map(d.rooms.map((r) => [r.def.id, [] as string[]]));
  const both = (a: string, b: string): void => void (out.get(a)!.push(b), out.get(b)!.push(a));
  for (const door of d.doors) {
    if (!door.b) continue;
    if (door.hidden && !o.insight) continue;
    const [a, b] = [door.a.def.id, door.b.def.id];
    const kind = door.link?.kind;
    if (!kind || kind === 'open') both(a, b);
    else if (kind === 'shortcut' && o.opened.has(door.link!.id)) both(a, b);
    else if (kind === 'drop') out.get(a)!.push(b); // from the ledge, down
  }
  return out;
}

/** Rooms between `from` and every room (Infinity: not come to). */
function distances(g: Map<string, string[]>, from: string): Map<string, number> {
  const dist = new Map([...g.keys()].map((k) => [k, Infinity]));
  dist.set(from, 0);
  const queue = [from];
  while (queue.length) {
    const at = queue.shift()!;
    for (const next of g.get(at)!) if (dist.get(next)! === Infinity) dist.set(next, dist.get(at)! + 1), queue.push(next);
  }
  return dist;
}

const entrance = (d: DungeonLayout): string => d.rooms[0].def.id;
/** Where a fallen investigator comes back from: the dungeon's Elder Sign, else its door. */
const anchorOf = (d: DungeonLayout): string => d.rooms.find((r) => r.def.sign)?.def.id ?? entrance(d);
const shortcuts = (d: DungeonLayout) => d.doors.filter((o) => o.link?.kind === 'shortcut').map((o) => o.link!);
const NONE = new Set<string>();

describe('the dungeons as Souls levels (round 127)', () => {
  it('lays every dungeon without a fault, and gives each but the two that keep their one way a shortcut or a drop', () => {
    for (const [id, d] of laid) {
      expect(d.errors, id).toEqual([]);
      const second = d.doors.filter((o) => o.link && o.link.kind !== 'open');
      if (ONE_WAY.has(id)) continue;
      expect(second.length, `${id}: no shortcut or drop`).toBeGreaterThan(0);
    }
    const legacy = DUNGEONS.filter((d) => d.rooms.some((r) => r.sign) && !ONE_WAY.has(d.id));
    for (const d of legacy) expect(shortcuts(laid.get(d.id)!).length, `${d.id}: a legacy dungeon's loop is a shortcut back`).toBeGreaterThan(0);
  });

  it('every shortcut is come to from beyond without insight, and its near side too', () => {
    for (const [id, d] of laid) {
      const reach = distances(ways(d, { opened: NONE, insight: false }), entrance(d));
      for (const s of shortcuts(d)) {
        expect(reach.get(s.from.def.id), `${s.id}: its far side cannot be come to`).toBeLessThan(Infinity);
        expect(reach.get(s.to.def.id), `${s.id}: its near side cannot be come to`).toBeLessThan(Infinity);
        expect(reach.get(s.from.def.id)!, `${id}: a shortcut opened from nearer than it leads is no shortcut`).toBeGreaterThan(reach.get(s.to.def.id)!);
      }
    }
  });

  it('opening a shortcut brings its far side two rooms or more nearer the sign or the door', () => {
    for (const [, d] of laid) {
      for (const s of shortcuts(d)) {
        const far = s.from.def.id;
        const saved = [anchorOf(d), entrance(d)].map((anchor) => {
          const shut = distances(ways(d, { opened: NONE, insight: false }), anchor).get(far)!;
          const open = distances(ways(d, { opened: new Set([s.id]), insight: false }), anchor).get(far)!;
          return { anchor, shut, open, saved: shut - open };
        });
        const best = saved.reduce((a, b) => (b.saved > a.saved ? b : a));
        expect(best.saved, `${s.id}: from ${best.anchor}, ${best.shut} rooms shut and ${best.open} open`).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('a drop leaves nobody where they cannot walk out, and is come to without insight', () => {
    for (const [, d] of laid) {
      const g = ways(d, { opened: NONE, insight: false });
      const fromDoor = distances(g, entrance(d));
      for (const o of d.doors.filter((x) => x.link?.kind === 'drop')) {
        expect(fromDoor.get(o.link!.from.def.id), `${o.link!.id}: its ledge cannot be come to`).toBeLessThan(Infinity);
        const back = distances(g, o.link!.to.def.id);
        expect(back.get(entrance(d)), `${o.link!.id}: dropped, there is no way out`).toBeLessThan(Infinity);
        expect(o.link!.drop).toBeGreaterThan(1);
      }
    }
  });

  it('something lies in wait in every dungeon but the Stairs of Slumber, never more than two in a room, never where a sign stands', () => {
    for (const d of DUNGEONS) {
      const lurk = d.rooms.flatMap((r) => r.lurk ?? []);
      if (d.id === 'slumber') expect(lurk, d.id).toEqual([]);
      else expect(lurk.length, `${d.id}: nothing lies in wait`).toBeGreaterThan(0);
      for (const r of d.rooms) {
        expect(r.lurk?.length ?? 0, `${d.id}/${r.id}`).toBeLessThanOrEqual(2);
        if (r.sign) expect(r.lurk ?? [], `${d.id}/${r.id}`).toEqual([]);
      }
    }
  });

  it('a window and a shortcut never open on a boss: its hall keeps the doorway its fog stands in', () => {
    for (const [, d] of laid) {
      for (const o of [...d.windows, ...d.doors.filter((x) => x.link)]) expect([o.a.def.boss, o.b?.def.boss].some(Boolean), o.link!.id).toBe(false);
    }
  });

  it('still keeps an Echo cache in every dungeon (a dead end, or the deepest free room)', () => {
    for (const d of DUNGEONS) expect(echoCaches(d).size, d.id).toBeGreaterThan(0);
  });

  it('keeps what the people say of the places true', () => {
    const side = (d: DungeonLayout, a: string, b: string): string => {
      const [ra, rb] = [roomOf(d, a), roomOf(d, b)];
      return Object.entries(DIRS).find(([, v]) => Math.sign(rb.x - ra.x) === v.x && Math.sign(rb.z - ra.z) === v.z)?.[0] ?? '?';
    };
    const witch = laid.get('witch_house')!; // Peaslee: the sign on the stair landing, the closet off it to the west, the garret above it
    expect(roomOf(witch, 'landing').def.sign?.id).toBe('arkham_witch');
    expect(side(witch, 'landing', 'closet')).toBe('w');
    expect(roomOf(witch, 'closet').def.hidden?.minInsight).toBe(1);
    expect(roomOf(witch, 'garret').def.from).toBe('landing');
    const tsath = laid.get('tsath')!; // Zamacona: past the temple stair and over the span into N'kai
    expect([roomOf(tsath, 'span').def.from, roomOf(tsath, 'nkai').def.from]).toEqual(['temple_stair', 'span']);
    const migo = laid.get('migo_cities')!; // Akeley: the cities east of the landing
    expect(side(migo, 'landing', 'fungus')).toBe('e');
    const voidL = laid.get('ultimate_void')!; // the quest: across the span north of the First Gate
    expect(side(voidL, 'antechamber', 'span')).toBe('n');
    expect(roomOf(voidL, 'ultimate').def.from).toBe('span');
    const archives = laid.get('archives')!; // Peaslee: his account lies past the reading hall
    const fromDoor = distances(ways(archives, { opened: NONE, insight: false }), entrance(archives));
    expect(fromDoor.get('deep')!).toBeGreaterThan(fromDoor.get('reading')!);
    expect(roomOf(archives, 'reading').def.sign?.id).toBe('pnakotus_archives');
  });
});
