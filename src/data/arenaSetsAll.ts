/** Every arena's set, by its first horror's id (round 61): the open ground of the waking world (arenaSetsEarth.ts) and of the realms (arenaSetsBeyond.ts). Data only. */

import type { ArenaSet } from './arenaSets';
import { BEYOND_SETS } from './arenaSetsBeyond';
import { EARTH_SETS } from './arenaSetsEarth';

export const ARENA_SETS: Readonly<Record<string, ArenaSet>> = { ...EARTH_SETS, ...BEYOND_SETS };
