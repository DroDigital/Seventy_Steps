/**
 * Where a dungeon's traps stand (2026-11-27; data/dungeonTraps.ts says which, systems/dungeonTraps.ts plays them): each mechanism laid in its
 * rooms on open floor only, clear of the walls, pillars, pits' brinks and what is set in the room, and well clear of every doorway, so no
 * one is struck coming through a door and there is always a way past (a tile, a plate, a vent or a slab is one spot among open floor; a
 * dart's line, a jet, a blade's swing or a boulder's lane is one line across a room with floor either side of it). Seeded by the dungeon
 * and the room, so every run lays them alike. Pure: no Three.js.
 */

import type { V3 } from '../core/geom';
import { createRng, hash2 } from '../core/rng';
import { DUNGEON_TRAPS, type TrapDef, type TrapKind } from '../data/dungeonTraps';
import type { Look } from '../data/arenaWays';
import { DUNGEON, TRAP } from '../data/tuning';
import type { Part } from './dungeonParts';
import { floorAt, kitOfRoom, roomPoint, type DungeonLayout, type RoomLayout } from './dungeonKit';
import type { Prop } from './props';

export interface TrapPiece {
  kind: TrapKind;
  look: Look;
  of?: TrapDef['of'];
  trap: number; // which of the dungeon's traps it belongs to
  room: number;
  at: V3; // a tile's, plate's, vent's or slab's middle on the floor; a blade's and an eye's middle; a boulder's plate
  from?: V3; // a dart slot's or a nozzle's mouth, a boulder's start, a blade's one end of its swing
  to?: V3; // where a dart's line, a jet or a boulder's run ends; a blade's other end
  rows?: V3[][]; // a tide's rows, the far one first
  top: number; // the ceiling over it (an open ruin's: as high as its walls)
  phase: number; // 0..1: where in its rhythm it starts
}

export interface TrapLayout {
  dungeon: string;
  defs: readonly TrapDef[];
  pieces: TrapPiece[];
  rooms: { room: number; trap: number }[];
}

interface Dungeon {
  layout: DungeonLayout;
  parts: readonly Part[];
  decor: readonly Prop[];
}

/** How far (x, z) lies outside a part's footprint. */
function outside(p: Part, x: number, z: number): number {
  if (p.shape === 'cyl') return Math.hypot(x - p.x, z - p.z) - p.radius;
  return Math.hypot(Math.max(p.min.x - x, 0, x - p.max.x), Math.max(p.min.z - z, 0, z - p.max.z));
}

/** Whether (x, z) in room `r` is open floor with `m` metres clear about it. */
function opener(d: Dungeon, r: RoomLayout): (x: number, z: number, m: number, door?: number) => boolean {
  const y = r.level;
  const near = d.parts.filter((p) => {
    const [lo, hi] = p.shape === 'box' ? [p.min.y, p.max.y] : [p.y0, p.y1];
    const [x0, x1, z0, z1] = p.shape === 'box' ? [p.min.x, p.max.x, p.min.z, p.max.z] : [p.x - p.radius, p.x + p.radius, p.z - p.radius, p.z + p.radius];
    return x1 > r.rect.x0 - 3 && x0 < r.rect.x1 + 3 && z1 > r.rect.z0 - 3 && z0 < r.rect.z1 + 3 && hi > y - 3 && lo < y + 3 + Math.abs(r.rise);
  });
  const floors = near.filter((p) => p.shape === 'box' && (p.look === 'floor' || p.look === 'step' || p.look === 'deck'));
  const solids = near.filter((p) => p.solid && p.look !== 'ceiling');
  const things = d.decor.filter((p) => !p.set?.walk && Math.abs(p.x - r.x) < r.half + 3 && Math.abs(p.z - r.z) < r.half + 3);
  const doors = [...d.layout.doors, ...d.layout.windows].filter((o) => o.a === r || o.b === r);
  return (x, z, m, door = TRAP.clear.door + m * 0.5) => {
    const fy = floorAt(r, x, z);
    if (x < r.rect.x0 || x > r.rect.x1 || z < r.rect.z0 || z > r.rect.z1) return false;
    if (!floors.some((p) => p.shape === 'box' && x >= p.min.x && x <= p.max.x && z >= p.min.z && z <= p.max.z && Math.abs(p.max.y - fy) < 0.4)) return false;
    if (solids.some((p) => (p.shape === 'box' ? p.max.y : p.y1) > fy + 0.05 && (p.shape === 'box' ? p.min.y : p.y0) < fy + 2.2 && outside(p, x, z) < m)) return false;
    if (things.some((p) => Math.hypot(p.x - x, p.z - z) < Math.max(p.w, p.d) + m * 0.6)) return false;
    return doors.every((o) => Math.hypot(o.x - x, o.z - z) >= door);
  };
}

const at = (r: RoomLayout, u: number, v: number, up = 0): V3 => {
  const p = roomPoint(r, u, v);
  return { x: p.x, y: floorAt(r, p.x, p.z) + up, z: p.z };
};

/** Lays one trap's pieces in one room. */
function layRoom(d: Dungeon, r: RoomLayout, def: TrapDef, trap: number, out: TrapPiece[]): void {
  const open = opener(d, r);
  const ok = (u: number, v: number, m: number, door?: number): boolean => { const p = roomPoint(r, u, v); return open(p.x, p.z, m, door); };
  const rng = createRng((hash2(r.index, trap, d.layout.def.id.length * 977 + d.layout.def.id.charCodeAt(0)) * 4294967296) >>> 0);
  const h = r.half - DUNGEON.wall / 2;
  const top = floorAt(r, r.x, r.z) + DUNGEON.height - (kitOfRoom(d.layout, r).roof === 'open' ? 0 : 0.5);
  const cells: [number, number][] = [];
  const n = Math.floor(h - 1);
  for (let u = -n; u <= n; u += 1) for (let v = -n; v <= n; v += 1) cells.push([u, v]); // (whole metres from the middle: a corridor's lanes run down it)
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cells[i], cells[j]] = [cells[j]!, cells[i]!]; }
  const base = { kind: def.kind, look: def.look, ...(def.of && { of: def.of }), trap, room: r.index, top };
  const many = r.size === 3 ? 2 : 1; // a great hall takes more
  const pick = (n: number, m: number, gap: number, also: (u: number, v: number) => boolean = () => true): [number, number][] => {
    const got: [number, number][] = [];
    for (const [u, v] of cells) {
      if (got.length >= n) break;
      if (ok(u, v, m) && also(u, v) && got.every(([a, b]) => Math.hypot(a - u, b - v) >= gap)) got.push([u, v]);
    }
    return got;
  };
  /** From (u, v) across the room (±u) to where the floor stops, each way: the two ends. */
  const span = (u: number, v: number, m: number, door?: number): [number, number] => {
    let [lo, hi] = [u, u];
    while (lo - 0.25 > -h && ok(lo - 0.25, v, m, door)) lo -= 0.25;
    while (hi + 0.25 < h && ok(hi + 0.25, v, m, door)) hi += 0.25;
    return [lo, hi];
  };
  const phase = (): number => rng();
  switch (def.kind) {
    case 'spikes':
      for (const [u, v] of pick(3 * many, TRAP.spikes.half + 0.35, 3.6)) out.push({ ...base, at: at(r, u, v), phase: 0 });
      break;
    case 'gas':
      for (const [u, v] of pick(2 * many, 0.9, 5)) out.push({ ...base, at: at(r, u, v), phase: phase() });
      break;
    case 'crusher':
      for (const [u, v] of pick(2 * many, TRAP.crusher.half + 0.3, 4)) out.push({ ...base, at: at(r, u, v), phase: phase() });
      break;
    case 'darts':
    case 'flames':
      for (const [u, v] of pick(2 * many, 0.9, 4)) {
        const [lo, hi] = span(u, v, 0.35, 0);
        if (hi - lo < 2.4) continue; // a corridor's lane is crossed by it, wall to wall
        const left = u - lo > hi - u; // the mouth in the wall further from the plate, so the dart is seen coming
        const [a, b] = left ? [lo, hi] : [hi, lo];
        const reach = def.kind === 'flames' ? Math.min(TRAP.flames.length, Math.abs(b - a) - 0.6) : Math.abs(b - a);
        const end = a + Math.sign(b - a) * reach;
        out.push({ ...base, at: at(r, u, v), from: at(r, a, v, 1), to: at(r, end, v, 1), phase: phase() });
      }
      break;
    case 'blades':
      for (const [u, v] of pick(2 * many, 0.5, 4.5)) {
        const [lo, hi] = span(u, v, 0.35, 0);
        if (hi - lo < 2.4) continue;
        const [mid, reach] = [(lo + hi) / 2, Math.min(TRAP.blades.reach, (hi - lo) / 2)]; // it swings from wall to wall of a lane, and in a hall over its own breadth
        out.push({ ...base, at: at(r, mid, v), from: at(r, mid - reach, v), to: at(r, mid + reach, v), phase: phase() });
      }
      break;
    case 'boulder': {
      const R = TRAP.boulder.radius + 0.2;
      for (const u of [0, 1.5, -1.5, 3, -3, 5, -5]) {
        let far = Math.floor(h - 1);
        while (far > 0 && !ok(u, far, R, 1.2)) far -= 0.5; // (it rolls in from the far doorway's side)
        let near = far;
        while (near - 0.5 > -h + 1 && ok(u, near - 0.5, R, 1.2)) near -= 0.5;
        const plate = Math.round(near + 2);
        if (far - near < 7 || !ok(u, plate, 0.9)) continue;
        const [lo, hi] = span(u, (far + near) / 2, 0.35, 0);
        if (hi - lo < 2 * TRAP.boulder.radius + 1.2) continue; // room to step aside: a body's breadth beside it
        out.push({ ...base, at: at(r, u, plate), from: at(r, u, far, TRAP.boulder.radius), to: at(r, u, near, TRAP.boulder.radius), phase: 0 });
        break;
      }
      break;
    }
    case 'watcher':
      out.push({ ...base, at: at(r, 0, 0, Math.min(DUNGEON.height - 1.4, 4.2)), phase: phase() });
      break;
    case 'tide': {
      const rows: V3[][] = [];
      for (let v = h - 1.5; v > -h + 1.5; v -= TRAP.tide.row) {
        const row: V3[] = [];
        for (let u = -h + 1; u <= h - 1; u += TRAP.tide.across) if (ok(u, v, 0.3)) row.push(at(r, u, v));
        if (row.length) rows.push(row);
      }
      if (rows.length) out.push({ ...base, at: at(r, 0, 0), rows, phase: phase() });
      break;
    }
  }
}

const plans = new WeakMap<object, TrapLayout | null>();

/** A dungeon's traps laid, or null for one that keeps none. */
export function trapPlan(d: Dungeon): TrapLayout | null {
  if (plans.has(d)) return plans.get(d)!;
  const own = DUNGEON_TRAPS[d.layout.def.id];
  let plan: TrapLayout | null = null;
  if (own?.traps.length) {
    plan = { dungeon: d.layout.def.id, defs: own.traps, pieces: [], rooms: [] };
    own.traps.forEach((def, trap) => {
      for (const id of def.rooms) {
        const r = d.layout.rooms.find((x) => x.def.id === id);
        if (!r || r.def.sign || r.def.boss) continue;
        plan!.rooms.push({ room: r.index, trap });
        layRoom(d, r, def, trap, plan!.pieces);
      }
    });
  }
  plans.set(d, plan);
  return plan;
}
