/** Azathoth's marked tears open in the air before their tentacles strike. Render only. */
import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import type { Game } from '../systems/components';

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// A narrow, irregular wound with fractured edges and an animated depth, dithered like the sprites.
const FRAG = /* glsl */ `
uniform float uTime;
uniform float uOpen;
uniform float uSeed;
varying vec2 vUv;
float bayer(vec2 p) {
  const float m[16] = float[16](0.0,8.0,2.0,10.0,12.0,4.0,14.0,6.0,3.0,11.0,1.0,9.0,15.0,7.0,13.0,5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  float y = vUv.y;
  float kink = 0.12 * sin(y * 8.0 + uSeed) + 0.05 * sin(y * 19.0 - uTime * 2.0);
  float width = (0.16 + 0.44 * pow(max(0.0, 1.0 - abs(y)), 0.65)) * uOpen;
  float edge = abs(vUv.x - kink);
  if (abs(y) > 0.97 || edge > width + 0.06) discard;
  float rim = 1.0 - smoothstep(0.025, 0.095, abs(edge - width));
  float shards = step(0.91, sin(y * 38.0 + uSeed * 3.0 + uTime * 2.0) * sin(vUv.x * 27.0 - uTime));
  vec3 dark = mix(vec3(0.025, 0.008, 0.06), vec3(0.24, 0.07, 0.33), 0.5 + 0.5 * sin(y * 11.0 + uTime * 2.0 + uSeed));
  vec3 colour = mix(dark, vec3(0.9, 0.52, 1.0), max(rim, shards * 0.75));
  float alpha = uOpen * (0.8 + 0.2 * rim);
  if (alpha < bayer(gl_FragCoord.xy)) discard;
  gl_FragColor = vec4(colour, 1.0);
}`;

interface Rift {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  closedAt?: number;
}

export function createRifts(scene: THREE.Scene, g: Game): { update(time: number, camera: THREE.Camera): void } {
  const geometry = new THREE.PlaneGeometry(1, 1);
  const rifts = new Map<Entity, Rift>();
  return {
    update(time, camera) {
      for (const [id, mark] of g.ecs.c.mark) {
        if (mark.look !== 'rift') continue;
        const at = g.ecs.c.transform.get(id)?.pos;
        if (!at) continue;
        let rift = rifts.get(id);
        if (!rift) {
          const material = new THREE.ShaderMaterial({ uniforms: { uTime: { value: time }, uOpen: { value: 0 }, uSeed: { value: id * 0.618 } }, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, depthWrite: false });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.frustumCulled = false;
          scene.add(mesh);
          rift = { mesh };
          rifts.set(id, rift);
        }
        rift.mesh.position.set(at.x, at.y + 1.7, at.z);
        rift.mesh.scale.set(mark.radius * 1.3, mark.radius * 2.2, 1);
        rift.mesh.lookAt(camera.position);
        rift.mesh.material.uniforms.uOpen.value = Math.min(1, 0.35 + (1 - mark.delay / mark.total) * 1.5);
        rift.closedAt = undefined;
      }
      for (const [id, rift] of rifts) {
        const material = rift.mesh.material;
        material.uniforms.uTime.value = time;
        if (!g.ecs.c.mark.has(id)) {
          rift.closedAt ??= time;
          const left = 1 - (time - rift.closedAt) / 1.0;
          if (left <= 0) {
            scene.remove(rift.mesh);
            material.dispose();
            rifts.delete(id);
          } else {
            material.uniforms.uOpen.value = left;
            rift.mesh.lookAt(camera.position);
          }
        }
      }
    },
  };
}
