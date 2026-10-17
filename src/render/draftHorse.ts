/**
 * The included chariot's horse (round 50): a chestnut draft horse in black harness, built here (horseBody.ts, horseLegs.ts) and
 * rigged on the joints a horse has. Its feet are placed by the shared gait (systems/mountGait.ts): each foot stands still on the
 * ground while it is down, folds through the air, and comes down on the frame the hoofbeat is heard; the two bones of each leg bend
 * by a two-bone solve so the knees fold forward and the hocks drive back, and the whole body rides over them: a stooped crouch at
 * speed, a rocking back in the canter, the neck nodding in the walk and reaching out in the gallop. Standing, it breathes, flicks
 * an ear, swishes its tail and, now and then, paws the ground. Render only.
 */
import * as THREE from 'three';
import { hash2 } from '../core/rng';
import { footAt, gaitAt, legPhase } from '../systems/mountGait';
import { BODY_Y, HEAD_DROP, NECK_AT, NECK_LENGTH, NECK_RISE, barrel, bridle, ear, harness, head, neck, tail } from './horseBody';
import { CANNON, FETLOCK, LEGS, LEG_NAMES, cannonBone, hoofOf, upperBone } from './horseLegs';
import { MountBuilder, group, swingAbout } from './mountKit';

/** Where the horse stands in the chariot's frame, and where the shaft tips meet the collar (the shafts run to it). */
export const DRAFT_PLACE = { x: 0, z: 2.5 } as const;
export const DRAFT_HITCH = { x: 0.49, y: 1.4, z: DRAFT_PLACE.z + 0.5 } as const;

export interface DraftHorse {
  root: THREE.Group;
  bit: THREE.Object3D;
  /** `cycle`: gait cycles ridden (the simulation's `MountState.phase`); `ground`: the land's height at (x, z) in the chariot's frame. */
  update(time: number, cycle: number, speed: number, turn: number, ground?: (x: number, z: number) => number, bend?: number): void;
}

const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
const smooth = (t: number): number => t * t * (3 - 2 * t);
const TAU = Math.PI * 2;
const MAX_SWEEP = 1.5;
const LIFT = { front: 0.3, hind: 0.24 } as const;

export function draftHorse(b: MountBuilder, parent: THREE.Object3D, x: number, z: number): DraftHorse {
  const root = group(parent, x, 0, z);
  root.name = 'draft-horse';
  const lean = group(root);
  const body = group(lean, 0, BODY_Y, 0);
  const hide = b.material('hide');
  const cloth = b.material('cloth');
  const part = (at: THREE.Object3D, geo: THREE.BufferGeometry, material: THREE.ShaderMaterial, name: string): THREE.Mesh => {
    const m = new THREE.Mesh(geo, material);
    m.name = name;
    at.add(m);
    return m;
  };
  const barrelMesh = part(body, barrel(), hide, 'draft-body');
  part(body, harness(), cloth, 'draft-harness');
  const neckG = group(body, 0, NECK_AT.y, NECK_AT.z);
  neckG.name = 'neck';
  part(neckG, neck(), hide, 'draft-neck');
  const headG = group(neckG, 0, 0.02, NECK_LENGTH);
  headG.name = 'head';
  const face = head();
  part(headG, face.skin, hide, 'draft-head');
  part(headG, face.eyes, b.material('hide', 0.5), 'draft-eyes');
  part(headG, bridle(), cloth, 'draft-bridle');
  const bit = group(headG, 0, -0.1, 0.57);
  bit.name = 'draft-bit';
  const ears = [-1, 1].map((s) => {
    const g = group(headG, s * 0.07, 0.125, 0);
    g.name = 'ear';
    part(g, ear(), hide, 'draft-ear');
    return g;
  });
  const tailG = group(body, 0, 0.23, -0.84);
  tailG.name = 'tail';
  part(tailG, tail(), hide, 'draft-tail');

  const legs = LEGS.map((plan, i) => {
    const pivot = group(body, ...plan.hip);
    pivot.name = LEG_NAMES[i];
    part(pivot, upperBone(plan), hide, `${LEG_NAMES[i]}-upper`);
    const knee = group(pivot, 0, -plan.upper, 0);
    part(knee, cannonBone(plan), hide, `${LEG_NAMES[i]}-cannon`);
    const fetlock = group(knee, 0, -CANNON, 0);
    part(fetlock, hoofOf(plan), hide, `${LEG_NAMES[i]}-hoof`);
    return { plan, pivot, knee, fetlock, flat: 0 };
  });

  const inverse = new THREE.Matrix4();
  const aim = new THREE.Vector3();
  const hips = LEGS.map((l) => l.hip);

  return { root, bit, update(time, cycle, speed, turn, ground, bend = 0) {
    swingAbout(root, DRAFT_PLACE, { x: 0, z: DRAFT_HITCH.z }, bend); // the horse leads a turn, about the collar the shafts meet; the carriage follows
    const gait = gaitAt(speed);
    const moving = smooth(clamp((speed - 0.15) / 1.1));
    const stretch = gait.stretch * moving;
    const flight = smooth(clamp((gait.stretch - 0.3) / 0.3)); // 0 in a walk or a trot, 1 in a canter or gallop: one bounce a cycle, not two
    const floor = ground?.(x, z) ?? 0;
    root.position.y = floor;
    const slope = clamp(-Math.atan2((ground?.(x, z + 0.8) ?? 0) - (ground?.(x, z - 0.8) ?? 0), 1.6), -0.25, 0.25);
    const bounce = (1 - flight) * Math.cos(2 * TAU * (cycle - 0.1)) * (0.012 + 0.014 * gait.stretch) + flight * Math.cos(TAU * (cycle - 0.15)) * (0.03 + 0.04 * gait.stretch);
    const settle = 0.012 * Math.sin(time * 0.9) * (1 - moving);
    body.position.y = BODY_Y - 0.04 * moving - 0.12 * stretch + (bounce + settle) * moving;
    body.rotation.x = slope * 0.8 + 0.05 * Math.sin(TAU * (cycle - 0.05)) * flight * gait.stretch - 0.03 * stretch;
    body.rotation.z = -turn * 0.05 + 0.014 * Math.sin(TAU * cycle) * moving * (1 - flight);
    body.rotation.y = 0.012 * Math.sin(TAU * cycle) * moving * (1 - flight);
    lean.rotation.y = -turn * 0.1;
    barrelMesh.scale.y = 1 + (0.008 + 0.014 * stretch) * Math.sin(time * (1.5 + 5 * stretch));

    const nod = Math.sin(TAU * (cycle - 0.1)) * (0.07 * (1 - flight) + 0.1 * flight) * moving;
    neckG.rotation.x = -NECK_RISE + 0.26 * stretch + nod - 0.02 * Math.sin(time * 0.8) * (1 - moving);
    neckG.rotation.y = turn * 0.3 + Math.sin(time * 0.35) * 0.05 * (1 - moving);
    headG.rotation.x = HEAD_DROP - 0.55 * nod - 0.12 * stretch + 0.03 * Math.sin(time * 0.6 + 1) * (1 - moving);
    headG.rotation.y = turn * 0.12;
    tailG.rotation.x = 0.1 + 0.5 * stretch + 0.1 * Math.sin(TAU * (cycle - 0.3)) * moving + 0.07 * Math.sin(time * 1.3) * (1 - moving);
    tailG.rotation.z = Math.sin(time * 1.9) * 0.12 * (1 - 0.6 * moving) - turn * 0.2;
    ears.forEach((e, i) => {
      const flick = Math.max(0, Math.sin(time * (0.8 + 0.13 * i) + i * 2)) ** 24;
      e.rotation.x = -0.35 + 0.6 * stretch + 0.5 * flick * (1 - moving);
      e.rotation.z = (i ? 1 : -1) * (0.18 + 0.55 * flick);
    });

    // The frame feet are placed in: the horse's own, so a body that pitches and rolls leaves them where the ground is.
    lean.updateMatrix();
    body.updateMatrix();
    inverse.multiplyMatrices(lean.matrix, body.matrix).invert();
    const paw = hash2(Math.floor(time / 9), 3, 17) > 0.45 ? clamp((time % 9 - 2) / 1.6) : 0; // now and then, a front hoof is pawed at the ground
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const { plan } = leg;
      const sweep = Math.min(MAX_SWEEP, gait.duty * gait.length);
      const foot = footAt(legPhase(cycle, gait.offsets[i]), gait.duty, sweep);
      const reach = foot.z * moving;
      const stand = i === 0 && paw > 0 && paw < 1 ? Math.sin(paw * Math.PI * 3) : 0;
      const lift = (foot.lift * moving + Math.max(0, stand) * (1 - moving)) * (plan.front ? LIFT.front : LIFT.hind) * (1 - 0.1 * gait.stretch);
      const hipX = hips[i][0];
      const hipZ = hips[i][2] + (plan.front ? 0.2 : 0.12) * reach; // the shoulder and the hip slide with the stride
      leg.pivot.position.z = hipZ;
      const footZ = hips[i][2] + (plan.front ? 0.04 : 0) + reach - 0.14 * Math.max(0, stand) * (1 - moving);
      const local = ground?.(x + hipX, z + footZ) ?? 0;
      aim.set(hipX, local - floor + lift + FETLOCK, footZ).applyMatrix4(inverse); // the fetlock is placed: the hoof hangs flat below it
      const [dz, dy] = [aim.z - hipZ, aim.y - leg.pivot.position.y];
      const d = clamp(Math.hypot(dy, dz), 0.2, plan.upper + plan.lower - 0.003);
      const lineAngle = Math.atan2(dz, -dy);
      const a = Math.acos(clamp((plan.upper ** 2 + d * d - plan.lower ** 2) / (2 * plan.upper * d), -1, 1));
      const c = Math.acos(clamp((plan.lower ** 2 + d * d - plan.upper ** 2) / (2 * plan.lower * d), -1, 1));
      const bend = plan.front ? 1 : -1; // a knee folds forward, a hock back
      const upperAngle = lineAngle + bend * a;
      const lowerAngle = lineAngle - bend * c;
      leg.pivot.rotation.x = -upperAngle;
      leg.knee.rotation.x = upperAngle - lowerAngle;
      leg.fetlock.rotation.x = lowerAngle - body.rotation.x + 0.55 * foot.lift * moving; // flat on the ground, toe dropping as it lifts
    }
  } };
}
