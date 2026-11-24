/**
 * How far down the Stairs of Slumber the investigator is (round 105): 0 at the head of the seventy steps (the threshold's floor),
 * 1 on the deepest floor of the descent, read from the height the feet stand at. It thickens the mist (render/volumetricFog.ts,
 * `descentGain`; round 120: thick from the head and climbing fast, most of the way in the first third) and says how far the stairs'
 * lights are taken down (render/stairLights.ts). It is null in any other place: the open world and every other dungeon included,
 * where the mist is its place's own. The stairs' layout is found by where the investigator stands (terrain.ts `dungeonRoomAt`).
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

/** The share of the descent the investigator stands at: 0 at its head, 1 on its deepest floor; null out of the stairs altogether. */
export function descentAt(x: number, y: number, z: number): number | null {
  const hit = dungeonRoomAt(x, z);
  if (!hit || hit.layout.def.id !== SLUMBER_ID) return null;
  const { top, bottom } = descentSpan(hit.layout);
  return Math.min(1, Math.max(0, (top - y) / (top - bottom)));
}

/** How far the mist has climbed toward its deepest at a share of the descent: 0 at the head (and out of the stairs), 1 on the deepest floor, most of it early (round 120: an ease-out). */
export function descentRise(share: number | null | undefined): number {
  if (share === null || share === undefined) return 0;
  const s = Math.min(1, Math.max(0, share));
  const k = SLUMBER.mist.curve;
  return (1 - Math.exp(-k * s)) / (1 - Math.exp(-k));
}

/** The mist's gain: 1 out of the stairs; SLUMBER.mist.head at their head, climbing fast toward SLUMBER.mist.max on the deepest floor. */
export function descentGain(share: number | null | undefined): number {
  if (share === null || share === undefined) return 1;
  const { head, max } = SLUMBER.mist;
  return head + (max - head) * descentRise(share);
}
