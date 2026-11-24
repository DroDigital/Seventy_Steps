/**
 * Protoplasmic surface warp and organic eye-cluster modulation for amorphous sprites.
 * Needs, before it: `vnoise`, `hash12`, `uTime`, `uEyeRange`, `vDist`, `bodyRim` (from shaders/bodyLight.ts).
 */
export const PROTOPLASM_GLSL = /* glsl */ `
/** Breaks up rigid mechanical eye grids into writhing protoplasmic bubbles and staggered organic clusters. */
vec3 protoplasmSurface(vec2 cellUv, vec3 col, vec3 raw, vec3 light) {
  vec2 p = cellUv * 9.0;
  float boil = vnoise(p + vec2(uTime * 0.45, -uTime * 0.32)) * 0.65 + vnoise(p * 2.3 - vec2(uTime * 0.6, uTime * 0.4)) * 0.35;
  float sheen = smoothstep(0.62, 0.88, boil);
  col = mix(col, col * vec3(0.75, 1.05, 0.92) + vec3(0.04, 0.07, 0.06) * light, sheen * 0.55);
  // Suppress rigid grid green pixels irregularly so they blink and shift organically.
  float isGridEye = smoothstep(0.08, 0.25, raw.g - max(raw.r, raw.b) * 1.12);
  if (isGridEye > 0.05) {
    float cluster = hash12(floor(cellUv * 12.0));
    float wink = 0.2 + 0.8 * smoothstep(0.15, 0.85, 0.5 + 0.5 * sin(uTime * (1.8 + cluster * 3.0) + cluster * 17.0));
    vec3 darkMass = vec3(0.06, 0.08, 0.07) * light * (0.7 + 0.6 * boil);
    col = mix(col, darkMass, isGridEye * (1.0 - wink * 0.72));
  }
  // Bubbling asymmetric organic micro-eyes rising across the protoplasmic silhouette.
  vec2 ec = cellUv * 15.0 + vec2(sin(uTime * 0.35 + cellUv.y * 5.0) * 0.25, cos(uTime * 0.28 + cellUv.x * 5.0) * 0.2);
  vec2 id = floor(ec);
  vec2 f = fract(ec) - 0.5;
  float h = hash12(id + 3.1);
  if (h > 0.62 && bodyRim.z < 0.75) {
    vec2 off = vec2(hash12(id + 9.4) - 0.5, hash12(id + 14.7) - 0.5) * 0.45;
    float d = length(f - off);
    float life = smoothstep(0.2, 0.75, sin(uTime * (0.9 + h * 1.4) + h * 23.0) * 0.5 + 0.5);
    float iris = 1.0 - smoothstep(0.09, 0.22, d);
    float pupil = 1.0 - smoothstep(0.03, 0.09, d);
    float eyeFade = 1.0 - smoothstep(uEyeRange.x, uEyeRange.y, vDist);
    vec3 eyeCol = mix(vec3(0.18, 0.92, 0.56), vec3(0.02, 0.04, 0.03), pupil);
    col = mix(col, eyeCol, iris * life * eyeFade * 0.85);
  }
  return col;
}
`;
