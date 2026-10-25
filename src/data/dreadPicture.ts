/**
 * Round 78, atmosphere: the numbers of the picture of dread (render/pressure.ts, shock.ts, watchers.ts, darkEyes.ts, unseenShade.ts):
 * the pressure that leans the picture toward madness while something presses on the mind, the shock of a sudden loss, the watchers'
 * steps and the darters at the corner of the eye, the eyes beyond the lantern, the shade with no one. All of it cosmetic and held by the
 * FX intensity setting; none writes a number the simulation reads.
 */

/** Pressure (render/pressure.ts): the picture and the whispers lean toward a failing mind's while the mind is pressed, even at full sanity. */
export const PRESSURE = {
  lean: 0.4, // the most of the way to madness the picture is taken at a pressure of 1 (felt = stress + lean × pressure × (1 − stress), never past the FX intensity)
  leanDread: 0.6, // ...and for the soft edges and the wrong stars, which wait for more of it (FX.dreadFrom) and would show too little at `lean`
  leanHeard: 0.75, // ...and for the whispers, which begin at the Fractured (AUDIO.whisper.from): one reaches the ear only at the top of a pressure
  rate: 0.9, // sanity a second lost that is a pressure of 1: a great horror's aura at its edge is about this
  attack: 0.4, // seconds in which the loss rate's pressure rises...
  release: 2.6, // ...and in which it settles again, a backed-away step or a swallow of Laudanum
  shock: 10, // a sudden loss (SanityLost) this large is a jolt of 1...
  shockSeconds: 1.6, // ...fading with this time constant
  fight: 0.5, // in a horror's fight (the approach, the ring and first sight carry the most) pressure is this share
  fightEase: 1.2, // seconds in which the fight's share is taken up or let go
  maxStep: 0.25, // longest span of seconds one frame counts (a hitch is not a long span of dread)
};

/** The shock (render/shock.ts, atm/dread.ts): a sudden large loss closes the world's high end, rings, and sends a faint ring over the picture. */
export const SHOCK = {
  from: 4.5, // a loss at least this large at once is a shock (SANITY.jolt × 3)
  full: 12, // ...and this large is a whole one
  ringScale: 0.5, // the ring across the picture, as a share of a band change's
  muffle: 0.7, // the share of a whole shock that dulls the world's high end...
  hush: 0.55, // ...and the bed that gives way
  seconds: 2.4, // time constant of the world coming back
  ringAt: 0.12, // seconds after the blow that the tinnitus begins
  tone: { gain: 0.05, hz: 3900, beat: 4.5, seconds: 5.5 }, // the thin tone: two sines this far apart (a shimmer), thinning over this long, at this gain at most
};

/** The watchers' steps and the darters (render/watchers.ts, watcherSteps.ts): not where it was. */
export const STEP = {
  after: 25, // seconds a watcher has stood before it will move at all
  turned: 0.2, // radians beyond the edge of the picture it must be before it dares
  every: [2, 4] as readonly [number, number], // seconds between steps...
  metres: [1, 1.6] as readonly [number, number], // ...each this long
  closest: 26, // metres: it never comes nearer than this by stealth
  held: 0.25, // the bed's hush for each that stands (render/audio/dread.ts), up to...
  heldMost: 0.45, // ...this
};
export const DARTER = {
  yawRate: 0.7, // radians a second the lens must be turning for one to cross the corner of the eye
  from: 2, // only while this many watchers stand (watchersFor)
  every: [60, 180] as readonly [number, number], // seconds between darters
  near: [9, 15] as readonly [number, number], // metres from the lens
  edge: 0.85, // of the half-width of the picture: how far out it begins
  speed: [4, 6] as readonly [number, number], // metres a second sideways
  seconds: 1.2,
  gone: 0.3, // radians of the middle of the picture: it is not there when looked at
};

/** The eyes beyond the lantern (render/darkEyes.ts). */
export const EYES = {
  max: 3, // pairs at once (one more below `uneasy`)
  uneasy: 60, // sanity below which one more is out there, and they blink out of step
  near: 16, // metres: nearer than this and they are gone
  from: 26, // metres from the lens they are put...
  far: 52, // ...to here
  height: [0.9, 1.5] as readonly [number, number], // metres over the ground, fixed for a pair's life
  span: 0.3, // metres either side of the middle between a pair's eyes (a big beast's: at thirty metres they are four pixels apart, and read as two)
  life: [6, 20] as readonly [number, number], // seconds a pair hangs there
  rest: [30, 90] as readonly [number, number], // seconds a slot is empty after
  fadeIn: 1.5,
  fadeOut: 0.2,
  blinkEvery: [4, 9] as readonly [number, number],
  blink: 0.18,
  stare: 0.26, // radians of the lens's axis: looked at this squarely...
  stareFor: 0.8, // ...for this long and the pair is gone
  litAt: 0.02, // ground lit more than this is not dark enough for them
  radius: 0.05, // metres, of each eye's halo
  gain: 0.3,
  arc: 1.9, // radians either side of the heading they may be put (ahead and the sides, not behind)
  /** Regions they are out in (the heath and the woods), their colour (display sRGB), whether they blink. Not the towns, the mountains, the cities of the dream or the Outer Dark, but for the Black Wood. */
  regions: {
    arkham: { rgb: [0.9, 0.82, 0.55], blinks: true },
    dunwich: { rgb: [0.88, 0.8, 0.52], blinks: true },
    vermont: { rgb: [0.78, 0.84, 0.66], blinks: true },
    providence: { rgb: [0.86, 0.8, 0.6], blinks: true },
    innsmouth: { rgb: [0.82, 0.86, 0.56], blinks: false }, // wide, never-blinking (the Innsmouth look)
    black_wood: { rgb: [1, 0.2, 0.16], blinks: true },
  } as Readonly<Record<string, { rgb: readonly [number, number, number]; blinks: boolean }>>,
};

/** The shade with no one (render/unseenShade.ts). */
export const SHADE = {
  every: [70, 170] as readonly [number, number], // seconds between episodes
  lasts: [25, 45] as readonly [number, number], // seconds one stays
  near: [11, 22] as readonly [number, number], // metres from the lens
  side: [1.22, 1.92] as readonly [number, number], // radians off the heading (70 to 110 degrees: the periphery)
  height: 3.7, // metres
  slide: [0.5, 1.2] as readonly [number, number], // metres it may move while the lens is turned away...
  turnedAway: 1.05, // ...beyond this many radians (60 degrees)
  gone: 8, // metres: within this it is gone
  grow: 0.7, // seconds it takes to rise from nothing...
  fade: 0.5, // ...and to go
  moon: 0.08, // the share the moon's light is lifted by while one lies (so that its shadow is read at the deepest night)
  slideEvery: [3, 6] as readonly [number, number], // seconds between the slides it may make when turned from
};
