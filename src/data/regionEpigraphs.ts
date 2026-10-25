/**
 * The epigraphs of the realms (round 80): a sentence of Lovecraft's, under the name of a realm as the investigator first comes to it
 * (ui/banner.ts) and, on a first journey there, under the veil (ui/loreLine.ts). Not spoken; as for data/loreLines.ts, only of stories
 * published by 1928, and unsigned. The words are the interface's (`epigraph.<id>` in data/lang, in all four languages): this lists which realms have one.
 * Where no story of his by then is of the place (Dunwich, Vermont, the Mountains, K'n-yan, Yuggoth) the card is the name alone.
 * The sources, for whoever checks them: hub, Herbert West: Reanimator (1922); arkham, The Colour Out of Space (1927); innsmouth, Dagon
 * (1919); providence, The Festival (1925); pnakotus, The Nameless City (1921); dreamlands, Celephaïs (1922); rlyeh and spheres, The Call
 * of Cthulhu (1928); beyond, Beyond the Wall of Sleep (1919); the Outer Dark's four (cloud_summit, black_wood, pale_lattice, piping_dark) and
 * court_centre, Nyarlathotep (1920).
 */

import type { Key } from './lang';

export const EPIGRAPH_REGIONS = [
  'hub', 'arkham', 'innsmouth', 'providence', 'pnakotus', 'dreamlands', 'rlyeh', 'beyond',
  'cloud_summit', 'black_wood', 'pale_lattice', 'piping_dark', 'spheres', 'court_centre',
] as const;

export type EpigraphRegion = (typeof EPIGRAPH_REGIONS)[number];

const HAS: ReadonlySet<string> = new Set(EPIGRAPH_REGIONS);

/** The language key of a realm's epigraph, or undefined where it has none. */
export const epigraphKey = (region: string | null | undefined): Key | undefined => (region && HAS.has(region) ? (`epigraph.${region}` as Key) : undefined);
