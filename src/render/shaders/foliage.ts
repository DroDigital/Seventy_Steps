/**
 * Round 125, what grows, lit as leaves are (the world shader's FOLIAGE: the material `foliage` of render/propMeshes.ts, the near field's
 * grass): its normals are its crown's (render/floraKit.ts: a leaf faces out of the crown it is part of, not along its own card), so a
 * crown is lit as one soft mass; the moon wraps round it, as light gets in among leaves; seen against the moon, its leaves glow at their
 * edge as the light comes through them; the lantern lights a leaf turned from it a little too. A leaf card is cut out by its texel's
 * cover (render/textureFoliage.ts), by the same ordered dither as the PS1's, so a far crown keeps as much of itself as it covers.
 */

import { FLORA_LIGHT as L } from '../../data/floraTuning';

const f = (x: number): string => x.toFixed(4);

/** The moon on a leaf: wrapped about the crown, and through it when the eye looks toward the moon. */
export const FOLIAGE_VERT = /* glsl */ `
vec3 foliageMoon(vec3 wn, vec3 at) {
  float nl = dot(wn, uLightDir);
  float wrapped = max((nl + ${f(L.wrap)}) / ${f(1 + L.wrap)}, 0.0);
  vec3 look = normalize(at - cameraPosition);
  float through = pow(max(dot(look, uLightDir), 0.0), ${f(L.throughPower)}) * (1.0 - max(nl, 0.0) * 0.6);
  return uLightColor * (wrapped + ${f(L.through)} * through);
}
`;

/** The cut of a leaf card by its texel's cover (1: there; less, in a far mip: dithered), and the lantern's wrapped facing. */
export const FOLIAGE_FRAG = /* glsl */ `
void foliageCut(vec2 uv, vec2 gx, vec2 gy) {
  float cover = textureGrad(uMap, uv, gx, gy).a;
  if (cover > 0.996) return;
  ivec2 cell = ivec2(mod(gl_FragCoord.xy, 4.0));
  if (cover < (BAYER4[cell.x + cell.y * 4] + 0.5) / 16.0) discard;
}
float foliageFacing(vec3 n, vec3 toLamp) {
  return max((dot(n, toLamp) + ${f(L.lanternWrap)}) / ${f(1 + L.lanternWrap)}, 0.0);
}
`;
