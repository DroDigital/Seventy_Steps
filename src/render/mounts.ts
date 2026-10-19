/** Mounted traversal art: shared suspension and rider pose; two equally sized gameplay origins. */
import * as THREE from 'three';
import type { MountId } from '../data/mounts';
import { MOUNT_TRAVERSAL } from '../data/mounts';
import { cyclesFor } from '../systems/mountGait';
import { CASTER } from './moonShadow';
import { MountBuilder, type CoachWheel } from './mountKit';
import { automobileArt } from './mountAutomobile';
import { carriageArt } from './mountCarriage';
import { animateReins, type ReinHands } from './reinLines';
import { CALM, type RiderCue } from './riderPose';
import { SEAT_BACK, type Slab } from './lanternCover';
import { swayLamps } from './chariotFittings';

export type { MountId } from '../data/mounts';
export interface MountFrame {
  time: number; dt: number; speed: number;
  /** Gait cycles ridden since the summon (`MountState.phase`). Without it the exhibit counts them from its own speed. */
  cycle?: number;
  /** Signed turning intensity, -1..1. */
  turn?: number;
  /** Radians the horse is turned ahead of the carriage (to the left positive). */
  bend?: number;
  /** Ground relative to the root, sampled in local mount coordinates (+z forward). */
  ground?: (x: number, z: number) => number;
  /** What the driver's hands are doing (a pull, a slap's ripple): the horse answers it at the bit. */
  cue?: RiderCue;
  /** Someone is driving: the reins are drawn by `holdReins`, from their hands, once they are posed. */
  rider?: boolean;
}
export interface MountVisual {
  root: THREE.Group;
  /** Attach the investigator's feet-origin here, then apply poseMountedRider. */
  seat: THREE.Object3D;
  materials: THREE.ShaderMaterial[];
  update(frame: MountFrame): void;
  /** The seat back that stands between the driver's lantern and the camera behind: the slab, and the part of the mount it is in the frame of; null for a mount without one. */
  back: { at: THREE.Object3D; slab: Slab } | null;
  /** The reins from the driver's hands (in this mount's frame), after the driver is posed. */
  holdReins(hands: ReinHands, cue: RiderCue): void;
  dispose(): void;
}

export function createMount(id: MountId): MountVisual {
  const root = new THREE.Group(); root.name = `mount-${id}`;
  const b = new MountBuilder();
  const car = id === 'automobile' ? automobileArt(b, root) : null;
  const coach = id === 'chariot' || id === 'grey' ? carriageArt(b, root, id === 'grey') : null;
  const art = car ?? coach;
  if (!art) throw new Error(`unknown mount ${id}`);
  const wheels = car?.wheels ?? coach?.wheels ?? [];
  const materials = [...b.materials, ...(coach ? coach.horses.map((horse) => horse.flame.material) : [])];
  // The global depth-only shadow shader has no instance transform. Ordinary coachwork casts;
  // animated limb instances stay out of that pass instead of casting their unposed rest mesh.
  root.traverse(o => {
    if (o instanceof THREE.Mesh && !(o instanceof THREE.InstancedMesh) && ![o.material].flat().some(m => m.transparent)) o.layers.enable(CASTER);
  });
  let distance = 0, phase = 0, cycle = 0, lastSpeed = 0, accel = 0;
  const shown = { time: 0, pace: 0 }; // the frame the reins are drawn for, when the driver's hands are known
  function poseWheel(w: CoachWheel, turn: number, ground?: MountFrame['ground']): void {
    w.pivot.position.y = w.radius + (ground?.(w.x, w.z) ?? 0);
    w.pivot.rotation.y = w.steer ? turn * 0.3 : 0;
    w.spin.rotation.x = distance / w.radius;
  }
  return { root, seat: art.seat, materials, back: coach ? { at: coach.body, slab: SEAT_BACK } : null,
    holdReins(hands, cue) {
      if (coach) animateReins(coach, shown.time, shown.pace, hands, cue);
    },
    update({ time, dt, speed, turn = 0, bend = 0, ground, cycle: ridden, cue = CALM, rider = false }) {
      const step = Math.max(0, Math.min(0.1, dt)), pace = Math.max(0, speed), steer = Math.max(-1, Math.min(1, turn));
      shown.time = time; shown.pace = pace;
      distance = (distance + pace * step) % (Math.PI * 2 * 1e4);
      if (ridden === undefined) cycle += cyclesFor(pace * step, pace);
      else cycle = Math.abs(ridden - cycle) > 0.75 ? ridden : cycle + (ridden - cycle) * Math.min(1, step * 40); // the simulation's count, eased between its steps
      phase = (cycle * Math.PI * 2) % (Math.PI * 2);
      const rear = ground?.(0, -1.1) ?? 0, front = ground?.(0, 0.65) ?? 0;
      const left = ground?.(-0.8, -0.2) ?? 0, right = ground?.(0.8, -0.2) ?? 0;
      const movement = Math.min(1, pace / 2), suspension = Math.sin(distance * 7.1) * 0.018 + Math.sin(distance * 11.9) * 0.008;
      art.body.position.y = (rear + front) * 0.5 + suspension * movement;
      art.body.rotation.x = Math.max(-0.22, Math.min(0.22, -Math.atan2(front - rear, 1.75))) + Math.max(-0.035, Math.min(0.035, (lastSpeed - pace) * 0.025));
      art.body.rotation.z = Math.max(-0.2, Math.min(0.2, Math.atan2(right - left, 1.6))) - steer * 0.035 * movement;
      for (const w of wheels) poseWheel(w, steer, ground);
      if (car) car.steering.rotation.z = -steer * 0.48;
      if (coach) {
        const answer = { check: cue.pull, urge: cue.arrive }; // the horse feels the reins at the bit: a haul on them, a ripple's end
        for (const horse of coach.horses) horse.update(time, phase, pace, steer, ground, bend, answer);
        coach.draft?.update(time, cycle, pace, steer, ground, bend, answer);
        if (!rider) animateReins(coach, time, pace);
        if (coach.lamps.length && step > 0) { // the lanterns hang plumb while the box speeds up, brakes, comes round and tilts about them
          accel += ((pace - lastSpeed) / step - accel) * Math.min(1, step * 10);
          swayLamps(coach.lamps, { dt: step, time, cycle, accel, lateral: pace * steer * 1.1, speed: Math.min(1, pace / MOUNT_TRAVERSAL.gallop), pitch: art.body.rotation.x, roll: art.body.rotation.z });
        }
      }
      lastSpeed = pace;
    },
    dispose() {
      root.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
      for (const material of materials) material.dispose(); root.removeFromParent();
    },
  };
}

export { CALM, poseMountedRider, riderCue, type RiderCue } from './riderPose';
