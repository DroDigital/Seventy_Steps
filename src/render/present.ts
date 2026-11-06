/**
 * The last pass (2026-11-03): draws the post pass's low-res picture onto the canvas. With even pixels (Settings › Display, on by
 * default) the canvas is as many pixels as the screen gives its box and every picture pixel is drawn the same size
 * (render/evenPixels.ts); off, the canvas is the picture's size and the browser blows it up nearest-neighbour, as before.
 */

import * as THREE from 'three';
import { PRESENT_FRAG, PRESENT_VERT } from './shaders/present';

export interface Present {
  scene: THREE.Scene;
  camera: THREE.Camera;
  /** The picture's size and the canvas's, each in its own pixels, and whether the picture is spread evenly over the canvas. */
  set(picture: THREE.Vector2, canvas: THREE.Vector2, even: boolean): void;
}

export function createPresent(picture: THREE.Texture): Present {
  const uniforms = {
    tPicture: { value: picture },
    uSrc: { value: new THREE.Vector2(1, 1) },
    uOut: { value: new THREE.Vector2(1, 1) },
    uEven: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: PRESENT_VERT, fragmentShader: PRESENT_FRAG, depthTest: false, depthWrite: false });
  const triangle = new THREE.BufferGeometry();
  triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const mesh = new THREE.Mesh(triangle, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  return {
    scene,
    camera: new THREE.Camera(),
    set(src, out, even) {
      uniforms.uSrc.value.copy(src);
      uniforms.uOut.value.copy(out);
      uniforms.uEven.value = even ? 1 : 0;
    },
  };
}
