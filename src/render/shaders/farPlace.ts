/**
 * Where a far thing is drawn (round 117, asked: "make sure every background keeps correct distance perception and parallax when moving,
 * especially close walking the shore"). A far silhouette was a card turned to face the eye and drawn at a fixed 98 m, sized to the angle it
 * would fill: its near end and its far end moved as one, so a wide city walked past along a shore swung round with the walker, and a peak
 * was held at 34 degrees however near it was come. Now it stands where it truly is, at its true size, facing its realm (render/skyline.ts),
 * and is drawn in true perspective: every part of it has its own parallax and a nearer layer crosses a farther one. Two things keep it
 * drawable: past the far plane it is drawn all the same (it is drawn first and neither tests nor writes depth, so only its clip depth is
 * held inside), and its height over the eye is eased from SKY.farKnee toward SKY.farAngle, so a mountain grows as it is neared but never
 * walls the sky.
 */

import { SKY } from '../../data/tuning';

const RAD = Math.PI / 180;
const KNEE = SKY.farKnee * RAD;
const ROOM = (SKY.farAngle - SKY.farKnee) * RAD;

/** The elevation (radians) a far point `e` radians over the eye is drawn at: itself below the knee, eased toward SKY.farAngle above it. */
export function shownElevation(e: number): number {
  return e <= KNEE ? e : KNEE + ROOM * Math.tanh((e - KNEE) / ROOM);
}

export const FAR_PLACE_GLSL = /* glsl */ `
// a far point where it is drawn (shaders/farPlace.ts): where it truly stands, its height over the eye eased from the knee toward the most
vec4 farPlace(vec4 world) {
  vec3 d = world.xyz - cameraPosition;
  float across = max(length(d.xz), 1e-3);
  float e = atan(d.y, across);
  if (e > ${KNEE.toFixed(5)}) world.y = cameraPosition.y + tan(${KNEE.toFixed(5)} + ${ROOM.toFixed(5)} * tanh((e - ${KNEE.toFixed(5)}) / ${ROOM.toFixed(5)})) * across;
  return world;
}
// and on the screen: past the far plane it is drawn all the same (drawn first, it neither tests nor writes depth)
vec4 farClip(vec4 world) {
  vec4 c = projectionMatrix * viewMatrix * world;
  c.z = min(c.z, c.w * 0.9999);
  return c;
}
`;
