import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createFogSight } from '../src/render/fogSight';

const wall = { x: 0, z: 0, yaw: 0, width: 8 };
const outside = { x: 0, y: 1.7, z: -3 };
const inside = { x: 0, y: 0, z: 1.8 };

describe('the camera following through a boss fog', () => {
  it('leaves the wall opaque before traversal, then tracks the sight-line crossing while the camera is behind it', () => {
    const sight = createFogSight(wall);
    expect(sight.update(outside, inside, false, 1).blocked).toBe(false);
    const crossing = sight.update(outside, inside, true, 1 / 60);
    expect(crossing.blocked).toBe(true);
    expect(crossing.at).toMatchObject({ x: 0, z: 0 });
    expect(crossing.u).toBeCloseTo(0, 5);
    expect(crossing.clear).toBeGreaterThan(0);
    sight.crossed(inside);
    const after = sight.update(outside, inside, false, 1);
    expect(after.blocked).toBe(true);
    expect(after.clear).toBe(1);
    const further = sight.update(outside, { ...inside, x: 2, z: 4 }, false, 1 / 60);
    expect(further.blocked).toBe(true);
    expect(further.at!.x).toBeGreaterThan(0);
    expect(further.u).toBeGreaterThan(0); // wall-local u follows the camera's sight line
    expect(further.at!.z).toBeCloseTo(0);
    const lensInside = { x: 0, y: 2, z: 0.5 };
    const closing = sight.update(lensInside, inside, false, 0.1);
    expect(closing.blocked).toBe(false);
    expect(closing.clear).toBeGreaterThan(0);
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

it('keeps the surrounding fog wall visible, holds a localized torn hole while the camera is behind, and swirls it shut once inside', async () => {
  const { createBossFog } = await import('../src/render/bossFog');
  const { gatePlan } = await import('../src/world/gatePlan');
  const { worldLayout } = await import('../src/world/placements');
  const w = gatePlan(worldLayout()).fogs[0]!;
  const normal = { x: Math.sin(w.yaw), z: Math.cos(w.yaw) };
  const player = { x: w.x + 1.8 * normal.x, y: w.y, z: w.z + 1.8 * normal.z };
  const callbacks = new Map<string, (event: any) => void>();
  const recipe = vi.fn();
  const g = {
    events: { on: (name: string, callback: (event: any) => void) => callbacks.set(name, callback) },
    overworld: { slain: new Set<string>() },
    player: { id: 1, fogPass: null },
    ecs: { c: { transform: new Map([[1, { pos: player }]]), fight: new Map() } },
    world: { ground: () => w.y },
  } as never;
  const scene = new THREE.Scene();
  const fog = createBossFog(scene, g, { spawn: () => undefined } as never, { recipe, sample: () => undefined } as never);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(w.x - 3 * normal.x, w.y + 1.7, w.z - 3 * normal.z);
  fog.update(camera, 0, false);
  fog.update(camera, 1, false);
  const mesh = scene.children.find((o) => o.position.x === w.x && o.position.z === w.z) as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  const u = mesh.material.uniforms;
  expect(u.uVis.value).toBeGreaterThan(0);
  expect(u.uBreach.value.z).toBe(0);

  callbacks.get('FogPassed')!({ wall: w.id, x: player.x, z: player.z });
  fog.update(camera, 1.1, false);
  expect(u.uVis.value, 'surrounding fog wall never disappears').toBeGreaterThan(0.05);
  expect(u.uBreach.value.z, 'localized breach opens where the player passed').toBeGreaterThan(0.5);
  expect(u.uBreach.value.z, 'breach stays narrower than half the wall so jamb mist remains').toBeLessThan(w.width * 0.45);
  for (let t = 1.2; t <= 5.0; t += 0.1) fog.update(camera, t, false);
  expect(u.uVis.value, 'wall stays visible while camera remains behind').toBeGreaterThan(0.9);
  expect(u.uBreach.value.z, 'sight hole remains open without fixed timeout while camera is behind').toBeGreaterThan(0.5);

  // Camera enters: hole lingers briefly, then visibly swirls inward and seals shut.
  camera.position.set(w.x + normal.x, w.y + 1.7, w.z + normal.z);
  fog.update(camera, 5.1, false);
  const openAfterEnter = u.uBreach.value.z;
  expect(openAfterEnter, 'hole stays visible immediately as camera enters').toBeGreaterThan(0.4);
  for (let t = 5.2; t <= 6.2; t += 0.1) fog.update(camera, t, false);
  expect(u.uBreach.value.z, 'hole is actively shrinking closed').toBeLessThan(openAfterEnter);
  expect(u.uBreach.value.z, 'hole is still partly open mid-close').toBeGreaterThan(0.1);
  expect(u.uBreachFx.value.x, 'mist swirls inward while closing').toBeLessThan(0);
  for (let t = 6.3; t <= 8.5; t += 0.1) fog.update(camera, t, false);
  expect(u.uBreach.value.z, 'hole closes completely shut').toBe(0);
  expect(u.uVis.value, 'wall remains solid after closing').toBeGreaterThan(0.9);
  expect(recipe.mock.calls.some(([k]) => k === 'mist:close'), 'close sound plays when the breach seals').toBe(true);
});
