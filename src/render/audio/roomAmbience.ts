/**
 * Round 121: what a dungeon's room sounds like, its kit's soundscape (data/dungeonAmbience.ts KIT_AMBIENCE; a kit without one falls back
 * on its kind's, data/samples.ts DUNGEON_AMBIENCE) with whatever its dungeon adds of its own tale (DUNGEON_ACCENTS), or null for a room
 * under the sky, which keeps its region's. Put together once for each dungeon and kit and kept, so the same room is the same object and
 * render/audio/ambience.ts does not cross-fade into what it already plays. Pure.
 */

import { DUNGEON_ACCENTS, KIT_AMBIENCE } from '../../data/dungeonAmbience';
import { KITS, type DungeonKit, type KitId } from '../../data/kits';
import { DUNGEON_AMBIENCE, type Ambience } from '../../data/samples';

const made = new Map<string, Ambience | null>();

export function roomAmbience(dungeon: string, kit: KitId): Ambience | null {
  const key = `${dungeon}/${kit}`;
  let a = made.get(key);
  if (a === undefined) {
    const sound = (KITS[kit] as DungeonKit | undefined)?.sound ?? 'open';
    const base = sound === 'open' ? null : KIT_AMBIENCE[kit] ?? DUNGEON_AMBIENCE[sound];
    const accents = [DUNGEON_ACCENTS[dungeon], DUNGEON_ACCENTS[key]].filter((x) => !!x);
    a = base && accents.length ? { beds: [...base.beds, ...accents.flatMap((x) => x.beds ?? [])], spots: [...base.spots, ...accents.flatMap((x) => x.spots ?? [])], roofed: true } : base;
    made.set(key, a);
  }
  return a;
}
