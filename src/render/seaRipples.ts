/**
 * Rings on the sea (round 55): where a body meets the water, the surface does not take the splash and lie still; rings spread from the place,
 * a front with crests behind it, thinning as they go, with foam on the front while it is young. Eight at a time, each (x, z, the time it began,
 * its strength), written to a uniform the sea's shader reads (render/sea.ts, `rippleRings`).
 */

import * as THREE from 'three';

export const RIPPLE_SLOTS = 8;
export const RIPPLE_LIFE = 6; // seconds a ring lasts
export const RIPPLE_SPEED = 2.6; // m/s the front spreads at

export const RIPPLES = { value: Array.from({ length: RIPPLE_SLOTS }, () => new THREE.Vector4(0, 0, -100, 0)) };
let next = 0;

/** A ring begins at (x, z) at `time` (the sea's clock), `strength` about 1 for a body's splash. The oldest is let go if all are in use. */
export function addRipple(x: number, z: number, time: number, strength: number): void {
  RIPPLES.value[next++ % RIPPLE_SLOTS]!.set(x, z, time, strength);
}

/** GLSL: `vec3 rippleRings(vec2 p, float t)` gives (the rings' gradient in x and z, their foam) at a point of the surface. */
export const RIPPLES_GLSL = /* glsl */ `
uniform vec4 uRipples[${RIPPLE_SLOTS}];
vec3 rippleRings(vec2 p, float t) {
  vec3 r = vec3(0.0);
  for (int i = 0; i < ${RIPPLE_SLOTS}; i++) {
    vec4 q = uRipples[i];
    float age = t - q.z;
    if (age < 0.0 || age > ${RIPPLE_LIFE.toFixed(1)}) continue;
    vec2 d = p - q.xy;
    float dist = length(d);
    float k = dist - age * ${RIPPLE_SPEED.toFixed(1)}; // metres behind the front
    float env = q.w * exp(-age * 0.5) / (1.0 + dist * 0.18);
    float train = sin(k * 4.2) * exp(-abs(k) * 0.5) * step(k, 0.5); // a few crests behind the front, none ahead of it
    r.xy += (d / max(dist, 0.001)) * train * env * 0.55;
    r.z += exp(-k * k * 1.6) * env * smoothstep(2.4, 0.0, age); // foam on the front while it is young
  }
  return r;
}
`;
