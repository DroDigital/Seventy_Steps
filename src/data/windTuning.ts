/**
 * Round 125, the wind in what grows (shaders/wind.ts draws it; render/windField.ts is the same gust on the CPU, for the leaves let go
 * and the people's coats): gust fronts roll across the land down the realm's own wind (data/fogs.ts `wind`), bent across their length
 * so no two hedgerows bow at once; a trunk is pushed by the gust and rings back at its own slow pace; each bough sways on a phase of
 * its own, faster, up and down as well as along; each leaf and blade shivers at its tip. All in metres, seconds and radians. Data only.
 */

export const WIND = {
  front: { k: 0.085, speed: 0.95, bend: 0.06, bendSpeed: 0.11, wander: 1.7 }, // the gust fronts: 74 m apart, rolling at 11 m/s, their line bent across the wind
  ripple: { k: 0.29, speed: 2.7, across: 0.05 }, // smaller gusts inside them
  swell: { speed: 0.19, k: 0.007 }, // the whole wind rising and falling over half a minute
  mix: { front: 0.38, ripple: 0.14 }, // their shares of the gust about its middle (0.5)
  calm: 0.22, // a trunk's lean when no gust is on it, of what a full gust gives
  push: 0.95, // ...and what a full gust adds
  ring: { speed: [1.9, 1.17] as const, share: 0.2 }, // a trunk's own slow swing (about a third and a fifth of a cycle a second), a share of its lean
  across: { speed: 1.43, share: 0.13 }, // and its swing across the wind
  bow: 0.12, // a leaning crown drops by this share of its lean squared: bowed, not stretched
  branch: { reach: 0.55, speed: 2.4, spread: 1.4, lift: 0.55, calm: 0.35, push: 0.9 }, // metres a bough's tip travels at aWind.y = 1, its pace (and how much a bough's phase quickens it), its bob
  flutter: { reach: 0.13, speed: 9.5, calm: 0.3 }, // metres a leaf's or a blade's tip shivers at aWind.z = 1, and how fast
  sheen: 0.2, // a blade or a leaf bowed by a gust catches the moon: its light lifted by this share at the gust's height
  ease: 0.35, // a second's share of the way the wind's bearing turns to a new realm's
} as const;

/** The leaves heard (render/audio/leafBed.ts): how far trees are heard, how many make it full, and its two voices. */
export const LEAF_SOUND = {
  reach: 28, // metres a tree is heard rustling from
  full: 3.2, // the trees (by nearness) that make the rustle full
  every: 0.5, // seconds between countings of them
  calm: 0.18, // the rustle with no gust on it, of a full gust's
  rustleHz: 3600, // the leaves' chatter: a band about here...
  boughHz: 900, // ...and the boughs' rush about here
  flicker: [[11.3, 0.22], [17.1, 0.16]] as const, // the tremolos on the chatter (Hz, depth)
  rustleGain: 0.07, // at full cover and a full gust
  boughGain: 0.05,
} as const;
