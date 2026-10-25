/**
 * Round 78: the numbers of the sky's answers (render/overcast.ts, heatLightning.ts, skyOmen.ts; render/atm/sky.ts):
 * the cloud ceiling a spell of rain or a thunderstorm closes, the bank that crosses the moon on a clear night, the
 * silent lightning on a far horizon, and the wrong moon and the figure the stars now and then fall into. Render only.
 */

export type Pair = readonly [number, number];

/** The sky in the weather: which kinds close it, how fast, and what a full overcast takes of the light. */
export const OVERCAST = {
  kinds: { rain: 0.8, storm: 1, gale: 0.5 } as Readonly<Record<string, number>>, // the ceiling a spell closes, by kind (the dream's motes and clear skies close none)
  gather: 0.6, // the spell's amount at which its ceiling is whole: the sky closes before the rain is at its hardest
  rise: 6, // seconds for the ceiling to close
  fall: 40, // seconds for the stars to come back after the spell
  moon: 0.6, // the share of the moon's light a full overcast takes: the moon is never dimmed below 0.4 of itself
  ambient: 0.12, // the share of the ambient light it takes
  sky: 0.14, // the share of the sky's haze, its horizon and the mist's own light it takes
  lobe: 1, // the share of the mist's pale lobe on the moon's side that a full overcast puts out
};

/** The bank of cloud that crosses the moon now and then on a clear night (and the thin cloud's ring about it). */
export const VEIL = {
  slot: 260, // seconds: the night is laid in slots, each with (by chance) a bank somewhere in it
  chance: 0.85,
  last: [24, 48] as Pair, // seconds a bank takes to cross
  light: 0.65, // the share of a full overcast's dimming a bank at its thickest does to the moonlight on the ground
  mist: 0.6, // and the share of the mist's lobe it puts out
  clouds: [0.15, 0.5] as Pair, // a realm's cloud cover (data SKY) from which it has no bank to where it has the whole: the Mountains, Pnakotus and Yuggoth have none
};

/** Heat lightning (candidate the-horizon-is-alive, only its sky): silent sheets of light on a far horizon, on a clear night. */
export const HEAT = {
  every: [45, 130] as Pair, // seconds between bursts
  pulses: [2, 4] as Pair, // flickers in a burst
  gap: [0.5, 1.6] as Pair, // seconds between them
  strength: [0.35, 0.8] as Pair, // how bright a pulse is, before the Flashes setting (a still of 0.6 was faint through the mist)
  away: 1.05, // radians (60 degrees): the least a burst is from where the eye looks
  width: 0.9, // radians: the sector of the horizon a bank lights
  clear: 0.2, // the weather's amount below which the sky counts as clear
  first: [20, 60] as Pair, // seconds into a clear spell before the first burst
};

/** The wrong moon and the Alignment (candidate wrong-moon-and-alignment). */
export const OMEN = {
  slot: 150, // seconds: each slot may hold one episode
  last: 28, // seconds an episode lasts...
  fade: 8, // ...of which this many to come...
  hold: 12, // ...this many held, and the rest to drift apart
  stress: [0.45, 0.9] as Pair, // the failing mind's strange (0..1) from which an episode becomes likely, to where it is as likely as it gets
  know: 0.5, // the share of the chance that a mind that has gathered all its insight has, steady as it is
  chance: 0.75, // the most chance a slot has of an episode
  elevation: [0.38, 0.55] as Pair, // radians above the horizon
  lean: 0.5, // radians either side of where the eye looked when it began
  size: 0.21, // radians: the figure's radius
  swell: 0.3, // the moon's growth at its greatest and the mind at its worst
  period: 90, // seconds of its slow swelling
  sour: 0.5, // the share of the moon's colour that goes toward the stars' wrong violet
};
