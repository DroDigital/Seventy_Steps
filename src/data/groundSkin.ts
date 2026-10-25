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
