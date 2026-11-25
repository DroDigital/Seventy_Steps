/**
 * How a far silhouette takes the night (round 117; render/skylineShader.ts includes it, data/farLooks.ts holds its numbers). Its face is lit
 * as the slope over each column leans toward the moon or away (a wall below the eaves facing the eye), with the grain of what it is made of
 * (gullies and strata, a wood's crowns, masonry's courses, sand's ripples, a hide's folds), snow lying where the cold is and the face turns
 * up, and wet stone glinting when the moon stands behind. Its crest's last pixel takes the sky behind it, and a moon behind it rims it.
 * Then the air between is laid over it as the sky's own light toward it (shaders/skyTone.ts), thicker at its foot, with distance and in
 * rain, so a far shape is never lighter than the sky on one side and darker on the other: it melts into the very light behind it. Its veils
 * roll over it with the realm's wind: the bank of mist at its foot and, on the tallest, a belt of cloud, both reaching past its ends.
 */

import { FAR } from '../../data/farLooks';
import { WINK } from '../../data/horizonLife';
import { FX, RENDER } from '../../data/tuning';
import { SKY_TONE_GLSL } from './skyTone';

const F = (n: number, d = 3): string => n.toFixed(d);

/** Metres of far air every far shape lies behind besides its own distance: the realm's near haze over the world's reach (RENDER.far), in the far air's units. */
const EDGE = (FAR.edge * RENDER.far) / FAR.air;

/** How much thicker the far air is as the world's fog closes in (a failing mind: FX.fogFar): 1 while it is where a lucid mind's is, or off. */
export const closingOf = (fogFar: number, fogAmount: number): number => 1 + fogAmount * Math.max(FX.fogFar[0] / Math.max(fogFar, 1) - 1, 0);

/**
 * The share of a far shape the air between takes (2026-11-25; the shader's `airShare`, for the tests): `dist` metres off and `h` over its foot,
 * in a realm of `haze` a metre (data/fogs.ts), the world's fog closing at `fogFar` (`fogAmount`: on), under `overcast` of a closed sky, the
 * silhouette `fade`d and its layer behind `layer` of air. A far shape lies beyond all the land the world draws, so it is never clearer than
 * the near haze leaves that land at its edge, and as the fog closes on a failing mind it closes on the far land too: it was as clear at
 * 1 km as the land at 100 m, crisper than the fogged land before it, and read as near.
 */
export function farAirShare(dist: number, h: number, haze: number, fogFar: number, fogAmount = 1, overcast = 0, fade = 0, layer = 0): number {
  const tau = (dist + EDGE) * haze * FAR.air * closingOf(fogFar, fogAmount) * (1 + FAR.weather * overcast) * (1 + FAR.ground * Math.exp(-Math.max(h, 0) / FAR.groundRise));
  return Math.min(1 - Math.exp(-tau) * (1 - fade) * (1 - layer), FAR.most);
}

export const FAR_UNIFORMS = /* glsl */ `
uniform vec3 uZenith; uniform vec3 uMoonColor; uniform vec3 uMoonDir; uniform float uHaze; uniform vec3 uFogColor; // the sky's own (sky.ts)
uniform vec4 uHour; uniform vec3 uHourGlow; uniform vec3 uHourDawn; uniform float uFlash; uniform float uOver;
uniform vec3 uLightColor; uniform vec3 uAmbient; // the moon's light on the land, and the night's ambient (worldMaterial.ts)
uniform vec3 uMoonRef; // the moon's light this hour in this realm, before the weather and the dark take any (realmLook.ts)
uniform vec2 uSize; // the silhouette in metres, across and up
uniform vec4 uAir; // the far air per metre, how much thicker at its foot, metres that thins over, the closed sky's share now
uniform vec4 uLook; // its grain, snow, the snow's line, wet stone (data/farLooks.ts)
uniform vec4 uMist; // the bank at its foot: how thick, metres it rises; the belt of cloud: how thick, its height share
uniform float uWind; // metres a second the realm's wind carries its veils across it
uniform float uSeed;
uniform vec2 uBand; // the heights (its own share) over which its windows thin out: a town's are mostly in its lower half, a castle's high on its peak
uniform float uWallFoot; // and below which it has no walls (a castle's are on its summit, not down the mountain under it)
uniform vec2 uHandoff; // metres over which a far town's columns give way to the real town nearer than them (0: none)
uniform float uFogFar; uniform float uFogAmount; // the world's fog (worldMaterial.ts): where it closes, and whether it is on
varying vec4 vShape; varying vec3 vView; varying vec3 vMoon; varying float vDist;
`;

export const FAR_GLSL = /* glsl */ `
${SKY_TONE_GLSL}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float vn2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// octaves of noise about -0.5..0.5, those finer than about two pixels let go (px: a pixel in p's units), so a far face never shimmers
float fbmAA(vec2 p, float px) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * (vn2(p) - 0.5) * (1.0 - smoothstep(0.3, 0.6, px));
    p = p * 2.03 + 17.3;
    px *= 2.03;
    a *= 0.5;
  }
  return s;
}
// the light the far air lays over what lies behind it toward d: the sky's own, a closed sky's underside, the lightning in it; under the horizon, the haze the land melts into
vec3 airAt(vec3 d) {
  float rise = max(d.y, 0.0);
  vec3 hours = skyHours(d);
  vec3 sky = skyTone(d) + hours;
  float ov = clamp(uOver * 1.7 - 0.7 * smoothstep(0.0, 0.9, rise), 0.0, 1.0);
  sky = mix(sky, mix(uHorizon, uZenith, 0.4) * 0.57 + hours * 0.7, ov * 0.65);
  sky += vec3(0.8, 0.85, 1.0) * uFlash * ((0.5 + 0.5 * exp(-rise * 3.0)) * (1.0 - 0.6 * ov) + 0.6 * ov);
  return mix(uFogColor, sky, smoothstep(-0.035, 0.015, d.y));
}
// how much of a far thing h metres over its foot the air between takes: its own distance's and the near haze over the world's reach, which it lies beyond, thickened as the world's fog closes in (farAirShare)
float airShare(float h, float layer) {
  float closing = 1.0 + uFogAmount * max(${F(FX.fogFar[0], 1)} / max(uFogFar, 1.0) - 1.0, 0.0);
  float tau = (vDist + ${F(EDGE, 1)}) * uAir.x * closing * (1.0 + ${F(FAR.weather, 2)} * uAir.w) * (1.0 + uAir.y * exp(-max(h, 0.0) / uAir.z));
  return min(1.0 - exp(-tau) * (1.0 - uFade) * (1.0 - layer), ${F(FAR.most, 2)});
}
// a far town gives way, column by column, to the real one the world draws nearer than the far plane
float handoff() { return uHandoff.y > 0.0 ? smoothstep(uHandoff.x, uHandoff.y, vDist) : 1.0; }
float moonNow() { return clamp(luma(uLightColor) / max(luma(uMoonRef), 1e-4), 0.0, 2.5); }

vec4 farOutline() {
  vec2 m = vPos * uSize; // metres across and up the silhouette
  vec2 px2 = max(fwidth(vPos), vec2(1e-6)); // a pixel, in its own units (taken here, outside any branch)
  float pxY = px2.y;
  float pxM = pxY * uSize.y; // a pixel, in metres
  float below = max(vShape.x - vPos.y, 0.0) / pxY; // pixels under its crest
  vec3 L = normalize(vMoon);
  float moonK = moonNow();
  vec3 hue = uLightColor / max(luma(uLightColor), 1e-4);
  bool wall = vPos.y < vShape.z && vPos.y > uWallFoot;
  float sm = clamp(vShape.y * uSize.y / uSize.x, -4.0, 4.0); // the crest's slope over this column, in metres
  vec3 n = wall ? vec3(0.0, 0.12, 1.0) : vec3(-sm * 0.65, 0.6, 1.0);
  float grain = 0.0;
  float tone = 1.0;
  int kind = int(uLook.x + 0.5);
  if (kind == 1) { // rock: gullies running down it, strata across it
    grain = fbmAA(m / vec2(16.0, 70.0), pxM / 16.0);
    n.x += grain * 2.2;
    tone *= 1.0 + 0.35 * fbmAA(vec2(m.x / 60.0, m.y / 7.0), pxM / 7.0);
  } else if (kind == 2) { // a wood: its crowns, speckled
    grain = fbmAA(m / 6.0, pxM / 6.0);
    tone *= 0.8 + 0.9 * grain;
    n.y += grain;
  } else if (kind == 3) { // masonry: its courses and joints, where near enough to see, and its weathering
    vec2 q = m / vec2(5.0, 2.2);
    float joint = min(smoothstep(0.82, 0.95, fract(q.y)) + smoothstep(0.86, 0.97, fract(q.x + 0.5 * floor(q.y))), 1.0);
    tone *= (1.0 - 0.3 * joint * (1.0 - smoothstep(0.4, 0.9, pxM / 2.2))) * (1.0 + 0.3 * fbmAA(m / 30.0, pxM / 30.0));
  } else if (kind == 4) { // sand: the ripples the wind laid
    tone *= 1.0 + 0.25 * sin(m.x / 5.0 + m.y / 1.6 + 3.0 * fbmAA(m / 40.0, pxM / 40.0)) * (1.0 - smoothstep(0.25, 0.6, pxM / 3.0));
  } else if (kind == 5) { // a hide: folds and lumps
    grain = fbmAA(m / vec2(9.0, 14.0), pxM / 9.0);
    n.xy += vec2(1.6, 0.8) * grain;
    tone *= 0.85 + 0.6 * grain;
  }
  n = normalize(n);
  float lit = max(dot(n, L), 0.0) * moonK;
  vec3 col = uColor * tone * (${F(FAR.shade, 2)} + ${F(FAR.lit, 2)} * lit * mix(vec3(1.0), hue, ${F(FAR.hue, 2)}));
  float behind = max(-L.z, 0.0); // the moon stands behind it
  if (uLook.w > 0.0) col += uLightColor * uLook.w * 0.25 * behind * behind * smoothstep(0.1, 0.4, fbmAA(m / vec2(3.0, 18.0), pxM / 3.0) + 0.2) * (wall ? 1.0 : 0.6); // wet stone glints
  vec3 air = airAt(normalize(vView));
  float roof = luma(air) * ${F(FAR.under, 2)}; // it stands darker than the sky behind it (a soft knee, so its light and shade keep their order)
  float knee = roof * ${F(FAR.knee, 2)};
  float l = luma(col);
  if (l > knee) col *= (knee + (roof - knee) * (1.0 - exp(-(l - knee) / max(roof - knee, 1e-5)))) / l;
  if (uLook.y > 0.0) { // snow, above its line, where the face turns up: moonlit snow outshines the night sky, and its fields and the dark rock between them are what a far range is read by
    float line = uLook.z + 0.14 * fbmAA(m / 45.0, pxM / 45.0) + 0.1 * grain;
    float cover = smoothstep(line, line + 0.07, vPos.y) * smoothstep(0.25, 0.62, n.y + 0.4 * grain) * uLook.y;
    vec3 skyRef = mix(uHorizon, uZenith, 0.45) * mix(vec3(1.0), hue, 0.3);
    col = mix(col, skyRef * mix(${F(FAR.snow[0], 2)}, ${F(FAR.snow[1], 2)}, lit / max(moonK, 0.2)) * (0.4 + 0.6 * min(moonK, 1.5)), cover);
  }
  float crest = exp(-below * 1.1);
  col = mix(col, air, crest * ${F(FAR.crest, 2)}); // its crest's last pixel takes the sky behind it
  col += uLightColor * moonK * crest * ${F(FAR.rim, 2)} * pow(behind, 1.5) * smoothstep(-0.2, 0.3, L.y); // and the moon behind it rims it
  float k = airShare(vPos.y * uSize.y, vShape.w);
  col = mix(col, air, k);
  if (uLit > 0.0 && wall) { // its windows, as they were (round 32, 80): a cell of the mass lit by chance, most in its lower half; round 117: only on its walls, so no cap, roof or tree is lit
    vec2 q = vec2(vPos.x * ${F(WINK.cells[0], 1)}, vPos.y * ${F(WINK.cells[1], 1)});
    vec2 cell = floor(q);
    vec2 f = fract(q);
    vec2 big = 1.0 / (px2 * vec2(${F(WINK.cells[0], 1)}, ${F(WINK.cells[1], 1)})); // pixels a cell spans: far off a lit cell is a spark; near, a pane in its frame
    float pane = mix(1.0, step(0.22, f.x) * step(f.x, 0.78) * step(0.2, f.y) * step(f.y, 0.8), smoothstep(2.5, 4.5, min(big.x, big.y)));
    float on = pane * step(1.0 - uLit * smoothstep(0.03, 0.14, vPos.y) * (1.0 - smoothstep(uBand.x, uBand.y, vPos.y)), hash(cell));
    if (on > 0.0) { // its own life (round 80): some are put out for a spell or dim, and as the night wears on the last seeds go out
      float s = hash(cell + 17.31);
      on *= paneLit(s, uWink);
      on *= 1.0 - uNerves * smoothstep(0.35, 0.8, sin(uWink * (6.0 + 9.0 * s) + s * 61.0) * sin(uWink * 2.3 + s * 17.0 + 1.0)); // a failing mind: they strobe, a few at a time
    }
    col = mix(col, uGlow, on * (1.0 - ${F(FAR.windowAir, 2)} * k)); // a lit window shines through the air that greys the stone about it
  }
  float a = uAlpha * handoff() * mix(${F(FAR.footAlpha, 2)}, 1.0, smoothstep(${F(FAR.foot, 2)}, 0.0, vPos.y));
  return vec4(col * a, a);
}

vec4 farVeil() {
  vec2 m = vPos * uSize;
  float ends = smoothstep(0.0, 0.22, vFx.y) * (1.0 - smoothstep(0.78, 1.0, vFx.y));
  float drift = uWink * uWind; // metres the wind has carried it
  vec3 air = airAt(normalize(vView));
  float moonK = moonNow();
  if (vFx.w < 0.5) { // the bank of mist at its foot, its top rolling
    float rise = uMist.y;
    float edge = rise * (0.45 + 0.7 * vn2(vec2((m.x - drift) / (rise * 5.0), uWink * 0.015)) + 0.3 * vn2(vec2((m.x - drift * 1.6) / (rise * 1.7), 3.0)));
    float a = (1.0 - smoothstep(edge * 0.3, edge, m.y)) * ends * uMist.x * uAlpha * handoff() * 0.9;
    vec2 g = vPos / uDome.yz; // and a lit town's own light lies in it
    vec3 lit = uGlow * uDome.x * exp(-g.x * g.x) * exp(-max(g.y, 0.0)) * 0.8;
    return vec4((air * (1.0 + 0.2 * moonK) + lit) * a, a);
  }
  float mid = uMist.w * uSize.y; // a belt of cloud across it: wisps rolling along it, lit from above
  float thick = 0.09 * uSize.y;
  float v = (m.y - mid) / thick;
  float band = exp(-v * v * 1.6);
  float wisp = vn2(vec2((m.x - drift) / (thick * 3.0), v * 0.8 + uWink * 0.01)) * 0.65 + vn2(vec2((m.x - drift * 1.4) / (thick * 1.1), v * 2.0 + 5.0)) * 0.35;
  float a = smoothstep(0.45, 0.85, wisp * band + band * 0.25) * ends * uMist.z * uAlpha;
  vec3 c = mix(uHorizon, uZenith, 0.35) * 0.72 + uLightColor * moonK * (0.03 + 0.08 * smoothstep(-0.5, 1.0, v));
  c = mix(c, air, airShare(mid, 0.0) * 0.8);
  return vec4(c * a, a);
}
`;
