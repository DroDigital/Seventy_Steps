/** Every discovery, by the open horror whose house it opens (data/discoveries.ts). */

import type { Discovery } from './discoveries';
import { BEYOND_DISCOVERIES } from './discoveriesBeyond';
import { EARTH_DISCOVERIES } from './discoveriesEarth';

export const DISCOVERIES: Readonly<Record<string, Discovery>> = { ...EARTH_DISCOVERIES, ...BEYOND_DISCOVERIES };
