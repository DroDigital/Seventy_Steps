import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SPILL } from '../src/data/mistLight';
import { CLOCK } from '../src/data/tuning';
import { paneLit } from '../src/render/paneLife';
import { createSpillPlans, planSpill } from '../src/render/spillPlan';
import { createWindowSpill } from '../src/render/windowSpill';
import { createWorldLights, type LightSpot } from '../src/render/worldLights';
import type { Game } from '../src/systems/components';
import type { Collider, CollisionWorld } from '../src/world/colliders';

const flat = (colliders: Collider[] = [], ground: CollisionWorld['ground'] = () => 0): CollisionWorld => ({ colliders, off: new Set(), ground, contain: () => undefined });
/** A lit window in the wall at z = 0 looking toward +z, `x` along the wall and `y` up it; `pane` its seed. */
const win = (x: number, y = 2, pane = 0.05, z = 0): LightSpot & { glass: { x: number; y: number; z: number } } => ({ x, y, z: z + 0.52, kind: 'window', glass: { x, y, z }, pane });
const night = (phase: number): number => ((phase - CLOCK.start + 1) % 1) * CLOCK.night; // the seconds of play at which the night stands at `phase`
const eye = new THREE.Vector3(0, 1.7, 10);

function rig(world: CollisionWorld | null = flat()) {
  const scene = new THREE.Scene();
  const spill = createWindowSpill(scene, { world } as unknown as Game);
  const lights = createWorldLights();
  const mesh = scene.children[0] as THREE.Mesh;
  const count = (): number => (mesh.geometry as THREE.InstancedBufferGeometry).instanceCount;
  const frame = (time: number, on = true, from = eye): void => {
    lights.update(from, time, null);
    spill.update(time, on);
  };
  return { lights, mesh, count, frame, scene };
}

describe('the light of a lit window on the ground before it (round 78)', () => {
  it('runs out from the glass along the wall\'s normal, as far as the reach, on the ground it finds', () => {
    const p = planSpill(win(0), flat())!;
    expect(p).not.toBeNull();
    expect([p.nx, p.nz]).toEqual([0, 1]);
    expect(p.z).toBeCloseTo(SPILL.start, 6);
    expect(p.y).toBe(0);
    expect(p.length).toBeGreaterThan(SPILL.reach * 0.75);
    expect(p.length).toBeLessThan(SPILL.reach * 1.3);
    const high = planSpill(win(0, 4), flat())!;
    expect(high.length).toBeGreaterThan(p.length); // a higher window throws farther
  });

  it('follows a slope, and stops short of a wall, a fence or a tree in its way, and lays none where there is no room', () => {
    const slope = planSpill(win(0), flat([], (_x, z) => 0.1 * z))!;
    expect(slope.slopeAlong).toBeCloseTo(0.1, 6);
    const fence: Collider = { kind: 'box', min: { x: -3, y: 0, z: 2.5 }, max: { x: 3, y: 1.2, z: 2.7 } };
    const stopped = planSpill(win(0), flat([fence]))!;
    expect(stopped.length).toBeLessThan(2.5);
    expect(stopped.length).toBeGreaterThan(1.5);
    const tree: Collider = { kind: 'cylinder', x: 0, z: 1.1, radius: 0.4, y0: 0, y1: 6 };
    expect(planSpill(win(0), flat([tree]))).toBeNull(); // a trunk a metre from the glass: no ground to light
    const cage: Collider = { kind: 'box', min: { x: -3, y: 0, z: 2.5 }, max: { x: 3, y: 1.2, z: 2.7 }, lightPass: true };
    expect(planSpill(win(0), flat([cage]))!.length).toBeGreaterThan(SPILL.reach * 0.75); // light goes through a cage
    expect(planSpill(win(0, 9), flat())).toBeNull(); // too high
    expect(planSpill(win(0, 0.1), flat())).toBeNull(); // below the ground
  });

  it('is planned once for a window and kept', () => {
    let asks = 0;
    const world = flat([], () => (asks++, 0));
    const plans = createSpillPlans();
    const a = plans(win(0), world);
    const n = asks;
    expect(plans(win(0), world)).toBe(a);
    expect(asks).toBe(n);
    expect(plans(win(4), world)).not.toBe(a);
  });

  it('lays one instance for each lit window in reach of the eye, in one draw, and none for a window put out, behind the eye\'s reach, or a torch', () => {
    const { lights, count, frame, mesh } = rig();
    const t = night(0.3);
    expect(paneLit(0.05, t)).toBeGreaterThan(0.5);
    lights.add(1, [win(-2), win(2), { x: 3, y: 2, z: 0.5, kind: 'torch' }, { x: 0, y: 2, z: SPILL.within + 20, kind: 'window', glass: { x: 0, y: 2, z: SPILL.within + 19.5 }, pane: 0.05 }]);
    frame(t);
    expect(count()).toBe(2);
    expect(mesh.visible).toBe(true);
    frame(t, false); // under a roof
    expect(count()).toBe(0);
    expect(mesh.visible).toBe(false);
  });

  it('goes out with the window in the waning hour, and comes back when the night turns', () => {
    const { lights, count, frame } = rig();
    lights.add(1, [win(0, 2, 0.95), win(3, 2, 0.05)]);
    const dark = night(0.9);
    expect(paneLit(0.95, dark)).toBe(0);
    frame(dark);
    expect(count()).toBe(1); // the one whose seed the night has put out is gone
    frame(night(0.05));
    expect(count()).toBe(2);
  });

  it('holds to its capacity however many windows there are, nearest first', () => {
    const { lights, count, frame } = rig();
    lights.add(1, Array.from({ length: 80 }, (_, i) => win(-20 + i * 0.5, 2, 0.05, -((i % 4) * 3))));
    frame(night(0.3));
    expect(count()).toBe(SPILL.count);
  });

  it('does nothing without a world, or without lights', () => {
    const { count, frame, lights } = rig(null);
    lights.add(1, [win(0)]);
    frame(night(0.3));
    expect(count()).toBe(0);
  });
});
