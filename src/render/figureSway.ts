/**
 * What hangs loose on the investigator (round 78; render only, read-only on the simulation): the lantern on its strap
 * and the scarf's tail. The lantern is a pendulum from the loop at the belt's end, driven by the body's own acceleration
 * in its frame and by the stride, and kept off the body; the scarf's tail streams back with the pace and is flung
 * outward in a turn. Both are second-order springs stepped in small slices, so they settle in a second at any frame rate,
 * and both are laid on the pose after it is made (`apply`), never in the pose. No run-lean, no breathing, no sway of the body.
 */

import type * as THREE from 'three';
import { FIGURE_LIFE } from '../data/fxTuning';

const G = 9.8;

export interface Sway {
  /** The lantern's displacement angles (rad): out to the left (+x) and forward (+z), and their rates. */
  lx: number; lz: number; lvx: number; lvz: number;
  /** The scarf's tail: streamed back, and flung to the side (rad), and their rates. */
  sb: number; sbv: number; ss: number; ssv: number;
}

export const newSway = (): Sway => ({ lx: 0, lz: 0, lvx: 0, lvz: 0, sb: 0, sbv: 0, ss: 0, ssv: 0 });

export interface SwayInput {
  dt: number;
  /** The acceleration of the body in its own frame, m/s²: toward its left (+x) and forward (+z). */
  ax: number; az: number;
  /** Ground speed, m/s; the yaw rate, rad/s (+ = turning left); the stride phase, rad; the render time, s. */
  speed: number; yawRate: number; stride: number; time: number;
  /** 1 on its feet, falling to 0 as the body goes over (a roll, a fall, kneeling): what hangs then is let be. */
  upright: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** One drawn frame's step; returns the angles to lay (the same object each call, mutated). */
export function stepSway(s: Sway, i: SwayInput): Sway {
  const T = FIGURE_LIFE;
  const dt = clamp(i.dt, 0, 0.1);
  const slices = Math.max(1, Math.ceil(dt / T.slice));
  const h = dt / slices;
  const w2 = G / T.lantern.length;
  const gait = clamp(i.speed / 4, 0, 1.25);
  const ax = i.ax * T.lantern.gain + T.lantern.gait[0] * gait * Math.cos(i.stride);
  const az = i.az * T.lantern.gain + T.lantern.gait[1] * gait * Math.sin(i.stride * 2);
  const target = clamp(i.speed * T.scarf.stream, 0, T.scarf.most) + T.scarf.droop;
  const flutter = Math.sin(i.time * T.scarf.rate) * T.scarf.flutter * clamp(i.speed / 4, 0, 1);
  const side = clamp(-i.yawRate * T.scarf.fling, -T.scarf.side, T.scarf.side);
  for (let k = 0; k < slices; k++) {
    s.lvx += (-w2 * s.lx - ax / T.lantern.length - T.lantern.damp * s.lvx) * h;
    s.lvz += (-w2 * s.lz - az / T.lantern.length - T.lantern.damp * s.lvz) * h;
    s.lx += s.lvx * h;
    s.lz += s.lvz * h;
    s.lx = clamp(s.lx, T.lantern.inward, T.lantern.most);
    s.lz = clamp(s.lz, -T.lantern.most, T.lantern.most);
    s.sbv += (T.scarf.spring * (target + flutter - s.sb) - T.scarf.damp * s.sbv) * h;
    s.ssv += (T.scarf.spring * (side - s.ss) - T.scarf.damp * s.ssv) * h;
    s.sb += s.sbv * h;
    s.ss += s.ssv * h;
  }
  return s;
}

/** Lays the angles on the groups (the lantern pivots at its loop, the scarf's tail at the neck), faded by how upright the body is. */
export function applySway(s: Sway, upright: number, lantern: THREE.Object3D, scarf: THREE.Object3D): void {
  lantern.rotation.set(-s.lz * upright, 0, s.lx * upright);
  scarf.rotation.set(s.sb * upright, 0, s.ss * upright);
}
