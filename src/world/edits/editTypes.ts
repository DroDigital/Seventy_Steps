/**
 * The world editor's edits (round 110; docs/WORLD_EDITOR.md): what a hand changed in the world, kept
 * as data over what the world's planners lay. Each edit names what it changes by where it came from,
 * so it maps back onto the source: a prop by the group that laid it (a region's plan, an arena's set,
 * a dungeon's furnishing), its kind and the spot it was laid on; a foe's post by its spawn id; a site
 * (an Elder Sign, a gate, a tome, an arena, a dungeon's door, an ally) by its kind, region and id, with
 * its new place in the region's own metres, as `data/sites.ts` writes it. Types only: editFile.ts
 * holds what reads and writes them.
 */

import type { Dir } from '../../data/dungeons';
import type { HouseStyle } from '../../data/regionFeatures';
import type { PropKind } from '../../data/regions';
import type { LightKind } from '../../data/tuning';

/** A prop the planners laid: the group that laid it (`region:<id>`, `arena:<first boss>`, `dungeon:<id>`), its kind, its set piece's id, and where it was laid (to the centimetre). */
export interface PropRef {
  group: string;
  kind: PropKind;
  piece?: string;
  at: readonly [x: number, z: number];
}

/** What of a set piece's look may be changed. */
export interface LookPatch {
  scale?: number;
  tint?: readonly [number, number, number];
  lit?: LightKind | null; // null: no flame
  walk?: boolean;
}

/** A prop's new values, absolute. A move that gives no `y` keeps the prop as high over the ground as it stood. */
export interface PropPatch {
  x?: number;
  y?: number;
  z?: number;
  yaw?: number;
  w?: number;
  d?: number;
  h?: number;
  seed?: number;
  style?: HouseStyle;
  look?: LookPatch;
}

/** A whole prop, for one added. */
export interface PropSpec {
  kind: PropKind;
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  yaw: number;
  seed: number;
  style?: HouseStyle;
  piece?: string; // a set piece's id (data/models, data/setKits)
  look?: LookPatch;
}

export interface SpawnPatch {
  x?: number;
  z?: number;
  yaw?: number;
  entity?: string;
}

export interface FoeSpec {
  entity: string;
  region: string;
  x: number;
  z: number;
  yaw: number;
}

export type SiteKind = 'sign' | 'gate' | 'tome' | 'ally' | 'arena' | 'dungeon';

/** A site of data/sites.ts: a tome by its name, an arena by its first boss, the rest by their id. */
export interface SiteRef {
  site: SiteKind;
  region: string;
  id: string;
}

export interface SitePatch {
  at: readonly [x: number, z: number]; // metres from the region's south-west corner, as data/sites.ts has it
  face?: Dir; // a sign's or a gate's
}

export type WorldEdit =
  | { prop: PropRef; remove: true }
  | { prop: PropRef; set: PropPatch }
  | { add: string; prop: PropSpec; region: string } // a new prop, laid with the region's own
  | { spawn: string; remove: true }
  | { spawn: string; set: SpawnPatch }
  | { add: string; foe: FoeSpec } // a new foe's post; its spawn id is `edit:<add>`
  | { site: SiteRef; set: SitePatch };

export interface WorldEditFile {
  format: 'seventy-steps-world-edits';
  version: number;
  made?: string; // when it was exported (ISO time)
  note?: string; // what the editor wants done, in their words
  base?: string[]; // the keys of the committed edits it was made over (a merge keeps those committed since)
  edits: WorldEdit[];
}
