/**
 * Round 78, the sea where the sea is and the wind where it blows (render/audio/exposure.ts reads the land about the investigator,
 * render/audio/ambience.ts shapes the beds by it). The surf of Innsmouth sounded the same on the quay and a quarter mile inland,
 * centred, and the wind the same on a ridge and in a hollow. Now a sea bed is loud, bright and from the water's side on the shore,
 * and falls to a far, dull rumble inland; a wind bed rises and brightens on an exposed height and drops in a lee. Data only.
 */

export type BedRole = 'sea' | 'wind' | 'other';

/** What each recorded bed (data/samples.ts, by file without the extension) is, to the land about the listener. */
export const BED_ROLE: Readonly<Record<string, BedRole>> = {
  surf: 'sea',
  waves: 'sea',
  wind: 'wind',
  wind_cold: 'wind',
  wind_ghost: 'wind',
};

export const roleOf = (file: string): BedRole => BED_ROLE[file] ?? 'other';

/** How the land is sensed: the rings (metres) about the listener sampled on `bearings` directions, and what counts as sea. */
export const SENSE = {
  rings: [14, 40, 100, 180] as const,
  bearings: 12,
  every: 0.25, // seconds between looks
  share: [1, 0.62, 0.3, 0.1] as const, // how much a sea found on each ring counts toward the shore (it is heard from farther than it is seen)
  below: 0.4, // metres under the sea's level that ground is sea
  wind: [40, 100] as const, // the rings the wind's exposure is the height above
  scale: 4, // metres above (or below) the land about that is wholly exposed (or wholly in a lee)
  rise: 1.2, // seconds: a reading is followed up this fast...
  fall: 4, // ...and let down this slowly, so a gap in the coast or one step of a hill does not flicker the sound
};

/** The sea beds on the shore and inland. */
export const SEA_PLACE = {
  inland: 0.3, // the share of its level a sea bed keeps with no sea about
  gain: 0.7, // and what the shore adds to it (the two make 1 at the water's edge)
  low: 1800, // Hz: the cutoff inland...
  high: 1000, // ...and what the shore adds to it
  pan: 0.6, // how far toward the water's bearing the bed is drawn at the shore (of the spread it has)
  reach: 0.9, // the widest it is panned toward the water
};

/** The wind beds on a height and in a lee. */
export const WIND_PLACE = {
  lift: 0.35, // a share more of its level at the height's most exposed...
  lee: 0.5, // ...and a share less in the deepest lee
  bright: 0.3, // and its cutoff a share higher (lower) with it
  most: 1.6, // the greatest the hour and the place together raise a bed's level
};

/** The spot sounds that come from the water, not from anywhere: the hull's knock and the gurgle (data/samples.ts), panned toward the sea and softer inland. */
export const SEA_SPOTS: ReadonlySet<string> = new Set(['hull', 'gurgle']);
export const SEA_SPOT = { inland: 0.4, jitter: 0.25 };
