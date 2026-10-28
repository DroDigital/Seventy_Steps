/**
 * How hard a region is, apart from what a creature is (the land's press).
 * Authored health and damage are the creature in the mildest region it inhabits. A later ring, and a
 * region that houses a harder class of horror, presses harder. Off the land there is no press.
 * Numbers are the share against the university (1). Greater bodies are already the strong end, so the
 * cap on them is lower (`PRESS_CAP`).
 */

import type { Tier } from './schema';

export const REGION_PRESS: Readonly<Record<string, number>> = {
  hub: 1, // no horror of its own: the first hour
  arkham: 1.08, // named horrors, the first town
  dunwich: 1.22,
  providence: 1.22,
  vermont: 1.22, // the rest of the waking world, still named horrors
  innsmouth: 1.38, // Dagon and Hydra under the reef
  mountains: 1.55, // the shoggoth
  pnakotus: 1.55, // the polyp
  dreamlands: 1.72, // Bokrug and the Great Ones
  kn_yan: 1.78, // Yig, Tsathoggua, Nug and Yeb
  yuggoth: 1.88, // Rhan-Tegoth and Hastur
  rlyeh: 1.95, // Ghatanothoa and Cthulhu
  beyond: 2.1, // the gate, and 'Umr at-Tawil
  cloud_summit: 2.2,
  black_wood: 2.28,
  pale_lattice: 2.36,
  piping_dark: 2.42,
  spheres: 2.5,
  court_centre: 2.6, // the Outer Gods, each dimension harder than the last
};

/** The most a region's press may multiply a creature past its mildest home. A boss is never pressed: its own scaling stands. */
export const PRESS_CAP: Readonly<Record<Tier, number>> = {
  lesser: 1.85,
  greater: 1.45,
  named: 1,
  great_old_one: 1,
  outer_god: 1,
  ally: 1,
};

/** Vermin stay vermin in a hard land: a cane-light still drops them, and the press on them stops here. */
export const VERMIN_PRESS = new Set(['zoog', 'rat_swarm', 'wamp', 'cat_from_saturn', 'child_of_yig']);
export const PRESS_VERMIN = 1.25;

export const pressOf = (region: string): number => REGION_PRESS[region] ?? 1;

/** The cap that applies to this body: vermin stop short of the lesser cap. */
export const capFor = (id: string, tier: Tier): number => (VERMIN_PRESS.has(id) ? PRESS_VERMIN : PRESS_CAP[tier]);

/**
 * Share of authored health and blows at `here`, against the mildest region the creature inhabits.
 * 1 off the land and in any place no harder than that home, and never past `cap`.
 */
export function landScale(regions: readonly string[], here: string | undefined, tier: Tier, cap = PRESS_CAP[tier]): number {
  if (!here || cap <= 1) return 1;
  let home = pressOf(here);
  for (const id of regions) if (id in REGION_PRESS) home = Math.min(home, pressOf(id));
  return Math.max(1, Math.min(cap, pressOf(here) / home));
}
