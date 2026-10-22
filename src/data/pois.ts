/**
 * Points of interest (round 61: "address map sparsity by introducing points of interest marked with a grayed-out ? until discovered,
 * with scripted or dynamic events drawn from Lovecraft's narratives, chests of Echoes, anomalous phenomena, and dense areas of foes
 * and loot"). Each stands at a feature the region plan already placed (the nth of its kind: a graveyard, a ring of stones, a ruin,
 * an outcrop, a grove) or at a spot found on the land (a shore, a cliff, a clearing for a maze), is shown on the map as a "?" once
 * the ground near it is charted, and is found by coming to it: its name is read out, its line spoken, its chest set down (Echoes for
 * whoever takes them), its foes already at their posts (world/poiPlan.ts), its phenomenon drawn (render/poiFx.ts). Pure data: no Three.js.
 */

import type { FeatureKind } from '../world/features';
import { POIS_BEYOND } from './poisBeyond';
import { POIS_DREAM } from './poisDream';
import { POIS_WAKING } from './poisWaking';
import type { PropKind } from './regions';

export type PoiKind = 'tale' | 'hoard' | 'rite' | 'anomaly' | 'den';
export const POI_KINDS: readonly PoiKind[] = ['tale', 'hoard', 'rite', 'anomaly', 'den'];

/** How a place's phenomenon is drawn (render/poiFx.ts): its form, in one of the anomaly hues (nothing else is saturated). */
export interface PoiFx {
  form: 'column' | 'ring' | 'motes' | 'sheet';
  hue: 'magenta' | 'purple' | 'green' | 'bone';
}

/** Where a place stands: at a feature of the region plan, or on the land near a point (metres from the region's south-west corner, as sites are). */
export type PoiAt =
  | { feature: FeatureKind; nth: number }
  | { near: readonly [u: number, v: number]; as: 'shore' | 'cliff' | 'clearing' };

export interface PoiDef {
  id: string;
  region: string;
  at: PoiAt;
  name: string;
  kind: PoiKind; // the mark it is given on the map once found, and how it is sorted in the tests
  story: string; // the tale of Lovecraft's it recalls
  line: string; // said on finding it
  again?: string; // said when one comes back into it (the places that speak twice)
  foes?: { ids: readonly string[]; n: number }; // the guard that stands about it, drawn from these
  hoard?: number; // Echoes in the chest set down near its heart
  fx?: PoiFx;
  aura?: number; // sanity a second while within it: below nothing drains, above mends
  insight?: number; // insight for finding it (default POI.insight for an anomaly or a tale, none for the rest)
  dress?: readonly (readonly [PropKind, number])[]; // what is set about it besides: a kind and how many
  maze?: boolean; // walls of stone laid out about its middle (a clearing for it is found)
}

export const POIS: readonly PoiDef[] = [...POIS_WAKING, ...POIS_BEYOND, ...POIS_DREAM];
export const poisOf = (region: string): readonly PoiDef[] => POIS.filter((p) => p.region === region);
export const poiDef = (id: string): PoiDef | undefined => POIS.find((p) => p.id === id);

/** The kind of the mark kept in the save among what was told: `poi:<id>`. */
export const poiKey = (id: string): string => `poi:${id}`;
/** A chest's name among the things taken: `Hoard: <id>`. */
export const hoardName = (id: string): string => `Hoard: ${id}`;
