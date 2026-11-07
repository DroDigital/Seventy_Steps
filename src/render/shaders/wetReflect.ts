/**
 * Wet ground mirrors what stands over it (round 113), a chunk of the post pass: the world shader tells how much of a mirror a pixel is
 * in its alpha (0.92..1: rain-soaked ground and its puddles, a drowned hall's floor; shaders/world.ts `shine`). From such a pixel the
 * view's ray is turned about the ground's up, rippled a little by the rain, and followed over the scene's depth; where it meets what is
 * drawn, that colour is laid over the ground by the angle it is seen at. Nothing found (the sky, off the picture): nothing is laid.
 * Needs, before it: tScene, tDepth, uProjInv, uCamWorld, uRes, uTime and uWet's ripple, and CONTACT_GLSL's uProj, uView and contactView.
 */

export const WET_REFLECT_GLSL = /* glsl */ `
uniform vec4 uWetMirror; // how strongly it mirrors, metres the ray is followed, how deep a thing is taken to be, how much the rain ripples it

// The colour wet ground at uv mirrors and how much of it shows (a), given how much of a mirror it is.
vec4 wetReflect(vec2 uv, float shine, float jitter) {
  if (uWetMirror.x <= 0.0 || shine <= 0.01) return vec4(0.0);
  float d = texture(tDepth, uv).x;
  if (d >= 0.9999) return vec4(0.0);
  vec3 p = contactView(uv, d);
  vec3 wp = (uCamWorld * vec4(p, 1.0)).xyz;
  vec2 rip = vec2(sin(wp.x * 7.0 + uTime * 5.0) + sin(wp.z * 9.0 - uTime * 4.0), cos(wp.z * 6.0 + uTime * 4.5) + cos(wp.x * 8.0 - uTime * 3.5));
  vec3 up = normalize(vec3(rip.x * uWetMirror.w, 1.0, rip.y * uWetMirror.w));
  vec3 n = normalize(mat3(uView) * up);
  vec3 v = normalize(p);
  vec3 r = reflect(v, n);
  float fres = 0.15 + 0.85 * pow(1.0 - max(dot(-v, n), 0.0), 4.0);
  float stride = uWetMirror.y / 14.0;
  float t = stride * (0.5 + jitter);
  for (int i = 0; i < 14; i++) {
    vec3 q = p + r * t;
    vec4 c = uProj * vec4(q, 1.0);
    if (c.w <= 0.0) break;
    vec2 s = c.xy / c.w * 0.5 + 0.5;
    if (s.x <= 0.0 || s.x >= 1.0 || s.y <= 0.0 || s.y >= 1.0) break;
    float ds = texture(tDepth, s).x;
    float behind = -q.z + contactView(s, ds).z;
    if (ds < 0.9999 && behind > 0.0 && behind < uWetMirror.z + 0.04 * t) {
      vec2 edge = smoothstep(vec2(0.0), vec2(0.08), s) * smoothstep(vec2(0.0), vec2(0.08), 1.0 - s);
      float fade = edge.x * edge.y * (1.0 - float(i) / 14.0);
      return vec4(texture(tScene, s).rgb, uWetMirror.x * shine * fres * fade);
    }
    t += stride * (1.0 + 0.15 * float(i));
  }
  return vec4(0.0);
}
`;
