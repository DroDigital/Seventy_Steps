/**
 * The far silhouettes' shader (render/skyline.ts; round 80 gave it its life, render/horizonGlow.ts; round 117 its form and its air,
 * shaders/skylineFar.ts). One mesh draws, in the order of its triangles, the glow over a town (kind 1 of `aFx`: light added to the sky), the
 * outline's columns, its back layer first (kind 0: a form in the night's light, melted into the sky behind it, with its windows), its veils
 * (kind 3: the bank of mist at its foot, a belt of cloud) and a turning lamp's flash and shaft (kind 2: light added). The blend is
 * premultiplied, so the outline covers what is behind it, a veil lies over it in part and the glow and the lamp add to it. The windows are
 * panes in rows on its walls, lit by chance; they follow the night and wink as the near windows do (paneLife.ts), the last seeds going out
 * first; a failing mind sees them flicker.
 */

import { BEAM } from '../data/horizonLife';
import { PANE_GLSL } from './paneLife';
import { FAR_PLACE_GLSL } from './shaders/farPlace';
import { FAR_GLSL, FAR_UNIFORMS } from './shaders/skylineFar';

export const SKYLINE_VERT = /* glsl */ `
attribute vec4 aFx; // kind (0 the outline, 1 the glow over a town, 2 a lamp, 3 a veil), then the quad's own coordinates, and a veil's type
attribute vec4 aShape; // the outline's: the crest over its column, the crest's slope, its walls' height, the air its layer lies behind
uniform vec2 uLampBox; // a lamp quad's half width and height, in metres
uniform vec2 uPer; // the silhouette's own units to a metre, across and up, × its distance over 98 m (a lamp is as large on the sky as it ever was)
uniform vec3 uLightDir; // toward the moon (worldMaterial.ts)
varying vec2 vPos;
varying vec4 vFx;
varying vec4 vShape;
varying vec3 vView; // from the eye toward it, in the world
varying vec3 vMoon; // the moon in its own frame: across it, up, toward the eye
varying float vDist; // metres to it, across the ground (round 117: each part of a wide one is as far as it truly is)
${FAR_PLACE_GLSL}
void main() {
  vec3 p = position;
  vPos = p.xy;
  vFx = aFx;
  vShape = aShape;
  if (abs(aFx.x - 2.0) < 0.5) p.xy += aFx.yz * uLampBox * uPer; // the lamp is the same size on the sky whatever the silhouette's
  vec4 world = farPlace(modelMatrix * vec4(p, 1.0)); // where it truly stands (round 117: shaders/farPlace.ts)
  vView = world.xyz - cameraPosition;
  vDist = length(vView.xz);
  vec3 l = normalize(uLightDir);
  vMoon = vec3(dot(l, normalize(modelMatrix[0].xyz)), l.y, dot(l, normalize(modelMatrix[2].xyz)));
  gl_Position = farClip(world);
}`;

export const SKYLINE_FRAG = /* glsl */ `
uniform vec3 uColor; uniform vec3 uHorizon; uniform vec3 uGlow; uniform float uFade; uniform float uAlpha; uniform float uLit;
uniform float uWink; // the game's seconds, for the windows and the veils
uniform float uNerves; // 0..1: how far the mind has gone
uniform vec3 uDome; // the glow over a town: its strength now, how far it spreads across and up (silhouette units)
uniform vec4 uLamp; // a turning lamp: the flash, which side the shaft stands to and how far, how bright the shaft is
uniform vec3 uLampCol;
varying vec2 vPos; varying vec4 vFx;
${FAR_UNIFORMS}
${PANE_GLSL}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
${FAR_GLSL}
void main() {
  if (vFx.x > 2.5) { // a veil: the bank of mist at its foot, a belt of cloud
    gl_FragColor = farVeil();
    return;
  }
  if (vFx.x > 1.5) { // the lamp: its pilot light, the flash as the beam comes round, the shaft it leaves in the haze to one side
    vec2 m = vFx.yz * vec2(${BEAM.box[0].toFixed(1)}, ${BEAM.box[1].toFixed(1)}); // the quad is drawn as large as the lamp is (uLampBox), but what is drawn in it is the same
    float r2 = dot(m, m);
    float i = ${BEAM.pilot.toFixed(2)} * exp(-r2 / 0.45) + uLamp.x * ${BEAM.flash.toFixed(2)} * (exp(-r2 / 2.6) + 0.45 * exp(-r2 / 16.0));
    float side = uLamp.y < 0.0 ? -1.0 : 1.0;
    float along = m.x * side;
    float len = abs(uLamp.y) * ${BEAM.reach.toFixed(1)};
    float shaft = step(0.0, along) * smoothstep(0.6, 3.0, along) * (1.0 - smoothstep(0.35 * len, len, along)) * smoothstep(0.0, 2.0, len) * exp(-m.y * m.y / ${(BEAM.thick * BEAM.thick).toFixed(3)});
    i += shaft * uLamp.z;
    gl_FragColor = vec4(uLampCol * i * uAlpha, 0.0); // (the lamp comes and goes with its realm's far land, as the outline and the glow do)
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
  gl_FragColor = farOutline();
}`;
