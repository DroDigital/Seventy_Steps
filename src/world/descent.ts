/**
 * How far down the Stairs of Slumber the investigator is (round 105): 0 at the head of the seventy steps (the threshold's floor),
 * 1 on the deepest floor of the descent, read from the height the feet stand at. It thickens the mist exponentially
 * (render/volumetricFog.ts, `descentGain`) and says how far the stairs' lights are taken down (render/stairLights.ts). It is 0 in any
 * other place: the open world and every other dungeon included. The stairs' layout is found by where the investigator stands
 * (terrain.ts `dungeonRoomAt`).
 */

import { SLUMBER } from '../data/tuning';
import type { DungeonLayout } from './dungeonKit';
import { dungeonRoomAt } from './terrain';

export const SLUMBER_ID = 'slumber';

const spans = new WeakMap<DungeonLayout, { top: number; bottom: number }>();

/** The head of a stairs' dungeon (the threshold's floor) and the deepest floor of its descent, in metres (cached per layout). */
export function descentSpan(layout: DungeonLayout): { top: number; bottom: number } {
  let span = spans.get(layout);
  if (!span) {
    const top = layout.rooms.find((r) => r.def.id === 'threshold')?.level ?? layout.base;
    const floors = layout.rooms.map((r) => Math.min(r.level, r.level + (r.def.kind === 'stair' ? r.rise : 0)));
    span = { top, bottom: Math.min(top - 1, ...floors) };
    spans.set(layout, span);
  }
  return span;
}

/** The share of the descent the investigator stands at: 0 at its head, 1 on its deepest floor, 0 out of the stairs altogether. */
export function descentAt(x: number, y: number, z: number): number {
  const hit = dungeonRoomAt(x, z);
  if (!hit || hit.layout.def.id !== SLUMBER_ID) return 0;
  const { top, bottom } = descentSpan(hit.layout);
  return Math.min(1, Math.max(0, (top - y) / (top - bottom)));
}

/** The mist's gain at a share of the descent: 1 at its head, SLUMBER.mist.max on its deepest floor, climbing exponentially between. */
export function descentGain(share: number): number {
  const s = Math.min(1, Math.max(0, share));
  const { max, curve } = SLUMBER.mist;
  return 1 + (max - 1) * ((Math.exp(curve * s) - 1) / (Math.exp(curve) - 1));
}
