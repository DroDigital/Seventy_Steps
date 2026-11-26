/**
 * Round 125, the numbers of what grows (render/floraKit.ts, shaders/foliage.ts, render/propMeshes.ts): how a leaf takes the light, how
 * far a plant leans in a gust, and how the library's trees are fitted to the props they stand for. Data only.
 */

/** How a leaf takes the light (shaders/foliage.ts). */
export const FLORA_LIGHT = {
  wrap: 0.6, // the moon wraps this far round a crown (0: a hard terminator, as stone has)
  through: 0.55, // what comes through the leaves against the moon, of the moon's own light
  throughPower: 4, // how near the moon the eye must look for it
  lanternWrap: 0.5, // a leaf turned from the lantern still takes some of it
} as const;

/** How the library's plants stand (render/floraKit.ts). */
export const FLORA = {
  bend: 0.03, // metres a plant's crown leans at a gust's height, per metre it stands (as round 34's)
  widen: 0.12, // a crown's spread drawn this much wider or narrower, by the prop's seed
  reach: 1.2, // ...but never farther from its trunk than half its height and this many metres
} as const;
