/**
 * Round 125, the shadows of leaves: what grows (the material `foliage`, render/propMeshes.ts) is drawn into the moon's maps with its
 * cards cut out by the leaf atlas and blown by the same wind as the world draws it (shaders/wind.ts), so a crown lays a dappled shadow
 * on the ground that moves with its boughs, and its outer leaves shade its inner ones. Its meshes stand on a layer of their own, which
 * only the moon's cameras look at; they are drawn after the solids into the same maps (render/moonShadow.ts).
 */

import * as THREE from 'three';
import { WIND_GLSL } from './shaders/wind';
import { foliageTexture, worldUniforms } from './worldMaterial';

/** The layer what grows casts from (the investigator's camera does not look at it; its meshes are on layer 0 as well). */
export const FOLIAGE_CASTER = 3;

let material: THREE.ShaderMaterial | null = null;

function depth(): THREE.ShaderMaterial {
  if (material) return material;
  const u = worldUniforms;
  material = new THREE.ShaderMaterial({
    uniforms: { uTime: u.uTime, uWind: u.uWind, uWindDir: u.uWindDir, uMap: { value: foliageTexture() } },
    vertexShader: /* glsl */ `
uniform float uTime;
uniform float uWind;
attribute float aSway;
${WIND_GLSL}
varying vec2 vUv;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 wn = normalize(mat3(modelMatrix) * normal);
  float gust;
  wp.xyz += windMove(wp.xyz, aSway, aWind, wn, uWind, gust);
  vUv = uv * 0.5; // geometry units to the texture's (render/textures.ts UV_PER_TEXTURE)
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;
void main() {
  if (textureLod(uMap, vUv, 0.0).a < 0.5) discard;
  gl_FragColor = vec4(1.0);
}`,
    side: THREE.DoubleSide,
    colorWrite: false,
  });
  return material;
}

/** Draws what grows into the map `camera` is drawing (after its solids: nothing is cleared), then gives the camera back its layer. */
export function castFoliage(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
  const [mask, clears, over] = [camera.layers.mask, renderer.autoClear, scene.overrideMaterial];
  camera.layers.set(FOLIAGE_CASTER);
  scene.overrideMaterial = depth();
  renderer.autoClear = false;
  renderer.render(scene, camera);
  renderer.autoClear = clears;
  scene.overrideMaterial = over;
  camera.layers.mask = mask;
}
