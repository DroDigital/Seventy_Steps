/**
 * The shaders of the horrors' presences (render/bossAuras.ts, data/bossAuras.ts). Round 115: nothing drawn
 * as a line: a soft haze behind the body (a low mist, or a pall), and motes that move by the horror's tale.
 */

export const HAZE_KIND = { none: 0, low: 1, pall: 2 } as const;
export const MOTION_KIND = { rise: 0, fall: 1, orbit: 2, still: 3, drift: 4, spiral: 5, peel: 6, stream: 7 } as const;
export const SHAPE_KIND = { bubble: 0, drop: 1, wisp: 2, scrap: 3, globe: 4, speck: 5, spore: 6 } as const;

const NOISE = /* glsl */ `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), f.x), f.y);
}
float fbm(vec2 p) { return noise2(p) * 0.6 + noise2(p * 2.1 + 7.3) * 0.3 + noise2(p * 4.3 - 2.9) * 0.1; }`;

export const HAZE_VERT = /* glsl */ `
uniform float uFogNear; uniform float uFogFar;
varying vec2 vUv; varying float vFog;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFog = clamp((-mv.z - uFogNear) / max(0.001, uFogFar - uFogNear), 0.0, 1.0);
  gl_Position = projectionMatrix * mv;
}`;

export const HAZE_FRAG = /* glsl */ `
uniform float uTime; uniform float uHaze; uniform float uAlpha; uniform float uFogAmount;
uniform vec3 uColor; uniform vec3 uFogColor;
varying vec2 vUv; varying float vFog;
${NOISE}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float t = uTime, a;
  if (uHaze < 1.5) { // a low mist about the feet, thinning upward and at its sides
    float n = fbm(vec2(p.x * 2.2 + t * 0.06, vUv.y * 3.0 - t * 0.05));
    float body = (1.0 - smoothstep(0.05, 0.95, vUv.y)) * smoothstep(0.0, 0.12, vUv.y);
    a = body * (1.0 - smoothstep(0.45, 1.0, abs(p.x))) * smoothstep(0.35, 0.85, n) * 0.5;
  } else { // a pall: the dark closing softly about the whole body, never with an edge
    float r = length(p * vec2(1.0, 0.85));
    float n = fbm(p * 1.8 + vec2(t * 0.03, -t * 0.05));
    a = (1.0 - smoothstep(0.2, 1.0, r)) * (0.55 + 0.45 * n) * 0.6;
  }
  vec3 col = mix(uColor, uFogColor, vFog * uFogAmount * 0.8);
  gl_FragColor = vec4(col, clamp(a * uAlpha, 0.0, 0.4));
}`;

export const MOTE_VERT = /* glsl */ `
attribute float aSeed; uniform float uTime; uniform float uMotion; uniform float uHeight; uniform float uRadius;
uniform float uSize; uniform float uTop; uniform float uGrow; uniform vec2 uWind;
uniform vec2 uRes; uniform float uFogNear; uniform float uFogFar;
varying float vFade; varying float vSeed; varying float vFog; varying float vSpin;
void main() {
  float s = aSeed, t = uTime, H = uHeight, R = uRadius;
  float c = fract(s * 7.13 + t * (0.06 + 0.04 * fract(s * 17.0)));
  float a = s * 43.9823 + t * (0.1 + 0.08 * fract(s * 19.0));
  float r = R * (0.6 + 0.5 * fract(s * 31.0));
  float h = fract(s * 13.7);
  float grow = 1.0;
  vec3 p;
  vFade = sin(3.14159 * c);
  vSpin = 0.0;
  if (uMotion < 0.5) { // rise
    float sway = sin(c * 7.0 + s * 40.0) * 0.12 * R;
    p = vec3(cos(a) * r + sway, H * uTop * c, sin(a) * r);
    grow += uGrow * c;
  } else if (uMotion < 1.5) { // fall: let go from the body, sinking a little outward
    float a0 = s * 43.9823;
    float rr = r * (0.7 + 0.3 * c);
    float y = H * uTop * (0.35 + 0.65 * h) * (1.0 - c);
    p = vec3(cos(a0) * rr + sin(c * 5.0 + s * 30.0) * 0.06 * R, y, sin(a0) * rr);
    vFade = smoothstep(0.0, 0.12, c) * (1.0 - smoothstep(0.85, 1.0, c));
  } else if (uMotion < 2.5) { // orbit, slow, crossing before and behind
    p = vec3(cos(a) * r * 1.1, H * (0.15 + uTop * 0.75 * (0.5 + 0.5 * sin(a * 0.6 + s * 20.0))), sin(a) * r * 1.1);
    vFade = 0.5 + 0.5 * sin(s * 21.0 + t * 0.4);
  } else if (uMotion < 3.5) { // still: each where it hangs, only appearing and fading
    float a0 = s * 43.9823;
    p = vec3(cos(a0) * r * 1.15, H * uTop * (0.08 + 0.9 * h), sin(a0) * r * 1.15);
    float w = sin(3.14159 * fract(s * 3.1 + t * 0.05));
    vFade = w * w;
  } else if (uMotion < 4.5) { // drift: torn off and carried down the wind, turning
    float a0 = s * 43.9823;
    vec3 from = vec3(cos(a0) * r * 0.6, H * uTop * (0.35 + 0.6 * h), sin(a0) * r * 0.5);
    p = from + vec3(uWind.x, 0.0, uWind.y) * (c * R * 2.4) + vec3(0.0, sin(c * 6.0 + s * 9.0) * H * 0.03 + c * H * 0.06, 0.0);
    vSpin = s * 6.28 + t * (0.8 + fract(s * 5.0));
  } else if (uMotion < 5.5) { // spiral: round and in
    float rr = R * (0.3 + 1.1 * (1.0 - c));
    float aa = a + c * 4.0;
    p = vec3(cos(aa) * rr, H * mix(0.1 + 0.8 * h, 0.5, c * 0.6) * uTop, sin(aa) * rr);
  } else if (uMotion < 6.5) { // peel: off the body and up, swelling
    float a0 = s * 43.9823 + t * 0.05;
    p = vec3(cos(a0) * r * 0.55, H * uTop * (0.25 + 0.6 * h + 0.5 * c), sin(a0) * r * 0.5);
    p.xz += uWind * c * R * 0.4;
    vFade = sin(3.14159 * c) * (1.0 - 0.5 * c);
    grow += uGrow * c;
  } else { // stream: drawn in from the ground about it and up into the sky
    float rr = R * (1.3 - 0.9 * c);
    p = vec3(cos(a) * rr, H * uTop * c, sin(a) * rr);
    grow += uGrow * c;
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float size = H * uSize * (0.6 + 0.8 * fract(s * 29.0)) * grow;
  gl_PointSize = clamp(size * uRes.y * projectionMatrix[1][1] * 0.5 / max(0.1, -mv.z), 1.0, 48.0);
  gl_Position = projectionMatrix * mv;
  vSeed = s;
  vFog = clamp((-mv.z - uFogNear) / max(0.001, uFogFar - uFogNear), 0.0, 1.0);
}`;

export const MOTE_FRAG = /* glsl */ `
uniform float uShape; uniform float uAlpha; uniform float uFogAmount; uniform float uIris; uniform float uTime;
uniform vec3 uColor; uniform vec3 uAccent;
varying float vFade; varying float vSeed; varying float vFog; varying float vSpin;
${NOISE}
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d = length(q), shape;
  if (uShape < 0.5) { // bubble: a thin lit skin
    shape = (1.0 - smoothstep(0.06, 0.22, abs(d - 0.7))) * 0.7 + (1.0 - smoothstep(0.0, 0.7, d)) * 0.08;
  } else if (uShape < 1.5) { // drop: a bead drawn long by its fall
    float e = length(vec2(q.x * 2.6, q.y * 0.95));
    shape = 1.0 - smoothstep(0.25, 0.9, e);
  } else if (uShape < 2.5) { // wisp: a soft breath, broken
    float n = noise2(q * 2.5 + vSeed * 40.0);
    shape = (1.0 - smoothstep(0.0, 1.0, d)) * (1.0 - smoothstep(0.0, 1.0, d)) * (0.55 + 0.45 * n);
  } else if (uShape < 3.5) { // scrap: a torn rag, turning
    float c = cos(vSpin), s = sin(vSpin);
    vec2 r = mat2(c, -s, s, c) * q;
    float rag = (1.0 - smoothstep(0.42, 0.62, abs(r.x))) * (1.0 - smoothstep(0.14, 0.3, abs(r.y + 0.1 * sin(r.x * 6.0))));
    shape = rag * step(0.25, hash(floor(r * 5.0) + vSeed * 13.0));
  } else if (uShape < 4.5) { // globe: a sphere, its rim catching the light
    float body = 1.0 - smoothstep(0.85, 1.0, d);
    shape = body * (0.15 + 0.55 * smoothstep(0.45, 0.95, d)) + (1.0 - smoothstep(0.0, 0.25, length(q - vec2(-0.3, -0.35)))) * 0.25 * body;
  } else if (uShape < 5.5) { // speck
    float k = 1.0 - smoothstep(0.0, 0.75, d);
    shape = k * k;
  } else { // spore: a soft seed with a faint halo
    shape = (1.0 - smoothstep(0.0, 0.35, d)) * 0.8 + (1.0 - smoothstep(0.35, 1.0, d)) * 0.15;
  }
  vec3 col = mix(uColor, uAccent, 0.35 + 0.65 * fract(vSeed * 23.0));
  vec3 iris = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + vSeed * 3.0 + uTime * 0.04));
  col = mix(col, iris * (0.35 + 0.65 * max(col.r, max(col.g, col.b))), uIris);
  float alpha = uAlpha * vFade * shape * (1.0 - vFog * uFogAmount);
  gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.5));
}`;
