/**
 * A drawn creature's picture goes, forms and wears its wounds by its own texels (round 78; data/creatureFx.ts,
 * render/creatureFx.ts). Nothing of the recorded art is redrawn: in a death or an arrival the texels are
 * taken away (or given back) in an order, each style with its own rim and its own movement of the rest;
 * a wound is the darkness of a wet patch laid over the pixels it falls on, and the flash of a blow is a
 * pool of light about where it fell.
 *   aFx    x how far gone (0 whole .. 1 gone), y the style (1 crumble, 2 burn, 3 melt, 4 shatter, 5 rise),
 *          z how much of its health it has lost, w a seed of its own
 *   aWound x, y where the last blow fell on the picture (0..1 across, 0..1 up), z its flash left, w the metres it reaches
 * Needs `uAtlas`, `vCell` and the noise (shaders/common.ts) before it.
 */

export const SPRITE_FX_GLSL = /* glsl */ `
varying vec4 vFx;
varying vec4 vWound;
varying vec2 vQuad; // across (0..1) and up (0..1) the billboard as the screen sees it, whichever way the picture is turned
varying vec2 vSize; // metres

/** The place in its frame: x across, y down (0 at the top). */
vec2 fxCell(vec2 uv) { return (uv - vCell.xy) / (vCell.zw - vCell.xy); }

/** The texel to show at uv while the body goes or forms: its place moved by the style; z is 0 where the frame holds nothing there. */
vec3 fxSource(vec2 uv) {
  float s = vFx.x;
  if (s <= 0.0) return vec3(uv, 1.0);
  float st = vFx.y;
  vec2 p = fxCell(uv);
  float col = hash12(vec2(floor(uv.x * float(textureSize(uAtlas, 0).x)), 7.0 + vFx.w));
  if (st < 1.5 || st > 4.5) p.y -= s * s * (0.18 + 0.7 * col); // the columns of texels fall (and, the other way about in time, come up out of the ground)
  else if (st > 2.5 && st < 3.5) p.y = 1.0 - (1.0 - p.y) / max(1.0 - 0.78 * s, 0.06); // the body sinks into itself, to the ground
  else if (st > 3.5) p += (vec2(hash12(floor(p * 11.0) + vFx.w), hash12(floor(p * 11.0) + 3.1)) - 0.5) * 0.06 * s; // it comes apart in blocks
  vec2 inside = step(vec2(0.0), p) * step(p, vec2(1.0));
  return vec3(vCell.xy + p * (vCell.zw - vCell.xy), inside.x * inside.y);
}

/** The order the texels go in, 0 (first) to 1 (last): the head first, or the feet, a noise of char, a block at a time. */
float fxOrder(vec2 uv) {
  vec2 px = floor(uv * vec2(textureSize(uAtlas, 0)));
  float h = hash12(px + vFx.w * 17.0);
  float feet = 1.0 - fxCell(uv).y;
  float st = vFx.y;
  if (st < 1.5 || st > 4.5) return 0.55 * (1.0 - feet) + 0.45 * h; // crumble, rise
  if (st < 2.5) return 0.3 * h + 0.55 * vnoise(px * 0.16 + vFx.w * 9.0) + 0.15 * (1.0 - feet); // burn
  if (st < 3.5) return 0.65 * (1.0 - feet) + 0.35 * h; // melt
  return hash12(floor(px / 3.0) + vFx.w * 5.0); // shatter
}

/** False where the texel at uv is gone; at the rim of what is left, the style's own colour (ember, dust, ichor, starlight) lies over col. */
bool fxKeep(vec2 uv, inout vec3 col) {
  float s = vFx.x;
  if (s <= 0.0) return true;
  if (s >= 0.995) return false;
  float o = fxOrder(uv);
  if (o < s) return false;
  float rim = 1.0 - smoothstep(0.0, 0.09, o - s); // 1 at the edge of what is left
  float ahead = 1.0 - smoothstep(0.0, 0.3, o - s); // and the way before it
  float st = vFx.y;
  float flick = 0.7 + 0.3 * hash12(floor(uv * 400.0) + floor(uTime * 14.0));
  if (st < 1.5) col = mix(col, vec3(0.62, 0.58, 0.5) * (0.55 + 0.25 * flick), rim * 0.7); // dust
  else if (st < 2.5) { // embers eat in from the edge, and the char runs ahead of them
    col = mix(col, col * vec3(0.3, 0.26, 0.26), ahead * 0.8);
    col = mix(col, vec3(1.0, 0.5, 0.12) * (0.8 + 0.5 * flick), rim);
  } else if (st < 3.5) col = mix(col * (1.0 - 0.45 * s), vec3(0.04, 0.09, 0.07), rim * 0.8); // ichor
  else if (st < 4.5) col = mix(col, vec3(0.78, 0.86, 1.0) * (0.7 + 0.5 * flick), rim); // starlight
  else col = mix(col, vec3(0.7, 0.76, 0.85), rim * 0.5); // the first of it to be there
  return true;
}

/** The darkness of its wounds on the pixels of its picture, and the flash of the blow just struck (white about where it fell, a fifth of it over the rest). */
vec3 fxWear(vec3 col, float flash) {
  float wear = vFx.z;
  if (wear > 0.0) {
    vec2 px = floor(vUv * vec2(textureSize(uAtlas, 0)));
    float aspect = vSize.x / vSize.y;
    for (int i = 0; i < 5; i++) {
      if (float(i) >= wear * 5.0 + 0.5) break;
      float k = float(i) + vFx.w * 31.0;
      vec2 c = vec2(0.26 + 0.48 * hash12(vec2(k, 1.0)), 0.18 + 0.62 * hash12(vec2(k, 2.0)));
      float r = (0.045 + 0.05 * hash12(vec2(k, 3.0))) * (0.5 + 0.5 * min(1.0, wear * 5.0 - float(i) + 0.5));
      float d = length((vQuad - c) * vec2(aspect, 1.0));
      float m = step(d, r * (0.8 + 0.5 * vnoise(px * 0.8 + k)));
      col = mix(col, col * vec3(0.42, 0.37, 0.4), m * 0.85);
      col += vec3(0.1, 0.11, 0.13) * m * step(0.93, hash12(px + k)); // a glint in the wet
    }
  }
  float f = flash * 0.25;
  if (vWound.z > 0.0) { // a pool of light of three steps about the wound, as the picture's own pixels are
    float d = length((vQuad - vWound.xy) * vSize) / vWound.w;
    f = max(f, vWound.z * min(1.0, step(d, 0.34) + 0.6 * step(d, 0.68) + 0.3 * step(d, 1.0)) * 0.9);
  }
  return mix(col, vec3(1.0, 0.97, 0.92), f);
}
`;
