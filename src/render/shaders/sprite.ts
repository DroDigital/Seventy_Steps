/**
 * Creature billboards (spec §2): instanced quads that turn about the vertical axis to face the
 * camera, Doom-style, sampling the sprite atlas. They share the world's vertex snapping, light
 * (ambient, moon and lantern, without normals) and fog. Atlas alpha marks lit pixels (1) and
 * self-lit pixels (glow markings ~0.63, eye glints ~0.82); transparency is dithered. Self-lit eyes and
 * markings fade into the dark beyond a short distance, so a creature is not spotted from afar by its
 * eyes. Output alpha can mark (the Colour Out of Space) a hue outside the palette that the post pass
 * leaves alone (see post.ts). The higher a creature stands in the Mythos, the less its body holds
 * together: rows slip, its darkest parts open onto a starry void, a faint double lags beside it.
 */

import { VOID_GLSL } from './eldritch';
import { LAMPS_GLSL, LANTERN_GLSL, NOISE_GLSL } from './common';
import { SHADOW_GLSL } from './shadow';
import { SPRITE_FX_GLSL } from './spriteFx';
import { SPRITE_GRADE_GLSL } from './spriteGrade';

export const SPRITE_VERT = /* glsl */ `
uniform vec2 uRes;
uniform float uSnap;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uLightDir; // toward the moon

attribute vec4 aCell; // u0, v0 (top), u1, v1 (bottom)
attribute vec4 aInfo; // flash, opacity, flip, outside the palette
attribute float aWeird; // 0..1: how far it refuses to hold its shape (eldritch.ts)
attribute vec4 aFx; // how far gone, in what style, how worn, a seed (spriteFx.ts)
attribute vec4 aWound; // where the last blow fell, its flash, its reach
attribute vec4 aGlint; // the colour of the marks of this form that keep their light in the dark, and how far
attribute vec4 aTone; // the form's recolour to the realm it stands in: a turn of hue (cos, sin), a lift of colour, a cast for a grey (render/spriteTone.ts)

varying vec2 vUv;
varying vec3 vWorld; // where this corner is: the light is laid at each pixel (round 78: it was found at the four corners and carried across, so the lantern's pool never climbed a colossus's legs and a lamp's light was the same ramp from foot to head)
varying vec2 vShade; // what stands between it and the moon, and the lantern, at its middle
varying float vFog;
varying float vDist;
varying float vFlash;
varying float vOpacity;
varying float vOutside;
varying float vWeird;
varying vec4 vCell;
varying vec4 vFx;
varying vec4 vWound;
varying vec4 vGlint;
varying vec4 vTone;
varying vec2 vQuad;
varying vec2 vSize;
${LANTERN_GLSL}
${SHADOW_GLSL}
void main() {
  vec3 origin = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float w = length(instanceMatrix[0].xyz);
  float h = length(instanceMatrix[1].xyz);
  vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
  vec3 wp = origin + right * position.x * w + vec3(0.0, position.y * h, 0.0);
  vec4 vp = viewMatrix * vec4(wp, 1.0);
  vec4 clip = projectionMatrix * vp;
  if (uSnap > 0.0 && clip.w > 0.0) { // the quad as a whole, by where it stands (round 78: its four corners were each snapped, so as it moved its size, and which of its texel rows were two pixels tall, crawled)
    vec4 foot = projectionMatrix * (viewMatrix * vec4(origin, 1.0));
    vec2 grid = uRes * 0.5 / uSnap;
    clip.xy += floor(foot.xy / foot.w * grid + 0.5) / grid * foot.w - foot.xy;
  }
  gl_Position = clip;
  float u = aInfo.z > 0.5 ? 1.0 - uv.x : uv.x;
  vUv = vec2(mix(aCell.x, aCell.z, u), mix(aCell.y, aCell.w, 1.0 - uv.y));
  float moon = mix(1.0, moonLit(origin + vec3(0.0, 0.8, 0.0) + normalize(uLightDir) * (0.32 * w + 0.3), vec3(0.0, 1.0, 0.0), 1.0), uShadow.x); // what stands between it and the moon (round 34), at a point out toward it from the creature's middle: its own body (render/creatureCasters.ts) stands in the way of the middle itself
  float lamp = mix(1.0, lanternLit(origin + vec3(0.0, 0.8, 0.0), vec3(0.0, 1.0, 0.0)), uLShadow.x) * lanternSlab(origin + vec3(0.0, 0.8, 0.0)); // and the lantern's, the seat back of a rig among them
  vWorld = wp;
  vShade = vec2(moon, lamp);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  vDist = -vp.z;
  vFlash = aInfo.x;
  vOpacity = aInfo.y;
  vOutside = aInfo.w;
  vWeird = aWeird;
  vCell = aCell;
  vFx = aFx;
  vWound = aWound;
  vGlint = aGlint;
  vTone = aTone.z > 0.01 ? aTone : vec4(1.0, 0.0, 1.0, 0.0); // (a form with none is drawn as it is)
  vQuad = uv;
  vSize = vec2(w, h);
}
`;

export const SPRITE_FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform float uReviewed; // authored PNG alpha is transparency, never a glow marker
uniform vec3 uFogColor;
uniform float uFogAmount;
uniform float uMarkCharacters;
uniform float uTime;
uniform vec2 uEyeRange; // metres over which self-lit eyes and markings sink into the dark
uniform vec3 uAmbient;
uniform vec3 uLightColor;
uniform float uCharacterLight;
uniform float uMind; // 0..1: how far a failing mind slips what it sees
uniform float uWet; // how soaked the world is, 0..1 (weather.ts)

varying vec2 vUv;
varying vec3 vWorld;
varying vec2 vShade;
varying float vFog;
varying float vDist;
varying float vFlash;
varying float vOpacity;
varying float vOutside;
varying float vWeird;
varying vec4 vCell;
varying vec4 vGlint;
varying vec4 vTone;
${LANTERN_GLSL}
${LAMPS_GLSL}
${NOISE_GLSL}
${VOID_GLSL}
${SPRITE_GRADE_GLSL}
${SPRITE_FX_GLSL}

float bayer4(vec2 p) {
  const float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}

/** Rows of a body that will not hold its shape slip sideways now and then (the higher, the more often). */
vec2 slip(vec2 uv) {
  float w = vCell.z - vCell.x;
  float band = floor((uv.y - vCell.y) / (vCell.w - vCell.y) * 12.0);
  float beat = floor(uTime * (2.0 + 6.0 * vWeird));
  float on = step(1.0 - 0.2 * vWeird, hash12(vec2(band, beat)));
  uv.x += on * (hash12(vec2(beat, band + 7.0)) - 0.5) * 0.3 * w * vWeird;
  return vec2(clamp(uv.x, vCell.x, vCell.z), uv.y);
}

/** A failing mind sees a creature's rows slide a texel or two now and then, never more, and always whole texels (so nothing shimmers): the more, the less it holds. */
vec2 mindSlip(vec2 uv) {
  float rows = floor((uv.y - vCell.y) / (vCell.w - vCell.y) * 8.0);
  float beat = floor(uTime * (1.2 + 2.4 * uMind) + vFx.w * 13.0);
  float on = step(1.0 - 0.14 * uMind, hash12(vec2(rows + vFx.w * 31.0, beat)));
  float shift = clamp(floor((hash12(vec2(beat + 3.0, rows)) - 0.5) * (2.0 + 3.0 * uMind) + 0.5), -2.0, 2.0);
  return vec2(clamp(uv.x + on * shift / float(textureSize(uAtlas, 0).x), vCell.x, vCell.z), uv.y);
}

void main() {
  vec2 uv = vWeird > 0.2 ? slip(vUv) : (uMind > 0.0 && uReviewed > 0.5 ? mindSlip(vUv) : vUv);
  vec3 src = fxSource(uv); // a body that is going or forming has its texels moved (spriteFx.ts)
  if (src.z < 0.5) discard;
  vec4 t = texture(uAtlas, src.xy);
  if (vWeird >= 0.6 && t.a < 0.3) { // a faint double of it, lagging to one side
    vec2 lag = vec2(clamp(uv.x + sin(uTime * 1.3) * 0.08 * (vCell.z - vCell.x), vCell.x, vCell.z), uv.y);
    if (texture(uAtlas, lag).a < 0.3 || 0.3 * vOpacity < bayer4(gl_FragCoord.xy)) discard;
    gl_FragColor = vec4(mix(voidAt(gl_FragCoord.xy, uTime) + vec3(0.12, 0.0, 0.18), uFogColor, vFog * uFogAmount), 1.0);
    return;
  }
  if (t.a < 0.3 || vOpacity * (uReviewed > 0.5 ? t.a : 1.0) < bayer4(gl_FragCoord.xy)) discard;
  bool glow = uReviewed < 0.5 && t.a < 0.9;
  vec3 light = uAmbient + (uLightColor * vShade.x + uLanternColor * lanternAt(uLanternPos - vWorld) * vShade.y + lampLight(vWorld, vec3(0.0, 1.0, 0.0), 0.0)) * uCharacterLight; // the world's own light, here (round 78)
  vec3 col = glow ? t.rgb : t.rgb * light;
  if (uReviewed > 0.5) col = spriteGraded(col, vTone); // the realm's colours on the older art, brightness kept (round 78: spriteGrade.ts)
  if (!glow && uWet > 0.02) col = mix(col, col * col, 0.35 * uWet); // soaked by the rain: darker in its mid-tones, deeper in its colour, the hide and cloth heavy with water (round 78)
  if (vWeird >= 0.5 && !glow) col = mix(col, voidAt(gl_FragCoord.xy, uTime), smoothstep(0.24, 0.12, dot(t.rgb, vec3(0.3333))) * vWeird); // its darkest parts open onto nothing
  col = fxWear(col, vFlash); // its wounds, and the flash of the blow about where it fell
  if (vGlint.w > 0.0) { // the marks this form's eyes and lamps are drawn in keep their light in the dark, in the colour they were drawn in, until the eye can no longer pick them out (round 78: reviewedLook.ts)
    float lit = 1.0 - smoothstep(0.012, 0.05, distance(t.rgb, vGlint.rgb));
    col = mix(col, t.rgb * (1.0 + 0.25 * vGlint.w), lit * (1.0 - smoothstep(uEyeRange.x, uEyeRange.y, vDist)));
  }
  if (!fxKeep(src.xy, col)) discard; // and the texels that are gone, with their rim
  float fog = vFog * uFogAmount;
  if (vOutside > 0.5 && uReviewed < 0.5) {
    // A colour no palette holds: every hue at once, crawling over it, bright wherever it is lit.
    vec3 hue = 0.5 + 0.5 * cos(6.2832 * (uTime * 0.23 + dot(t.rgb, vec3(1.7, -0.9, 0.6)) + vec3(0.0, 0.33, 0.67)));
    gl_FragColor = vec4(hue * (0.55 + 0.45 * dot(col, vec3(0.3333))), uMarkCharacters > 0.5 ? 0.31 : 1.0);
    return;
  }
  if (glow) fog = max(fog, smoothstep(uEyeRange.x, uEyeRange.y, vDist));
  gl_FragColor = vec4(mix(col, uFogColor, fog), uMarkCharacters > 0.5 ? 0.75 : 1.0); // alpha 0.75 marks a character for the post pass, which lets it keep its colour (round 34)
}
`;
