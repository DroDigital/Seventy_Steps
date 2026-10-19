/** The chariot's lanterns, hung on the sides from iron crooks and swinging on their rings as the rig goes (round 57). */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createMount } from '../src/render/mounts';
import { SWAY, createSway, stepSway, type SwayDrive } from '../src/render/lanternSway';

const still: SwayDrive = { accel: 0, lateral: 0, pitch: 0, roll: 0, speed: 0, time: 0, cycle: 0, seed: 1 };
const run = (s = createSway(), seconds: number, drive: (t: number) => Partial<SwayDrive>, hz = 60) => {
  let peak = { x: 0, z: 0 };
  for (let i = 0; i < seconds * hz; i++) {
    const t = i / hz;
    stepSway(s, 1 / hz, { ...still, time: t, ...drive(t) });
    peak = { x: Math.max(peak.x, Math.abs(s.x)), z: Math.max(peak.z, Math.abs(s.z)) };
  }
  return { s, peak };
};

describe('a lantern on its ring swings with the ride (round 57)', () => {
  it('hangs still when the rig does', () => {
    const { s } = run(createSway(), 5, () => ({}));
    expect(s).toEqual({ x: 0, z: 0, vx: 0, vz: 0 });
  });

  it('lags when the box speeds up, swings on when it brakes, and is thrown out of a turn', () => {
    const speeding = run(createSway(), 0.6, () => ({ accel: 8.2 })).s;
    expect(speeding.x).toBeGreaterThan(0.03); // swings back
    const braking = run(createSway(), 0.6, () => ({ accel: -15 })).s;
    expect(braking.x).toBeLessThan(-0.03); // swings on, forward
    const left = run(createSway(), 0.6, () => ({ lateral: 7 })).s;
    expect(left.z).toBeLessThan(-0.02); // a left turn throws it to the right
    const right = run(createSway(), 0.6, () => ({ lateral: -7 })).s;
    expect(right.z).toBeGreaterThan(0.02);
  });

  it('rings down in a few swings once the push is over, and never swings past its limit', () => {
    const s = createSway();
    const { peak } = run(s, 1, () => ({ accel: -60, lateral: 60 }));
    expect(peak.x).toBeLessThanOrEqual(SWAY.limit + 1e-9);
    expect(peak.z).toBeLessThanOrEqual(SWAY.limit + 1e-9);
    run(s, 5, () => ({}));
    expect(Math.abs(s.x) + Math.abs(s.z)).toBeLessThan(0.005);
  });

  it('trembles a little with the road at a gallop: small, never still, and not at all at rest', () => {
    const { peak } = run(createSway(), 12, (t) => ({ speed: 1, cycle: t * 2.5 }));
    expect(peak.x).toBeGreaterThan(0.01);
    expect(peak.x).toBeLessThan(0.14);
    expect(peak.z).toBeGreaterThan(0.005);
    expect(peak.z).toBeLessThan(0.14);
    const walking = run(createSway(), 12, (t) => ({ speed: 0.2, cycle: t * 1 })).peak;
    expect(walking.x).toBeLessThan(peak.x);
    const s = createSway();
    run(s, 4, (t) => ({ speed: 1, cycle: t * 2.5 }));
    run(s, 6, () => ({ speed: 0, cycle: 0 }));
    expect(Math.abs(s.x) + Math.abs(s.z)).toBeLessThan(0.005);
  });

  it('hangs plumb while the box tilts about it, and survives a stall or a bad number', () => {
    const { s } = run(createSway(), 6, () => ({ pitch: 0.2, roll: -0.1 }));
    expect(s.x).toBeCloseTo(-0.2 * SWAY.tilt, 2);
    expect(s.z).toBeCloseTo(0.1 * SWAY.tilt, 2);
    const t = createSway();
    stepSway(t, 5, { ...still, accel: 8 });
    expect(Number.isFinite(t.x + t.z)).toBe(true);
    stepSway(t, 1 / 60, { ...still, accel: NaN });
    expect(Number.isFinite(t.x + t.z + t.vx + t.vz)).toBe(true);
  });

  it('the two lanterns do not shiver as one', () => {
    const a = run(createSway(), 3, (t) => ({ speed: 1, cycle: t * 2.5, seed: 3 - 1.7 })).s;
    const b = run(createSway(), 3, (t) => ({ speed: 1, cycle: t * 2.5, seed: 3 + 1.7 })).s;
    expect(Math.abs(a.x - b.x) + Math.abs(a.z - b.z)).toBeGreaterThan(0.001);
  });
});

describe('the chariot has a lantern on each side, hung from a hook (round 57)', () => {
  const lamps = (root: THREE.Object3D): THREE.Object3D[] => { const out: THREE.Object3D[] = []; root.traverse((o) => { if (o.name === 'side-lantern') out.push(o); }); return out; };

  it('one each side, beside the driver, outside the box and clear of the wheels, hanging below the hook by its loop', () => {
    const visual = createMount('grey');
    visual.update({ time: 0, dt: 0, speed: 0 });
    visual.root.updateMatrixWorld(true);
    const found = lamps(visual.root);
    expect(found).toHaveLength(2);
    expect(found.map((l) => Math.sign(l.position.x)).sort()).toEqual([-1, 1]);
    for (const pivot of found) {
      expect(Math.abs(pivot.position.x)).toBeGreaterThan(0.9); // outside the side panels (0.78), by a crook
      expect(Math.abs(pivot.position.x)).toBeLessThan(1.1); // and no wider than the wheels
      expect(pivot.position.z).toBeGreaterThan(-0.5); // beside the driver's hip, not back by the tail
      expect(pivot.position.z).toBeLessThan(0.1);
      const box = new THREE.Box3().setFromObject(pivot).applyMatrix4(pivot.matrixWorld.clone().invert());
      expect(box.max.y).toBeLessThan(0.02); // its loop reaches the hook, and no higher
      expect(box.max.y).toBeGreaterThan(-0.08);
      expect(box.min.y).toBeGreaterThan(-0.45);
      expect(box.max.x - box.min.x).toBeLessThan(0.3);
    }
    expect(lamps(createMount('chariot').root)).toHaveLength(0); // the spectral coach keeps its lamps on its posts
    visual.dispose();
  });

  it('they swing when it rides and hang still when it stands', () => {
    const visual = createMount('grey');
    const pivots = lamps(visual.root);
    for (let i = 0; i < 120; i++) visual.update({ time: i / 60, dt: 1 / 60, speed: 0 });
    expect(pivots.every((p) => p.rotation.x === 0 && p.rotation.z === 0)).toBe(true);
    let moved = 0;
    for (let i = 0; i < 240; i++) {
      visual.update({ time: 2 + i / 60, dt: 1 / 60, speed: 10.5, cycle: i / 60 * 2.5, turn: i > 120 ? 0.8 : 0 });
      moved = Math.max(moved, ...pivots.map((p) => Math.abs(p.rotation.x) + Math.abs(p.rotation.z)));
    }
    expect(moved).toBeGreaterThan(0.02);
    expect(moved).toBeLessThan(0.7);
    visual.dispose();
  });
});
