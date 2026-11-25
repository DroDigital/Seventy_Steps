/**
 * Boss fog curtain shaders (2026-11-24; split from bossFog.ts to keep files focused and under 300 lines):
 * - Backward-compatible `FOG_VERT`, `fogFrag` and `fogMaterial` kept for render/demoMist.ts.
 * - Multi-layer volumetric `BOSS_FOG_VERT` / `BOSS_FOG_FRAG` and `bossFogMaterial` for boss thresholds:
 *   3D vertex billowing, domain-warped FBM clouds, floor pooling, jamb/lintel contact grounding,
 *   lantern light response, and an upright organic breach that tears open around the passing player
 *   and swirls inward with creeping tendrils to close again. Render only.
 */

import * as THREE from 'three';
import type { FogMotion, FogTheme } from '../data/fogThemes';
import { LANTERN_GLSL } from './shaders/common';
import { worldUniforms } from './worldMaterial';

const MODE: Record<FogMotion, number> = { rise: 0, roll: 1, swirl: 2, shear: 3 };

const NOISE_3D = /* glsl */ `
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { return 0.55 * noise(p) + 0.3 * noise(p * 2.1 + 7.0) + 0.15 * noise(p * 4.3 + 3.0); }
`;

export const FOG_VERT = `varying vec3 vWorld; varying vec2 vUv;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

/** Legacy / demo-border fog fragment shader (kept for render/demoMist.ts). */
export interface FogFragOptions {
  height?: string;
  far?: string;
  solid?: number;
  lit?: boolean;
}
export const fogFrag = ({ height = 'clamp((vWorld.y - uFoot) / uHeight, 0.0, 1.0)', far = '1.0', solid = 0, lit = false }: FogFragOptions = {}): string => `${lit ? 'uniform vec3 uAmbient, uLightColor;' : ''}
uniform vec3 uBase, uTop, uSpark, uGlow; uniform vec3 uCentre; uniform vec4 uPart;
uniform float uTime, uVis, uDensity, uSpeed, uMode, uShimmer, uShare, uFoot, uHeight, uHeld, uGlyph;
varying vec3 vWorld; varying vec2 vUv;
${NOISE_3D}
void main() {
  float h = ${height};
  float t = uTime * uSpeed * 0.3;
  vec3 p = vWorld * 0.32;
  if (uMode < 0.5) p.y -= t * 1.4;
  else if (uMode < 1.5) { p.x += t * 1.1; p.z -= t * 0.7; p.y -= t * 0.2; }
  else if (uMode < 2.5) {
    vec2 d = vWorld.xz - uCentre.xz; float a = t * 0.9; float c = cos(a), s = sin(a);
    p.xz = (mat2(c, -s, s, c) * d) * 0.32; p.y -= t * 0.4;
  } else { p.x += t * 2.4; p.y += sin(vWorld.x * 0.5 + uTime * uSpeed) * 0.15; p.z += t * 0.4; }
  float n = fbm(p);
  float crown = 1.0 - smoothstep(0.5 + 0.35 * n, 1.0, h);
  float foot = smoothstep(0.0, 0.07, h);
  float a = uDensity * (0.35 + 0.95 * n) * crown * foot;
  a = max(min(0.96, a * (1.0 + 0.3 * uHeld)), 0.985 * (1.0 - smoothstep(0.8, 1.0, h)) * foot) * uVis;
  vec3 col = mix(uBase, uTop, clamp(h * 0.5 + (n - 0.5) * 1.5 + 0.25, 0.0, 1.0));
  col *= 0.72 + 0.5 * noise(p * vec3(2.2, 0.5, 2.2) + 11.0);
  if (uShimmer > 0.0) col = mix(col, 0.55 + 0.45 * cos(6.2832 * (n * 1.6 + uTime * 0.12 + vec3(0.0, 0.33, 0.67))), uShimmer * 0.6);
  if (uShare > 0.0) {
    vec3 q = floor(p * 9.0);
    float s = step(1.0 - 0.06 * uShare, hash(q)) * (0.5 + 0.5 * sin(uTime * 3.0 + hash(q + 3.0) * 40.0));
    col += uSpark * s * 0.9; a = max(a, s * 0.7 * uVis * foot);
  }
  if (uGlyph > 0.0) col += uGlow * pow(n, 5.0) * 1.6 * (0.6 + 0.4 * sin(uTime * 1.3));
  ${lit ? 'col *= clamp(uAmbient * 1.6 + uLightColor * 0.55, 0.36, 1.0);' : ''}
  float shown = a * (${far});
  ${solid > 0 ? `if (shown < ${solid.toFixed(3)}) discard;` : ''}
  gl_FragColor = vec4(col, shown);
}`;

const LEGACY_FRAG = fogFrag();

/** Demo-border / generic fog material (kept backward-compatible for demoMist.ts). */
export function fogMaterial(theme: FogTheme, centre: { x: number; y: number; z: number }, foot: number, height: number, frag = LEGACY_FRAG): THREE.ShaderMaterial {
  const v = (c: readonly number[]): THREE.Vector3 => new THREE.Vector3(c[0], c[1], c[2]);
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: v(theme.base) }, uTop: { value: v(theme.top) }, uSpark: { value: v(theme.sparks?.colour ?? [0, 0, 0]) }, uGlow: { value: v(theme.glyph ?? [0, 0, 0]) }, uCentre: { value: new THREE.Vector3(centre.x, centre.y, centre.z) },
      uTime: { value: 0 }, uVis: { value: 0 }, uDensity: { value: theme.density }, uSpeed: { value: theme.speed }, uMode: { value: MODE[theme.motion] },
      uShimmer: { value: theme.shimmer ?? 0 }, uShare: { value: theme.sparks?.share ?? 0 }, uFoot: { value: foot }, uHeight: { value: height }, uHeld: { value: 0 }, uPart: { value: new THREE.Vector4(0, 0, 0, 0) }, uGlyph: { value: theme.glyph ? 1 : 0 },
    },
    vertexShader: FOG_VERT, fragmentShader: frag, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
}

const BOSS_FOG_VERT = /* glsl */ `
attribute float aLayer;
uniform float uTime, uSpeed, uCapped;
uniform vec4 uBreach;   // u, y, rx, ry (wall-local metres)
uniform vec4 uBreachFx; // swirl, push, rim, closeProg
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vRight;
varying vec2 vUv;
varying float vLayer;
varying float vCamSide;
void main() {
  vUv = uv;
  vLayer = aLayer;
  vec3 pos = position;
  // Edges pinned at jambs, floor, and lintel (when capped) so the curtain never separates from its stonework.
  float edgeX = sin(clamp(uv.x, 0.0, 1.0) * 3.14159265);
  float edgeY = smoothstep(0.0, 0.14, uv.y) * (uCapped > 0.5 ? (1.0 - smoothstep(0.86, 1.0, uv.y)) : 1.0);
  float pin = edgeX * edgeY;
  float wave = (0.09 + 0.07 * abs(aLayer)) * sin(pos.x * 0.72 + uTime * uSpeed * 0.75 + aLayer * 1.6) * cos(pos.y * 0.62 - uTime * uSpeed * 0.5);
  pos.z += wave * pin;
  // Physical 3D billowing around the breach as the player pushes through the curtain.
  if (abs(uBreachFx.y) > 0.005 || uBreach.z > 0.005) {
    vec2 dp = vec2(pos.x - uBreach.x, pos.y - uBreach.y);
    vec2 rad = vec2(max(uBreach.z, 0.85), max(uBreach.w, 1.15));
    float d2 = dot(dp / rad, dp / rad);
    float influence = exp(-d2 * 0.65) * pin;
    float layerBias = 0.75 + 0.35 * aLayer * sign(uBreachFx.y + 0.0001);
    pos.z += uBreachFx.y * 0.52 * influence * layerBias;
    float len = length(dp) + 0.001;
    pos.x += (dp.x / len) * 0.14 * uBreachFx.z * influence * smoothstep(0.15, 0.9, sqrt(d2));
  }
  vLocal = pos;
  vec4 w = modelMatrix * vec4(pos, 1.0);
  vWorld = w.xyz;
  vRight = normalize((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  vec3 wn = normalize((modelMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);
  vCamSide = dot(wn, cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const BOSS_FOG_FRAG = /* glsl */ `
uniform vec3 uBase, uTop, uSpark, uGlow, uCentre;
uniform vec4 uBreach;   // u, y, rx, ry (wall-local metres)
uniform vec4 uBreachFx; // swirl, push, rim, closeProg
uniform float uTime, uVis, uDensity, uSpeed, uMode, uShimmer, uShare, uWidth, uHeight, uHeld, uGlyph, uCapped;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vRight;
varying vec2 vUv;
varying float vLayer;
varying float vCamSide;
${LANTERN_GLSL}
${NOISE_3D}

void main() {
  float h = clamp(vLocal.y / max(uHeight, 0.1), 0.0, 1.0);
  float t = uTime * uSpeed * 0.32;
  vec3 p = vWorld * 0.34 + vec3(vLayer * 0.55, vLayer * 0.25, -vLayer * 0.45);
  if (uMode < 0.5) p.y -= t * 1.45;
  else if (uMode < 1.5) { p.x += t * 1.15; p.z -= t * 0.72; p.y -= t * 0.22; }
  else if (uMode < 2.5) {
    vec2 d = vWorld.xz - uCentre.xz; float a = t * 0.9; float c = cos(a), s = sin(a);
    p.xz = (mat2(c, -s, s, c) * d) * 0.34; p.y -= t * 0.4;
  } else { p.x += t * 2.4; p.y += sin(vWorld.x * 0.5 + uTime * uSpeed) * 0.16; p.z += t * 0.4; }

  // Breach geometry in wall-local metres: upright human archway with organic swirl & closing tendrils.
  float holeMask = 1.0;
  float coreSolid = 1.0;
  float rimGlow = 0.0;
  float rimThick = 0.0;
  if (uBreach.z > 0.002 && uBreach.w > 0.002) {
    vec2 d = vec2(vLocal.x - uBreach.x, vLocal.y - uBreach.y);
    float rx = uBreach.z;
    float ry = uBreach.w;
    // Layered stagger: outer veils open ahead of the core when tearing and knit across first when closing.
    float pushSign = sign(uBreachFx.y + 0.0001);
    float layerScale = 1.0 - 0.1 * vLayer * pushSign * abs(uBreachFx.y) - 0.18 * abs(vLayer) * uBreachFx.w;
    rx *= max(0.25, layerScale);
    ry *= max(0.25, layerScale);
    vec2 rel = vec2(d.x / rx, d.y / ry);
    rel.x *= 1.0 + 0.16 * max(rel.y, 0.0) - 0.09 * max(-rel.y, 0.0); // arched shoulders/crown, grounded feet
    if (d.y < 0.0) rel.y *= 0.84;
    float rd = length(rel);
    float ang = atan(rel.y, rel.x);
    // Vortex swirl bends the mist clouds outward during tear and spirals them inward while closing, aligned to the wall plane.
    float ringBand = exp(-pow(rd - 1.05, 2.0) * 2.2);
    float twist = uBreachFx.x * 1.15 * ringBand;
    float ca = cos(twist), sa = sin(twist);
    vec2 spun = mat2(ca, -sa, sa, ca) * rel;
    vec2 swirlDelta = (spun - rel) * 0.95 + normalize(rel + 1e-4) * (-uBreachFx.x * 0.45 * ringBand);
    p += vRight * swirlDelta.x + vec3(0.0, swirlDelta.y, 0.0);
    // Ragged wispy tear edge + inward-reaching tendrils while closing.
    float tendril = fbm(vec3(cos(ang) * 1.9 + uTime * 0.35, sin(ang) * 1.9 - uTime * 0.28, rd * 1.35 + vLayer * 0.8));
    float detail = fbm(vWorld * 1.05 + vec3(0.0, -uTime * 0.55, uTime * 0.35));
    float creep = mix(0.28, 0.46, uBreachFx.w);
    float edge = max(0.25, 0.78 + creep * (tendril * 0.65 + detail * 0.35) - 0.22 * uBreachFx.w * (1.0 - tendril));
    float feather = mix(0.22, 0.44, abs(vLayer));
    holeMask = smoothstep(edge - feather, edge + feather * 0.65, rd);
    coreSolid = smoothstep(edge - 0.18, edge + 0.14, rd);
    float collar = smoothstep(edge * 0.66, edge * 1.06, rd) * (1.0 - smoothstep(edge * 1.06, edge * 1.92, rd));
    rimThick = collar * uBreachFx.z * (0.68 + 0.32 * detail);
    rimGlow = collar * uBreachFx.z * (0.48 + 0.52 * tendril) * step(0.01, holeMask);
  }

  // Two-pass domain-warped FBM for silky, churning banks of mist.
  vec3 wOff = vec3(fbm(p * 0.8 + vec3(0.0, -t * 0.35, 2.3)), fbm(p * 0.8 + vec3(5.2, t * 0.28, -1.7)), 0.0) - 0.5;
  float n = fbm(p + wOff * 0.85);
  float fine = noise(p * vec3(2.4, 1.1, 2.4) + 11.0);

  // Grounding: solid pooling at the floor (no hover gap), clamped into jambs & lintel, arched rolling crest when open-sky.
  float edgeX = min(vUv.x, 1.0 - vUv.x);
  float jambHug = 1.0 - smoothstep(0.0, 0.14, edgeX);
  float groundPool = exp(-max(vLocal.y, 0.0) / 0.55);
  float crestLine = 0.72 + 0.09 * sin(vUv.x * 3.14159265) + 0.16 * (n - 0.5);
  float crown = uCapped > 0.5 ? 1.0 : 1.0 - smoothstep(crestLine, 0.98, h);
  float baseSolid = uCapped > 0.5 ? 0.995 : 0.99 * crown;

  float a;
  if (abs(vLayer) < 0.5) {
    // Dense opaque core curtain (writes depth while active so post volumetric fog never X-rays geometry behind the wall).
    float cloud = uDensity * (0.48 + 0.92 * n) * (1.0 + 0.26 * uHeld + 0.16 * jambHug + 0.2 * groundPool);
    a = max(min(0.99, cloud) * crown, baseSolid) + rimThick * 0.24;
  } else {
    // Wispy foreground & recessed volumetric veils; hardware depth test against core hides the far veil except inside the torn hole!
    float isFar = step(0.0, -vLayer * vCamSide);
    float farVis = mix(1.0, 1.0 - 0.82 * coreSolid, isFar);
    float wisp = smoothstep(0.26, 0.82, n * 0.72 + fine * 0.28);
    float veilCrown = uCapped > 0.5 ? 1.0 : 1.0 - smoothstep(crestLine + 0.04, 1.0, h);
    a = (0.24 + 0.44 * wisp + 0.14 * groundPool + rimThick * 0.36) * veilCrown * farVis * (0.85 + 0.2 * uHeld);
  }
  a = clamp(a, 0.0, 0.996) * holeMask * uVis;

  vec3 col = mix(uBase, uTop, clamp(h * 0.48 + (n - 0.5) * 1.45 + 0.24 - 0.16 * groundPool, 0.0, 1.0));
  col *= 0.76 + 0.46 * fine;
  // Subtle stone-contact occlusion at jambs and capped lintel so the mist looks anchored into the architecture.
  float topHug = uCapped > 0.5 ? (1.0 - smoothstep(0.86, 1.0, h)) : 1.0;
  col *= mix(1.0, 0.78, jambHug * 0.75) * mix(0.84, 1.0, topHug);
  // Subtle warm response to the investigator's lantern on nearby mist folds (clamped so bright fog never blows out).
  float lamp = min(1.0, lanternAt(uLanternPos - vWorld));
  col *= vec3(0.94) + uLanternColor * lamp * 0.16;
  if (uShimmer > 0.0) col = mix(col, 0.55 + 0.45 * cos(6.2832 * (n * 1.6 + uTime * 0.12 + vec3(0.0, 0.33, 0.67))), uShimmer * 0.6);
  if (uShare > 0.0) {
    // Soft jittered glowing motes inside 3D cells rather than blocky voxel cubes.
    vec3 sp = p * 7.5;
    vec3 q = floor(sp);
    if (hash(q) > 1.0 - 0.095 * uShare) {
      vec3 c = 0.22 + 0.56 * vec3(hash(q + 1.3), hash(q + 2.7), hash(q + 5.1));
      float mote = smoothstep(0.22, 0.03, length(fract(sp) - c)) * (0.5 + 0.5 * sin(uTime * 3.0 + hash(q + 3.0) * 40.0));
      col += uSpark * mote * 1.15;
      a = max(a, mote * 0.72 * holeMask * crown * uVis);
    }
  }
  if (uGlyph > 0.0) col += uGlow * pow(n, 4.5) * 1.55 * (0.6 + 0.4 * sin(uTime * 1.3));
  // Subtle inner lip shade + illuminated displaced-mist collar along the ragged edge of the torn hole.
  col *= mix(0.82, 1.0, smoothstep(0.05, 0.75, holeMask));
  vec3 rimTint = uShare > 0.0 ? mix(uTop * 1.18, uSpark, 0.28) : mix(uTop * 1.18, vec3(0.86, 0.86, 0.84), 0.22);
  col += rimTint * rimGlow * 0.32;
  if (abs(vLayer) < 0.5 && uVis > 0.72) {
    if (a < 0.34) discard;
  } else if (a < 0.004) {
    discard;
  }
  gl_FragColor = vec4(col, a);
}
`;

export interface BossFogMaterials {
  core: THREE.ShaderMaterial;
  veil: THREE.ShaderMaterial;
  uniforms: Record<string, THREE.IUniform>;
}

/** Multi-layer boss fog curtain materials (depth-writing core + soft non-depth-writing parallax veils sharing one uniforms map). */
export function bossFogMaterials(theme: FogTheme, centre: { x: number; y: number; z: number }, width: number, height: number, capped: boolean): BossFogMaterials {
  const v = (c: readonly number[]): THREE.Vector3 => new THREE.Vector3(c[0], c[1], c[2]);
  const uniforms: Record<string, THREE.IUniform> = {
    uLanternPos: worldUniforms.uLanternPos,
    uLanternColor: worldUniforms.uLanternColor,
    uLanternRange: worldUniforms.uLanternRange,
    uLanternDecay: worldUniforms.uLanternDecay,
    uBase: { value: v(theme.base) }, uTop: { value: v(theme.top) }, uSpark: { value: v(theme.sparks?.colour ?? [0, 0, 0]) }, uGlow: { value: v(theme.glyph ?? [0, 0, 0]) },
    uCentre: { value: new THREE.Vector3(centre.x, centre.y, centre.z) },
    uBreach: { value: new THREE.Vector4(0, 1.18, 0, 0) },
    uBreachFx: { value: new THREE.Vector4(0, 0, 0, 0) },
    uTime: { value: 0 }, uVis: { value: 0 }, uDensity: { value: theme.density }, uSpeed: { value: theme.speed }, uMode: { value: MODE[theme.motion] },
    uShimmer: { value: theme.shimmer ?? 0 }, uShare: { value: theme.sparks?.share ?? 0 }, uWidth: { value: width }, uHeight: { value: height },
    uHeld: { value: 0 }, uGlyph: { value: theme.glyph ? 1 : 0 }, uCapped: { value: capped ? 1 : 0 },
  };
  const core = new THREE.ShaderMaterial({
    uniforms, vertexShader: BOSS_FOG_VERT, fragmentShader: BOSS_FOG_FRAG, transparent: true, depthWrite: true, side: THREE.DoubleSide,
  });
  const veil = new THREE.ShaderMaterial({
    uniforms, vertexShader: BOSS_FOG_VERT, fragmentShader: BOSS_FOG_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  return { core, veil, uniforms };
}
