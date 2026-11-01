/** The court's cracks and missing sections, drawn to match the simulation's tile boundaries. */
import * as THREE from 'three';
import type { Game } from '../systems/components';
import type { ArenaTile } from '../systems/fightTypes';
import { FLOOR } from '../systems/azathothFloor';

const MAX = 256;
const VERT = /* glsl */ `
attribute vec3 aFloor; // strain, collapsed, seed
varying vec2 vUv;
varying vec3 vFloor;
void main() {
  vUv = uv;
  vFloor = aFloor;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vFloor;
float bayer(vec2 p) {
  const float m[16] = float[16](0.0,8.0,2.0,10.0,12.0,4.0,14.0,6.0,3.0,11.0,1.0,9.0,15.0,7.0,13.0,5.0);
  ivec2 q = ivec2(mod(p, 4.0));
  return (m[q.x + q.y * 4] + 0.5) / 16.0;
}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float strain = vFloor.x;
  float hole = vFloor.y;
  float seed = vFloor.z * 6.28318;
  float branch1 = abs(p.x + 0.16 * sin(p.y * 8.0 + seed) + 0.07 * sin(p.y * 21.0 - seed));
  float branch2 = abs(p.y - 0.45 * p.x - 0.13 * sin(p.x * 11.0 + seed));
  float branch3 = abs(p.y + 0.7 * p.x + 0.12 * sin(p.x * 14.0 - seed));
  float crack = min(branch1, min(branch2, branch3));
  float widening = 0.008 + strain * 0.034;
  float line = 1.0 - smoothstep(widening, widening + 0.02, crack);
  float edge = max(abs(p.x), abs(p.y));
  float rim = smoothstep(0.88, 0.99, edge);
  float warn = smoothstep(0.65, 0.9, strain);
  float shimmer = 0.8 + 0.2 * sin(uTime * 5.0 + seed);
  if (hole > 0.5) {
    vec3 voidColour = mix(vec3(0.012, 0.008, 0.025), vec3(0.13, 0.045, 0.18), 0.15 + 0.15 * sin(p.x * 12.0 + p.y * 9.0 + uTime));
    gl_FragColor = vec4(mix(voidColour, vec3(0.48, 0.28, 0.56), rim * 0.8), 1.0);
    return;
  }
  float alpha = max(line * (0.45 + 0.5 * strain), rim * warn * 0.6) * shimmer;
  if (alpha < bayer(gl_FragCoord.xy)) discard;
  vec3 colour = mix(vec3(0.19, 0.13, 0.24), vec3(1.0, 0.58, 0.77), warn);
  gl_FragColor = vec4(colour, 1.0);
}`;

export function createAzathothFloor(scene: THREE.Scene, g: Game): { update(time: number): void } {
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.rotateX(-Math.PI / 2);
  const data = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('aFloor', data);
  const material = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.InstancedMesh(geometry, material, MAX);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  const heights = new WeakMap<ArenaTile, number>();
  const matrix = new THREE.Matrix4();
  return {
    update(time) {
      let count = 0;
      material.uniforms.uTime.value = time;
      for (const fight of g.ecs.c.fight.values()) {
        const floor = fight.engaged && fight.arenaFloor;
        if (!floor) continue;
        for (const t of floor.tiles) {
          if ((!t.collapsed && t.strain < FLOOR.visible) || count >= MAX) continue;
          let y = heights.get(t);
          if (y === undefined) { y = g.world.ground(t.x, t.z) + 0.06; heights.set(t, y); }
          const tremor = t.warning > 0 && !t.collapsed ? Math.sin(time * 22 + t.seed * 6) * 0.035 : 0;
          matrix.makeScale(floor.size, 1, floor.size);
          matrix.setPosition(t.x, y + tremor, t.z);
          mesh.setMatrixAt(count, matrix);
          data.setXYZ(count, t.strain, t.collapsed ? 1 : 0, t.seed);
          count++;
        }
      }
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      data.needsUpdate = true;
    },
  };
}
