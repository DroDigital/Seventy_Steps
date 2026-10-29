/** Optional material studies. Heights come from the unlit, fully blended material rather than the
 * finished picture, so painted pools of light, sky, silhouettes and sprites never become relief.
 * Insert after sampleWorldTexture; all functions are called only for eligible opaque materials. */

export const STUDY_GLSL = /* glsl */ `
uniform float uStudy; // 0: original, 1: carved, 2: ceramic, 3: facets

float studyHeight(vec3 tex) {
  return dot(tex, vec3(0.2126, 0.7152, 0.0722));
}

vec3 studyNormal(vec3 tex, vec2 uv, vec2 gx, vec2 gy, vec3 n) {
  vec3 dx = dFdx(vWorld);
  vec3 dy = dFdy(vWorld);
  if (uStudy > 2.5) {
    vec3 face = cross(dx, dy);
    if (dot(face, face) < 1e-12) return n;
    face = normalize(face);
    return dot(face, n) < 0.0 ? -face : face;
  }

  // One filtered material sample keeps the road/patch/border blend and texture bombing without
  // expanding that entire mixture four times in the shader. Take derivatives before any spatial
  // early return, so neighbouring fragments always participate in the same derivative quad.
  float footprint = max(length(gx), length(gy));
  float height = studyHeight(sampleWorldTexture(uv, gx * 2.5, gy * 2.5));
  vec2 heightScreen = vec2(dFdx(height), dFdy(height)) / max(studyHeight(tex), 0.18);

  // A surface gradient in world metres, using the actual texture mapping's derivatives. There is
  // no tangent attribute to mismatch on procedural terrain or on mirrored/scaled geometry.
  vec3 rx = cross(dy, n);
  vec3 ry = cross(n, dx);
  float det = dot(dx, rx);
  if (abs(det) < 1e-10) return n;
  vec3 slope = (heightScreen.x * rx + heightScreen.y * ry) / det;
  float relief = uStudy < 1.5 ? 0.018 : 0.006;
  float distanceFade = 1.0 - smoothstep(14.0, 40.0, length(cameraPosition - vWorld));
  float footprintFade = 1.0 - smoothstep(0.045, 0.14, footprint);
  slope *= relief * distanceFade * footprintFade;
  float limit = uStudy < 1.5 ? 0.36 : 0.12;
  slope *= min(1.0, limit / max(length(slope), 1e-5));
  return normalize(n - slope);
}

vec3 studyAlbedo(vec3 tex, vec2 uv, vec2 gx, vec2 gy) {
  if (uStudy < 1.5) return tex;
  float span = uStudy < 2.5 ? 4.0 : 7.0;
  vec3 broad = sampleWorldTexture(uv, gx * span, gy * span);
  // Keep the material's own colour. Ceramic lets broad pigment show through the glaze; facets
  // simplify the paint enough for the mesh's large planes and lighting bands to carry its form.
  return mix(tex, broad, uStudy < 2.5 ? 0.72 : 0.88);
}

float studyDiffuse(float ndl) {
  if (uStudy < 1.5) return pow(max(ndl, 0.0), 0.9);
  if (uStudy < 2.5) return max((ndl + 0.2) / 1.2, 0.0);
  float lit = smoothstep(0.0, 0.07, ndl);
  float bands = 0.24 + 0.36 * smoothstep(0.28, 0.34, ndl)
                     + 0.4 * smoothstep(0.65, 0.71, ndl);
  return lit * bands;
}

float studySpec(vec3 n, vec3 light, vec3 eye) {
  vec3 halfVector = light + eye;
  float halfLength = length(halfVector);
  if (halfLength < 1e-5 || dot(n, light) <= 0.0) return 0.0;
  float nh = max(dot(n, halfVector / halfLength), 0.0);
  if (uStudy < 1.5) return pow(nh, 24.0) * 0.045;
  if (uStudy < 2.5) return pow(nh, 18.0) * 0.24 + pow(nh, 72.0) * 0.12;
  return 0.0;
}
`;
