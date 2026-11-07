/**
 * The light on a drawn body (round 113; data/bodyLight.ts), laid at each of its pixels as the world's own is:
 *   - its shadows: what stands between each pixel and the moon, and the lantern, so a branch's, an eave's or another body's shadow falls
 *     across it and half of it can stand in a wall's shadow (it took one sample at its middle; its feet still take that one, standing in
 *     their own body's shadow: BODY_LIGHT.shadowFoot)
 *   - which side of it a light is on: the face the camera sees is darker for a light behind it, so a horror between the lens and the
 *     moon or a lamp stands dark against the lit mist; nothing is brightened at its edge (no rim: XDro turned one down three times)
 *   - its shape: the edge of the painted figure turned from its light falls a little into shade, as a rounded body's would; only darker
 *   - the ground's light thrown up onto its lower part, in the realm's colour, and the sky's on its top
 * Needs, before it: the world's light (LANTERN_GLSL, LAMPS_GLSL, SHADOW_GLSL), `uAtlas`, `vCell`, `vUv`, `vWorld`, `vQuad`, `vShade`, and
 * `creatureWarmth` (shaders/sprite.ts).
 */

import { BODY_LIGHT } from '../../data/bodyLight';

const f = (n: number): string => n.toFixed(4);

export const BODY_LIGHT_GLSL = /* glsl */ `
uniform vec4 uBodyLight; // side, shape, bounce, sky (data/bodyLight.ts)

float bodyLantern; // the lantern's light on this pixel, after its shadow (read again for the colours it shows: shaders/sprite.ts)

/** How much of a light from L reaches the face of a body that looks along face: whole in front, least straight behind, a high light reaching the top whatever its side. */
float bodyFacing(vec3 face, vec3 L) {
  return clamp(0.5 + 0.5 * dot(face, L) + 0.35 * max(L.y, 0.0), 0.0, 1.0);
}

/** How much of the body is at uv in its frame (0 beyond it). */
float bodyInside(vec2 uv) {
  if (uv.x < vCell.x || uv.x > vCell.z || uv.y < vCell.y || uv.y > vCell.w) return 0.0;
  return step(0.3, texture(uAtlas, uv).a);
}

/** The way out of the body at uv on the screen (x right, y up), and how near its edge it is (0 deep inside). */
vec3 bodyEdge(vec2 uv) {
  vec2 dx = vec2(dFdx(vUv.x), dFdy(vUv.x));
  vec2 dy = vec2(dFdx(vUv.y), dFdy(vUv.y));
  vec2 texel = 1.0 / vec2(textureSize(uAtlas, 0));
  vec2 sx = vec2(sign(dx.x + 1e-9) * texel.x, 0.0) * ${f(BODY_LIGHT.shapeReach)}; // one way across the screen, in the atlas
  vec2 sy = vec2(0.0, sign(dy.y + 1e-9) * texel.y) * ${f(BODY_LIGHT.shapeReach)}; // (the atlas runs down as the screen runs up)
  float r = bodyInside(uv + sx) + 0.5 * bodyInside(uv + 0.5 * sx);
  float l = bodyInside(uv - sx) + 0.5 * bodyInside(uv - 0.5 * sx);
  float d = bodyInside(uv + sy) + 0.5 * bodyInside(uv + 0.5 * sy);
  float u = bodyInside(uv - sy) + 0.5 * bodyInside(uv - 0.5 * sy);
  vec2 out2 = vec2(l - r, u - d) / 1.5; // toward where the body is not (d: the body above, u: below)
  return vec3(length(out2) > 1e-3 ? normalize(out2) : vec2(0.0), clamp(length(out2), 0.0, 1.0));
}

/** The light on the body at this pixel (uv its texel), its warmth from the lantern and lamps as a creature takes it. */
vec3 bodyLightAt(vec2 uv, bool glow) {
  vec3 face = vec3(cameraPosition.x - vWorld.x, 0.0, cameraPosition.z - vWorld.z);
  face = length(face) > 1e-4 ? normalize(face) : vec3(0.0, 0.0, 1.0);
  float up = clamp(vQuad.y, 0.0, 1.0);
  float own = smoothstep(${f(BODY_LIGHT.shadowFoot[0])}, ${f(BODY_LIGHT.shadowFoot[1])}, up);
  vec3 L = normalize(uLightDir);
  vec2 toMoon = length(L.xz) > 1e-3 ? normalize(L.xz) : vec2(1.0, 0.0);
  float moon = mix(vShade.x, mix(1.0, moonLit(vWorld + vec3(toMoon.x, 0.0, toMoon.y) * 0.25, L, 1.0), uShadow.x), own);
  vec3 toLamp = uLanternPos - vWorld;
  vec3 Ll = normalize(toLamp + vec3(0.0, 1e-4, 0.0));
  float lamp = mix(vShade.y, mix(1.0, lanternLit(vWorld + Ll * 0.2, Ll), uLShadow.x) * lanternSlab(vWorld), own);
  float side = uBodyLight.x;
  bodyLantern = lanternAt(toLamp) * lamp * mix(1.0, bodyFacing(face, Ll), side);
  vec3 moonLight = uLightColor * moon * mix(1.0, bodyFacing(face, L), side);
  vec3 lamps = lampLight(vWorld, face, side * 0.8);
  vec3 sky = uAmbient * (1.0 + uBodyLight.w * (2.0 * up - 1.0));
  vec3 feet = vec3(vWorld.x, vWorld.y - (vSize.y * up), vWorld.z); // the ground under it, about
  vec3 ground = normalize(mix(uSpriteTints[1], uSpriteTints[2], 0.5) + 1e-3) * 0.577;
  vec3 lit = uLightColor * vShade.x * max(L.y, 0.0) + uLanternColor * lanternAt(uLanternPos - feet) + lampLight(feet, vec3(0.0, 1.0, 0.0), 1.0);
  vec3 bounce = ground * dot(lit, vec3(0.3333)) * uBodyLight.z * (1.0 - smoothstep(0.0, 0.45, up));
  vec3 light = sky + (moonLight + creatureWarmth(uLanternColor * bodyLantern + lamps) + bounce) * uCharacterLight;
  if (!glow && uBodyLight.y > 0.0) { // the body's own shape: its edge turned from the light falls into shade
    vec3 e = bodyEdge(uv);
    vec3 lv = mat3(viewMatrix) * (L * dot(uLightColor * moon, vec3(0.3333)) + Ll * dot(uLanternColor * bodyLantern, vec3(0.3333)));
    vec2 ls = length(lv.xy) > 1e-4 ? normalize(lv.xy) : vec2(0.0);
    float away = max(0.0, -dot(e.xy, ls));
    light *= 1.0 - uBodyLight.y * e.z * away;
  }
  return light;
}
`;
