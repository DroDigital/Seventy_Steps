/**
 * Which enclosure a horror's house is (round 67): a ring of wall (arenaHouse.ts) or a bailey (enclosureBailey.ts), by what its data says;
 * how far from the fight's ring its gate stands, which the court before it is laid from; and whether the land under the whole of it is the
 * realm's own to stand on. Pure: no Three.js.
 */

import { HOUSE, type House } from '../data/arenaHouses';
import { planHouse, courtLand } from './arenaHouse';
import { planBailey } from './enclosureBailey';
import type { Enclosure, EnclosureSite } from './enclosure';
import { padDistance } from './sitePads';
import { chunkOf, regionAt, walkableChunk } from './worldMap';

export { courtLand };

/** Metres from the fight's ring to the gate: the ring's reach, or the bailey's `ahead`. */
export const gateReach = (h: House): number => h.bailey?.ahead ?? h.reach ?? HOUSE.reach;

export const planEnclosure = (h: House, boss: string, s: EnclosureSite): Enclosure => (h.bailey ? planBailey(h, boss, s) : planHouse(h, boss, s));

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
