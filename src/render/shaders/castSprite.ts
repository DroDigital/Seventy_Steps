/**
 * A foe's picture as a shadow (round 92; render/silhouetteCasters.ts draws it into the moon's, the lantern's and the lamps' depth
 * maps, after the solids). The picture's own billboard shares its instance buffers (the cell, the flip, the death's texels), but is
 * stood across the light and not across the camera, and leans back from the light until its shadow is as long as the body is tall
 * (render/castPlan.ts: `leanOf`); a texel of the body is written to the map, a texel of nothing is not, so the shadow is the body's
 * own shape, a claw raised in a blow is raised in it, and a body that crumbles crumbles in it. The picture is turned about, left
 * for right, where the light is across the camera's view, through the shape the two have in common (so it never jumps).
 * Round 83's rows that slip, texels that go and double that lags are all kept. Depth only: `colorWrite` is off.
 */

import { CAST } from '../../data/fxTuning';
import { NOISE_GLSL } from './common';
import { SPRITE_FX_GLSL } from './spriteFx';

const f = (n: number): string => n.toFixed(4);

export const CAST_VERT = /* glsl */ `
uniform vec4 uCastLight; // xyz: toward the light (w = 0: the moon), or where it burns (w = 1: the lantern, a lamp)
uniform vec3 uCastRight; // the camera's right, level
uniform float uCastBack; // metres the cut-out stands behind the body, away from the light

attribute vec4 aCell; // u0, v0 (top), u1, v1 (bottom)
attribute vec4 aInfo; // flash, opacity, flip, outside
attribute float aWeird;
attribute vec4 aFx;
attribute vec4 aCast; // casts (0 or 1), how much taller its shadow is, how much broader, the metres its feet stand above the picture's bottom

varying vec2 vUv; // where in the atlas, as the picture is drawn
varying vec2 vUvB; // and as it is turned about
varying float vTurn; // 1: as drawn, 0: turned about
varying vec4 vCell;
varying vec4 vFx;
varying vec4 vWound;
varying vec2 vQuad;
varying vec2 vSize;
varying float vWeird;

void main() {
  vec3 origin = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float w = length(instanceMatrix[0].xyz) * aCast.z;
  float h = length(instanceMatrix[1].xyz) * aCast.y;
  vec3 feet = origin + vec3(0.0, aCast.w, 0.0); // the shadow is larger than the body about its feet, which stay on the ground
  vec3 to = uCastLight.w > 0.5 ? uCastLight.xyz - (feet + vec3(0.0, 0.5 * h, 0.0)) : uCastLight.xyz;
  vec3 dir = normalize(to + vec3(0.0, 1e-4, 0.0));
  vec2 flat2 = dir.xz;
  float fl = length(flat2);
  vec2 f = fl > 1e-3 ? flat2 / fl : vec2(-uCastRight.z, uCastRight.x); // a light overhead stands the cut-out across the camera
  vec3 away = vec3(-f.x, 0.0, -f.y); // level, away from the light
  vec3 side = vec3(f.y, 0.0, -f.x); // level, across it
  float sy = clamp(dir.y, 0.0, 0.999);
  float lean = clamp(asin(sy) - acos(min(1.0, ${f(CAST.stretch)} * sy)), 0.0, ${f(CAST.lean)}); // castPlan.ts: leanOf
  vec3 up = vec3(0.0, cos(lean), 0.0) + away * sin(lean);
  vec3 p = feet + away * uCastBack + side * (position.x * w) + up * (position.y * h - aCast.w * aCast.y);
  p = mix(origin, p, aCast.x); // a body that casts none is a point
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  float u = aInfo.z > 0.5 ? 1.0 - uv.x : uv.x;
  float v = mix(aCell.y, aCell.w, 1.0 - uv.y);
  vUv = vec2(mix(aCell.x, aCell.z, u), v);
  vUvB = vec2(mix(aCell.x, aCell.z, 1.0 - u), v);
  vTurn = smoothstep(${f(-CAST.turn)}, ${f(CAST.turn)}, dot(side, uCastRight)); // castPlan.ts: turnOf
  vCell = aCell;
  vFx = aFx;
  vWound = vec4(0.0);
  vQuad = uv;
  vSize = vec2(w, h);
  vWeird = aWeird;
}
`;

export const CAST_FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uTime;
uniform float uCastMin; // the least opacity of a texel that is body

varying vec2 vUv;
varying vec2 vUvB;
varying float vTurn;
varying vec4 vCell;
varying float vWeird;
${NOISE_GLSL}
${SPRITE_FX_GLSL}

/** The picture's rows that slip, as the sprite's do (shaders/sprite.ts). */
vec2 slip(vec2 uv) {
  float w = vCell.z - vCell.x;
  float band = floor((uv.y - vCell.y) / (vCell.w - vCell.y) * 12.0);
  float beat = floor(uTime * (2.0 + 6.0 * vWeird));
  float on = step(1.0 - 0.2 * vWeird, hash12(vec2(band, beat)));
  uv.x += on * (hash12(vec2(beat, band + 7.0)) - 0.5) * 0.3 * w * vWeird;
  return vec2(clamp(uv.x, vCell.x, vCell.z), uv.y);
}

/** How much of the body is at uv: what the picture shows there (the texels a death has taken are gone, and the double a high horror lags beside itself is body too). */
float bodyAt(vec2 uv) {
  vec2 at = vWeird > 0.2 ? slip(uv) : uv;
  vec3 src = fxSource(at);
  if (src.z < 0.5) return 0.0;
  vec3 col = vec3(0.0);
  if (!fxKeep(src.xy, col)) return 0.0;
  float a = texture(uAtlas, src.xy).a;
  if (vWeird >= 0.6 && a < 0.3) {
    vec2 lag = vec2(clamp(at.x + sin(uTime * 1.3) * 0.08 * (vCell.z - vCell.x), vCell.x, vCell.z), at.y);
    a = texture(uAtlas, lag).a;
  }
  return a;
}

void main() {
  if (mix(bodyAt(vUvB), bodyAt(vUv), vTurn) < uCastMin) discard;
  gl_FragColor = vec4(1.0);
}
`;
