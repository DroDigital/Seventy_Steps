/**
 * The light of a lit window on the ground before it (round 78): a soft trapezoid of the window's colour running out from the wall,
 * with the dark cross of its mullion and transom across it, flickering with the pane (paneLife.ts) and gone when the window goes out in
 * the waning hour. A town at night reads as rooms of light with people at home in them, and not as amber balls on the walls. One
 * instanced additive batch (the halos' way: a draw, no depth write, a little over the ground), the nearest windows of those in reach of
 * the eye; where each lies is spillPlan.ts. Render only: nothing in the simulation reads it.
 */

import * as THREE from 'three';
import { SPILL } from '../data/mistLight';
import { LIGHTS } from '../data/tuning';
import type { Game } from '../systems/components';
import { paneLit } from './paneLife';
import { createSpillPlans } from './spillPlan';
import { LIGHT_VIEW } from './worldLights';
import { worldUniforms } from './worldMaterial';

const VERT = /* glsl */ `
attribute vec4 aOrigin; // where it begins on the ground, and its length
attribute vec4 aAlong; // the way it runs (x, z), its width at the wall and at its end
attribute vec2 aSlope; // the ground's rise along it and across it, a metre
attribute vec3 aTint;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFogShare;
uniform float uLift;
varying vec2 vQ;
varying vec3 vCol;
void main() {
  float a = position.y + 0.5; // along it, 0 at the wall
  float b = position.x * 2.0; // across it, -1..1
  float wide = 0.5 * mix(aAlong.z, aAlong.w, a);
  vec2 n = aAlong.xy;
  vec2 xz = aOrigin.xz + n * (a * aOrigin.w) + vec2(-n.y, n.x) * (b * wide);
  float y = aOrigin.y + aSlope.x * a * aOrigin.w + aSlope.y * b * wide + uLift;
  vec4 mv = viewMatrix * vec4(xz.x, y, xz.y, 1.0);
  gl_Position = projectionMatrix * mv;
  vQ = vec2(b, a);
  float fog = clamp((length(mv.xyz) - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  vCol = aTint * (1.0 - fog * uFogShare);
}
`;

const FRAG = /* glsl */ `
uniform vec4 uBars; // the mullion's width, where the transom lies, its width, the share of the light the bars leave
uniform float uSoft;
varying vec2 vQ;
varying vec3 vCol;
float bar(float x, float at, float w) {
  return 1.0 - smoothstep(w * 0.5, w, abs(x - at));
}
void main() {
  float across = 1.0 - smoothstep(0.5, 1.0, abs(vQ.x)); // soft at its sides...
  float onset = smoothstep(0.0, uSoft, vQ.y); // ...and where it begins
  float fall = pow(max(1.0 - vQ.y, 0.0), 1.6); // and thinning to nothing at its end
  float shade = 1.0 - (1.0 - uBars.w) * max(bar(vQ.x, 0.0, uBars.x), bar(vQ.y, uBars.y, uBars.z));
  gl_FragColor = vec4(vCol * across * onset * fall * shade, 1.0);
}
`;

export interface WindowSpill {
  /** Each drawn frame, after the lights are chosen (worldLights.ts): `on` is false where it does not belong (a roof, the arena). */
  update(time: number, on: boolean): void;
}

export function createWindowSpill(scene: THREE.Scene, g: Game): WindowSpill {
  const cap = SPILL.count;
  const geo = new THREE.InstancedBufferGeometry();
  geo.copy(new THREE.PlaneGeometry(1, 1, 1, 6) as unknown as THREE.InstancedBufferGeometry);
  const attr = (size: number): THREE.InstancedBufferAttribute => new THREE.InstancedBufferAttribute(new Float32Array(cap * size), size).setUsage(THREE.DynamicDrawUsage);
  const [origin, along, slope, tint] = [attr(4), attr(4), attr(2), attr(3)];
  geo.setAttribute('aOrigin', origin);
  geo.setAttribute('aAlong', along);
  geo.setAttribute('aSlope', slope);
  geo.setAttribute('aTint', tint);
  geo.instanceCount = 0;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uFogNear: worldUniforms.uFogNear,
      uFogFar: worldUniforms.uFogFar,
      uFogShare: { value: SPILL.fog },
      uLift: { value: SPILL.lift },
      uBars: { value: new THREE.Vector4(...SPILL.bars) },
      uSoft: { value: SPILL.soft },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);
  const plan = createSpillPlans();
  const colour = LIGHTS.kinds.window.color;
  return {
    update(time, on) {
      let n = 0;
      const world = g.world;
      if (on && world) {
        for (const { s, d } of LIGHT_VIEW.visible) {
          if (d > SPILL.within) break; // (nearest first)
          if (!s.glass || s.kind !== 'window') continue;
          const lit = s.pane === undefined ? 1 : paneLit(s.pane, time);
          if (lit < 0.03) continue;
          const p = plan(s as { x: number; z: number; glass: { x: number; y: number; z: number } }, world);
          if (!p) continue;
          const k = SPILL.gain * lit;
          origin.setXYZW(n, p.x, p.y, p.z, p.length);
          along.setXYZW(n, p.nx, p.nz, SPILL.near, SPILL.far);
          slope.setXY(n, p.slopeAlong, p.slopeAcross);
          tint.setXYZ(n, colour[0] * k, colour[1] * k, colour[2] * k);
          if (++n >= cap) break;
        }
      }
      mesh.visible = n > 0;
      geo.instanceCount = n;
      if (n === 0) return;
      origin.needsUpdate = along.needsUpdate = slope.needsUpdate = tint.needsUpdate = true;
    },
  };
}
