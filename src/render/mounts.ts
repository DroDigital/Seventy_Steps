/** Mounted traversal art: shared suspension and rider pose; two equally sized gameplay origins. */
import * as THREE from 'three';
import type { MountId } from '../data/mounts';
import { cyclesFor } from '../systems/mountGait';
import { CASTER } from './moonShadow';
import { MountBuilder, type CoachWheel } from './mountKit';
import { automobileArt } from './mountAutomobile';
import { animateReins, carriageArt } from './mountCarriage';
import type { Figure } from './figures';

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
}
export interface MountVisual {
  root: THREE.Group;
  /** Attach the investigator's feet-origin here, then apply poseMountedRider. */
  seat: THREE.Object3D;
  materials: THREE.ShaderMaterial[];
  update(frame: MountFrame): void;
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
  let distance = 0, phase = 0, cycle = 0, lastSpeed = 0;
  function poseWheel(w: CoachWheel, turn: number, ground?: MountFrame['ground']): void {
    w.pivot.position.y = w.radius + (ground?.(w.x, w.z) ?? 0);
    w.pivot.rotation.y = w.steer ? turn * 0.3 : 0;
    w.spin.rotation.x = distance / w.radius;
  }
  return { root, seat: art.seat, materials,
    update({ time, dt, speed, turn = 0, bend = 0, ground, cycle: ridden }) {
      const step = Math.max(0, Math.min(0.1, dt)), pace = Math.max(0, speed), steer = Math.max(-1, Math.min(1, turn));
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
        for (const horse of coach.horses) horse.update(time, phase, pace, steer, ground, bend);
        coach.draft?.update(time, cycle, pace, steer, ground, bend);
        animateReins(coach, time, pace);
      }
      lastSpeed = pace;
    },
    dispose() {
      root.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
      for (const material of materials) material.dispose(); root.removeFromParent();
    },
  };
}

/** A seated driver with bent knees, hands on reins/wheel, weight braced through acceleration and turns. */
export function poseMountedRider(f: Figure, id: MountId, time: number, speed: number, turn = 0): void {
  const moving = Math.min(1, Math.max(0, speed) / 3), reins = id !== 'automobile';
  f.body.position.set(0, 0.48 + Math.sin(time * 7) * 0.008 * moving, 0);
  f.body.rotation.set(0.045 + moving * 0.035, 0, -turn * 0.025);
  f.torso.rotation.set(Math.sin(time * 1.6) * 0.012, turn * 0.05, 0);
  f.head.rotation.set(-0.035, turn * 0.15, 0);
  for (const [leg, knee, foot, side] of [[f.legR, f.kneeR, f.footR, -1], [f.legL, f.kneeL, f.footL, 1]] as const) {
    leg.rotation.set(-1.38, 0, side * 0.08); knee.rotation.set(1.32, 0, 0); foot.rotation.set(0.04, 0, 0);
  }
  for (const [arm, elbow, hand, side] of [[f.armR, f.elbowR, f.handR, -1], [f.armL, f.elbowL, f.handL, 1]] as const) {
    arm.rotation.set(reins ? -0.65 : -0.9, side * -0.12, side * 0.08);
    elbow.rotation.set(reins ? -0.93 : -0.55, 0, 0); hand.rotation.set(0, 0, side * 0.12);
  }
  for (const skirt of f.skirt) skirt.rotation.x = -1.05;
  for (const weapon of Object.values(f.arms ?? {})) weapon.visible = false;
  if (f.gun) f.gun.visible = false;
  if (f.flash) f.flash.visible = false;
}
