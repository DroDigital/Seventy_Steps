/**
 * What the picture's light is finished with (round 39), chunks of the post pass: contact shadow (screen-space
 * ambient occlusion over the scene's depth: a foot, a crease, the base of a wall and the underside of a ledge
 * lose the light a shadow map is too coarse to take), bloom (what shines bleeds a little into what is about it:
 * flames, windows, the lantern) and a vignette. They run at the low-res size, so they are as chunky as the rest.
 */

export const LIGHTING_GLSL = /* glsl */ `
uniform vec3 uAo; // strength, the metres it looks about, the metres from the lens it fades out by
uniform vec4 uBloom; // strength, the brightness it begins at, how soft the start is, the low-res pixels it spreads
uniform float uVig;

// Metres from the lens of what the depth buffer holds at uv.
float viewZ(vec2 uv, float d) {
  vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return -v.z / v.w;
}

// 1 where nothing crowds a point; less where nearer surfaces stand close about it. Eight taps in a turned spiral (the picture's own dither turns them), a near neighbour counting, a far one being another thing.
float contactAo(vec2 uv, float jitter) {
  float d0 = texture(tDepth, uv).x;
  if (d0 >= 0.9999 || uAo.x <= 0.0) return 1.0;
  float z0 = viewZ(uv, d0);
  if (z0 > uAo.z) return 1.0;
  float px = clamp(uAo.y * (0.5 * uRes.y / uProjInv[1][1]) / z0, 1.5, 12.0);
  float occ = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = (float(i) + jitter) * 2.39996;
    float r = (float(i) + 0.5) / 8.0;
    vec2 o = vec2(cos(a), sin(a)) * px * (0.3 + 0.7 * r) / uRes;
    float dz = z0 - viewZ(uv + o, texture(tDepth, uv + o).x);
    occ += smoothstep(0.03, 0.14, dz) * (1.0 - smoothstep(uAo.y * 0.7, uAo.y * 2.4, dz));
  }
  return 1.0 - uAo.x * (occ / 8.0) * (1.0 - smoothstep(0.55 * uAo.z, uAo.z, z0));
}

// The light that spills from what shines: the bright part of the picture, gathered from two rings about a point.
vec3 bloomAt(vec2 uv) {
  if (uBloom.x <= 0.0) return vec3(0.0);
  vec2 px = uBloom.w / uRes;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5236 + (i >= 6 ? 0.26 : 0.0);
    vec2 o = vec2(cos(a), sin(a)) * px * (i < 6 ? 0.5 : 1.0);
    vec3 c = texture(tScene, uv + o).rgb;
    float open = step(texture(tDepth, uv + o).x, 0.99999); // the open sky spills nothing: a star's two rings of taps drew a ring of dots about every star (round 45)
    sum += c * open * smoothstep(uBloom.y, uBloom.y + uBloom.z, dot(c, vec3(0.2126, 0.7152, 0.0722)));
  }
  return sum / 12.0 * uBloom.x;
}

float vignette(vec2 uv) {
  return 1.0 - uVig * smoothstep(0.3, 1.0, length((uv - 0.5) * vec2(1.0, 0.82)) * 1.5);
}
`;
