/**
 * Soft particles (round 113): dust, smoke, sparks and a blow's matter were cut off hard where they met the ground or a wall, a straight
 * edge across a cloud. The world is drawn first without them, its depth copied into a small texture they can read (the target's own
 * depth cannot be read while it is drawn into), and they are drawn after over it, each pixel thinning out (by the dither the particles
 * already use) as the surface behind it comes within `PARTICLE_SOFT` metres. Render only.
 */

import * as THREE from 'three';
import { PARTICLE_SOFT } from '../data/tuning';

const COPY_FRAG = /* glsl */ `
#include <packing>
uniform sampler2D tDepth;
uniform mat4 uProjInv;
varying vec2 vUv;
void main() {
  float d = texture2D(tDepth, vUv).x;
  vec4 v = uProjInv * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  float metres = d >= 0.9999 ? 1000.0 : -v.z / v.w;
  gl_FragColor = packDepthToRGBA(clamp(metres / 1000.0, 0.0, 0.999)); // metres from the lens, of a thousand
}
`;

/** The particles' side: how far behind each pixel the scene stands. Needs `#include <packing>` before it, and gives `softShare`. */
export const SOFT_GLSL = /* glsl */ `
uniform sampler2D uSoftDepth;
uniform float uSoft; // metres over which a particle thins out before what stands behind it (0: drawn hard)
float softShare(float metres) {
  if (uSoft <= 0.0) return 1.0;
  vec2 uv = gl_FragCoord.xy / vec2(textureSize(uSoftDepth, 0));
  float behind = unpackRGBAToDepth(texture(uSoftDepth, uv)) * 1000.0 - metres;
  return clamp(behind / uSoft, 0.0, 1.0);
}
`;

export interface SoftDepth {
  /** The world's depth, as the particles read it. */
  readonly texture: THREE.Texture;
  /** Copies the target's depth (the camera it was drawn with). */
  copy(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void;
  setSize(w: number, h: number): void;
}

export function createSoftDepth(depth: THREE.DepthTexture, w: number, h: number): SoftDepth {
  const target = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, depthBuffer: false });
  const uniforms = { tDepth: { value: depth }, uProjInv: { value: new THREE.Matrix4() } };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec2 vUv; void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: COPY_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const triangle = new THREE.BufferGeometry();
  triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(triangle, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const flat = new THREE.Camera();
  return {
    texture: target.texture,
    copy(renderer, camera) {
      uniforms.uProjInv.value.copy((camera as THREE.PerspectiveCamera).projectionMatrixInverse);
      renderer.setRenderTarget(target);
      renderer.render(scene, flat);
    },
    setSize(width, height) {
      target.setSize(width, height);
    },
  };
}

/** Draws `soft` (the particles) over what `render` drew into `target`, thinned where they meet it; `render` draws the rest without them. */
export function drawSoft(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget, depth: SoftDepth, soft: THREE.Mesh, camera: THREE.Camera, render: () => void): void {
  const material = soft.material as THREE.ShaderMaterial;
  const was = soft.visible;
  soft.visible = false;
  render();
  soft.visible = was;
  if (!was) return;
  depth.copy(renderer, camera);
  material.uniforms.uSoftDepth.value = depth.texture;
  material.uniforms.uSoft.value = PARTICLE_SOFT;
  renderer.setRenderTarget(target);
  const clear = renderer.autoClear;
  renderer.autoClear = false;
  renderer.render(soft, camera);
  renderer.autoClear = clear;
}
