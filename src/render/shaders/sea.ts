/**
 * The sea's shaders (round 30; made over in round 55). Lifted by the waves of `world/seaSurface.ts` and lit by what is above it: the sky at the glancing
 * angle (a mirror, by Schlick's fresnel), the moon in a path of glitter that sparkles, the lamps and the lantern on the swell near them, the world
 * itself mirrored through the ripples. New in round 55: it knows its own depth (the seabed's window, `world/seabedWindow.ts`), and so is a pale
 * turquoise where the light reaches the bottom and goes through the greens to the black of the deep, thins to nothing where it meets the shore
 * (the bed shows through), washes up the shore in foam that advances and slips back, with a lace left behind it in the shallows; and the rain
 * pocks it with rings, a body that meets it throws rings (render/seaRipples.ts), and the shallows are calmer than the open sea. Colours are display
 * sRGB, as everything; the sea is dark, as ever. Render only.
 */

import { WORLD } from '../../data/tuning';
import { AMP_SUM, WAVES_GLSL } from '../seaWaves';
import { RIPPLES_GLSL } from '../seaRipples';
import { LAMPS_GLSL, LAMP_SLOTS, LANTERN_GLSL, NOISE_GLSL, SPACE_GLSL } from './world';

export const SEA_VERT = /* glsl */ `
${SPACE_GLSL}
uniform float uChop;
uniform float uSeaLevel;
uniform float uFogNear;
uniform float uFogFar;
${WAVES_GLSL}
varying vec3 vWorld;
varying vec3 vN;
varying float vHigh; // 0..1: how near a crest
varying float vFog;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 w = seaWave(wp.xz);
  float mean = 0.5 * ${(AMP_SUM * 0.35).toFixed(5)};
  wp.y = uSeaLevel + (w.x - mean) * uChop;
  vN = normalize(vec3(-w.y * uChop, 1.0, -w.z * uChop));
  vHigh = clamp(w.x / ${AMP_SUM.toFixed(5)} * 1.7, 0.0, 1.0);
  vWorld = wp.xyz;
  wp.xyz = displace(wp.xyz);
  vec4 vp = viewMatrix * wp;
  gl_Position = snap(projectionMatrix * vp);
  vFog = clamp((-vp.z - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
}
`;

export const SEA_FRAG = /* glsl */ `
uniform vec3 uCamPos;
uniform vec3 uLightDir;
uniform vec3 uLightColor;
uniform vec3 uAmbient;
uniform vec3 uFogColor;
uniform float uFogAmount;
uniform float uTime;
uniform float uChop;
uniform float uWet; // how soaked the world is: the rain on the sea
uniform sampler2D uReflect; // the scene mirrored in the sea (reflection.ts; round 35)
uniform sampler2D uSeaMask;
uniform vec4 uSeaMaskBounds; // world XZ origin and size of the dungeon room mask
uniform sampler2D uSeabed; // the seabed's heights about the investigator (render/seabed.ts; round 55)
uniform vec4 uSeabedWin; // its window: the world cell it begins at (x, z), its size in cells, a cell's size in metres
uniform float uSeabedOn;
uniform float uReflectOn;
uniform vec2 uRes;
varying vec3 vWorld;
varying vec3 vN;
varying float vHigh;
varying float vFog;
${LANTERN_GLSL}
${LAMPS_GLSL}
${NOISE_GLSL}
${RIPPLES_GLSL}

// The seabed's height at a point: bilinear over the window's cells, the sea floor outside it.
float bedTexel(vec2 i) {
  vec2 inside = step(uSeabedWin.xy, i) * step(i, uSeabedWin.xy + uSeabedWin.z - 1.0);
  float h = texelFetch(uSeabed, ivec2(mod(i, vec2(uSeabedWin.z))), 0).r;
  return mix(${WORLD.seaFloor.toFixed(1)}, h, inside.x * inside.y);
}
float bedAt(vec2 p) {
  vec2 u = p / uSeabedWin.w - 0.5;
  vec2 i = floor(u);
  vec2 f = u - i;
  return mix(mix(bedTexel(i), bedTexel(i + vec2(1.0, 0.0)), f.x), mix(bedTexel(i + vec2(0.0, 1.0)), bedTexel(i + vec2(1.0, 1.0)), f.x), f.y);
}

// Small ripples, two layers sliding across each other, as a gradient: the wind on the swell.
vec2 ripple(vec2 p, float t) {
  vec2 a = p * 0.9 + vec2(t * 0.35, t * 0.21);
  vec2 b = p * 2.3 + vec2(-t * 0.5, t * 0.43);
  float e = 0.35;
  vec2 ga = vec2(vnoise(a + vec2(e, 0.0)) - vnoise(a - vec2(e, 0.0)), vnoise(a + vec2(0.0, e)) - vnoise(a - vec2(0.0, e)));
  vec2 gb = vec2(vnoise(b + vec2(e, 0.0)) - vnoise(b - vec2(e, 0.0)), vnoise(b + vec2(0.0, e)) - vnoise(b - vec2(0.0, e)));
  return ga * 0.5 + gb * 0.3;
}

// Rain on the water: rings that open in cells, each in its own time, here and there, and fade.
vec3 rainRings(vec2 p, float t) {
  vec3 acc = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    vec2 q = p * (layer == 0 ? 1.35 : 2.2) + float(layer) * 17.3;
    vec2 cell = floor(q);
    float h = hash12(cell);
    float period = 0.8 + h * 1.2;
    float turn = floor(t / period + h * 7.1);
    float age = fract(t / period + h * 7.1);
    float on = step(0.4, hash12(cell * 1.7 + turn));
    vec2 centre = cell + 0.2 + 0.6 * vec2(hash12(cell + turn * 3.1), hash12(cell * 2.3 + turn * 5.3));
    vec2 d = q - centre;
    float dist = length(d);
    float ring = exp(-pow((dist - age * 0.85) * 8.0, 2.0)) * (1.0 - age) * on;
    acc += vec3(d / max(dist, 0.001) * ring * 0.9, ring);
  }
  return acc;
}

void main() {
  vec2 roomUv = (vWorld.xz - uSeaMaskBounds.xy) / uSeaMaskBounds.zw;
  if (all(greaterThanEqual(roomUv, vec2(0.0))) && all(lessThan(roomUv, vec2(1.0))) && texture(uSeaMask, roomUv).r > 0.5) discard;
  vec3 view = uCamPos - vWorld;
  float dist = length(view);
  vec3 v = view / max(dist, 0.001);
  float near = 1.0 - smoothstep(14.0, 60.0, dist); // ripples are a near thing: far off they would only shimmer at this resolution
  float depth = uSeabedOn > 0.5 ? max(vWorld.y - bedAt(vWorld.xz), 0.0) : 8.0; // metres of water here: the window of the seabed's heights
  float calm = mix(0.5, 1.0, smoothstep(0.0, 1.6, depth)); // the shallows are quieter than the open sea
  vec2 r = ripple(vWorld.xz, uTime) * (0.28 + 0.2 * uChop) * near * calm;
  vec3 rings = rippleRings(vWorld.xz, uTime); // where a body has met the water (round 55)
  vec3 rain = uWet > 0.04 ? rainRings(vWorld.xz, uTime) * smoothstep(0.04, 0.5, uWet) * near : vec3(0.0); // and where the rain has
  vec3 n = normalize(vN + vec3(r.x + rings.x + rain.x * 0.5, 0.0, r.y + rings.y + rain.y * 0.5));
  float cosv = max(dot(n, v), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - cosv, 5.0); // water's own: from above it is deep and dark; at a glance it is a mirror

  // What it mirrors: the horizon's haze, deepening overhead; the moon, as a path that sparkles.
  vec3 rd = reflect(-v, n);
  vec3 horizon = uFogColor * 1.5 + uAmbient * 0.6;
  vec3 zenith = uFogColor * 0.25 + uAmbient * 0.5;
  vec3 sky = mix(horizon, zenith, pow(clamp(rd.y, 0.0, 1.0), 0.45));
  float toMoon = max(dot(rd, normalize(uLightDir)), 0.0);
  float sparkle = 0.45 + 1.1 * smoothstep(0.42, 0.78, vnoise(vWorld.xz * 5.5 + vec2(uTime * 0.6, -uTime * 0.4))) * near + 0.5 * (1.0 - near);
  vec3 moon = uLightColor * (pow(toMoon, 260.0) * 3.2 * sparkle + pow(toMoon, 22.0) * 0.28);
  vec3 mirror = sky * 1.25 + moon;
  if (uReflectOn > 0.5) { // the world itself, turned over, through the ripples (the picture is drawn from a camera mirrored in the surface)
    vec2 suv = gl_FragCoord.xy / uRes;
    vec2 ruv = vec2(suv.x, 1.0 - suv.y) + (n.xz - vN.xz) * vec2(0.5, 0.9) + vN.xz * vec2(0.03, 0.05);
    vec3 world = texture(uReflect, clamp(ruv, vec2(0.002), vec2(0.998))).rgb;
    mirror = mix(mirror, world * vec3(0.62, 0.72, 0.74) + moon, 0.94); // the water takes a little of it, and gives the moon its glitter
  }

  // The body of the water, by its depth: where the light reaches the bottom it is pale and green, deeper it takes the red, then the green, and is black.
  float slope = 0.5 + 0.5 * dot(n, normalize(uLightDir)); // the swell's faces turned to the moon are lit, those turned away dark
  vec3 deep = vec3(0.028, 0.055, 0.062) + uAmbient * vec3(0.16, 0.26, 0.26);
  vec3 shallow = vec3(0.05, 0.15, 0.14) + uAmbient * vec3(0.3, 0.5, 0.46) + uLightColor * vec3(0.04, 0.12, 0.1) * slope;
  vec3 water = mix(shallow, deep, 1.0 - exp(-depth * 0.36));
  vec3 body = water * (0.3 + 1.5 * slope) * (0.75 + 0.6 * vHigh) + uLightColor * vec3(0.05, 0.1, 0.09) * slope * slope + vec3(0.02, 0.06, 0.05) * pow(1.0 - cosv, 2.0) * vHigh; // a crest lets light through
  // The lamps and the lantern in the water: long glitter, drawn out toward the eye along the swell.
  vec3 glint = vec3(0.0);
  for (int i = 0; i < ${LAMP_SLOTS}; i++) {
    vec4 l = uLamps[i];
    if (l.w <= 0.0) continue;
    vec3 toL = l.xyz - vWorld;
    float dl = length(toL);
    glint += uLampColors[i] * windowLight(i, vWorld) * pow(max(dot(rd, toL / max(dl, 0.001)), 0.0), 140.0) * 2.2 / (1.0 + 0.012 * dl * dl);
  }
  vec3 toLantern = uLanternPos - vWorld;
  glint += uLanternColor * pow(max(dot(rd, normalize(toLantern)), 0.0), 120.0) * 1.2 / (1.0 + 0.03 * dot(toLantern, toLantern));
  vec3 lamp = lampLight(vWorld, n, 0.0) * 0.45 + uLanternColor * lanternFalloff(length(uLanternPos - vWorld)) * 0.5;
  vec3 col = mix(body, mirror, fres) + lamp * (0.25 + 0.75 * fres) * vec3(0.9, 0.95, 0.95) + glint * (0.35 + 0.65 * fres);

  // Foam: white where a crest breaks, torn into lace by noise that drifts with the swell...
  float lace = vnoise(vWorld.xz * 1.1 + vec2(uTime * 0.25, -uTime * 0.18)) * 0.6 + vnoise(vWorld.xz * 3.1 - uTime * 0.4) * 0.4;
  float streak = vnoise(vec2(dot(vWorld.xz, vec2(0.94, 0.34)) * 0.42, dot(vWorld.xz, vec2(-0.34, 0.94)) * 1.9 + uTime * 0.12)); // drawn out along the crests, not in blotches
  float foam = smoothstep(0.82 - 0.1 * (uChop - 1.0), 1.0, vHigh + 0.3 * (lace - 0.5)) * smoothstep(0.52, 0.78, streak) * near;
  // ...and where the water meets the shore: it runs up and slips back, a wash of foam at its edge and a lace of it left in the shallows behind.
  if (uSeabedOn > 0.5) {
    float surge = 0.18 + 0.14 * sin(uTime * 0.7 + vWorld.x * 0.11 + vWorld.z * 0.07) + 0.05 * sin(uTime * 1.7 + vWorld.z * 0.3);
    float shoreLace = vnoise(vWorld.xz * 2.4 + vec2(uTime * 0.2, 0.0)) * 0.6 + vnoise(vWorld.xz * 7.0 - uTime * 0.35) * 0.4;
    foam = max(foam, (1.0 - smoothstep(surge, surge + 0.34, depth)) * smoothstep(0.3, 0.7, shoreLace));
    foam = max(foam, (1.0 - smoothstep(surge + 0.5, surge + 1.5, depth)) * smoothstep(0.64, 0.86, shoreLace) * 0.5);
  }
  foam = max(foam, max(rings.z, rain.z * 0.5) * 0.9); // the splash's rings, and the rain's
  vec3 white = (uAmbient * 1.6 + uLightColor * 0.4 + lamp) * vec3(0.7, 0.76, 0.74);
  col = mix(col, white, clamp(foam, 0.0, 0.72));

  // Thinner in the shallows, where the bed shows through, and nothing at the waterline itself.
  float edge = smoothstep(0.0, 0.16, depth);
  float see = mix(0.34, 1.0, smoothstep(0.1, 1.7, depth));
  float alpha = uSeabedOn > 0.5 ? clamp(max(max(see, fres), clamp(foam, 0.0, 0.72) * 0.9) * edge, 0.0, 1.0) : 1.0;
  gl_FragColor = vec4(mix(col, uFogColor, vFog * uFogAmount), alpha);
}
`;
