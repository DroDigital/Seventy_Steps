/**
 * The sky's own light toward a direction, before its stars, cloud and moon disc (round 117): the gradient from the horizon to the zenith, the
 * moon's quarter shining low on it, and the hour's glows (the dusk's afterglow, the false dawn). The sky draws it (shaders/sky.ts), and the far
 * silhouettes melt into it (shaders/skylineFar.ts): what the air between lays over a far shape is the same light the sky behind it shows, so a
 * far range is never a cut-out lighter than the sky on one side and darker on the other. Each shader declares the uniforms it reads:
 * uHorizon, uZenith, uMoonColor, uMoonDir, uHaze, uHour, uHourGlow, uHourDawn.
 */

import { HOURS } from '../../data/hours';

const F = (n: number): string => n.toFixed(2);

export const SKY_TONE_GLSL = /* glsl */ `
// the hour's own light low on the sky: a warm band opposite where the moon rose, a pale wedge opposite where it sets
vec3 skyHours(vec3 d) {
  float h = d.y;
  float rise = max(h, 0.0);
  float az = atan(d.x, d.z);
  vec3 hours = vec3(0.0);
  if (uHour.x > 0.001) hours += uHourGlow * (exp(-rise * ${F(HOURS.falloff)}) * pow(0.5 + 0.5 * cos(az - uHour.z), ${F(HOURS.spread)}) * uHour.x);
  if (uHour.y > 0.001) hours += uHourDawn * (pow(0.5 + 0.5 * cos(az - uHour.w), ${F(HOURS.cone.spread)}) * exp(-rise * ${F(HOURS.cone.lean)}) * smoothstep(0.0, 0.05, h) * uHour.y);
  return hours;
}
// the realm's horizon rising to its zenith, and the moon's quarter shining low on it
vec3 skyTone(vec3 d) {
  float rise = max(d.y, 0.0);
  vec3 m = normalize(uMoonDir);
  float toward = 0.5 + 0.5 * dot(normalize(d.xz + 1e-4), normalize(m.xz + 1e-4)); // 1 on the moon's side
  float glow = exp(-rise * 7.0) * (0.35 + 0.65 * toward * toward);
  vec3 col = mix(uHorizon, uZenith, pow(smoothstep(0.0, 0.85, rise), 0.7));
  return col + uMoonColor * (0.16 * uHaze) * glow;
}
`;
