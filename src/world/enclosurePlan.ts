/**
 * Which enclosure a horror's house is (round 67, 68): a place built of the packs' models (enclosurePlace.ts), a ring of wall (arenaHouse.ts), a bailey (enclosureBailey.ts), a basin (enclosureBasin.ts) or an island in a river (enclosureRiver.ts), by what its data says;
 * how far from the fight's ring its gate stands, which the court before it is laid from; and whether the land under the whole of it is the
 * realm's own to stand on. Pure: no Three.js.
 */

import { HOUSE, type House } from '../data/arenaHouses';
import { planHouse, courtLand } from './arenaHouse';
import { planBailey } from './enclosureBailey';
import { planBasin } from './enclosureBasin';
import { planRiver } from './enclosureRiver';
import { enrich, planPlace } from './enclosurePlace';
import { EXTRAS, PLACES } from './places';
import type { Enclosure, EnclosureSite } from './enclosure';
import { padDistance } from './sitePads';
import { chunkOf, regionAt, walkableChunk } from './worldMap';

export { courtLand };

/** Metres from the fight's ring to the gate: the ring's reach, or the bailey's or the basin's `ahead`. */
export const gateReach = (h: House): number => h.bailey?.ahead ?? h.basin?.ahead ?? h.reach ?? HOUSE.reach;

export function planEnclosure(h: House, boss: string, s: EnclosureSite): Enclosure {
  if (PLACES[boss]) return planPlace(h, boss, s);
  const base = h.bailey ? planBailey(h, boss, s) : h.basin ? planBasin(h, boss, s) : h.river ? planRiver(h, boss, s) : planHouse(h, boss, s);
  const extra = EXTRAS[boss];
  return extra ? enrich(base, extra, h, s) : base;
}

/** Whether a house is laid as a shape of its own, so land for the whole of it is asked before it takes its front (a ring's is the court's alone). */
export const hasOutline = (h: House): boolean => !!(h.bailey || h.basin || h.river || h.place);

/** Whether every place the enclosure levels (its wall and what lies a little beyond) is in the region and walkable: sampled every 6 m. */
export function enclosureLand(region: string, e: Enclosure): boolean {
  const pad = e.pad(0, 0);
  for (let x = e.rect.x0 - HOUSE.level; x <= e.rect.x1 + HOUSE.level; x += 6) {
    for (let z = e.rect.z0 - HOUSE.level; z <= e.rect.z1 + HOUSE.level; z += 6) {
      if (padDistance(pad, x, z) > 0) continue;
      if (regionAt(x, z)?.id !== region || !walkableChunk(chunkOf(x), chunkOf(z))) return false;
    }
  }
  return true;
}
