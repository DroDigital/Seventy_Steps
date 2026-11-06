/**
 * Where the trader at the lamps stands once the world is made (2026-11-06): the place his region's plan gave him (world/traderPlan.ts).
 * Pure: no Three.js.
 */

import { REGIONS } from '../data/regions';
import { TRADER_SITES } from '../data/npcs';
import type { TraderSpot } from '../data/traders';
import { regionPlan } from './regionPlan';

/** The trader `id`'s place, or undefined for anyone else. */
export function traderSpot(id: string): TraderSpot | undefined {
  const site = TRADER_SITES.find((t) => t.id === id);
  const region = site && REGIONS.find((r) => r.id === site.region);
  return region ? regionPlan(region).traders.find((t) => t.id === id) : undefined;
}
