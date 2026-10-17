/**
 * The sea's waves in the shader (round 30: the sea was a flat plane with a texture sliding over it): the table of `world/seaSurface.ts`, written
 * as GLSL so the shader lifts and lights the same water the simulation and the tentacles stand in. Pure but for the GLSL it writes.
 */

import { AMP_SUM, WAVES, omega, seaHeight, type Wave } from '../world/seaSurface';

export { AMP_SUM, WAVES, seaHeight, type Wave };

const f = (n: number): string => n.toFixed(5);

/** GLSL: `vec3 seaWave(vec2 p)` gives (height, d/dx, d/dz) of the same sum, at `uTime`, before `uChop`. */
export const WAVES_GLSL = /* glsl */ `
vec3 seaWave(vec2 p) {
  vec3 s = vec3(0.0);
${WAVES.map((w) => {
  const k = (2 * Math.PI) / w.length;
  return `  { float phi = ${f(k * Math.cos(w.dir))} * p.x + ${f(k * Math.sin(w.dir))} * p.y + ${f(omega(w))} * uTime + ${f(w.phase)};
    float h = ${f(w.amp)} * exp(sin(phi) - 1.0); float dh = h * cos(phi);
    s += vec3(h, dh * ${f(k * Math.cos(w.dir))}, dh * ${f(k * Math.sin(w.dir))}); }`;
}).join('\n')}
  return s;
}
`;
