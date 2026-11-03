/**
 * A flight over the void (round 104, asked: "make the actual seventy steps down into the dreamlands dramatically more visually
 * appealing"): the Stairs of Slumber's flights are no longer tunnels cut between two solid blocks but a monumental stair standing
 * in a great dark shaft, the dark falling away on both sides of it to a pit far below. Its steps are one mass from the pit's lip up,
 * a parapet a rail's height over the steps runs along both its edges in short stepped runs (solid for everyone: nobody falls), and
 * over the void beside each run an unseen stopper as high as the rail keeps a flyer or a body thrown back from drifting out over it.
 * Between two such flights the cross wall has a broad arch over the whole stair (wallParts in dungeonParts.ts asks `abyssOpening`).
 * Pure: no Three.js.
 */

import type { RoomLayout } from './dungeonKit';
import { DUNGEON } from '../data/tuning';

export const ABYSS = {
  rail: 0.5, // a parapet's thickness, outside the walkable lane
  railHeight: 1.05, // its top over the highest step of its run
  run: 5, // steps in one stepped run of the parapet
  chasm: 26, // metres the void falls below the flight's foot
  foot: 1.2, // metres the steps' mass reaches below its lowest step (its sides meet the pit's lip)
  arch: 6.2, // an arch between two flights: its height over the lower doorway's floor
};

/** Whether a room is a flight over the void. */
export const isAbyss = (r: RoomLayout | null | undefined): boolean => !!r && r.def.kind === 'stair' && !!r.def.abyss;

/** Half the breadth of the stair's mass: the lane and a parapet each side. */
export const abyssHalf = (): number => DUNGEON.stairLane / 2 + ABYSS.rail;

type LocalBox = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, look: 'chasm' | 'rail' | 'none', solid: boolean) => void;

/** The top of step `k` of `n` (its tread). */
export const stepTop = (r: RoomLayout, k: number, n: number): number => r.level + (r.rise * (k + 0.5)) / n;

/** The void beside a flight, its parapets and their stoppers, through `box` (a room-local box: u across, v along). */
export function abyssSides(r: RoomLayout, n: number, lo: number, box: LocalBox): void {
  const h = r.half;
  const [a, b] = [abyssHalf(), h - DUNGEON.wall / 2]; // from the stair's edge to the wall's face
  for (const s of [-1, 1]) {
    const [u0, u1] = s < 0 ? [-b, -a] : [a, b];
    box(u0, u1, -h, h, lo - ABYSS.chasm, lo - ABYSS.foot, 'chasm', false);
    for (let g = 0; g < n; g += ABYSS.run) {
      const e = Math.min(n, g + ABYSS.run);
      const [v0, v1] = [-h + (2 * h * g) / n, -h + (2 * h * e) / n];
      const top = Math.max(stepTop(r, g, n), stepTop(r, e - 1, n)) + ABYSS.railHeight;
      const [r0, r1] = s < 0 ? [-a, -a + ABYSS.rail] : [a - ABYSS.rail, a];
      box(r0, r1, v0, v1, lo - ABYSS.foot, top, 'rail', true);
      box(u0, u1, v0, v1, lo - ABYSS.chasm, top - 0.2, 'none', true);
    }
  }
}

/** The opening of the cross wall between rooms `a` and `b`: an arch over the whole stair where both are flights over the void, else none (the kit's doorway). */
export function abyssOpening(a: RoomLayout, b: RoomLayout | null | undefined): { width: number; lintel: number } | null {
  return isAbyss(a) && isAbyss(b) ? { width: abyssHalf() * 2, lintel: ABYSS.arch } : null;
}

/** How far below its floor a wall about a room reaches: down the void's depth beside a flight over it. */
export const wallFoot = (r: RoomLayout | null | undefined): number => (isAbyss(r) ? ABYSS.chasm : 0.3);
