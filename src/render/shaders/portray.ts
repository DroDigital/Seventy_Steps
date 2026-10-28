/**
 * Light the picture has but the vertices do not (round 98). Before the mist and the palette, and only
 * on the world (a sprite is the picture): the depth gives a normal, the paint's own brightness gives
 * the relief the mesh never had, and that relief is lit by the moon, the lantern and the lamps already
 * in the frame. Nothing is sampled from a neighbour's colour, so a lamp cannot paint a ring of itself
 * across the street. `uPortray` is the relief, how hard those lights catch it, the glint, and how many
 * pixels of the broad light are taken out of the relief. All zero leaves the picture as it was.
 */

import { LAMP_SLOTS } from './common';

export const PORTRAY_GLSL = /* glsl */ `
uniform vec4 uPortray;

vec3 viewPos(vec2 uv, float d) {
  vec4 p = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return p.xyz / max(p.w, 1e-4);
}

float portrayFalloff(float d, float range) {
  float x = clamp(d / max(range, 0.5), 0.0, 1.0);
  float x2 = x * x;
  float win = 1.0 - x2 * x2;
  return win * win / (1.0 + uLanternDecay * d * d);
}

// The scene's brightness at uv, or the centre's when the sample has stepped off this surface.
float portrayLuma(vec2 uv, vec2 at, float z) {
  float ds = texture(tDepth, at).x;
  if (ds > 0.9985) return dot(texture(tScene, uv).rgb, LUMA);
  vec3 q = viewPos(at, ds);
  if (abs(abs(q.z) - z) > z * 0.04) return dot(texture(tScene, uv).rgb, LUMA);
  return dot(texture(tScene, at).rgb, LUMA);
}

vec3 portray(vec3 col, vec2 uv, float person) {
  if (uPortray.x + uPortray.y + uPortray.z <= 0.0) return col;
  if (person > 0.5) return col;
  float d = texture(tDepth, uv).x;
  if (d > 0.9985) return col;
  vec3 p = viewPos(uv, d);
  vec2 px = 2.0 / uRes;
  float dR = texture(tDepth, uv + vec2(px.x, 0.0)).x;
  float dU = texture(tDepth, uv + vec2(0.0, px.y)).x;
  if (dR > 0.9985) dR = d;
  if (dU > 0.9985) dU = d;
  vec3 pR = viewPos(uv + vec2(px.x, 0.0), dR);
  vec3 pU = viewPos(uv + vec2(0.0, px.y), dU);
  float z = max(abs(p.z), 0.4);
  float gap = max(abs(abs(pR.z) - z), abs(abs(pU.z) - z));
  if (gap > z * 0.04) return col;
  vec3 n = normalize(cross(pR - p, pU - p));
  if (dot(n, -p) < 0.0) n = -n;

  float coarse = max(uPortray.w, 2.0);
  vec2 cpx = px * coarse;
  float dhdx = (portrayLuma(uv, uv + vec2(px.x, 0.0), z) - portrayLuma(uv, uv - vec2(px.x, 0.0), z)) - (portrayLuma(uv, uv + vec2(cpx.x, 0.0), z) - portrayLuma(uv, uv - vec2(cpx.x, 0.0), z)) / coarse;
  float dhdy = (portrayLuma(uv, uv - vec2(0.0, px.y), z) - portrayLuma(uv, uv + vec2(0.0, px.y), z)) - (portrayLuma(uv, uv - vec2(0.0, cpx.y), z) - portrayLuma(uv, uv + vec2(0.0, cpx.y), z)) / coarse;
  vec3 nPaint = normalize(n + vec3(-dhdx, -dhdy, 0.0) * (32.0 * uPortray.x));

  mat3 toView = transpose(mat3(uCamWorld));
  vec3 moonV = normalize(toView * uMoonDir);
  float moonS = clamp(dot(n, moonV), -1.0, 1.0);
  float moonP = clamp(dot(nPaint, moonV), -1.0, 1.0);
  col *= 1.0 + clamp(moonS * uPortray.x * 0.18 + (moonP - moonS) * 0.9, -0.28, 0.4);

  vec3 worldP = (uCamWorld * vec4(p, 1.0)).xyz;
  mat3 toWorld = mat3(uCamWorld);
  vec3 wN = normalize(toWorld * nPaint);
  vec3 wS = normalize(toWorld * n);
  vec3 eye = normalize(-p);
  vec3 caught = vec3(0.0);

  vec3 toLan = uLanternPos - worldP;
  float ld = length(toLan);
  vec3 lanW = toLan / max(ld, 1e-3);
  float att = portrayFalloff(ld, uLanternRange);
  caught += uLanternColor * (max(dot(wN, lanW), 0.0) - max(dot(wS, lanW), 0.0)) * att;
  float spL = pow(max(dot(nPaint, normalize(normalize(toView * lanW) + eye)), 0.0), 48.0) * att * att;

  for (int i = 0; i < ${LAMP_SLOTS}; i++) {
    vec4 lamp = uLamps[i];
    if (lamp.w <= 0.0) continue;
    if (windowLight(i, worldP) < 0.5) continue;
    vec3 to = lamp.xyz - worldP;
    float dist = length(to);
    vec3 dir = to / max(dist, 1e-3);
    caught += uLampColors[i] * (max(dot(wN, dir), 0.0) - max(dot(wS, dir), 0.0)) * portrayFalloff(dist, lamp.w);
  }
  col += clamp(caught * uPortray.y, vec3(-0.05), vec3(0.07));

  float spM = pow(max(dot(nPaint, normalize(moonV + eye)), 0.0), 72.0);
  vec3 own = col / max(dot(col, LUMA), 0.05);
  col += min((uLanternColor * spL * 0.4 + own * spM * 0.06) * uPortray.z, vec3(0.045));
  return col;
}
`;
