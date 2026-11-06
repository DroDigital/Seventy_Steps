/**
 * The tall man's dread of what is growing on him (round 98). The feet stay. The spine hunches, the head
 * looks down at the coat and then flinches off it, the hands lift away. Set outright each frame, so it
 * cannot pile up. The investigator himself is not posed by this. Render only.
 */

import type { Object3D } from 'three';
import type { Figure } from './figures';

const set = (j: Object3D, x: number, y: number, z: number): void => {
  j.rotation.set(x, y, z, 'YXZ');
};

/** `grown` is how far the mutation is out. A shock runs through him every few seconds. */
export function dread(f: Figure, time: number, grown: number): void {
  const k = Math.min(1, Math.max(0, grown));
  const shock = Math.pow(Math.max(0, Math.sin(time * 0.85 + 1.2)), 16);
  const glance = Math.sin(time * 0.35) * k;
  const breath = Math.sin(time * 2.4) * 0.6 + Math.sin(time * 5.3) * 0.4;
  const shake = Math.sin(time * 17) * 0.012 * k;
  set(f.body, shake, glance * 0.08, shake * 0.6 + shock * 0.06);
  set(f.torso, 0.2 * k + breath * 0.035 * k + shock * 0.14, -0.32 * k + glance * 0.15, -0.1 * k + shock * 0.08);
  set(f.head, 0.62 * k - shock * 0.45, -glance * 0.85, 0.18 * k + shock * 0.35 + shake);
  const reach = (0.25 + 0.2 * Math.sin(time * 0.55)) * k * (1 - shock);
  set(f.armR, -0.85 * k - reach, 0.12 * k, -0.5 * k);
  set(f.elbowR, -1.05 * k - shock * 0.25, 0, 0);
  set(f.handR, -0.35 * k, 0, shake * 2);
  set(f.armL, -0.65 * k - reach * 0.6, -0.18 * k, 0.62 * k);
  set(f.elbowL, -0.9 * k - shock * 0.45, 0, 0);
  set(f.handL, 0.25 * k, 0, shock * 0.4);
  if (f.lantern) f.lantern.rotation.set(0, 0, Math.sin(time * 7) * 0.06 * k + shock * 0.18, 'YXZ');
}
