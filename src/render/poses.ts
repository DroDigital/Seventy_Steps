/**
 * Procedural animation (spec §3B: tweened primitives, no skeletal assets). Every joint angle is a
 * function of the current move's data (hit arc and windows, motion, parry, shot) and its progress,
 * plus a stride from ground speed (gait.ts); reactions (stagger, guard break, parried, death) are
 * tweens. Joints use 'YXZ' order: z swings sideways, x pitches forward (negative raises an arm or a
 * thigh; positive bends a knee back), y turns. Every pose ends settled on the ground (gait.ts).
 */

import * as THREE from 'three';
import { wrapAngle } from '../core/geom';
import type { ActKind } from '../data/npcActs';
import { FALL } from '../data/tuning';
import type { MoveDef } from '../data/moves';
import type { Figure } from './figures';
import { settle, stride, type Ground } from './gait';
import { playerMove, playerStride } from './playerPose';
import { actPose } from './npcActs';
import { showProps } from './npcProps';
import { swing } from './swings';
import { poseEcho } from './echoPose';
import { poseGroundPickup } from './groundPickups';

export interface PoseInput {
  move: string | null;
  def: MoveDef | undefined;
  frame: number; // fractional, interpolated between sim steps
  speed: number; // horizontal m/s
  stride: number; // stride phase, radians (gait.ts): the right heel strikes at 0
  guard: boolean;
  flinch: number; // 1 right after a hit, fading to 0
  rollYaw: number; // roll direction relative to facing
  time: number;
  ground?: Ground; // the lie of the land about the feet (flat when absent)
  kneel?: number; // 0–1: kneeling before an Elder Sign, eased in and out (round 15)
  act?: { kind: ActKind; k: number }; // what a person is doing, and how far into it (0–1: they sit down, take it up; round 39)
  weapon?: string; // the investigator's: what is in his hand (his clips are made for it)
  drop?: { t: number; spin: number; sea?: { since: number; held: number } }; // over an edge: seconds into the fall, and which way it tumbles, 1 head first (round 54); in the sea (round 55): seconds since it met the water (-1 before), and seconds the tentacle has had it
}

const clamp01 = (t: number): number => Math.min(1, Math.max(0, t));
const ease = (t: number): number => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
const bump = (t: number): number => Math.sin(Math.PI * clamp01(t)); // 0 → 1 → 0

function rest(f: Figure): void {
  f.body.position.set(0, f.hip, 0);
  f.body.rotation.set(f.hunch, 0, 0, 'YXZ');
  for (const j of [f.torso, f.head, f.armR, f.armL, f.elbowR, f.elbowL, f.handR, f.handL, f.legR, f.legL, f.kneeR, f.kneeL, f.footR, f.footL, ...f.skirt]) j.rotation.set(0, 0, 0, 'YXZ');
  f.head.rotation.x = -f.hunch * 0.8; // keep a hunched head looking ahead
  f.lantern?.rotation.set(0, 0, 0);
  f.held = undefined;
  if (f.flash) f.flash.visible = false;
}

/**
 * A dodge roll: a short dive, a tucked somersault along the roll direction (knees to chest, arms
 * wrapped, head down, the body low), then coming up through a crouch.
 */
function roll(f: Figure, d: MoveDef, p: PoseInput): void {
  const [m0, m1] = d.motion!.window;
  const t = (p.frame - m0) / (m1 - m0); // 0..1 over the travel, beyond 1 while recovering
  const end = (d.frames - m0) / (m1 - m0); // where the move ends, on the same scale
  const dive = bump(t / 0.3);
  const spin = ease((t - 0.1) / 0.72);
  const tuck = bump((t - 0.04) / 0.86);
  const crouch = ease((t - 0.6) / 0.28) * (1 - ease((t - 0.92) / (end - 0.92))); // lands low as the tuck opens, stands just as the move ends
  f.body.rotation.set(0.55 * dive * (1 - spin) + Math.PI * 2 * spin, p.rollYaw, 0.1 * tuck, 'YXZ');
  f.body.position.y = f.hip * (1 - 0.52 * tuck - 0.12 * crouch);
  f.torso.rotation.x = 0.95 * tuck + 0.35 * crouch;
  f.head.rotation.x = 0.75 * tuck - 0.2 * crouch;
  f.legR.rotation.x = -2.1 * tuck - 0.5 * crouch; // the lead foot comes down first...
  f.legL.rotation.x = -1.8 * tuck + 0.35 * crouch; // ...the other braces behind
  f.kneeR.rotation.x = 2.2 * tuck + 0.5 * crouch; // knees to the chest
  f.kneeL.rotation.x = 2.0 * tuck + 0.9 * crouch;
  f.armR.rotation.set(-1.0 * tuck - 0.9 * dive, 0, -0.35 * tuck, 'YXZ');
  f.armL.rotation.set(-1.0 * tuck - 0.9 * dive, 0, 0.35 * tuck, 'YXZ');
  f.elbowR.rotation.x = f.elbowL.rotation.x = -1.2 * tuck; // arms wrapped about the shins
}

function backstep(f: Figure, t: number): void {
  const b = bump(t);
  f.body.rotation.x -= 0.35 * b;
  f.body.position.y -= 0.06 * b;
  f.legR.rotation.x = -0.5 * b;
  f.legL.rotation.x = 0.3 * b;
  f.kneeL.rotation.x = 0.5 * b; // the back foot takes the weight
  f.armR.rotation.x = f.armL.rotation.x = -0.4 * b;
  f.elbowR.rotation.x = f.elbowL.rotation.x = -0.5 * b;
}

/**
 * A parry (round 46: the off-hand alone flapped out to the side, the feet stayed put, and nothing of the blade moved): the
 * cane beats across the body in the first frames, wrist snapping, the body turning into the blow behind it with the lead foot
 * stepped in and the knees given; it is held against the weight through the window with a small shudder as the blow rings off it,
 * then let go in an easy recovery, the arm swinging back down past the guard rather than stopping at it.
 */
function parry(f: Figure, d: MoveDef, frame: number): void {
  const [p0, p1] = d.parry!;
  const beat = ease(frame / Math.max(1, p0)); // the cane comes across
  const letgo = ease((frame - p1) / Math.max(1, d.frames - p1)); // and goes
  const out = beat * (1 - letgo);
  const ring = frame >= p0 && frame < p1 + 6 ? Math.sin((frame - p0) * 2.4) * Math.exp(-(frame - p0) / 6) : 0; // the blow rings off it
  const kick = bump(frame / (p0 + 3)) * (1 - letgo); // the arm throws past where it will rest, and comes back to it
  f.armR.rotation.set(-0.6 * out - 0.4 * kick - 0.05 * ring, 0.8 * out + 0.25 * kick, -0.3 * out + 0.2 * (1 - beat) * out, 'YXZ'); // the hand across the face, the cane diagonal over it
  f.elbowR.rotation.x = -0.9 * out - 0.25 * kick;
  f.handR.rotation.set(-0.8 * out - 0.35 * kick, 0, 0.12 * ring, 'YXZ'); // the wrist cocked back, snapping at the beat
  f.armL.rotation.set(0.45 * out, -0.35 * out, 0.65 * out, 'YXZ'); // the off-hand thrown back for balance
  f.torso.rotation.y = 0.38 * out;
  f.torso.rotation.x += 0.1 * out;
  f.head.rotation.y = -0.2 * out; // the eyes stay on the blow
  f.body.rotation.x += 0.08 * out;
  f.body.position.y -= 0.07 * out;
  f.legR.rotation.x = -0.5 * out; // the lead foot steps in...
  f.kneeR.rotation.x = 0.25 * out;
  f.legL.rotation.x = 0.32 * out; // ...the other braces behind
  f.kneeL.rotation.x = 0.55 * out;
}

/** A swallow of Laudanum: the off-hand comes up to the mouth and the head tips back, then down again. */
function drink(f: Figure, d: MoveDef, frame: number): void {
  const at = d.item!;
  const t = frame < at ? ease(frame / (at - 4)) : 1 - ease((frame - at - 6) / Math.max(1, d.frames - at - 14));
  f.armL.rotation.set(-2.2 * t, -0.7 * t, 0, 'YXZ'); // forward, up and across, so the hand is at the lips
  f.head.rotation.x -= 0.4 * clamp01((frame - at + 10) / 10) * t;
}

/** A shot of West's Reagent: the off-hand brings the syringe to the side of the neck, the head tips away. */
function inject(f: Figure, d: MoveDef, frame: number): void {
  const at = d.item!;
  const t = frame < at ? ease(frame / (at - 6)) : 1 - ease((frame - at - 8) / Math.max(1, d.frames - at - 16));
  f.armL.rotation.set(-2.5 * t, -0.9 * t, 0.2 * t, 'YXZ');
  f.head.rotation.z = -0.35 * t;
  f.torso.rotation.x = 0.12 * t * clamp01((frame - at + 4) / 6); // it stings
}

/**
 * A reload (round 22): the revolver drawn up before the chest, its muzzle tipped high, the head bent to it; six
 * rounds dropped in one by one, the hand ticking with each; the cylinder snapped shut on the item frame, a
 * jerk of the wrist, and the arm let down again.
 */
function reload(f: Figure, d: MoveDef, frame: number): void {
  const at = d.item!;
  const up = ease(frame / 14) * (1 - ease((frame - at - 4) / Math.max(1, d.frames - at - 16)));
  const tick = frame >= 16 && frame < at - 2 ? 0.09 * Math.sin(((frame - 16) / 5) * Math.PI) ** 2 : 0;
  const snap = frame >= at ? 0.4 * Math.exp(-(frame - at) / 3) : 0;
  f.armL.rotation.set(-0.95 * up - snap, 0, 0.15 * up, 'YXZ');
  f.elbowL.rotation.x = -1.45 * up;
  f.handL.rotation.x = -0.5 * up + tick;
  f.torso.rotation.y = -0.18 * up;
  f.head.rotation.x += 0.28 * up;
}

/** A flask of lamp oil, lobbed with the off-hand (round 12): up and back, over as it leaves, then down. */
function lob(f: Figure, d: MoveDef, frame: number): void {
  const at = d.volley!.frame;
  const x = frame < at ? -2.8 * ease(frame / at) : frame < at + 6 ? -2.8 + 1.6 * ease((frame - at) / 6) : -1.2 * (1 - ease((frame - at - 6) / Math.max(1, d.frames - at - 10)));
  f.armL.rotation.set(x, 0, 0.25, 'YXZ');
  f.torso.rotation.y = frame < at ? 0.25 * ease(frame / at) : 0.25 * (1 - ease((frame - at) / 8));
}

/** Off-hand revolver: raise, fire (muzzle flash and kick), lower. */
function aim(f: Figure, d: MoveDef, frame: number): void {
  const s = d.shot!;
  const raise = ease(frame / Math.max(1, s.frame)) * (1 - ease((frame - (d.frames - 8)) / 8));
  const kick = frame >= s.frame ? 0.45 * Math.exp(-(frame - s.frame) / 3) : 0;
  f.armL.rotation.set(-(Math.PI / 2) * raise - kick, 0, 0, 'YXZ');
  f.torso.rotation.y = -0.25 * raise;
  if (f.flash) f.flash.visible = frame >= s.frame && frame < s.frame + 2;
}

function reel(f: Figure, t: number, k: number): void {
  const b = bump(t);
  f.body.rotation.x -= 0.4 * k * b;
  f.body.position.y -= 0.05 * k * b;
  f.head.rotation.x -= 0.3 * b;
  f.armR.rotation.set(-0.5 * k * b, 0, -0.6 * k * b, 'YXZ');
  f.armL.rotation.set(-0.5 * k * b, 0, 0.6 * k * b, 'YXZ');
  f.elbowR.rotation.x = f.elbowL.rotation.x = -0.5 * b;
  f.legR.rotation.x = -0.35 * b;
  f.kneeL.rotation.x = 0.4 * b;
}

/**
 * Parried or interrupted (round 46: it dropped to one knee as if shot, for a second and a half, and every body did the same):
 * the blow is thrown wide, the body knocked back on its heels with the weapon arm flung out and the head snapped away, then it
 * comes forward, stooped, arms hanging and open, swaying a little, the breath of a foe caught and not yet recovered: open to a riposte.
 */
function recoil(f: Figure, frame: number): void {
  const knock = ease(frame / 5);
  const dazed = ease((frame - 7) / 14);
  const sway = Math.sin(frame * 0.2) * dazed;
  f.body.rotation.x += -0.28 * knock + 0.52 * dazed; // back on its heels, then forward and stooped
  f.body.rotation.z += 0.05 * sway;
  f.body.position.y -= 0.05 * knock + 0.1 * dazed;
  f.torso.rotation.y = -0.45 * knock * (1 - dazed) + 0.1 * sway;
  f.head.rotation.x += -0.35 * knock + 0.65 * dazed;
  f.head.rotation.y = 0.5 * knock * (1 - dazed);
  f.armR.rotation.set(0.5 * knock * (1 - dazed) + 0.25 * dazed, 0, -1.25 * knock * (1 - dazed) - 0.2 * dazed, 'YXZ'); // flung wide, then hanging
  f.armL.rotation.set(0.3 * knock * (1 - dazed) + 0.2 * dazed, 0, 0.8 * knock * (1 - dazed) + 0.15 * dazed, 'YXZ');
  f.elbowR.rotation.x = f.elbowL.rotation.x = -0.25 * knock - 0.35 * dazed;
  f.legR.rotation.x = 0.35 * knock * (1 - dazed) - 0.55 * dazed; // the weight goes back, then settles forward: the thighs under the body that has stooped over them
  f.legL.rotation.x = -0.2 * knock * (1 - dazed) - 0.4 * dazed;
  f.kneeR.rotation.x = 0.2 * knock + 0.25 * dazed;
  f.kneeL.rotation.x = 0.3 * knock + 0.3 * dazed;
}

/** Eases a joint toward a rotation by `t` (1: all the way there; 0: it stays as the walk left it): through the quaternion, as a clip's joint reads as a folded Euler once it is bent past a right angle. */
function toward(j: Figure['legR'], t: number, x: number, y = 0, z = 0): void {
  j.quaternion.slerp(AIM.setFromEuler(EULER.set(x, y, z, 'YXZ')), t);
}

/** `k` on its own stretch `[a, b]` of the way, eased: 0 at and below `a`, 1 at and above `b`. */
const stage = (k: number, a: number, b: number): number => ease((k - a) / (b - a));

/** Where a weapon points at the kneel, radians off the hanging line (the forearm lifts onto the knee and the body goes down, so the walk's carry would put a point through the ground; the rapier, long, is turned the other way). */
const KNEEL_AIM: Readonly<Record<string, number>> = { cane: 1.4, axe: 1.5, cutlass: 1.2, rapier: 1.6 };
const [AIM, EULER, FRAME, SAGITTAL] = [new THREE.Quaternion(), new THREE.Euler(), new THREE.Quaternion(), new THREE.Vector3()];

/** Which way the weapon in his right hand points, off the hanging line, radians: its direction in the figure's own frame, from the quaternions of the chain that holds it. */
function aimOf(f: Figure): number {
  FRAME.identity();
  for (let o: THREE.Object3D | null = f.handR; o && o !== f.root; o = o.parent) FRAME.premultiply(o.quaternion);
  SAGITTAL.set(0, -1, 0).applyQuaternion(FRAME);
  return Math.atan2(-SAGITTAL.z, -SAGITTAL.y);
}

/** Turns the weapon in his right hand `by` radians, as seen from the side, about the figure's own x axis (not the hand's: that one is turned by the clip). */
function turnAim(f: Figure, by: number): void {
  FRAME.identity();
  for (let o = f.handR.parent; o && o !== f.root; o = o.parent) FRAME.premultiply(o.quaternion); // F: the hand's parent in the figure's frame
  AIM.setFromAxisAngle(SAGITTAL.set(1, 0, 0), by).premultiply(FRAME.clone().invert()).multiply(FRAME); // F⁻¹ · Rx · F
  f.handR.quaternion.premultiply(AIM);
}

/**
 * Resting at an Elder Sign: down on the right knee before the stone, head bowed, forearms on the raised
 * knee (round 15). The limbs ease toward the pose from whatever the stride left them at (round 19's
 * last fault: they were set outright, and as the kneel eased out but never quite reached nothing, they
 * stayed set to almost nothing, so the legs and arms never swung again until the game was restarted).
 * The parts have stretches of their own (round 22, for a slow rise): the head lifts first, the hands
 * push on the knee until half way up and then let go, and the legs and body unfold the whole way; the
 * body and legs run together, so the feet stay on the ground.
 */
function kneel(f: Figure, k: number, weapon = ''): void {
  const [low, hands, bow] = [stage(k, 0, 0.8), stage(k, 0, 0.5), stage(k, 0.3, 1)];
  const aim = KNEEL_AIM[weapon];
  const carried = aim === undefined ? 0 : aimOf(f);
  f.body.position.y -= 0.4 * low;
  f.body.rotateX(0.18 * low);
  f.torso.rotateX(0.12 * low);
  f.head.rotateX(0.45 * bow); // bowed
  toward(f.legL, low, -1.3); // the front leg: thigh forward, shin straight down
  toward(f.kneeL, low, 1.35);
  toward(f.legR, low, 0.2); // the back leg: its knee to the ground
  toward(f.kneeR, low, 1.55);
  toward(f.armR, hands, -0.5, 0, -0.1);
  toward(f.armL, hands, -0.6, 0, 0.14);
  toward(f.elbowR, hands, -0.75);
  toward(f.elbowL, hands, -0.75);
  if (aim !== undefined) turnAim(f, wrapAngle(carried + (aim - carried) * hands - aimOf(f))); // the wrist turns the weapon from where the walk carried it to where it clears the ground
}

/**
 * A clip's boots are set for the clip's own walk; a kneel bends the legs by hand over it, and the front boot would stand tilted into the
 * floor. So the pose is settled both ways, the clip's own feet and the ground's, and the one eased into the other over the first of the
 * kneel (a kneel eased to nothing leaves the stride as it was). The joints are blended as quaternions: a clip's knee bent past a right
 * angle reads as a folded Euler, which a lerp of its angles would twist.
 */
function settleKneeling(f: Figure, ground: Ground | undefined, k: number): void {
  const joints = [f.kneeR, f.kneeL, f.footR, f.footL, f.skirt[0], f.skirt[1]];
  const keep = (): { y: number; q: THREE.Quaternion[] } => ({ y: f.body.position.y, q: joints.map((j) => j.quaternion.clone()) });
  const put = (at: { y: number; q: THREE.Quaternion[] }): void => {
    f.body.position.y = at.y;
    joints.forEach((j, i) => j.quaternion.copy(at.q[i]));
  };
  const start = keep();
  settle(f, ground, false);
  const clips = keep();
  put(start);
  settle(f, ground, true);
  const grounded = keep();
  const t = stage(k, 0, 0.1);
  put(clips);
  f.body.position.y += (grounded.y - clips.y) * t;
  joints.forEach((j, i) => j.quaternion.slerp(grounded.q[i], t));
}

function fall(f: Figure, frame: number): void {
  const t = ease(frame / 30);
  f.body.rotation.x = f.hunch * (1 - t) - (Math.PI / 2) * t;
  f.body.position.y = f.hip - (f.hip - 0.18) * t;
  f.armR.rotation.z = -0.8 * t;
  f.armL.rotation.z = 0.8 * t;
  f.kneeR.rotation.x = 0.7 * t; // one knee drawn up
  f.legR.rotation.x = -0.5 * t;
}

/**
 * Over the edge (round 54). The body is still going the way it was: the arms fly up and out as the footing goes, the legs run on in the
 * air, the head throws back; then the weight takes the hips over and it tumbles, head first, about the hip, arms thrown wide, until it is
 * small and dark. No ground is under it, so nothing is settled to one.
 */
function plunge(f: Figure, t: number, spin: number): void {
  const grab = ease(t / 0.16); // the footing gone: the arms go up
  const tip = ease((t - 0.1) / 0.5); // then the hips go over
  const flail = Math.sin(t * 17);
  f.body.rotation.set(spin * (0.18 * grab + FALL.spin * Math.max(0, t - 0.12)), 0, 0.22 * Math.sin(t * 6.5) * grab, 'YXZ');
  f.body.position.y = f.hip * (1 - 0.1 * tip);
  f.torso.rotation.x = -0.35 * grab + 0.25 * tip; // the chest thrown out, then folding
  f.head.rotation.x = -0.6 * grab * (1 - tip) + 0.2 * tip; // the head back, looking for the ledge
  f.armR.rotation.set(-2.7 * grab + 0.5 * tip + 0.28 * flail, 0, -0.55 * grab - 0.25 * tip, 'YXZ');
  f.armL.rotation.set(-2.7 * grab + 0.5 * tip - 0.28 * flail, 0, 0.55 * grab + 0.25 * tip, 'YXZ');
  f.elbowR.rotation.x = f.elbowL.rotation.x = -0.35 - 0.3 * Math.abs(flail) * grab;
  f.legR.rotation.x = -0.95 * grab + 0.7 * flail * grab; // running on the air
  f.legL.rotation.x = -0.95 * grab - 0.7 * flail * grab;
  f.kneeR.rotation.x = 0.35 + 0.8 * Math.max(0, -flail) * grab;
  f.kneeL.rotation.x = 0.35 + 0.8 * Math.max(0, flail) * grab;
}

/**
 * In the water (round 55): upright and chest-deep, the arms thrown up and beating the surface, the legs kicking for a floor that is not there;
 * then, once the tentacle has hold, drawn over onto the back, the arms flung to the sky, and the flailing weaker as the breath goes.
 */
function thrash(f: Figure, t: number, held: number): void {
  const grip = ease(held / 0.3); // drawn back
  const tire = ease((held - 0.7) / 0.6); // the breath going
  const flail = Math.sin(t * 13) * (1 - 0.7 * tire);
  const kick = Math.sin(t * 9.5) * (1 - 0.8 * tire);
  f.body.rotation.set(-0.12 - 0.75 * grip, 0, 0.14 * Math.sin(t * 4.1) * (1 - tire), 'YXZ');
  f.body.position.y = f.hip * (1 - 0.06 * grip);
  f.torso.rotation.x = -0.25 - 0.3 * grip;
  f.head.rotation.x = -0.5 - 0.4 * grip + 0.1 * tire;
  f.armR.rotation.set(-2.4 + 0.55 * flail, 0, -0.55 - 0.3 * grip, 'YXZ');
  f.armL.rotation.set(-2.4 - 0.55 * flail, 0, 0.55 + 0.3 * grip, 'YXZ');
  f.elbowR.rotation.x = f.elbowL.rotation.x = -0.4 - 0.5 * Math.abs(flail);
  f.legR.rotation.x = -0.35 + 0.55 * kick;
  f.legL.rotation.x = -0.35 - 0.55 * kick;
  f.kneeR.rotation.x = 0.5 + 0.5 * Math.max(0, -kick);
  f.kneeL.rotation.x = 0.5 + 0.5 * Math.max(0, kick);
}

export function pose(f: Figure, p: PoseInput): void {
  rest(f);
  if (f.rig === 'prop') {
    poseGroundPickup(f, p.time);
    return;
  }
  if (f.rig === 'echo') {
    poseEcho(f, p.time);
    return;
  }
  const d = p.def;
  if (f.rig === 'dummy') {
    const t = p.move === 'stagger' && d ? p.frame / d.frames : 1;
    f.body.rotation.x = -0.35 * Math.sin(t * Math.PI * 3) * (1 - t) - 0.1 * p.flinch * Math.sin(p.time * 40);
    return;
  }
  if (p.drop) return p.drop.sea && p.drop.sea.since >= 0 ? thrash(f, p.drop.sea.since, p.drop.sea.held) : plunge(f, p.drop.t, p.drop.spin);
  const mine = f.character === 'player'; // his own clips (playerPose.ts) where he has them
  const player = { move: p.move, def: d, frame: p.frame, speed: p.speed, stride: p.stride, guard: p.guard, time: p.time, weapon: p.weapon ?? 'cane', rollYaw: p.rollYaw };
  let [clipped, kneeling] = [false, false];
  if (!d || p.move === null) {
    clipped = mine && playerStride(f, player);
    if (!clipped) stride(f, p.speed, p.stride, p.time, p.guard);
    if (p.kneel) kneel(f, p.kneel, mine ? player.weapon : '');
    kneeling = clipped && !!p.kneel;
    if (p.act) {
      actPose(f, p.act.kind, p.act.k, p.time);
      showProps(f, p.act.k > 0.02);
    }
  }
  else if (mine && (clipped = playerMove(f, player))) { /* a clip made for this move */ }
  else if (p.move === 'death') fall(f, p.frame);
  else if (p.move === 'stagger' || p.move === 'guardBreak') reel(f, p.frame / d.frames, p.move === 'guardBreak' ? 1.6 : 1);
  else if (p.move === 'parried') recoil(f, p.frame);
  else if (d.hit) swing(f, d, p.frame);
  else if (d.motion?.dir === 'input') roll(f, d, p);
  else if (d.motion?.dir === 'back') backstep(f, p.frame / d.frames);
  else if (d.parry) parry(f, d, p.frame);
  else if (d.shot) aim(f, d, p.frame);
  else if (d.volley) lob(f, d, p.frame);
  else if (d.item !== undefined) {
    stride(f, p.speed, p.stride, p.time, false); // walking on beneath it
    (d.use === 'rounds' ? reload : d.use === 'reagent' ? inject : drink)(f, d, p.frame);
  }
  if (clipped) {
    f.body.rotateX(-0.18 * p.flinch);
    f.head.rotateX(-0.25 * p.flinch);
  } else {
    f.body.rotation.x -= 0.18 * p.flinch;
    f.head.rotation.x -= 0.25 * p.flinch;
  }
  if (kneeling) settleKneeling(f, p.ground, p.kneel!); // (a move in the hands of the clip keeps its own feet, kneel or none)
  else settle(f, p.ground, !clipped); // a clip keeps its own feet
}
