/**
 * How one pose becomes the next (render only: poses.ts stays a pure function of the move). Round 116: inertialization (render/inertia.ts)
 * where a frozen crossfade was. When a figure's move or guard changes, or a move begins again (a second roll out of the first, a shot
 * after a shot), what each joint and the pelvis's place are off the new pose, and how fast that was changing over the last frame drawn,
 * are taken and decayed to nothing over a moment, laid each frame over the new pose as it plays. So a swing called off by the guard goes
 * on a little the way it was going and turns into the guard, a blow cut short by a stagger is carried from where it was moving, a chain's
 * next strike flows out of the last; no joint stops dead at the change (the crossfade held the old pose still and eased out of it), and
 * none jumps.
 */

import * as THREE from 'three';
import type { Figure } from './figures';
import { decayAt, decayOf, NO_DECAY, type Decay } from './inertia';

export const POSE_BLEND = {
  seconds: 0.15, // the longest a difference takes to go (the crossfade was 0.12 s)
  stale: 0.25, // seconds without a frame drawn after which the pose last drawn is no measure of the next: the change is not eased (the figure was hidden)
};

export interface PoseBlend {
  /** Before posing: a new move or guard, or the move begun again (its frame gone back), starts a transition from the pose last drawn. */
  watch(move: string | null, guard: boolean, time: number, frame?: number): void;
  /** After posing: lays what is left of the difference over the new pose. */
  apply(time: number): void;
}

const [off, back, unit] = [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()];
const [axisV, vec] = [new THREE.Vector3(), new THREE.Vector3()];

/** The rotation `q` as an axis (into `axis`) and an angle, the short way round. */
function axisAngle(q: THREE.Quaternion, axis: THREE.Vector3): number {
  const s = q.w < 0 ? -1 : 1;
  const sin = Math.hypot(q.x, q.y, q.z);
  if (sin < 1e-9) return (axis.set(1, 0, 0), 0);
  axis.set((q.x * s) / sin, (q.y * s) / sin, (q.z * s) / sin);
  return 2 * Math.atan2(sin, Math.abs(q.w));
}

interface Joint {
  last: THREE.Quaternion; // as drawn the last frame, and the frame before
  prev: THREE.Quaternion;
  axis: THREE.Vector3; // the transition's axis and its decay
  decay: Decay;
}

export function createPoseBlend(f: Figure): PoseBlend {
  const list = [f.body, f.torso, f.head, f.armR, f.armL, f.elbowR, f.elbowL, f.handR, f.handL, f.legR, f.legL, f.kneeR, f.kneeL, f.footR, f.footL, ...f.skirt]; // (not the lantern: it swings live, render/lanternSwing.ts)
  const joints: Joint[] = list.map((j) => ({ last: j.quaternion.clone(), prev: j.quaternion.clone(), axis: new THREE.Vector3(1, 0, 0), decay: NO_DECAY }));
  const hip = { last: f.body.position.clone(), prev: f.body.position.clone(), axis: new THREE.Vector3(1, 0, 0), decay: NO_DECAY };
  let [was, guarded, frameWas] = [null as string | null, false, 0];
  let [drawn, before, start] = [-Infinity, -Infinity, -Infinity]; // when the last frame and the one before it were drawn, and when the transition began
  let pending = false;

  /** Takes the transition from the poses last drawn to the new one now set on the joints. */
  function begin(): void {
    pending = false;
    const dt = drawn - before;
    const rate = dt > 1e-4 && dt < 0.1 ? 1 / dt : 0; // (no measure of speed from a frame long ago)
    start = drawn; // the difference is the last frame's: the first frame of the new pose is a frame into it, so the change shows at once
    list.forEach((j, i) => {
      const s = joints[i];
      unit.copy(j.quaternion).invert();
      const x0 = axisAngle(off.multiplyQuaternions(s.last, unit), s.axis);
      const xPrev = axisAngle(back.multiplyQuaternions(s.prev, unit), axisV); // (the change of the difference's size: d|r|/dt is the speed along its axis, and over a frame in which the axis turns it is the truer measure)
      s.decay = decayOf(x0, (x0 - xPrev) * rate, POSE_BLEND.seconds);
    });
    vec.subVectors(hip.last, f.body.position);
    const x0 = vec.length();
    hip.axis.copy(vec).divideScalar(Math.max(x0, 1e-9));
    hip.decay = decayOf(x0, (x0 - axisV.subVectors(hip.prev, f.body.position).length()) * rate, POSE_BLEND.seconds);
  }

  return {
    watch(move, guard, time, frame = 0) {
      const again = move !== null && move === was && frame < frameWas - 0.5; // the same move begun again
      if (move !== was || guard !== guarded || again) pending = time - drawn < POSE_BLEND.stale;
      [was, guarded, frameWas] = [move, guard, frame];
    },
    apply(time) {
      if (pending) begin();
      const t = time - start;
      list.forEach((j, i) => {
        const s = joints[i];
        const x = decayAt(s.decay, t);
        if (x !== 0) j.quaternion.premultiply(off.setFromAxisAngle(s.axis, x));
        s.prev.copy(s.last);
        s.last.copy(j.quaternion);
      });
      const x = decayAt(hip.decay, t);
      if (x !== 0) f.body.position.addScaledVector(hip.axis, x);
      hip.prev.copy(hip.last);
      hip.last.copy(f.body.position);
      [before, drawn] = [drawn, time];
    },
  };
}
