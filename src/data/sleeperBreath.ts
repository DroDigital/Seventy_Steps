/**
 * The Sleeper's breath (round 78, atmosphere): the numbers of the slow breath the dream draws about a colossus that has not yet woken.
 * `render/sleepers.ts` finds the sleeper and the waveform, `render/sleeperBreath.ts` swells the mist and draws the lantern's light dim,
 * `render/audio/breathBed.ts` is the low breath beneath. Presentation only: nothing here is read by the simulation.
 */

export const BREATH = Object.freeze({
  minHeight: 8, // metres: an unroused body this tall breathes the world (the line audio/dread.ts hushes the ground by)
  /** Seconds a whole breath takes, by the sleeper's height: `base` + `perMetre` x height, within `min` and `max`: the larger the slower. */
  period: { base: 8, perMetre: 0.15, min: 9, max: 15 },
  inhale: 0.6, // the share of a breath that draws in: the rest lets go, the quicker
  /** How far the picture follows the breath at the inhale's peak, with the sleeper's whole reach on the world (shares of what was set before it). */
  swell: {
    mist: 1.1, // the low mist's density rises by this: the ground thickens as the dream draws in (it is a thin mist, a third of what it was: a third more is not seen)...
    haze: 0.7, // ...and the thin haze above it
    lantern: 0.25, // the lantern's light is drawn down by this share, and returns
    glow: 0.35, // the mist's own light is brought up by this, a pale swell of the horizon
    vignette: 0.5, // and the picture's corners darken by this share more: the eye is drawn in with the light
  },
  /** Seconds the reach is taken up as one nears, and let go as one leaves, or as the fight or a scene begins ("stops dead": quickly). */
  ease: { up: 2.5, down: 0.4 },
  /** The low breath beneath (audio/breathBed.ts): its pitches (Hz, at the least size, and lowered by `drop` over `span` metres of height more), its gain at the peak with the whole reach on it, and the noise's. */
  bed: {
    hz: [31, 46.5, 93] as readonly [number, number, number], // two sines, and a triangle's harmonic for the speakers that do not reach the first
    drop: 0.28, // the share the pitches fall by at a sleeper `span` metres tall
    span: 40,
    gain: [0.45, 0.4, 0.2] as readonly [number, number, number], // each of the three against the peak (they sum to a little over one: a peak's most)
    noise: { hz: 260, q: 0.7, gain: 2.2 }, // the inhale: a low rush of air, drawn in as it fills and let go as it empties (a noise through so low a filter is a tenth of its own level: it is made up)
    peak: 0.1, // the bed's whole level on the effects bus at the peak of the breath, nearest a sleeper (-19.6 dBFS at the most)
    glide: 0.25, // seconds a level is taken up: no click, no step
  },
});
