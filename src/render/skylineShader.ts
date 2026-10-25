/**
 * The far silhouettes' shader (render/skyline.ts; round 78 gave it its life, render/horizonGlow.ts). One mesh draws, in the order of its
 * triangles, the glow over a town (kind 1 of `aFx`: light added to the sky), the outline with its windows (kind 0: the realm's colour, melted
 * toward the horizon's) and a turning lamp's flash and shaft (kind 2: light added). The blend is premultiplied, so the outline covers what is
 * behind it and the glow and the lamp add to it. The windows are cells of the mass, lit by chance; they follow the night and wink as the near
 * windows do (paneLife.ts), the last seeds going out first; a failing mind sees them flicker.
 */

import { BEAM, WINK } from '../data/horizonLife';
import { SKY } from '../data/tuning';
import { PANE_GLSL } from './paneLife';

export const SKYLINE_VERT = /* glsl */ `
attribute vec4 aFx; // kind (0 the outline, 1 the glow over a town, 2 a lamp), then the quad's own coordinates
uniform vec2 uLampBox; // a lamp quad's half width and height, in metres
uniform vec2 uPer; // the silhouette's own units to a metre, across and up (it is scaled by the distance it is drawn at)
varying float vUp;
varying vec2 vPos;
varying vec4 vFx;
void main() {
  vec3 p = position;
  vUp = p.y;
  vPos = p.xy;
  vFx = aFx;
  if (aFx.x > 1.5) p.xy += aFx.yz * uLampBox * uPer; // the lamp is the same size on the sky whatever the silhouette's
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

export const SKYLINE_FRAG = /* glsl */ `
uniform vec3 uColor; uniform vec3 uHorizon; uniform vec3 uGlow; uniform float uFade; uniform float uAlpha; uniform float uLit;
uniform float uWink; // the game's seconds, for the windows
uniform float uNerves; // 0..1: how far the mind has gone
uniform vec3 uDome; // the glow over a town: its strength now, how far it spreads across and up (silhouette units)
uniform vec4 uLamp; // a turning lamp: the flash, which side the shaft stands to and how far, how bright the shaft is
uniform vec3 uLampCol;
varying float vUp; varying vec2 vPos; varying vec4 vFx;
${PANE_GLSL}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  if (vFx.x > 1.5) { // the lamp: its pilot light, the flash as the beam comes round, the shaft it leaves in the haze to one side
    vec2 m = vFx.yz * vec2(${BEAM.box[0].toFixed(1)}, ${BEAM.box[1].toFixed(1)}); // the quad is drawn as large as the lamp is (uLampBox), but what is drawn in it is the same
    float r2 = dot(m, m);
    float i = ${BEAM.pilot.toFixed(2)} * exp(-r2 / 0.45) + uLamp.x * ${BEAM.flash.toFixed(2)} * (exp(-r2 / 2.6) + 0.45 * exp(-r2 / 16.0));
    float side = uLamp.y < 0.0 ? -1.0 : 1.0;
    float along = m.x * side;
    float len = abs(uLamp.y) * ${BEAM.reach.toFixed(1)};
    float shaft = step(0.0, along) * smoothstep(0.6, 3.0, along) * (1.0 - smoothstep(0.35 * len, len, along)) * smoothstep(0.0, 2.0, len) * exp(-m.y * m.y / ${(BEAM.thick * BEAM.thick).toFixed(3)});
    i += shaft * uLamp.z;
    gl_FragColor = vec4(uLampCol * i, 0.0);
    return;
  }
  if (vFx.x > 0.5) { // the glow over a town: widest and brightest at its roofs, rising and thinning, light only (an additive blend through the premultiplied one)
    float x = vPos.x / uDome.y;
    float across = exp(-x * x);
    float up = exp(-max(vPos.y, 0.0) / uDome.z) * smoothstep(-0.3, 0.0, vPos.y);
    float edge = smoothstep(0.0, 0.12, vFx.y) * (1.0 - smoothstep(0.88, 1.0, vFx.y)) * (1.0 - smoothstep(0.7, 1.0, vFx.z));
    gl_FragColor = vec4(uGlow * (uDome.x * across * up * edge), 0.0);
    return;
  }
  vec3 col = mix(uColor, uHorizon, uFade);
  float a = uAlpha * mix(0.12, 1.0, smoothstep(-0.05, ${SKY.farFoot.toFixed(3)}, vUp));
  if (uLit > 0.0) { // a window is a cell of the mass, lit by chance, most of them in its lower half
    vec2 cell = floor(vec2(vPos.x * ${WINK.cells[0].toFixed(1)}, vPos.y * ${WINK.cells[1].toFixed(1)}));
    float on = step(1.0 - uLit * smoothstep(0.03, 0.14, vUp) * (1.0 - smoothstep(0.3, 0.85, vUp)), hash(cell));
    if (on > 0.0) { // its own life (round 78): some are put out for a spell or dim, and as the night wears on the last seeds go out
      float s = hash(cell + 17.31);
      on *= paneLit(s, uWink);
      on *= 1.0 - uNerves * smoothstep(0.35, 0.8, sin(uWink * (6.0 + 9.0 * s) + s * 61.0) * sin(uWink * 2.3 + s * 17.0 + 1.0)); // a failing mind: they strobe, a few at a time
    }
    col = mix(col, uGlow, on);
    a = mix(a, uAlpha, on);
  }
  gl_FragColor = vec4(col * a, a);
}`;
