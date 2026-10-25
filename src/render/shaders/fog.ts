/**
 * Volumetric fog (playtest round 16), a chunk of the post pass: each pixel's ray is marched from the
 * lens to what it struck (the scene's depth) or FOG.far metres, through a low mist that pools about the
 * investigator's ground and clears above it, gathered in drifts of slow noise carried by the wind, and
 * a thin haze that reaches the lamps' height. Round 23: the mist is grey, with a hint of its realm,
 * brighter in the moon's quarter of the sky (as the sky's own haze is), and low, so the sky and the
 * upper parts of things keep their dark; the picture was washed all over in an olive haze before. The
 * world's own lights, the lantern and the nearest lamps, glow in it, each in closed form along the
 * whole ray (a few samples would miss a lamp's halo). The march's start is jittered by the picture's
 * own ordered dither, which hides the steps. Round 80: the moon's shafts cut into it (fogShaft.ts), a window's glow
 * poured outward and a lamp's let hang, and its fine wisps and its banks moved on their own (volumetricFog.ts).
 */

import { LIVING } from '../../data/mistLight';
import { SHAFT_GLSL } from './fogShaft';
import { LAMP_SLOTS, WINDOW_LIGHT_GLSL } from './common';

const FINE = { c: Math.cos(LIVING.fine.turn).toFixed(4), s: Math.sin(LIVING.fine.turn).toFixed(4), speed: LIVING.fine.speed.toFixed(3) };

export const FOG_GLSL = /* glsl */ `
uniform sampler2D tDepth;
uniform mat4 uProjInv;
uniform mat4 uCamWorld;
uniform vec3 uCamPos;
uniform vec4 uFog; // the low mist: density per metre at the ground (0: none), metres it thins over, the ground's height, patchiness
uniform vec4 uFogAir; // the thin haze: density per metre, metres it thins over; how much brighter the mist is in the moon's quarter (0..1); how far its banks swell and thin as they roll (round 80)
uniform vec3 uFogColor; // the mist's own tint
uniform vec3 uMoonDir; // toward the moon
uniform vec3 uFogDrift; // how far the wind has carried it (x, z metres), and time
uniform float uFogFar; // metres the march reaches
uniform vec2 uFogStart; // metres from the lens where the mist begins to gather, and where it is whole: the ground about the investigator stays crisp
uniform float uFogLantern; // how strongly the investigator's own lantern shines in it (the lamps' is uFogGlow)
uniform float uFogGlow; // how strongly the lights shine in it
uniform vec3 uLanternPos;
uniform vec3 uLanternColor;
uniform float uLanternRange;
uniform float uLanternDecay;
uniform vec4 uLamps[${LAMP_SLOTS}];
uniform vec3 uLampColors[${LAMP_SLOTS}];
${WINDOW_LIGHT_GLSL}
uniform vec4 uLampAim[${LAMP_SLOTS}]; // where each light throws its glow (round 80): a unit direction, and how sharply it holds to it (0: all round)
${SHAFT_GLSL}

float fogHash(vec3 i) {
  i = mod(i, 289.0);
  return fract(sin(dot(i, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
}

float fogNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(fogHash(i), fogHash(i + vec3(1.0, 0.0, 0.0)), f.x);
  float b = mix(fogHash(i + vec3(0.0, 1.0, 0.0)), fogHash(i + vec3(1.0, 1.0, 0.0)), f.x);
  float c = mix(fogHash(i + vec3(0.0, 0.0, 1.0)), fogHash(i + vec3(1.0, 0.0, 1.0)), f.x);
  float d = mix(fogHash(i + vec3(0.0, 1.0, 1.0)), fogHash(i + vec3(1.0, 1.0, 1.0)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}

float fogDensity(vec3 p) {
  float up = max(p.y - uFog.z, 0.0);
  float low = uFog.x * exp(-up / uFog.y);
  if (low > 1e-4) {
    vec2 wind = vec2(uFogDrift.x, uFogDrift.y);
    vec3 q = (p - vec3(wind.x, 0.0, wind.y)) * 0.085 + vec3(0.0, uFogDrift.z * 0.015, 0.0);
    // Round 80: the fine wisps are carried quicker than the banks and a little across them, so the mist shears and flows and is not one sheet sliding.
    vec2 fast = vec2(wind.x * ${FINE.c} - wind.y * ${FINE.s}, wind.x * ${FINE.s} + wind.y * ${FINE.c}) * ${FINE.speed};
    vec3 q2 = ((p - vec3(fast.x, 0.0, fast.y)) * 0.085 + vec3(0.0, uFogDrift.z * 0.015, 0.0)) * 2.6 + 7.3;
    float n = fogNoise(q) * 0.62 + fogNoise(q2) * 0.38;
    low *= mix(1.0, smoothstep(0.28, 0.78, n) * 1.8, uFog.w);
    // ...and over minutes whole banks thicken and thin as they roll across the land (a few sines, no noise to pay for).
    low *= 1.0 + uFogAir.w * 0.8 * sin(dot(p.xz, vec2(0.021, 0.014)) + uFogDrift.z * 0.05 + 1.7 * sin(dot(p.xz, vec2(-0.011, 0.019)) - uFogDrift.z * 0.031));
  }
  return low + uFogAir.x * exp(-up / uFogAir.y);
}

// The mist's own light toward a direction: its tint, and more of it in the moon's quarter, less in the far one.
vec3 fogTint(vec3 dir) {
  float side = 0.5 + 0.5 * dot(normalize(dir.xz + vec2(1e-4)), normalize(uMoonDir.xz + vec2(1e-4)));
  return uFogColor * mix(1.0, 0.75 + 0.65 * side * side, uFogAir.z);
}

// The glow a light at c (colour col, reach range) casts into the mist along the ray o + d·t, t in
// [0, len], in closed form: the integral of 1 / (1 + k·r²) along the line, windowed to its reach,
// weighed by the mist's thickness at the ray's nearest point and dimmed by the mist before it. Round 80: aim (a direction and a
// sharpness) lets a window pour its light outward and a lamp's hang downward, by where the ray's nearest point lies from the light.
vec3 glowAlong(vec3 o, vec3 d, float len, vec3 c, vec3 col, float range, float k, vec4 aim, vec4 plane) {
  vec3 oc = c - o;
  float t0 = dot(oc, d);
  float h2 = max(dot(oc, oc) - t0 * t0, 0.0);
  if (h2 >= range * range) return vec3(0.0);
  float s0 = max(-t0, -range);
  float s1 = min(len - t0, range);
  // Only the ray in front of a window's glass gathers its glow. Other lights have a zero plane.
  float side = dot(plane.xyz, o) + plane.w;
  float slope = dot(plane.xyz, d);
  if (abs(slope) < 1e-5) {
    if (side < 0.0) return vec3(0.0);
  } else {
    float crossing = -side / slope - t0;
    if (slope > 0.0) s0 = max(s0, crossing);
    else s1 = min(s1, crossing);
  }
  if (s1 <= s0) return vec3(0.0);
  float a = 1.0 + k * h2;
  float q = sqrt(k / a);
  float along = (atan(s1 * q) - atan(s0 * q)) / sqrt(k * a);
  vec3 near = o + d * clamp(t0, 0.0, len);
  float up = max(near.y - uFog.z, 0.0);
  float thick = uFog.x * exp(-up / uFog.y) + uFogAir.x * exp(-up / uFogAir.y);
  float cone = 1.0;
  if (aim.w > 0.0) {
    vec3 off = near - c;
    cone = mix(1.0, smoothstep(-0.15, 0.85, dot(normalize(off + vec3(1e-4)), aim.xyz)), aim.w * smoothstep(0.2, 1.2, length(off)));
  }
  return col * cone * along * thick * (1.0 - h2 / (range * range)) * exp(-(uFogAir.x + uFog.x * 0.2) * 0.6 * clamp(t0, 0.0, len));
}

// rgb: the light the mist adds along the ray; a: the share of what lies behind that shows through.
vec4 fogAlong(vec2 uv, float jitter) {
  if (uFog.x <= 0.0) return vec4(0.0, 0.0, 0.0, 1.0);
  vec4 view = uProjInv * vec4(uv * 2.0 - 1.0, texture(tDepth, uv).x * 2.0 - 1.0, 1.0);
  vec3 ray = (uCamWorld * vec4(view.xyz / view.w, 1.0)).xyz - uCamPos;
  float len = length(ray);
  vec3 dir = ray / max(len, 1e-4);
  float reach = min(len, uFogFar);
  float stepLen = reach / float(FOG_STEPS);
  float t = stepLen * jitter;
  float through = 1.0;
  vec3 tint = fogTint(dir);
  vec3 light = vec3(0.0);
  vec3 lightNear = vec3(0.0); // the part of it within the moon's shadows' reach (round 80)
  bool shafts = uShaft.x > 0.0 && uShadow.x > 0.0;
  float shaftReach = shafts ? uShaft.z : 0.0;
  for (int i = 0; i < FOG_STEPS; i++) {
    float s = fogDensity(uCamPos + dir * t) * smoothstep(uFogStart.x, uFogStart.y, t);
    if (s > 1e-4) {
      float keep = exp(-s * stepLen);
      vec3 add = through * (1.0 - keep) * tint; // the mist's own light
      light += add;
      if (t < shaftReach) lightNear += add;
      through *= keep;
    }
    t += stepLen;
  }
  if (shafts) light += lightNear * (max(1.0 + uShaft.x * shaftAlong(dir, len, jitter), 0.08) - 1.0); // round 80: the moon's shafts and the shadows behind what stands in them (the mist in a shadow keeps a little of its light, never less than none)
  float k = uLanternDecay * 2.0;
  light += glowAlong(uCamPos, dir, len, uLanternPos, uLanternColor * uFogLantern, uLanternRange * 1.2, k, vec4(0.0), vec4(0.0));
  for (int i = 0; i < ${LAMP_SLOTS}; i++) {
    vec4 l = uLamps[i];
    if (l.w > 0.0) light += glowAlong(uCamPos, dir, len, l.xyz, uLampColors[i] * uFogGlow, l.w, k, uLampAim[i], uLampPlane[i]);
  }
  return vec4(light, through);
}
`;
