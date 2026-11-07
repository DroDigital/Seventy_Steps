/**
 * How the drawn creatures take the world's light, and the ground they stand on (round 113: asked by XDro, "increase the overall game's
 * fidelity by a huge margin so the 2D sprite juxtaposition to the 3D world doesn't affect immersion"; render/shaders/bodyLight.ts).
 * Nothing of the art is repainted, outlined or rimmed: each number only darkens, lights or hides what is drawn, as the world would.
 */

export const BODY_LIGHT = {
  side: 0.55, // a light behind a body darkens the face of it the camera sees: 0 none, 1 a moon straight behind leaves it dark
  shape: 0.3, // the side of a body turned from its light is drawn this much darker at its edge (its painted outline read as a rounded form)
  shapeReach: 4, // texels of the art the body's shape is read over
  bounce: 0.2, // the share of the light on the ground that is thrown up onto a body's lower part
  sky: 0.16, // the top of a body takes this much more of the realm's ambient than its feet, which take this much less
  shadowFoot: [0.06, 0.2] as readonly [number, number], // over this share of the billboard from its feet, a pixel's own shadow takes over from the body's (the feet stand in the shadow their own body casts)
  turn: 0.12, // seconds a creature's picture takes to dissolve from one of its views into the next as it turns
} as const;

/** What a drawn body is made to share with the ground and the water it stands in (round 113; render/shaders/bodyMatter.ts, render/bodyGround.ts). */
export const BODY_MATTER = {
  depth: 0.3, // a body is drawn as deep as this share of its breadth: its middle stands forward of its picture, its edges back, so it meets a slope, a step, a wall, the mist and the shade of what crowds it as a rounded thing does
  depthMost: 6, // metres, the deepest (a colossus)
  grain: { from: 18, to: 10, density: 32, strength: 0.14 }, // a form drawn with fewer texels a metre than `from` (whole by `to`) has a fine grain laid in each of its texels, at the ground's `density` a metre (never finer than a screen pixel and a half), this strong
  filterFrom: 1.4, // texels a screen pixel covers past which a far body is drawn from the average of its footprint, not one texel: so it holds still as it moves
  sink: { snow: 0.16, mud: 0.1, sand: 0.05, grass: 0.07, leaves: 0.06 } as Readonly<Record<string, number>>, // metres the ground takes a body's feet into
  water: [0.05, 0.085, 0.095] as readonly [number, number, number], // the sea about a wading body, before its light
  foam: 0.04, // metres of the waterline on a body that are foam
  rings: 0.45, // seconds between the rings a body wading leaves as it moves
  splash: 0.5, // rain: drops a second breaking on a body's head and shoulders, at the heaviest, for a man's size
} as const;

/** The grounds that take a foot in, by the index the shader is told (render/bodyGround.ts): 0 none. */
export const SINKS = ['snow', 'mud', 'sand', 'grass', 'leaves'] as const;
export const SINK_COLOURS: Readonly<Record<(typeof SINKS)[number], readonly [number, number, number]>> = {
  snow: [0.82, 0.84, 0.88], mud: [0.22, 0.17, 0.12], sand: [0.6, 0.53, 0.4], grass: [0.2, 0.26, 0.14], leaves: [0.34, 0.24, 0.13],
};
