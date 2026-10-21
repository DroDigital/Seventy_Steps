/** Each boss hall's set (round 62; world/hallSet.ts), by its first boss's id: the great dungeons' halls (data/dungeons.ts, data/dungeonsFar.ts) and the lairs' (data/lairs.ts). Data only. */

import type { ArenaSet } from './arenaSets';
import { EARTH_HALLS } from './hallSetsEarth';
import { FAR_HALLS } from './hallSetsFar';
import { LAIR_HALLS } from './hallSetsLairs';

export const HALL_SETS: Readonly<Record<string, ArenaSet>> = { ...EARTH_HALLS, ...LAIR_HALLS, ...FAR_HALLS };
