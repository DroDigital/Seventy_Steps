/** Every way, by the horror it leads to (data/arenaWays.ts). */

import type { Way } from './arenaWays';
import { BEYOND_WAYS } from './arenaWaysBeyond';
import { EARTH_WAYS } from './arenaWaysEarth';

export const ARENA_WAYS: Readonly<Record<string, Way>> = { ...EARTH_WAYS, ...BEYOND_WAYS };
