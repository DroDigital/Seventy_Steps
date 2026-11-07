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
