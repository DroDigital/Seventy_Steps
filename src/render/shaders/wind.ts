/**
 * Round 125, the wind in the world shader's SWAY block (data/windTuning.ts; render/windField.ts is its gust on the CPU, the very same
 * sum): a trunk leans down the realm's wind as a gust front reaches it and rings back at its own slow pace, bowed and not stretched;
 * each bough sways on a phase of its own, up and down as well as along; each leaf and blade shivers about its own facing. `aSway` is the
 * lean of a point at a gust's height (metres: nothing at a trunk's foot, the most at its crown); `aWind` is the point's own (its plant's
 * phase, its bough's reach, its flutter, its bough's phase: render/windKit.ts), 0 where a geometry has none.
 */

import { WIND } from '../../data/windTuning';

const f = (x: number): string => x.toFixed(4);
const { front, ripple, swell, mix, ring, across, branch, flutter } = WIND;

export const WIND_GLSL = /* glsl */ `
attribute vec4 aWind; // (plant's phase, bough's reach, flutter, bough's phase), each 0..1 (render/windKit.ts)
uniform vec2 uWindDir; // where the wind blows to, along the ground (render/windField.ts)

// The gust (0..1) at a point of the land: render/windField.ts gustAt, term for term.
float gustField(vec2 p, float t) {
  float along = dot(p, uWindDir);
  float across = dot(p, vec2(-uWindDir.y, uWindDir.x));
  float fr = sin(along * ${f(front.k)} - t * ${f(front.speed)} + sin(across * ${f(front.bend)} + t * ${f(front.bendSpeed)}) * ${f(front.wander)});
  float rp = sin(along * ${f(ripple.k)} - t * ${f(ripple.speed)} + across * ${f(ripple.across)});
  float sw = 0.5 + 0.5 * sin(t * ${f(swell.speed)} + along * ${f(swell.k)});
  return clamp(0.5 + ${f(mix.front)} * fr + ${f(mix.ripple)} * rp, 0.0, 1.0) * (0.55 + 0.45 * sw);
}

// Where the wind has a point of strength (uWind) that leans sway metres at a gust's height, facing n; gust is told back.
vec3 windMove(vec3 p, float sway, vec4 w, vec3 n, float strength, out float gust) {
  vec2 d = uWindDir;
  vec2 side = vec2(-d.y, d.x);
  float t = uTime;
  gust = gustField(p.xz, t);
  float swing = sin(t * ${f(ring.speed[0])} + w.x * 6.2832) * 0.6 + sin(t * ${f(ring.speed[1])} + w.x * 11.0) * 0.4;
  float lean = sway * strength * (${f(WIND.calm)} + ${f(WIND.push)} * gust + ${f(ring.share)} * swing);
  float sideways = sway * strength * ${f(across.share)} * sin(t * ${f(across.speed)} + w.x * 9.0);
  vec3 off = vec3(d.x * lean + side.x * sideways, -lean * lean * ${f(WIND.bow)}, d.y * lean + side.y * sideways);
  if (w.y > 0.0) { // a bough: its own phase, quicker the thinner it is, bobbing as well as swinging
    float reach = w.y * ${f(branch.reach)} * strength * (${f(branch.calm)} + ${f(branch.push)} * gust);
    float ph = t * (${f(branch.speed)} + ${f(branch.spread)} * w.w) + w.w * 6.2832 + w.x * 3.7;
    float bob = sin(ph) * 0.65 + sin(ph * 2.13 + 1.3) * 0.35;
    off += vec3(d.x * (0.5 + 0.5 * gust) + side.x * 0.35 * bob, ${f(branch.lift)} * bob, d.y * (0.5 + 0.5 * gust) + side.y * 0.35 * bob) * reach;
  }
  if (w.z > 0.0) { // a leaf's or a blade's tip: a fast shiver about its own facing
    float fl = w.z * ${f(flutter.reach)} * strength * (${f(flutter.calm)} + gust);
    float ph = t * ${f(flutter.speed)} * (0.8 + 0.4 * w.w) + w.w * 23.0 + dot(p.xz, vec2(1.7, 2.3));
    off += (n * 0.7 + vec3(d.x, 0.25, d.y) * 0.3) * fl * (sin(ph) * 0.7 + sin(ph * 1.73 + 0.5) * 0.3);
  }
  return off;
}
`;
