/**
 * The Stairs of Slumber's descent (round 105, asked by XDro: the lights down the steps dimmed "significantly", a maximal dense mist
 * that grows exponentially the further down the steps go, and lights that flicker rarely, more of them as the mind fails). Every
 * number of how the descent looks: its mist (data/fogs.ts's crypt-mist, thickened by world/descent.ts), its lights (render/worldLights.ts)
 * and their gutters (render/stairLights.ts). Data only.
 */

export const SLUMBER = {
  light: { dim: 0.45 }, // the share of a stair light's strength, halo and flame that is left: the stairs are lit by the lantern, not their torches
  mist: {
    max: 5, // the mist on the deepest floor, as many times the crypt-mist's density as it is at the head of the stairs
    curve: 3.2, // how fast it climbs toward that: the gain is exponential in the share of the descent (1 at the head)
    height: 2.5, // metres the low mist rises by on the deepest floor, so a stair's shaft fills to a man's height and over
    patchy: 0.8, // how far its drifts even out into one dense veil on the deepest floor (0 keeps them)
  },
  flicker: {
    share: [0.12, 0.75], // the share of stair lights that may gutter at all: a calm mind's, then a failing one's (the rest never do)
    chance: [0.06, 0.5], // a light that may gutter does so in a given window with this chance: calm, then failing
    window: 12, // seconds in a window (a gutter falls at a moment of its own within it)
    dip: 0.25, // seconds a gutter lasts
    depth: 0.55, // how far a gutter dims a light: down to 0.45 of it
  },
} as const;
