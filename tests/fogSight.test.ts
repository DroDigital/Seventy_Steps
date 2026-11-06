import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createFogSight } from '../src/render/fogSight';

const wall = { x: 0, z: 0, yaw: 0, width: 8 };
const outside = { x: 0, y: 1.7, z: -3 };
const inside = { x: 0, y: 0, z: 1.8 };

describe('the camera following through a boss fog', () => {
  it('leaves the wall opaque before traversal, then keeps the sight line open while the camera is behind it', () => {
    const sight = createFogSight(wall);
    expect(sight.update(outside, inside, false, 1).blocked).toBe(false);
    const crossing = sight.update(outside, inside, true, 1 / 60);
    expect(crossing.blocked).toBe(true);
    expect(crossing.at).toMatchObject({ x: 0, z: 0 });
    expect(crossing.clear).toBeGreaterThan(0);
    sight.crossed(inside);
    const after = sight.update(outside, inside, false, 1);
    expect(after.blocked).toBe(true);
    expect(after.clear).toBe(1); // held throughout a scene, or with scenes disabled
    const further = sight.update(outside, { ...inside, x: 2, z: 4 }, false, 1 / 60);
    expect(further.blocked).toBe(true);
    expect(further.at!.x).toBeGreaterThan(0); // the opening follows the camera's sight line
    expect(further.at!.z).toBeCloseTo(0);
    const lensInside = { x: 0, y: 2, z: 0.5 };
    const closing = sight.update(lensInside, inside, false, 0.1);
    expect(closing.blocked).toBe(false);
    expect(closing.clear).toBeGreaterThan(0); // the fog returns smoothly after the lens clears it
    expect(sight.update(lensInside, inside, false, 1).clear).toBe(0);
  });

  it('does not reveal a wall after the player returns to its other side or the ray misses the doorway', () => {
    const sight = createFogSight(wall);
    sight.crossed(inside);
    expect(sight.update(inside, { ...outside, y: 0 }, false, 1).blocked).toBe(false);
    expect(sight.update({ ...outside, x: 20 }, { ...inside, x: 20 }, false, 1).blocked).toBe(false);
    sight.crossed({ ...outside, y: 0 }); // traversal out works in either direction
    expect(sight.update(inside, { ...outside, y: 0 }, false, 1).blocked).toBe(true);
  });
});

it('the rendered crossed fog stays clear until the follow camera has entered', async () => {
  const { createBossFog } = await import('../src/render/bossFog');
  const { gatePlan } = await import('../src/world/gatePlan');
  const { worldLayout } = await import('../src/world/placements');
  const w = gatePlan(worldLayout()).fogs[0];
  const normal = { x: Math.sin(w.yaw), z: Math.cos(w.yaw) };
  const player = { x: w.x + 1.8 * normal.x, y: w.y, z: w.z + 1.8 * normal.z };
  const callbacks = new Map<string, (event: any) => void>();
  const g = {
    events: { on: (name: string, callback: (event: any) => void) => callbacks.set(name, callback) },
    overworld: { slain: new Set<string>() },
    player: { id: 1, fogPass: null },
    ecs: { c: { transform: new Map([[1, { pos: player }]]), fight: new Map() } },
    world: { ground: () => w.y },
  } as never;
  const scene = new THREE.Scene();
  const fog = createBossFog(scene, g, { spawn: () => undefined } as never, { recipe: () => undefined, sample: () => undefined } as never);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(w.x - 3 * normal.x, w.y + 1.7, w.z - 3 * normal.z);
  fog.update(camera, 0, false);
  fog.update(camera, 1, false);
  const mesh = scene.children.find((o) => o.position.x === w.x && o.position.z === w.z) as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  expect(mesh.material.uniforms.uVis.value).toBeGreaterThan(0);
  callbacks.get('FogPassed')!({ wall: w.id, x: player.x, z: player.z });
  fog.update(camera, 1.1, false);
  expect(mesh.material.uniforms.uPart.value.w).toBe(9); // clear immediately, including the first blended scene frame
  fog.update(camera, 1.2, false);
  expect(mesh.material.uniforms.uVis.value).toBe(0);
  fog.update(camera, 5, false);
  expect(mesh.material.uniforms.uVis.value).toBe(0); // no fixed timeout while the lens remains behind
  camera.position.set(w.x + normal.x, w.y + 1.7, w.z + normal.z);
  fog.update(camera, 5.1, false);
  expect(mesh.material.uniforms.uVis.value).toBeGreaterThan(0);
});
