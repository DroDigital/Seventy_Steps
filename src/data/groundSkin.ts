/**
 * Round 80, the ground answers the body: the numbers of the grass that parts for whoever goes through it (render/bodyPush.ts, the
 * vertex shader's SWAY block), the lane of stems that stays laid down behind (render/trample.ts), and the rings a boot makes in a
 * puddle (the fragment shader's `footRings`). Metres and seconds. Data only.
 */

export const BODY_PUSH = {
  slots: 4, // bodies the shader parts the grass for at once: the investigator and the nearest three (the shader's `uBodies[4]`)
  reach: 14, // metres from the camera that a foe still parts it
  foot: 0.55, // metres: the investigator's reach on foot when the body says none
  rig: 1.0, // metres: a rig and its horses part a lane this wide
  most: 2.2, // metres: the broadest a body parts it (a colossus does not part a field)
  least: 0.25, // and the least (a rat)
  leap: 4, // metres a body moves in a frame before it is taken for a journey (nothing is trampled between)
  hover: 0.3, // a body that hovers higher than this parts nothing
};

/** The lane of laid-down stems: a toroidal field of texels about the investigator, stamped by the bodies and risen from over `hold` seconds. */
export const TRAMPLE = {
  size: 64, // texels a side (the shader's 64)
  cell: 0.5, // metres a texel
  hold: 8, // seconds a stem takes to rise again
  reach: 1.2, // the disc a body stamps, × its radius
  least: 0.5, // metres: the narrowest lane
};

/** Boots in a puddle: a ring for a stride, while the ground is soaked. */
export const FOOT_RINGS = {
  slots: 6, // rings alive at once (the shader's `uStep[6]`)
  wet: 0.5, // how soaked the ground must be (render/wetness.ts)
  stride: 0.95, // metres of walking between one step and the next
  rigStride: 1.6, // and of a rig's: a hoof strikes
  side: 0.12, // metres a foot lies to the side of the line walked (a hoof, ×4)
  strength: [0.6, 1] as const, // a ring's brightness, standing to running at `quick`
  quick: 6, // metres a second
  life: 1.7, // seconds a ring spreads before it is gone (the shader's)
};

/**
 * Round 116, a blast moves the world about it (render/blastWaves.ts): a horror's quake, a burst of marked ground, a bolt of the storm, a
 * way's plate, a bolt that bursts, a horror's roar as it turns, a slam. Its wave runs out over the land; as the front passes, the grass,
 * the leaves and the boughs bend away from it and the grass at its heart is laid down, the low mist is thrown out of the ring behind it and
 * heaped at its edge, a flame or a lamp gutters, and the motes in the air are carried off. Metres, seconds, and shares of a full blast.
 */
export const BLAST = {
  slots: 4, // waves alive at once (the shaders' `uBlasts[4]`)
  speed: 16, // metres a second the front runs out
  width: 1.8, // metres: the front's half breadth
  reach: 28, // metres it runs before it is spent
  near: 6, // metres from its heart within which it is whole (it weakens as 1 / (1 + r / near) beyond)
  bend: 5, // × a blade's or a bough's own sway, the most it is bent away at the front of a full blast...
  most: 0.7, // ...but never more than this, metres
  flatten: 0.45, // the share of a blade's height a full front lays it down for the moment it passes
  lay: 0.75, // a blast at least this strong lays the grass at its heart down, as a body's passing does (render/trample.ts)...
  layReach: [1.6, 4.2] as const, // ...over a disc this wide, from the least to the strongest, metres
  clear: 0.75, // the most of the low mist a full blast throws out of the ring behind its front
  heap: 0.6, // and how much thicker it lies at the front
  refill: 1.6, // seconds for the thrown mist to drift back (a share e of it each)
  gutter: 0.65, // the most of a flame's light and height a passing front takes, and of a lamp's
  air: 26, // m/s² a full front pushes the air's own motes (render/ambientAir.ts) away from its heart
  /** How strong each blast is, at its full (a share of a full blast, at most 1). */
  of: {
    quake: 1, // a horror's quake, its ring racing out
    strike: 0.9, // a bolt of the storm on the ground (systems/skyStrikes.ts)
    roar: 0.7, // a horror turning into its next phase
    ward: 0.5, // a way's plate, vent or wave bursting (systems/ways.ts)
    slam: 0.45, // a horror's slam or ring of a blow
    erupt: [0.35, 0.08] as const, // marked ground bursting: this, and this more for each metre of its radius
    bolt: [0.15, 0.1, 1.2] as const, // a bolt that bursts where it lands: this, and this more for each metre of its radius, from this radius
  },
};
