/** The driver's hands at work (round 57): a gallop leans, a slap lifts and snaps, a halt hauls the hands in to the chest, a turn draws the inside hand. */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { MOUNT_IDS } from '../src/data/mounts';
import { buildFigure } from '../src/render/figures';
import { createMount } from '../src/render/mounts';
import { CALM, poseMountedRider, riderCue, type RiderCue } from '../src/render/riderPose';
import { REINS, createReins, slapAt } from '../src/systems/mountReins';

function seated(id: 'grey' | 'chariot' | 'automobile' = 'grey') {
  const visual = createMount(id), rider = buildFigure('player');
  visual.seat.add(rider.root);
  visual.update({ time: 1, dt: 0, speed: 0 });
  const pose = (speed: number, cue: Partial<RiderCue> = {}, turn = 0) => {
    poseMountedRider(rider, id, 1, speed, turn, { ...CALM, ...cue });
    visual.root.updateMatrixWorld(true);
    const at = (o: THREE.Object3D): THREE.Vector3 => o.getWorldPosition(new THREE.Vector3());
    return { hands: { left: at(rider.handL), right: at(rider.handR) }, pelvis: at(rider.body), head: at(rider.head), torso: rider.torso.rotation.x };
  };
  return { visual, rider, pose };
}

describe('the driver works the reins (round 57)', () => {
  it('a haul draws both hands back toward the chest and sits the body back, and a calm hand does not', () => {
    const { pose } = seated();
    const calm = pose(0), haul = pose(0, { pull: 1 });
    for (const side of ['left', 'right'] as const) {
      expect(haul.hands[side].z - haul.pelvis.z, side).toBeLessThan(calm.hands[side].z - calm.pelvis.z - 0.1);
      expect(haul.hands[side].y, side).toBeGreaterThan(calm.hands[side].y - 0.1); // to the chest, not into the lap
    }
    expect(haul.torso).toBeLessThan(calm.torso - 0.15);
    const half = pose(0, { pull: 0.5 });
    expect(half.hands.left.z).toBeGreaterThan(haul.hands.left.z);
    expect(half.hands.left.z).toBeLessThan(calm.hands.left.z);
  });

  it('a slap lifts both hands, and the snap brings them down past where they rested', () => {
    const { pose } = seated();
    const calm = pose(10.5), up = slapAt(REINS.strikeAt), down = slapAt(REINS.strikeAt + 0.1);
    const lifted = pose(10.5, up), struck = pose(10.5, down);
    for (const side of ['left', 'right'] as const) {
      expect(lifted.hands[side].y, side).toBeGreaterThan(calm.hands[side].y + 0.08);
      expect(struck.hands[side].y, side).toBeLessThan(lifted.hands[side].y - 0.08);
    }
    expect(lifted.torso).toBeLessThan(calm.torso); // wound up, the body goes back a little
    expect(struck.torso).toBeGreaterThan(lifted.torso); // and is thrown forward into the snap
  });

  it('a gallop leans the driver forward with the eyes still on the road, and a turn draws the inside hand in', () => {
    const { pose, rider } = seated();
    const walk = pose(0), gallop = pose(10.5);
    expect(gallop.torso).toBeGreaterThan(walk.torso + 0.05);
    expect(rider.head.rotation.x).toBeLessThan(-0.035 - 0.03); // the head comes up against the lean
    const left = pose(7, { guide: 1 }), right = pose(7, { guide: -1 }), straight = pose(7);
    expect(left.hands.left.z).toBeLessThan(straight.hands.left.z - 0.04);
    expect(left.hands.right.z).toBeGreaterThan(left.hands.left.z + 0.03);
    expect(right.hands.right.z).toBeLessThan(straight.hands.right.z - 0.04);
  });

  it('every cue the simulation can give poses finite joints, and a motor car\'s driver ignores the reins', () => {
    const r = createReins();
    const { pose, rider } = seated();
    for (let age = -0.1; age < 1; age += 0.05) for (const pull of [0, 0.5, 1]) for (const guide of [-1, 0, 1]) {
      r.slapAge = age; r.pull = pull; r.guide = guide;
      pose(10.5, riderCue(r, 0.008));
      for (const joint of [rider.armL, rider.armR, rider.elbowL, rider.elbowR, rider.handL, rider.handR, rider.torso, rider.head]) {
        expect(Number.isFinite(joint.rotation.x + joint.rotation.y + joint.rotation.z)).toBe(true);
      }
      expect(rider.elbowL.rotation.x).toBeGreaterThan(-2.2); // an elbow bends no further than a man's
      expect(rider.elbowL.rotation.x).toBeLessThan(0);
    }
    const car = seated('automobile');
    const base = car.pose(10.5).hands.left.clone();
    const worked = car.pose(10.5, { pull: 1, lift: 1, snap: 1, guide: 1 }).hands.left;
    expect(worked.distanceTo(base)).toBeLessThan(1e-9);
  });

  it('the slap carries on between two steps of the simulation, and not past its end', () => {
    const r = createReins();
    r.slapAge = 0.2;
    expect(riderCue(r, 0.008).lift).toBeGreaterThan(riderCue(r, 0).lift);
    r.slapAge = REINS.total;
    expect(riderCue(r, 0.008)).toEqual({ ...CALM, ripple: -1 });
    expect(MOUNT_IDS).toContain('grey');
  });
});
