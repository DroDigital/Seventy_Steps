/**
 * The quiet blows' numbers (round 87; asked: "many of the lower-tier creatures' attack animations and telegraphs appear acceptable but overly
 * elaborate; in high-density combat scenarios, this detracts from the intended eerie atmosphere"). Every creature that is not one of the
 * horrors draws its blow as ONE graphic mark (data/foeBlows.ts: render/blowKit.ts) and at most a few specks of matter, never a crown, a
 * fountain, a cloud, a scar, a lit arc, a flash or a light; `render/foeFx.ts` lays them on the game's events and `render/foeCrowd.ts` thins what
 * a crowd draws. Re-exported by `fxTuning.ts`. Metres, seconds and counts of particles; a share is 0..1. To make blows quieter again, lower
 * `marks.*.alpha`, `size` and the counts; to thin a crowd, lower `crowd.budget`.
 */

/** The particle shapes a speck is drawn in (all of render/particles.ts's). */
export type SpeckShape = 'disc' | 'bubble' | 'spark' | 'shard' | 'wisp' | 'feather';

export interface MatterSpec {
  shapes: readonly SpeckShape[]; // taken in turn
  gravity: number; // m/s² (negative: it rises; near none: it hangs)
  drag: number; // per second
  up: readonly [number, number]; // m/s thrown up
  out: readonly [number, number]; // m/s thrown outward
  size: readonly [number, number]; // metres
  life: readonly [number, number]; // seconds
  glow: boolean; // self-lit: a light thing; else it is lit as the ground is
  base: readonly [number, number, number]; // what it is made of, before the blow's hues come into it
  spin?: number; // rad/s, either way
  share?: number; // how far the blow's hues come into its colour (`FOE_FX.hueShare` by default): a dark thing keeps its dark
  cools?: boolean; // it goes dark as it dies, not toward the blow's last hue (an ember)
}

export const FOE_FX = {
  /** A mark's length at full, in metres, by the body's radius: `base + perRadius * r`, between `min` and `most`. */
  size: { base: 0.5, perRadius: 0.55, min: 0.6, most: 1.7 },
  /** Each particle's colour is the blow's three hues turned a few percent of a circle and a few percent lighter or darker, so no two are alike. */
  jitter: { hue: 0.012, luma: 0.07 },
  /** Delayed strokes waiting (a beat apart); the oldest go if more are queued. */
  queue: 64,

  /** A blow as it falls: a sweep lays `pieces` strokes along its tip as it goes; a thrust or a bite one stamp at its tip; a slam a ripple and a stamp. */
  strike: {
    marks: 3, // most particles of a mark one blow draws
    specks: 3, // most specks of matter (a slam's and a sweep's last piece)
    thrustSpecks: 2, // ...a bite's, a grab's, a lunge's
    pieces: 3, // strokes along a sweep
    stampBelow: 45, // degrees: a blow that sweeps less is stamped where its tip is
    piece: [0.5, 1.6] as readonly [number, number], // a stroke's length along a sweep, in `size`s, between these
    slam: { from: 0.18, to: 0.8, width: 0.16, life: 0.42, floor: 0.9 }, // a slam's ripple: its radius runs from a share of the blow's to a share, its width (m), its seconds; the least radius
    sizeK: 1.0, // a stamp's length, in `size`s
  },
  /** A blow that lands on the investigator: the mark and the accent at the wound, and the matter it throws back. */
  wound: { marks: 2, specks: 5, size: 0.7, perDamage: 14, heavy: 70 }, // size in `size`s; a speck for each `perDamage`; the damage that counts as full
  /** A slow, heavy blow's tell (meleeFx TELL): the mark in miniature, once. */
  tell: { marks: 2, size: 0.5, alpha: 0.5 },
  /** A lunge or a charge's wake: faint smears behind it. */
  wake: { pieces: 3, size: 0.8, alpha: 0.3, life: 0.4, speed: 0.6 },

  /** A caster: its gather (motes drawn in over the wind-up), the bolt it looses, where it lands, a beam, a summoning, a teleport, a gaze, a roar. */
  gather: { motes: 9, size: 0.07, range: [0.55, 2.2] as readonly [number, number], life: [0.28, 0.42] as readonly [number, number], alpha: 0.7 },
  bolt: {
    muzzle: 0.45, // the mark at the muzzle, in `size`s
    trailEvery: 3, // sim frames between a bolt's trail particles
    trail: { size: 0.3, life: 0.28, alpha: 0.4, back: 0.15 }, // m; s; its brightness; the share of the bolt's speed it is left at, backward
    land: { marks: 1, specks: 4, size: 0.7 },
  },
  beam: { marks: 1, specks: 2, size: 0.6 }, // a mark at each end
  summon: { sigil: 1.3, perRadius: 0.4, life: 1.5, motes: 8, rise: [0.5, 1.2] as readonly [number, number] }, // the faint sigil's radius (m) and its seconds, the motes that rise from it
  teleport: { size: 0.9, motes: 4 }, // two swirls, a few motes at the arrival
  gaze: { every: 8, motes: 4, eye: 0.5 }, // sim frames between the motes a gaze lays along its look; the motes of its burst; the eye drawn at its source (`size`s)
  pulse: { motes: 6, size: 0.1, rise: [0.5, 1.6] as readonly [number, number] }, // a roar's front thrown up in this many motes over its window

  /** Each mark's own look. `life` is its seconds before the tempo's share of it, `alpha` how bright it is at birth, `speed` the m/s an aligned stroke travels along its way. */
  marks: {
    rake: { life: 0.3, alpha: 0.8, speed: 0.9, parts: 3 },
    jaws: { life: 0.22, alpha: 0.85, speed: 0, parts: 2 },
    crescent: { life: 0.28, alpha: 0.8, speed: 1.1, parts: 1 },
    lash: { life: 0.24, alpha: 0.8, speed: 2.4, parts: 2, back: 0.08 }, // `back`: seconds before it cracks back
    splat: { life: 0.5, alpha: 0.7, speed: 0, parts: 1 },
    swirl: { life: 0.42, alpha: 0.75, speed: 0, parts: 2, thick: 0.14, spin: 5 },
    glint: { life: 0.26, alpha: 0.9, speed: 0, parts: 2 },
    dash: { life: 0.2, alpha: 0.8, speed: 3, parts: 2 },
    ripple: { life: 0.45, alpha: 0.6, speed: 0, parts: 1 }, // (laid on the ground: its life and width are `strike.slam`'s)
    sigil: { life: 0.75, alpha: 0.75, speed: 0, parts: 1 },
    eye: { life: 0.6, alpha: 0.8, speed: 0, parts: 1 },
    plume: { life: 0.9, alpha: 0.4, speed: 0.7, parts: 2 },
  },
  /** How a mark moves (data/foeBlows.ts `Tempo`): shares of its life and growth, how long it holds its brightness, the seconds a stroke lags the one before, how it turns, sinks and drifts, and the beats it comes in. */
  tempo: {
    snap: { life: 0.6, grow: 0.85, alpha: 1, hold: 0.55, stagger: 0, spin: 0, sink: 0, wander: 0, beats: 1, gap: 0 },
    drag: { life: 1, grow: 1, alpha: 0.9, hold: 0.3, stagger: 0.045, spin: 0, sink: 0, wander: 0, beats: 1, gap: 0 },
    bloom: { life: 1.35, grow: 1.5, alpha: 0.8, hold: 0.1, stagger: 0.02, spin: 0, sink: 0, wander: 0, beats: 1, gap: 0 },
    settle: { life: 1.5, grow: 1.1, alpha: 0.85, hold: 0.3, stagger: 0.02, spin: 0, sink: -0.35, wander: 0, beats: 1, gap: 0 },
    flutter: { life: 1.1, grow: 1, alpha: 0.85, hold: 0.25, stagger: 0.03, spin: 4, sink: 0.1, wander: 0.5, beats: 1, gap: 0 },
    pulse: { life: 1, grow: 1.05, alpha: 0.9, hold: 0.4, stagger: 0.03, spin: 0, sink: 0, wander: 0, beats: 2, gap: 0.16 },
  },
  /** The specks of matter (data/foeBlows.ts `Matter`); how far the blow's own hues come into their colour is `hueShare`. */
  hueShare: 0.4,
  speckAlpha: 0.8,
  matter: {
    brine: { shapes: ['disc', 'bubble'], gravity: 9, drag: 0.8, up: [1, 2.6], out: [0.6, 1.8], size: [0.045, 0.085], life: [0.5, 0.8], glow: false, base: [0.62, 0.82, 0.84] },
    ash: { shapes: ['disc', 'shard'], gravity: 1.2, drag: 1.6, up: [0.2, 0.9], out: [0.3, 1], size: [0.04, 0.08], life: [0.8, 1.3], glow: false, base: [0.62, 0.6, 0.58] },
    dust: { shapes: ['disc'], gravity: 7, drag: 1.2, up: [0.6, 1.8], out: [0.5, 1.6], size: [0.03, 0.06], life: [0.4, 0.7], glow: false, base: [0.7, 0.62, 0.46] },
    spore: { shapes: ['wisp'], gravity: -0.45, drag: 1.4, up: [0.2, 0.8], out: [0.2, 0.7], size: [0.1, 0.18], life: [0.9, 1.4], glow: true, base: [0.82, 0.9, 0.62] },
    frost: { shapes: ['spark'], gravity: 0.3, drag: 2.6, up: [0.1, 0.5], out: [0.3, 0.9], size: [0.08, 0.14], life: [0.6, 1], glow: true, base: [0.85, 0.95, 1] },
    ichor: { shapes: ['disc'], gravity: 11, drag: 0.6, up: [1, 2.6], out: [0.6, 1.8], size: [0.045, 0.09], life: [0.45, 0.8], glow: false, base: [0.1, 0.09, 0.13], share: 0.15 },
    ember: { shapes: ['spark'], gravity: -1.8, drag: 0.9, up: [0.8, 1.8], out: [0.3, 1], size: [0.05, 0.1], life: [0.6, 1.1], glow: true, base: [1, 0.62, 0.28], cools: true },
    mote: { shapes: ['disc'], gravity: 0, drag: 1.5, up: [0.05, 0.4], out: [0.2, 0.6], size: [0.06, 0.11], life: [0.8, 1.3], glow: true, base: [0.9, 0.95, 1] },
    down: { shapes: ['feather'], gravity: 0.8, drag: 2.2, up: [0.3, 1], out: [0.3, 1], size: [0.1, 0.16], life: [1, 1.6], glow: false, base: [0.82, 0.8, 0.74], spin: 3 },
  } satisfies Record<string, MatterSpec>,

  /**
   * A crowd (render/foeCrowd.ts): the `full` nearest creatures to the investigator draw all of a blow, the next `marks` its marks only, and the
   * rest only within `range.rest` (their marks), none beyond; no creature farther than the range of its tier draws that tier. A rolling budget
   * of `budget` particles in `window` seconds is shared by all of them, of which what is optional (specks, trails, tells, motes) may spend
   * `optional` of it, and the marks-only tier `markShare` of it; so a pack of twelve spends what a pack of four would.
   */
  crowd: { full: 3, marks: 5, range: { full: 24, marks: 32, rest: 10 }, window: 0.5, budget: 56, optional: 0.65, markShare: 0.6 },
} as const;
