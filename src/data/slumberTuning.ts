/**
 * The Stairs of Slumber's descent (round 105, asked by XDro: the lights down the steps dimmed "significantly", a maximal dense mist
 * that grows exponentially the further down the steps go, and lights that flicker rarely, more of them as the mind fails). Round 120
 * (asked: thicker fog early in the descent, the mist intensifying rapidly, the torches dimming progressively with depth, and fewer of
 * them): the mist is thick from the first step and does most of its climbing in the first third, and each light keeps the share of its
 * own depth. Every number of how the descent looks: its mist (data/fogs.ts's crypt-mist, thickened by world/descent.ts), its lights
 * (render/worldLights.ts, render/stairLights.ts), its newels' fires (render/stairNewels.ts) and their gutters. Data only.
 */

export const SLUMBER = {
  light: {
    top: 0.85, // the share of a stair light's strength, halo and flame left at the head of the descent...
    bottom: 0.14, // ...and on its deepest floor: between, it falls by the same ratio with each metre down, so every flight is darker than the one above
    shrink: 0.45, // how much lower a flame burns on the deepest floor (that share less of its height and spread), and in proportion above it
  },
  newels: {
    light: 0.08, // a flight whose head lies above this share of the descent is of the seventy steps: both its pylons are lit, and a newel in its middle
    half: 0.5, // below that, a flight whose head lies above this share has one of its pylons lit; deeper, every other flight has one
  },
  mist: {
    head: 2.4, // the mist at the head of the stairs, as many times the crypt-mist's density (round 120: thick from the first step; 1 out of the stairs)
    max: 6, // and on the deepest floor
    curve: 3.5, // how fast it climbs between: an ease-out in the share of the descent, so most of the climb is in its first third
    height: 2.5, // metres the low mist rises by on the deepest floor, so a stair's shaft fills to a man's height and over (rising as the density does)
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
