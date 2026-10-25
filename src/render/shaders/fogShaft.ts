/**
 * Round 78: the moon's shafts in the mist, a piece of the fog march (shaders/fog.ts). The depth map the moon's shadows are read from
 * (render/moonShadow.ts: the world shader's own, shared) is looked up along each pixel's ray, in the air and not on a surface, so a
 * trunk, a roof or a standing stone that shades the ground shades the mist above it too: wedges of dark behind them, and between them
 * the pale shafts. What it finds is a mean, along the ray and weighed by the mist there, of how far the moon reaches it; the march
 * then dims or lifts the mist's own light by it (so the mean glow, which round 58 set by eye, is where the moon is taken to reach
 * `uShaft.y` of the mist, and the shadows go below it). Where the setting, a roof or a low moon turns the map off (`uShadow.x`), or the
 * weather veils the moon (`uShaft.x`), the march is not run at all.
 */

export const SHAFT_GLSL = /* glsl */ `
uniform sampler2D uShadowMap; // the moon's depth map, its matrix and its numbers: the world's own (moonShadow.ts)
uniform mat4 uShadowMat;
uniform vec4 uShadow; // strength (0: no shadows), a texel, the bias in depth units, the offset along the normal (metres)
uniform vec4 uShaft; // how far the mist follows the moon (0: not at all), the share of the ray it reaches on average, metres the shadows are read, -

// 1 where the moon reaches the point p of the air, 0 where something stands between: one tap (a shaft's edge is soft enough from the dither), 1 outside the map as the world's shadows are.
float moonReaches(vec3 p) {
  vec3 c = (uShadowMat * vec4(p, 1.0)).xyz;
  float e = max(abs(c.x - 0.5), abs(c.y - 0.5)) * 2.0;
  if (e >= 1.0 || c.z >= 1.0 || c.z <= 0.0) return 1.0;
  float lit = step(c.z - uShadow.z * 3.0, textureLod(uShadowMap, c.xy, 0.0).r);
  return mix(1.0, lit, 1.0 - smoothstep(0.5, 0.98, e));
}

// How far the moon reaches the mist along a ray from the lens (direction dir, len metres to what it strikes), less what is taken to be average: about -0.9 behind a trunk, +0.1 in a shaft.
float shaftAlong(vec3 dir, float len, float jitter) {
  float stepLen = min(len, uShaft.z) / float(SHAFT_STEPS);
  float t = stepLen * jitter;
  float through = 1.0;
  float sum = 0.0;
  float weight = 0.0;
  for (int i = 0; i < SHAFT_STEPS; i++) {
    vec3 p = uCamPos + dir * t;
    float up = max(p.y - uFog.z, 0.0);
    float s = (uFog.x * exp(-up / uFog.y) + uFogAir.x * exp(-up / uFogAir.y)) * smoothstep(uFogStart.x, uFogStart.y, t);
    float keep = exp(-s * stepLen);
    float w = through * (1.0 - keep);
    sum += w * moonReaches(p);
    weight += w;
    through *= keep;
    t += stepLen;
  }
  return weight > 1e-4 ? sum / weight - uShaft.y : 0.0;
}
`;
