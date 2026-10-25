import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DARTER, STEP } from '../src/data/dreadPicture';
import { darterEvery, darterGone, darterStart, heldBreath, mayStep, stepEvery, stepOf } from '../src/render/watcherSteps';
import { createWatchers, WATCHING } from '../src/render/watchers';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';

afterEach(() => vi.restoreAllMocks());

describe('the watchers\' steps (pure)', () => {
  it('step only after STEP.after seconds, only well out of the picture, and only when due', () => {
    const half = 0.5;
    expect(mayStep(STEP.after + 1, 2, half, 10, 9)).toBe(true);
    expect(mayStep(STEP.after - 1, 2, half, 10, 9)).toBe(false); // too young
    expect(mayStep(STEP.after + 1, half + STEP.turned - 0.01, half, 10, 9)).toBe(false); // too near the edge of the picture
    expect(mayStep(STEP.after + 1, 0.1, half, 10, 9)).toBe(false); // in view
    expect(mayStep(STEP.after + 1, -2, half, 10, 9)).toBe(true); // (either side)
    expect(mayStep(STEP.after + 1, 2, half, 8, 9)).toBe(false); // not due
  });

  it('come a stride nearer, never within STEP.closest metres', () => {
    expect(stepOf(60, 0)).toBe(STEP.metres[0]);
    expect(stepOf(60, 1)).toBe(STEP.metres[1]);
    expect(stepOf(STEP.closest + 0.4, 1)).toBeCloseTo(0.4, 9);
    expect(stepOf(STEP.closest, 1)).toBe(0);
    expect(stepOf(10, 1)).toBe(0);
    expect(stepEvery(0)).toBe(STEP.every[0]);
    expect(stepEvery(1)).toBe(STEP.every[1]);
  });

  it('hush the bed for each that stands, to a most', () => {
    expect(heldBreath(0)).toBe(0);
    expect(heldBreath(1)).toBe(STEP.held);
    expect(heldBreath(3)).toBe(STEP.heldMost);
  });

  it('darters begin at the edge the lens swings toward, and only while it swings', () => {
    expect(darterStart(0.3, 0.5, 0, 0)).toBeNull();
    expect(darterStart(-0.69, 0.5, 0, 0)).toBeNull();
    const right = darterStart(1, 0.5, 0.5, 0.5)!;
    const left = darterStart(-1, 0.5, 0.5, 0.5)!;
    expect(right.offset).toBeCloseTo(0.5 * DARTER.edge, 9);
    expect(left.offset).toBeCloseTo(-0.5 * DARTER.edge, 9);
    expect(right.distance).toBeGreaterThanOrEqual(DARTER.near[0]);
    expect(right.distance).toBeLessThanOrEqual(DARTER.near[1]);
    expect(right.speed).toBeGreaterThanOrEqual(DARTER.speed[0]);
    expect(right.speed).toBeLessThanOrEqual(DARTER.speed[1]);
    expect(darterEvery(0)).toBe(DARTER.every[0]);
    expect(darterGone(0.1)).toBe(true);
    expect(darterGone(0.4)).toBe(false);
  });
});

describe('the watchers\' steps and the darters (round 78)', () => {
  const setup = (): { g: ReturnType<typeof createWorldGame>; scene: THREE.Scene; camera: THREE.PerspectiveCamera; w: ReturnType<typeof createWatchers> } => {
    const g = createWorldGame();
    const scene = new THREE.Scene();
    const w = createWatchers(scene, g);
    const camera = new THREE.PerspectiveCamera();
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    camera.position.set(me.x, me.y + 1.6, me.z);
    camera.updateMatrixWorld();
    let n = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (((n = (n * 7 + 3) % 97) + 0.5) / 97) * 0.2);
    return { g, scene, camera, w };
  };
  const run = (w: ReturnType<typeof createWatchers>, camera: THREE.Camera, from: number, seconds: number, each?: (t: number) => void): void => {
    for (let t = 0; t < seconds; t += 0.05) {
      each?.(t);
      w.update(camera, from + t, false, () => undefined);
    }
  };
  const nearest = (scene: THREE.Scene, camera: THREE.Camera): number => Math.min(...scene.children.map((m) => Math.hypot(m.position.x - camera.position.x, m.position.z - camera.position.z)));

  it('one that stands unseen comes nearer, a step at a time, but not at first and never within 26 m', () => {
    const { g, scene, camera, w } = setup();
    setSanity(g, 5);
    run(w, camera, 100, 12);
    const placed = scene.children.map((m) => m.position.clone());
    expect(placed.length).toBeGreaterThan(0);
    run(w, camera, 112, STEP.after - 14); // still young
    expect(scene.children.map((m) => m.position.toArray())).toEqual(expect.arrayContaining(placed.map((p) => p.toArray())));
    const before = nearest(scene, camera);
    run(w, camera, 126, 25); // unseen, and old enough
    expect(nearest(scene, camera)).toBeLessThan(before - 2);
    run(w, camera, 151, 30);
    for (const m of scene.children) expect(Math.hypot(m.position.x - camera.position.x, m.position.z - camera.position.z)).toBeGreaterThanOrEqual(STEP.closest - 1e-6);
  });

  it('does not step while it is in the picture', () => {
    const { g, scene, camera, w } = setup();
    setSanity(g, 5);
    run(w, camera, 100, 8);
    const target = scene.children[0];
    expect(target).toBeDefined();
    const at = target.position.clone();
    // turn the lens so the watcher stands at 0.3 rad from the middle: in the picture (half 0.44), but not looked at squarely (0.22)
    const bearing = Math.atan2(at.x - camera.position.x, at.z - camera.position.z);
    camera.rotation.set(0, bearing + 0.3 + Math.PI, 0);
    camera.updateMatrixWorld(true);
    run(w, camera, 108, STEP.after + 12, () => camera.updateMatrixWorld(true));
    if (scene.children.includes(target)) expect(target.position.distanceTo(at)).toBeLessThan(1e-9);
  });

  it('count while they stand, and the count falls to nothing with them', () => {
    const { g, scene, camera, w } = setup();
    setSanity(g, 5);
    run(w, camera, 100, 15);
    expect(WATCHING.count).toBe(scene.children.length);
    expect(WATCHING.count).toBeGreaterThan(0);
    setSanity(g, 100);
    run(w, camera, 115, 3);
    expect(WATCHING.count).toBe(0);
  });

  it('send no darter while the lens is still, or the mind is steady', () => {
    const { g, scene, camera, w } = setup();
    setSanity(g, 5);
    let darting = 0;
    run(w, camera, 100, 220, () => void (darting = Math.max(darting, scene.children.filter((m) => Math.hypot(m.position.x - camera.position.x, m.position.z - camera.position.z) < 20).length)));
    expect(darting).toBe(0);
    setSanity(g, 100);
    run(w, camera, 400, 3);
    const swung = createWorldGame();
    const s2 = new THREE.Scene();
    const w2 = createWatchers(s2, swung);
    let yaw = 0;
    const cam = new THREE.PerspectiveCamera();
    cam.position.set(camera.position.x, camera.position.y, camera.position.z);
    for (let t = 0; t < 220; t += 0.05) {
      yaw += 0.05 * 1.6;
      cam.rotation.set(0, yaw, 0);
      cam.updateMatrixWorld(true);
      w2.update(cam, 600 + t, false, () => undefined);
    }
    expect(s2.children.filter((m) => Math.hypot(m.position.x - cam.position.x, m.position.z - cam.position.z) < 20)).toHaveLength(0); // (a steady mind: watchersFor 0)
  });

  it('send one across the edge of the picture while the lens swings, at 9 to 15 m, and it is gone within its second', () => {
    const { g, scene, camera, w } = setup();
    setSanity(g, 5);
    let yaw = 0;
    let seen: THREE.Object3D | null = null;
    let first = 0;
    let gone = -1;
    for (let t = 0; t < 400 && gone < 0; t += 0.05) {
      yaw += 0.05 * 1.6;
      camera.rotation.set(0, yaw, 0);
      camera.updateMatrixWorld(true);
      w.update(camera, 100 + t, false, () => undefined);
      const near = scene.children.find((m) => Math.hypot(m.position.x - camera.position.x, m.position.z - camera.position.z) < 20);
      if (near && !seen) [seen, first] = [near, t];
      if (seen && !scene.children.includes(seen)) gone = t;
      if (seen && scene.children.includes(seen)) {
        const d = Math.hypot(seen.position.x - camera.position.x, seen.position.z - camera.position.z);
        expect(d).toBeGreaterThan(DARTER.near[0] - 1);
        expect(d).toBeLessThan(DARTER.near[1] + DARTER.speed[1] * DARTER.seconds);
      }
    }
    expect(seen).not.toBeNull();
    expect(first).toBeGreaterThan(DARTER.every[0] - 1); // none before the first interval
    expect(gone - first).toBeLessThanOrEqual(DARTER.seconds + 0.1);
  });
});
