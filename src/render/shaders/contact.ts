/**
 * Fine shadows (round 113), a chunk of the post pass: the moon's map has a texel of 4 cm and the lantern's is coarser still, so a pebble,
 * a creature's foot, a step's lip or the gap under a door cast nothing. From each pixel the scene's depth is marched a little way toward
 * the moon and toward the lantern; if something drawn stands across that short way, the pixel loses the share of its light that one gave.
 * Only where that light reaches at all: a point already in the moon's shadow (moonReaches, shaders/fogShaft.ts) loses no more to it.
 * Needs, before it: tDepth, uProjInv, uCamWorld, uRes, the lantern's uniforms (shaders/fog.ts) and moonReaches.
 */

export const CONTACT_GLSL = /* glsl */ `
uniform mat4 uProj; // the camera's view to clip, and the world to its view
uniform mat4 uView;
uniform vec3 uLightDir; // toward the moon, its light and the sky's (the world's own: worldMaterial.ts)
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec4 uContact; // the most light it takes, metres it marches, how deep a thing is taken to be, metres from the lens it is gone by

vec3 contactView(vec2 uv, float d) {
  vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return v.xyz / v.w;
}

// The surface's normal at p (view space) from the depth about it, the nearer neighbour on each axis (so an edge does not bend it).
vec3 contactNormal(vec2 uv, vec3 p) {
  vec2 px = 1.0 / uRes;
  vec3 r = contactView(uv + vec2(px.x, 0.0), texture(tDepth, uv + vec2(px.x, 0.0)).x) - p;
  vec3 l = p - contactView(uv - vec2(px.x, 0.0), texture(tDepth, uv - vec2(px.x, 0.0)).x);
  vec3 u = contactView(uv + vec2(0.0, px.y), texture(tDepth, uv + vec2(0.0, px.y)).x) - p;
  vec3 d = p - contactView(uv - vec2(0.0, px.y), texture(tDepth, uv - vec2(0.0, px.y)).x);
  vec3 dx = abs(r.z) < abs(l.z) ? r : l;
  vec3 dy = abs(u.z) < abs(d.z) ? u : d;
  vec3 n = normalize(cross(dx, dy));
  return dot(n, p) > 0.0 ? -n : n; // (toward the lens)
}

// 1 when something drawn stands across the way from p (view space) along dir for len metres, nearer p the surer; 0 when nothing does (a person is passed over unless people is true).
float contactMarch(vec3 p, vec3 dir, float len, float jitter, bool people) {
  float z0 = -p.z;
  for (int i = 0; i < 8; i++) {
    float t = 0.05 + len * (float(i) + jitter) / 8.0;
    vec3 q = p + dir * t;
    vec4 c = uProj * vec4(q, 1.0);
    if (c.w <= 0.0) break;
    vec2 s = c.xy / c.w * 0.5 + 0.5;
    if (s.x <= 0.0 || s.x >= 1.0 || s.y <= 0.0 || s.y >= 1.0) break;
    float d = texture(tDepth, s).x;
    if (d >= 0.9999 || (!people && texture(tScene, s).a < 0.9)) continue; // (the one who carries the lantern casts no shadow from it: render/lanternShadow.ts)
    float behind = -q.z + contactView(s, d).z; // how far behind what is drawn there the way runs
    float slack = 0.03 + 0.006 * z0 + 0.02 * t; // the depth's own coarseness, which grows with distance
    if (behind > slack && behind < uContact.z) return 1.0 - 0.5 * float(i) / 8.0;
  }
  return 0.0;
}

// The share of its light a point keeps (1: all of it): uv on the screen, jitter the picture's own dither.
float contactShadow(vec2 uv, float jitter) {
  if (uContact.x <= 0.0) return 1.0;
  float d = texture(tDepth, uv).x;
  if (d >= 0.9999) return 1.0;
  vec3 p = contactView(uv, d);
  float z = -p.z;
  if (z > uContact.w) return 1.0;
  vec3 wp = (uCamWorld * vec4(p, 1.0)).xyz;
  vec3 lum = vec3(0.2126, 0.7152, 0.0722);
  vec3 L = normalize(uLightDir);
  vec3 n = contactNormal(uv, p);
  vec3 Lv = normalize(mat3(uView) * L);
  float moon = dot(uLightColor, lum) * max(L.y, 0.0) * smoothstep(0.05, 0.3, dot(n, Lv)); // only a face the moon lights has its light to lose
  moon *= moonReaches(wp + L * 0.15 + vec3(0.0, 0.05, 0.0)) * step(0.0001, uShadow.x); // none where the moon's own shadow already lies, or it casts none
  vec3 toLamp = uLanternPos - wp;
  float far = length(toLamp);
  float x = clamp(far / max(uLanternRange, 0.001), 0.0, 1.0);
  float win = 1.0 - x * x * x * x;
  float lamp = dot(uLanternColor, lum) * win * win / (1.0 + uLanternDecay * far * far);
  float whole = moon + lamp + dot(uAmbient, lum) + 1e-3;
  float lost = 0.0;
  vec3 lv = normalize((uView * vec4(uLanternPos, 1.0)).xyz - p);
  lamp *= smoothstep(0.05, 0.3, dot(n, lv));
  vec3 off = p + n * (0.02 + 0.004 * z); // (held off its own surface)
  if (moon > 0.02 * whole) lost += moon / whole * contactMarch(off, Lv, uContact.y, jitter, true);
  if (lamp > 0.02 * whole && far > 0.3) lost += lamp / whole * contactMarch(off, lv, min(uContact.y, far - 0.3), jitter, false);
  return 1.0 - uContact.x * min(lost, 1.0) * (1.0 - smoothstep(0.6 * uContact.w, uContact.w, z));
}
`;
