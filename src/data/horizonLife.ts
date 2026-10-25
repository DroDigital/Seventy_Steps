/**
 * The far horizon's life and the eye (round 78: render/horizonGlow.ts, render/skyline.ts, render/eyeAdapt.ts). The far towns' windows follow the
 * night and wink as the near ones do; a lit town lays a glow over the sky above its roofs, deepest in the gloaming and faint in the waning
 * hour; a lamp on Devil Reef and on Kingsport's head turns slowly, flashing as its beam comes round. And the eye: the picture's corners open in
 * lamplight and close in the dark. Numbers only.
 */

import type { SilhouetteKind } from './skylines';

/** The glow a lit far town lays over the sky above it (additive, over the haze; the post pass grades it with the rest). */
export const DOME = {
  strength: 1.15, // the glow's weight at the horizon over the middle of a town with a good many of its windows lit (0.6 was a warm sheen, 2.5 a sunset)
  across: 0.5, // how far it spreads, as the falloff's width in silhouette widths (a gaussian: a town's glow reaches past its ends)
  up: 0.8, // how far it rises, in silhouette heights (an exponential: strongest at the roofs, gone well above the steeples)
  box: { across: 1.7, below: 0.3, above: 3.6 }, // the quad that carries it, in silhouette widths either side, heights below and above the foot
  lit: 0.3, // the share of windows lit at which a town's glow is full: the few lit windows of a hamlet give less, never less than `floor`
  floor: 0.62,
  night: 0.28, // the glow that is left when the windows are fewest (the waning hour); systems/clock.ts `windowShare` gives the rest
  near: [150, 340], // metres: it comes in as the town is left behind: a town walked up to is seen as itself, and the real lamps light it
  half: 1500, // metres at which it has lost half its strength to the air between
  overcast: 0.7, // more of it where the sky is closed in (rain, storm, gale): the glow lies on the cloud
  breath: { amount: 0.05, speed: 0.29 }, // it swells and sinks a little, with no one window: a town's lamps are many
} as const;

/** The windows of the far towns. */
export const WINK = {
  nerves: 1.0, // how hard a failing mind (0..1) makes the far lights flicker: some strobe, a few at a time
  cells: [420, 90], // the cells of a silhouette's mass across and up (a window is one)
} as const;

/** A lamp that turns (a lighthouse): its beam comes round once a `period`; it stands on a silhouette, at a place on its outline. */
export interface LampDef {
  region: string;
  index: number; // which of the region's silhouettes (data/skylines.ts)
  x: number | null; // along the outline, -0.5..0.5; null: the outline's own lamp-tower (the reef's, render/skylineShapes.ts)
  rise: number; // above the outline there, as a share of the silhouette's height
  period: number; // seconds for the beam to come round
  phase: number; // 0..1: where in its turn the beam is at the clock's start
  colour: readonly [number, number, number];
  size: number; // the flash's reach, as a multiple (the reef's is the greater: it stands out of the open sea)
}

export const LAMPS: readonly LampDef[] = [
  { region: 'innsmouth', index: 0, x: null, rise: 0, period: 11, phase: 0.15, colour: [1, 0.9, 0.62], size: 1 }, // Devil Reef's tower, over the open water
  { region: 'innsmouth', index: 1, x: -0.4, rise: 0.015, period: 15, phase: 0.55, colour: [1, 0.86, 0.55], size: 0.7 }, // Kingsport Head's light, far to the south
  { region: 'hub', index: 2, x: 0.41, rise: 0.015, period: 15, phase: 0.1, colour: [1, 0.86, 0.55], size: 0.6 }, // and the same light, seen from Miskatonic over Providence
];

/** What a lamp's quad draws, in metres at the distance the silhouettes are drawn at (the beam is a thin shaft, the flash a bloom of its own). */
export const BEAM = {
  box: [30, 7], // the quad's half width and half height
  pilot: 0.55, // the lamp seen between flashes
  flash: 1, // and as the beam comes round to the eye
  reach: 24, // metres the shaft stands out to a side, at the most
  thick: 0.3, // its thickness
  turn: 40, // the flash's sharpness as the beam comes round (an exponent of the cosine): higher is briefer
} as const;

/** What kinds of silhouette are cities of lit windows, and so glow (`lit` in data/skylines.ts says how many windows). */
export const GLOWING: ReadonlySet<SilhouetteKind> = new Set<SilhouetteKind>(['town', 'minarets', 'towers']);

/** The eye (render/eyeAdapt.ts): the vignette and the bloom follow how well lit the ground underfoot is. The post pass's own numbers are LIGHTING (data/fxTuning.ts); these are multiples of them. */
export const EYE = {
  vignette: { dark: 1.22, lantern: 1.1, lit: 0.72 }, // the corners' darkness, as a multiple of LIGHTING.vignette: in the dark with the lantern out, in the dark with it kindled, in lamplight
  bloom: 0.2, // what shines blooms this much more in lamplight
  clamp: [0.28, 0.6], // the vignette's range as a whole, so the corners are never opened wide nor shut on the lantern's circle
  rise: 0.7, // seconds to open in lamplight (about; the ease is exponential)
  fall: 2.4, // seconds to close in the dark
  take: [0.1, 0.65], // how much `lightAt` is a pool: none below the first, a whole one at the second
  roofed: 0.4, // the share of the effect kept under a dungeon's roof, where the torches' pools lie close together
  calm: 1.2, // seconds the effect takes to go, and to come back, as a cutscene begins or a wound, a faint or a fall takes the picture
  every: 0.12, // seconds between two reads of `lightAt` (it scans every light in reach, and the pool changes slowly)
} as const;
