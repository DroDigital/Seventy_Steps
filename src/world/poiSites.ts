/**
 * Where the points of interest stand (round 61; data/pois.ts, planned in world/poiPlan.ts as part of each region's plan): by region,
 * by id, and the nearest to a point. The plans are pure and built once, as the map's art and the named places already build them.
 */

import { REGIONS } from '../data/regions';
import { regionPlan } from './regionPlan';
import type { PoiSite } from './poiPlan';

export type { PoiSite } from './poiPlan';

const NONE: readonly PoiSite[] = [];

/** The points of interest of a region, resolved on its land. */
export function poiSitesOf(region: string): readonly PoiSite[] {
  const def = REGIONS.find((r) => r.id === region);
  return def ? regionPlan(def).pois : NONE;
}

/** Every point of interest of the given regions (all of them by default). */
export const allPoiSites = (regions?: readonly string[]): PoiSite[] => REGIONS.filter((r) => !regions || regions.includes(r.id)).flatMap((r) => poiSitesOf(r.id));
