/**
 * Round 116: the lantern's shafts in the mist, a piece of the fog march (shaders/fog.ts). Its glow along a ray is gathered in closed form
 * (glowAlong), as if nothing stood in its light; here the stretch of the ray within its reach is tapped against its own depth map (the one
 * its shadows on the ground and walls are read from: render/lanternShadow.ts, drawn from the investigator's chest toward where the camera
 * looks, of the far faces of what is solid), weighed as the glow is gathered, so the share of that glow the lantern truly reaches is known.
 * A trunk, a pillar, a wall's end, a gravestone then throws a wedge of dark through the halo, and between them the lit mist stands out.
 * The shadowed stretch keeps a little (a flame is not a point). Nothing is marched where the shadows are off (the setting) or the ray
 * passes far from the lantern.
 */

export const FOG_LANTERN_GLSL = /* glsl */ `
uniform sampler2D uLShadowMap; // the lantern's depth map, world to its clip, its near and far, and its numbers (lanternShadow.ts: the world's own)
uniform mat4 uLShadowMat;
uniform vec2 uLShadowNF;
uniform vec4 uLShadow;
uniform vec4 uLanternShaft; // how far the glow follows its shadows (0: not at all), the share a shadowed stretch keeps, -, -

// 1 where the lantern reaches the point p of the air, 0 where something solid stands between: one tap, 1 outside its map.
float lanternReaches(vec3 p) {
  vec4 c = uLShadowMat * vec4(p, 1.0);
  float z = c.w; // (a perspective's w is the depth along its axis)
  if (z <= uLShadowNF.x || z >= uLShadowNF.y) return 1.0;
  vec2 uv = c.xy / c.w * 0.5 + 0.5;
  float e = max(abs(uv.x - 0.5), abs(uv.y - 0.5)) * 2.0;
  if (e >= 1.0) return 1.0;
  float d = textureLod(uLShadowMap, uv, 0.0).r;
  float metres = uLShadowNF.x * uLShadowNF.y / (uLShadowNF.y - d * (uLShadowNF.y - uLShadowNF.x));
  float lit = step(z - (uLShadow.z + 0.01 * z) * 2.0, metres);
  return mix(1.0, lit, 1.0 - smoothstep(0.72, 0.98, e));
}

// The share of the lantern's glow along the ray o + d·t, t in [0, len], that its light reaches (1: all of it), as glowAlong gathers it.
float lanternShaft(vec3 o, vec3 d, float len, float range, float k, float jitter) {
  if (uLanternShaft.x <= 0.0 || uLShadow.x <= 0.0) return 1.0;
  vec3 oc = uLanternPos - o;
  float t0 = dot(oc, d);
  float h2 = max(dot(oc, oc) - t0 * t0, 0.0);
  if (h2 >= range * range) return 1.0;
  float span = sqrt(range * range - h2);
  float a = max(t0 - span, 0.0);
  float b = min(t0 + span, len);
  if (b <= a) return 1.0;
  float stepLen = (b - a) / float(LANTERN_SHAFT_STEPS);
  float sum = 0.0;
  float weight = 0.0;
  for (int i = 0; i < LANTERN_SHAFT_STEPS; i++) {
    vec3 p = o + d * (a + stepLen * (float(i) + jitter));
    vec3 q = p - uLanternPos;
    float w = 1.0 / (1.0 + k * dot(q, q)); // (glowAlong's own weight along the ray)
    sum += w * lanternReaches(p);
    weight += w;
  }
  float seen = weight > 1e-5 ? sum / weight : 1.0;
  return mix(1.0, max(seen, uLanternShaft.y), uLanternShaft.x);
}
`;
