/**
 * The newels of a flight over the void (round 104; world/abyssStair.ts builds the flight): every ten steps a squat pier stands on
 * each parapet, capped, and every other one bears a stone bowl of fire, alternating sides, so the stair is a lit way down through the
 * dark with the dark falling away on both hands. At the flight's head a pair of tall pylons stand at the parapets' ends, a fire on
 * each. Render only.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { DungeonKit } from '../data/kits';
import { DUNGEON } from '../data/tuning';
import { ABYSS, stepTop } from '../world/abyssStair';
import { roomPoint, type RoomLayout } from '../world/dungeonKit';
import { stepsOf } from '../world/dungeonParts';
import type { Dressed } from './dungeonDressing';
import { box, tint, worldUv } from './meshKit';
import { scaleRgb, type Rgb } from './palette';

const EVERY = 10; // steps between two newels
const PIER = { w: 0.7, h: 0.85, cap: 0.86 };
const BOWL = { r: 0.36, foot: 0.16, h: 0.3 };

/** A pier on the parapet at room-local (u, v), its foot at `y`; with a bowl of fire on it if `lit`. */
function newel(r: RoomLayout, u: number, v: number, y: number, c: Rgb, lit: boolean, tall: number, at: { x: number; z: number }, geos: THREE.BufferGeometry[], lights: Dressed[], kit: DungeonKit): void {
  const p = roomPoint(r, u, v);
  const h = PIER.h * tall;
  geos.push(worldUv(box(PIER.w, h, PIER.w, p.x, y + h / 2, p.z, c, 1), at));
  geos.push(worldUv(box(PIER.cap, 0.14, PIER.cap, p.x, y + h + 0.07, p.z, scaleRgb(c, 1.12), 1), at));
  if (!lit) {
    geos.push(worldUv(box(0.4, 0.3, 0.4, p.x, y + h + 0.29, p.z, scaleRgb(c, 0.9), 1), at));
    return;
  }
  const top = y + h + 0.14;
  const bowl = tint(new THREE.CylinderGeometry(BOWL.r, BOWL.foot, BOWL.h, 8).translate(p.x, top + BOWL.h / 2, p.z), scaleRgb(c, 0.75));
  geos.push(bowl.index ? bowl.toNonIndexed() : bowl);
  lights.push({ kind: 'glow', kit, light: { x: p.x, y: top + BOWL.h + 0.35, z: p.z, kind: 'fire' } });
}

/** A flight's newels and their fires. */
export function stairNewels(r: RoomLayout, kit: DungeonKit, c: Rgb, at: { x: number; z: number }): Dressed[] {
  const n = stepsOf(r);
  const h = r.half;
  const u = DUNGEON.stairLane / 2 + ABYSS.rail / 2;
  const geos: THREE.BufferGeometry[] = [];
  const lights: Dressed[] = [];
  const vOf = (k: number): number => -h + (2 * h * k) / n;
  const railTop = (k: number): number => {
    const g = Math.floor(k / ABYSS.run) * ABYSS.run;
    const e = Math.min(n, g + ABYSS.run);
    return Math.max(stepTop(r, g, n), stepTop(r, e - 1, n)) + ABYSS.railHeight;
  };
  let turn = 0;
  for (let k = EVERY / 2; k < n - 2; k += EVERY) { // a newel in the middle of a run, clear of the arches at the flight's ends
    const mid = k + ABYSS.run / 2 - (k % ABYSS.run);
    for (const s of [-1, 1]) newel(r, s * u, vOf(mid), railTop(mid), c, (turn + (s > 0 ? 1 : 0)) % 2 === 0, 1, at, geos, lights, kit);
    turn++;
  }
  for (const s of [-1, 1]) newel(r, s * u, -h + 1.4, railTop(0), scaleRgb(c, 1.05), true, 2.4, at, geos, lights, kit); // the pylons at its head
  const geo = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  return [{ kind: 'wall', kit, geo: mergeGeometries(geo) }, ...lights];
}
