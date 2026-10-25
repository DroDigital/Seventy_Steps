/**
 * Round 78: the three hours of the night each have a sky of their own (render/skyHours.ts): at the turn a low afterglow
 * lies along the horizon opposite where the moon rose, through the deep the sky is the plain dark it was, and in the
 * waning hour a pale false dawn leans up on the far side from where the moon sets, and sinks back at the turn. The stars
 * wheel about the sky through the night. Colours are warm and low in saturation and none is an anomaly hue
 * (tests/hours.test.ts); no grade or palette is shifted (a changing grade would build the 64 colours anew).
 */

import type { Vec3 } from './tuning';

export const HOURS = {
  band: 0.5, // brightness of the afterglow band, added to the sky (a first try of 0.3 was not seen through the mist and the grade)
  falloff: 5.5, // how fast the band thins upward (1/radian of height): to a third of itself at eleven degrees
  spread: 2.5, // how wide it lies along the horizon: the power of the half-angle cosine
  cone: { spread: 5, lean: 2.4, band: 0.5 }, // the false dawn: its width (a power), how fast it thins upward, and its brightness
  turn: 0.6, // radians the stars wheel in a night (a vigil's called hour, ninety times faster, shows it)
  pole: [0.2, 0.6, 0.77] as Vec3, // the axis they wheel about (normalised in the shader), raised to the north
  ease: 3, // seconds to ease from one realm's hours to another's
  tint: 0.01, // how much of the glow the ambient light and the mist take (a hint: a warm cast on the nearest ground)
};

/** A realm's afterglow (`glow`) and false dawn (`dawn`); none in the realms that have no night of the common kind. */
export const HOUR_COLOURS: Readonly<Record<string, { glow: Vec3; dawn: Vec3 }>> = {
  hub: { glow: [1, 0.58, 0.3], dawn: [0.72, 0.8, 0.9] }, // amber-copper
  arkham: { glow: [0.95, 0.74, 0.26], dawn: [0.8, 0.82, 0.7] }, // jaundice ochre
  dunwich: { glow: [0.92, 0.44, 0.3], dawn: [0.78, 0.74, 0.7] }, // brick-rose
  innsmouth: { glow: [0.76, 0.8, 0.32], dawn: [0.7, 0.82, 0.78] }, // algae gold
  providence: { glow: [0.84, 0.6, 0.5], dawn: [0.76, 0.78, 0.86] }, // pewter-rose
  vermont: { glow: [0.96, 0.64, 0.22], dawn: [0.78, 0.82, 0.88] }, // amber
  mountains: { glow: [0.9, 0.8, 0.52], dawn: [0.8, 0.88, 0.96] }, // ice-gold
  pnakotus: { glow: [0.95, 0.52, 0.24], dawn: [0.86, 0.8, 0.7] }, // copper
  dreamlands: { glow: [1, 0.74, 0.42], dawn: [0.88, 0.84, 0.74] }, // peach-gold
  rlyeh: { glow: [0.62, 0.68, 0.52], dawn: [0.66, 0.74, 0.7] }, // a faint lime-grey
};
