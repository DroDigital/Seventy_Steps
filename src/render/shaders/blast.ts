/**
 * Round 116, a blast's wave in the shaders (render/blastWaves.ts writes `uBlasts`, data/groundSkin.ts BLAST its numbers): `blastAt`, how
 * strongly the fronts move what stands at a point now and away from where (the world shader bends the grass, leaves, boughs and cloth by
 * it, shaders/world.ts), and `blastMist`, the share of the low mist the waves leave there: thrown out of the ring behind a front, heaped
 * at it, drifting back (shaders/fog.ts). The CPU's `waveAt` is the same sum. Pure GLSL.
 */

import { BLAST } from '../../data/groundSkin';

const f = (v: number): string => v.toFixed(4);

export const BLAST_GLSL = /* glsl */ `
uniform vec4 uBlasts[${BLAST.slots}]; // each: x, z, when it went off (the shaders' clock), how strong (0: none)

// How strongly the fronts move what stands at p at the time now: xy the push away from their hearts, z its strength.
vec3 blastAt(vec2 p, float now) {
  vec3 o = vec3(0.0);
  for (int i = 0; i < ${BLAST.slots}; i++) {
    vec4 b = uBlasts[i];
    if (b.w <= 0.0) continue;
    float front = (now - b.z) * ${f(BLAST.speed)};
    if (front < 0.0 || front > ${f(BLAST.reach + 2 * BLAST.width)}) continue;
    vec2 d = p - b.xy;
    float r = length(d);
    float x = (r - front) / ${f(BLAST.width)};
    float k = b.w * exp(-x * x) * (1.0 - smoothstep(0.55, 1.0, front / ${f(BLAST.reach)})) / (1.0 + r / ${f(BLAST.near)});
    o += vec3(d / max(r, 0.3) * k, k);
  }
  return o;
}

// The share of the low mist the waves leave at p (1: all of it; more where it is heaped at a front).
float blastMist(vec2 p, float now) {
  float m = 1.0;
  for (int i = 0; i < ${BLAST.slots}; i++) {
    vec4 b = uBlasts[i];
    if (b.w <= 0.0) continue;
    float age = now - b.z;
    if (age < 0.0) continue;
    float front = age * ${f(BLAST.speed)};
    float r = length(p - b.xy);
    float x = (r - front) / ${f(BLAST.width)};
    float behind = 1.0 - smoothstep(front - ${f(2 * BLAST.width)}, front, r);
    float thrown = b.w * ${f(BLAST.clear)} * behind * exp(-age / ${f(BLAST.refill)}) / (1.0 + r / ${f(2 * BLAST.near)});
    float heaped = b.w * ${f(BLAST.heap)} * exp(-x * x) * (1.0 - smoothstep(0.55, 1.0, front / ${f(BLAST.reach)})) / (1.0 + r / ${f(BLAST.near)});
    m *= (1.0 - min(thrown, 0.9)) * (1.0 + heaped);
  }
  return m;
}
`;

/** The world shader's bending (inside its SWAY block, after the wind and the bodies): `wp` the vertex, `aSway` its sway. */
export const BLAST_BEND_GLSL = /* glsl */ `
  vec3 blast = blastAt(wp.xz, uTime);
  if (blast.z > 0.001) { // round 116: a blast's front bends what sways away from its heart as it passes, and lays the grass down for the moment
    vec2 bend = blast.xy * aSway * ${f(BLAST.bend)};
    float bent = length(bend);
    wp.xz += bend * min(1.0, ${f(BLAST.most)} / max(bent, 1e-4));
    if (aSway > 0.002 && aSway < 0.12) wp.y -= aSway * 6.25 * ${f(BLAST.flatten)} * min(blast.z, 1.0);
  }
`;
