/** The seat back hides the driver's lantern (round 57): no gap under it, no halo over it, no light through it. */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SEAT_BACK, slabCover } from '../src/render/lanternCover';
import { buildFigure } from '../src/render/figures';
import { createMountViews } from '../src/render/mountViews';
import { createMount, poseMountedRider } from '../src/render/mounts';
import { worldUniforms } from '../src/render/worldMaterial';
import { createGame } from '../src/systems/game';

const at = (x: number, y: number, z: number): { x: number; y: number; z: number } => ({ x, y, z });

describe('how much of a light a slab takes from an eye (round 57)', () => {
  const slab = SEAT_BACK;
  it('all of it behind the slab, none from the same side, and a soft edge between', () => {
    const lamp = at(0.3, 1.2, 0.1); // in front of it, at the driver's hip
    expect(slabCover(slab, at(0, 1.5, -4), lamp)).toBe(1); // the camera behind, in line with it
    expect(slabCover(slab, at(0.4, 1.0, -3), lamp)).toBe(1); // low: through where a gap was
    expect(slabCover(slab, at(0, 1.5, 4), lamp)).toBe(0); // in front of it: nothing between
    expect(slabCover(slab, at(5, 1.5, -1), lamp)).toBe(0); // beside it, past its edge
    const edge = slabCover(slab, at(slab.halfX + 0.5, 1.5, -2.2), at(slab.halfX + 0.5, 1.5, 0.1), 0.3); // a line crossing just outside the edge
    expect(edge).toBeLessThan(1e-9);
    const soft = slabCover(slab, at(slab.halfX + 0.1, 1.5, -2.2), at(slab.halfX + 0.1, 1.5, 0.1), 0.3);
    expect(soft).toBeGreaterThan(0.1);
    expect(soft).toBeLessThan(0.95);
    const covered = slabCover(slab, at(0, 1.5, -2.2), at(0, 1.5, 0.1), 0.3);
    expect(covered).toBe(1);
  });

  it('is continuous as the eye goes round the edge, and always between 0 and 1', () => {
    const lamp = at(0.3, 1.2, 0.1);
    let last = slabCover(slab, at(-2, 1.4, -4), lamp);
    for (let x = -2; x <= 2; x += 0.01) {
      const c = slabCover(slab, at(x, 1.4, -4), lamp);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1);
      expect(Math.abs(c - last)).toBeLessThan(0.2);
      last = c;
    }
  });
});

describe('nothing of the driver\'s lantern shows through the seat back of a chariot (round 57)', () => {
  it.each(['grey', 'chariot'] as const)('%s: from any eye behind it whose line to the lantern crosses the back, the back is in the way', (id) => {
    const visual = createMount(id), rider = buildFigure('player');
    visual.seat.add(rider.root);
    visual.update({ time: 1, dt: 0, speed: 0 });
    poseMountedRider(rider, id, 1, 0);
    visual.root.updateMatrixWorld(true);
    const flame = rider.flame!.getWorldPosition(new THREE.Vector3());
    const solid: THREE.Mesh[] = [];
    visual.root.traverse((o) => { if (o instanceof THREE.Mesh && o.geometry.getAttribute('position').count > 1000) solid.push(o); }); // the coachwork (not the reins, a thin ribbon)
    const ray = new THREE.Raycaster();
    const back = visual.back!;
    const inner = { ...back.slab, halfX: back.slab.halfX - 0.03, y0: back.slab.y0 + 0.03, y1: back.slab.y1 - 0.03 };
    let checked = 0;
    for (let z = -2.5; z >= -7; z -= 0.75) for (let x = -1.2; x <= 1.2; x += 0.2) for (let y = 0.9; y <= 4.2; y += 0.15) {
      const eye = new THREE.Vector3(x, y, z);
      const [le, ll] = [back.at.worldToLocal(eye.clone()), back.at.worldToLocal(flame.clone())];
      if (slabCover(inner, le, ll, 1e-6) < 1) continue; // its line passes outside the slab: others hide it, or nothing does
      const to = flame.clone().sub(eye);
      ray.set(eye, to.clone().normalize());
      ray.far = to.length() - 0.02;
      const hits = ray.intersectObjects(solid, false);
      expect(hits.length, `${id} eye (${x.toFixed(1)}, ${y.toFixed(2)}, ${z})`).toBeGreaterThan(0);
      checked++;
    }
    expect(checked).toBeGreaterThan(40);
    visual.dispose();
  });
});

describe('the views tell the shaders and the halo about the seat back (round 57)', () => {
  it('a rig being ridden shades what lies behind its seat back, a halo seen through it is taken, and dismounting puts it all away', () => {
    const g = createGame(), scene = new THREE.Scene(), f = buildFigure('player');
    const view = createMountViews(scene, g);
    expect(view.cover(new THREE.Vector3(0, 1.5, -4), new THREE.Vector3(0, 1.2, 0))).toBe(0);
    g.player.mount.active = 'grey';
    for (let i = 0; i < 8; i++) { f.root.position.set(5, 0, 5); view.place(f, i / 10, 0.1); }
    const u = worldUniforms.uLSlab.value;
    expect(u.x).toBeCloseTo(SEAT_BACK.halfX);
    expect([u.y, u.z, u.w]).toEqual([SEAT_BACK.y0, SEAT_BACK.y1, SEAT_BACK.z]);
    const mount = scene.getObjectByName('mount-grey')!;
    mount.updateMatrixWorld(true);
    const behind = mount.localToWorld(new THREE.Vector3(0, 1.5, -4)), lamp = mount.localToWorld(new THREE.Vector3(0.3, 1.2, 0.1)), front = mount.localToWorld(new THREE.Vector3(0, 1.5, 4));
    expect(view.cover(behind, lamp)).toBe(1);
    expect(view.cover(front, lamp)).toBe(0);
    const inv = worldUniforms.uLSlabInv.value;
    const local = mount.getObjectByName('plain-chariot')!.worldToLocal(lamp.clone());
    expect(new THREE.Vector3().copy(lamp).applyMatrix4(inv).distanceTo(local)).toBeLessThan(1e-4); // the shaders' world to the back's frame
    g.player.mount.active = null;
    for (let i = 0; i < 8; i++) { f.root.position.set(5, 0, 5); view.place(f, 2 + i / 10, 0.1); }
    expect(worldUniforms.uLSlab.value.x).toBe(0);
    expect(view.cover(behind, lamp)).toBe(0);
  });
});
