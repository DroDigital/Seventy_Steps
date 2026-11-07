/**
 * What a drawn body shares with the world it stands in (round 113; data/bodyLight.ts BODY_MATTER), laid in the sprite shader:
 *   - its depth: each pixel is written as deep as a rounded body's would be (bodyDepth), so a slope, a stair or a wall meets it in a
 *     curve, not the straight cut of a flat card, and the mist, the contact shadow and the fog read it as a body
 *   - a fine grain in each of the great pixels of the forms drawn coarse (the horrors: four texels a metre for Cthulhu against the
 *     ground's thirty-two), at the ground's density, never finer than the screen shows (bodyGrain): the art's colours are not changed
 *   - a far body drawn from the average of what each screen pixel covers, as the ground's mipmaps are, so it does not crawl (bodySample)
 *   - the sea it wades in (below the surface darkened, wavering and the colour of the water, a line of foam where it meets it) and the
 *     snow, mud, sand, grass or leaves its feet sink into (bodyGround)
 *   - the realm's matter (snow, sand, soot) on what of its outline faces up, as the props and the people take it (bodyCoat)
 * Needs, before it: shaders/bodyLight.ts (bodyDx, bodyDy, bodyInside, bodyRim), the noise, `uAtlas`, `vCell`, `vWorld`, `vSize`.
 */

import { BODY_MATTER, SINKS, SINK_COLOURS } from '../../data/bodyLight';

const f = (n: number): string => n.toFixed(4);
const rgb = (c: readonly number[]): string => `vec3(${c.map(f).join(', ')})`;

export const BODY_MATTER_GLSL = /* glsl */ `
uniform mat4 projectionMatrix; // (the vertex stage has it; a pixel needs it for its own depth)
varying vec4 vGround; // the sea's surface (world y; far below: none), metres the ground takes the feet into, what ground (SINKS, from 1), the feet's height
uniform vec3 uCoatCol; // the realm's matter on what faces up (render/coat.ts)
uniform vec4 uCoatA; // how much of what faces up, ..., and the share of it now

/** The atlas at uv as a screen pixel sees it: one texel near, the average of its footprint far (an alpha of 1 or 0 by the share of it that is body). */
vec4 bodySample(vec2 uv) {
  vec2 size = vec2(textureSize(uAtlas, 0));
  vec2 fx = bodyDx * size;
  vec2 fy = bodyDy * size;
  float m = max(length(fx), length(fy));
  if (uReviewed < 0.5 || m < ${f(BODY_MATTER.filterFrom)}) return texture(uAtlas, uv);
  vec3 sum = vec3(0.0);
  float hit = 0.0;
  float n = m < 2.8 ? 2.0 : 3.0;
  for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) {
    if (float(i) >= n || float(j) >= n) continue;
    vec2 o = (vec2(float(i), float(j)) + 0.5) / n - 0.5;
    vec4 t = texture(uAtlas, clamp(uv + (o.x * bodyDx + o.y * bodyDy), vCell.xy, vCell.zw));
    float a = step(0.3, t.a);
    sum += t.rgb * a;
    hit += a;
  }
  return hit > 0.0 ? vec4(sum / hit, step(0.5, hit / (n * n))) : vec4(0.0);
}

/** A fine grain within the great texels of a form drawn coarse, at the ground's density, as far as the screen can show it. */
vec3 bodyGrain(vec3 col, vec2 uv) {
  vec2 size = vec2(textureSize(uAtlas, 0));
  float rows = (vCell.w - vCell.y) * size.y;
  float perMetre = rows / max(vSize.y, 0.01);
  float k = 1.0 - smoothstep(${f(BODY_MATTER.grain.to)}, ${f(BODY_MATTER.grain.from)}, perMetre);
  if (k <= 0.0) return col;
  float perPixel = max(length(bodyDx * size), length(bodyDy * size));
  float sub = min(${f(BODY_MATTER.grain.density)} / perMetre, 0.6 / max(perPixel, 1e-4));
  sub = exp2(floor(log2(max(sub, 1.0)))); // whole halvings, so a grain never straddles two texels
  if (sub < 2.0) return col;
  vec2 q = floor(uv * size * sub);
  float n = (hash12(q + vFx.w * 3.0) - 0.5) * 0.6 + (vnoise(q * 0.41) - 0.5) * 1.1;
  return col * (1.0 + ${f(BODY_MATTER.grain.strength)} * k * n);
}

/** The depth a rounded body's pixel stands at: forward of the picture in the middle of the figure, back at its edges. */
float bodyDepth(vec2 uv) {
  vec2 size = vec2(textureSize(uAtlas, 0));
  vec2 frame = (vCell.zw - vCell.xy) * size;
  float reach = max(2.0, 0.16 * min(frame.x, frame.y));
  float inside = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7854;
    inside += bodyInside(uv + vec2(cos(a), sin(a)) * reach / size);
  }
  float thick = clamp(${f(BODY_MATTER.depth)} * vSize.x, 0.04, ${f(BODY_MATTER.depthMost)});
  vec3 v = (viewMatrix * vec4(vWorld, 1.0)).xyz;
  v += normalize(-v) * thick * (sqrt(inside / 8.0) - 0.5);
  vec4 clip = projectionMatrix * vec4(v, 1.0);
  return clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
}

/** The sink's colour, by index from 1. */
vec3 sinkColour(float k) {
${SINKS.map((s, i) => `  if (k < ${(i + 1.5).toFixed(1)}) return ${rgb(SINK_COLOURS[s])};`).join('\n')}
  return vec3(0.5);
}

/** Whether the pixel shows above the ground it stands in; what the sea and the ground do to its colour. */
bool bodyGround(inout vec3 col, vec3 light) {
  float h = vWorld.y - vGround.w; // metres above its feet
  if (vGround.y > 0.0) {
    float line = vGround.y * (0.65 + 0.7 * vnoise(vec2(vWorld.x + vWorld.z, 0.0) * 9.0));
    if (h < line) return false;
    if (h < line + 0.03) col = mix(col, sinkColour(vGround.z) * light, 0.75);
  }
  float d = vGround.x - vWorld.y; // metres under the sea's surface
  if (d > 0.0) {
    col = mix(col * 0.55, ${rgb(BODY_MATTER.water)} * light * 1.6, smoothstep(0.0, 0.7, d) * 0.75 + 0.15);
    if (d < ${f(BODY_MATTER.foam)} * (0.7 + 0.6 * hash12(floor(vWorld.xz * 24.0) + floor(uTime * 6.0)))) col = mix(col, vec3(0.72, 0.76, 0.78) * light, 0.7);
  }
  return true;
}

/** Wavering, below the sea's surface: where the picture is read from. */
vec2 bodyWaver(vec2 uv) {
  if (vWorld.y >= vGround.x) return uv;
  float texel = 1.0 / float(textureSize(uAtlas, 0).x);
  return vec2(clamp(uv.x + floor(sin(vWorld.y * 26.0 + uTime * 3.5) * 1.5 + 0.5) * texel, vCell.x, vCell.z), uv.y);
}

/** The realm's matter lies on what of the outline faces up. */
vec3 bodyCoat(vec3 col, vec3 light) {
  float up = max(0.0, bodyRim.y) * bodyRim.z;
  float k = up * uCoatA.x * uCoatA.w;
  return k > 0.0 ? mix(col, uCoatCol * light, clamp(k * 1.4, 0.0, 0.85)) : col;
}
`;
