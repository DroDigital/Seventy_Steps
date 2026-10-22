/** Every open horror's house (round 63; data/arenaHouses.ts), by the first boss of its arena. Data only. */

import type { House } from './arenaHouses';
import { BEYOND_HOUSES } from './arenaHousesBeyond';
import { EARTH_HOUSES } from './arenaHousesEarth';

export const ARENA_HOUSES: Readonly<Record<string, House>> = { ...EARTH_HOUSES, ...BEYOND_HOUSES };
