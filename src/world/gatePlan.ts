/**
 * Where the doors and the fog stand (round 27): a door in each doorway of a dungeon whose kit has
 * one (data/doors.ts), except a boss room's doorways, which are given fog instead (data/fogThemes.ts),
 * as is the gate of each arena in the open (round 78: it was a ring of fog about the fight, an opaque
 * wall that hid the place and the gate it stood in; now the mist stands in the gate's opening, on the
 * court's side of the leaves, and the ring is only the line at which a sleeping horror wakes, `Wake`).
 * A boss room's doors and an open gate share one list of walls, each naming the spawn ids of the
 * horrors it keeps: the fog is gone when every one is slain. Hidden doors have their own seals and
 * are left alone. Pure: no Three.js.
 */

import { hash2 } from '../core/rng';
import { hallCandle, ringCandle, type CandleSpot } from './candlePlan';
import { doorLook, type DoorLook } from '../data/doors';
import { fogThemeOf, type FogThemeId } from '../data/fogThemes';
import { DUNGEON } from '../data/tuning';
import { kitIdOfRoom, roomAt, type DoorLayout, type DungeonLayout } from './dungeonKit';
import type { Part } from './dungeonParts';
import { STAKE } from './enclosure';
import type { WorldLayout } from './placements';
import { yawOfDir } from './worldMap';

export interface DoorSpec {
  id: string;
  x: number;
  z: number;
  y: number; // the floor in the doorway
  yaw: number; // local +z runs through the doorway, into the room beyond
  width: number;
  height: number;
  look: DoorLook;
  ajar: boolean; // stands part open until first approached
  region: string;
}

export interface FogWall {
  id: string;
  x: number; // the doorway's centre
  z: number;
  y: number;
  yaw: number; // local +z runs through it, into the room or the court beyond
  width: number;
  height: number;
  theme: FogThemeId;
  region: string;
  bosses: string[]; // roster ids
  spawns: string[]; // `boss:<id>`: slain for good, the wall is gone
  stake: { x: number; z: number; yaw: number }; // where the fallen wake: before a hall's fog on the way in, looking at it; in an open arena's court, a few steps past the gate's mist, looking at the arena (round 45: systems/candles.ts)
  candle: CandleSpot; // where its candle stands: aside the stake, at the way's edge (round 62: world/candlePlan.ts)
  gate?: string; // an open arena's: the hidden piece (the house's gate) whose opening it stands in, which E passes only once it has opened (systems/fogGates.ts)
}

/** The line at which a sleeping horror of the open world wakes (round 78: the ring the fog stood on, now unseen): nothing it keeps sees or hears across it until it is roused. */
export interface Wake {
  id: string;
  x: number;
  z: number;
  radius: number;
  bosses: string[];
  spawns: string[];
}

const FOG = { doorHeight: 3.9, doorWidth: DUNGEON.door + 0.4, wake: STAKE.ring, stake: 6.5, past: STAKE.past, behind: 1.6, gateWidth: 9 };

/** A doorway's yaw: through it, from the room `a` into the room `b` (or out). */
const yawOf = (d: DoorLayout): number => yawOfDir(d.side);

/** Whether a candle can stand at (x, z) on a floor at `y`: no solid piece, pillar, wall or pit (the invisible edge of a chasm is one), within a pace of it. */
function free(parts: readonly Part[], x: number, z: number, y: number): boolean {
  return !parts.some((p) => p.solid && (p.shape === 'box'
    ? x > p.min.x - 0.75 && x < p.max.x + 0.75 && z > p.min.z - 0.75 && z < p.max.z + 0.75 && p.max.y > y + 0.3 && p.min.y < y + 1.2
    : Math.hypot(x - p.x, z - p.z) < p.radius + 0.75 && p.y1 > y + 0.3 && p.y0 < y + 1.2));
}

/** The doors of one dungeon, and the fog in the doorways of its boss rooms. */
function dungeonGates(L: DungeonLayout, parts: readonly Part[], doors: DoorSpec[], fogs: FogWall[]): void {
  L.doors.forEach((d, i) => {
    if (d.hidden) return; // the hidden layer has its own seals
    const room = d.b ?? d.a;
    const boss = [d.a, d.b].find((r) => r?.def.boss);
    if (boss?.def.boss) {
      const bosses = [...boss.def.boss];
      const [vx, vz] = [d.x - boss.x, d.z - boss.z]; // out of the boss's room, through the doorway, and on
      const len = Math.hypot(vx, vz) || 1;
      const [ux, uz] = [vx / len, vz / len];
      const spots: [number, number][] = [];
      for (const t of [FOG.stake, 5.5, 7.5, 4.5, 3.5, 2.4]) for (const s of [0, 1.8, -1.8, 3.4, -3.4]) spots.push([d.x + ux * t - uz * s, d.z + uz * t + ux * s]); // the pace back, then a pace to either side, then nearer and farther
      const [sx, sz] = spots.find(([x, z]) => roomAt(L, x, z) !== undefined && roomAt(L, x, z) !== boss && free(parts, x, z, d.level)) ?? spots[0]; // not over a pit or against a pillar
      const stake = { x: sx, z: sz, yaw: Math.atan2(-vx, -vz) };
      const candle = hallCandle(L, parts, boss, { x: d.x, z: d.z }, { x: ux, z: uz }, d.level, stake);
      fogs.push({ id: `${L.def.id}:${boss.def.id}:${i}`, x: d.x, z: d.z, y: d.level, yaw: yawOf(d), width: FOG.doorWidth, height: FOG.doorHeight, theme: fogThemeOf(bosses, L.region), region: L.region, bosses, spawns: bosses.map((b) => `boss:${b}`), stake, candle });
      return;
    }
    const look = doorLook(kitIdOfRoom(L, room));
    if (!look) return;
    const id = `${L.def.id}:${i}`;
    doors.push({ id, x: d.x, z: d.z, y: d.level, yaw: yawOf(d), width: DUNGEON.door, height: DUNGEON.lintel, look, ajar: hash2(i, L.def.id.length, 41) < look.ajar, region: L.region });
  });
}

export interface GatePlan {
  doors: DoorSpec[];
  fogs: FogWall[];
  wakes: Wake[];
}

/** Every door and every fog wall of the world, and the lines at which the horrors of the open wake. */
export function gatePlan(w: WorldLayout): GatePlan {
  const [doors, fogs, wakes]: [DoorSpec[], FogWall[], Wake[]] = [[], [], []];
  for (const d of w.dungeons) dungeonGates(d.layout, d.parts, doors, fogs);
  w.arenas.forEach((a, i) => {
    const bosses = [...a.bosses];
    const id = `ring:${i}:${bosses[0]}`; // (the id it had as a ring of fog: lit candles are saved under it)
    const radius = a.radius + FOG.wake;
    const [sx, sz] = [a.front.x, a.front.z]; // toward the nearest Elder Sign of its realm: the way a person comes (arenaFront.ts)
    const reach = radius + FOG.past;
    const stake = a.house?.stake ?? { x: a.x + sx * reach, z: a.z + sz * reach, yaw: Math.atan2(-sx, -sz) }; // an enclosure says where the fallen wake: inside its wall
    const candle = ringCandle(a, stake, a.front, a.house);
    const spawns = bosses.map((b) => `boss:${b}`);
    wakes.push({ id, x: a.x, z: a.z, radius, bosses, spawns });
    const door = a.house?.piece.door;
    const into = { x: -sx, z: -sz }; // through the gate, into the court
    const at = a.house?.gate ?? { x: a.x + sx * radius, z: a.z + sz * radius };
    const behind = door ? Math.max(0, Math.min(FOG.behind, door.thick / 2 - 0.25)) : 0; // on the court's side of the leaves, still within the wall's thickness, so there is no walking round it
    fogs.push({ id, x: at.x + into.x * behind, z: at.z + into.z * behind, y: door?.y ?? a.y, yaw: Math.atan2(into.x, into.z), width: (door?.width ?? FOG.gateWidth) + 0.4, height: (door?.height ?? FOG.doorHeight) + 0.1, theme: fogThemeOf(bosses, a.region), region: a.region, bosses, spawns, stake, candle, ...(a.house && { gate: a.house.piece.name }) });
  });
  return { doors, fogs, wakes };
}
