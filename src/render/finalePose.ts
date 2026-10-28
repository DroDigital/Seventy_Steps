/**
 * The hand in an ending (round 98): it closes on the key when the line says so, and opens as the key
 * lets go. The scene's id is kept here too, so the Gate stays up through the passage. Render only.
 */

import type { Object3D } from 'three';

let grasp = 0;
let goal = 0;
let crumble = 0;
let scene = '';
let hand: Object3D | null = null;

export const graspOf = (): number => grasp;
export const crumbleOf = (): number => crumble;
export const finaleScene = (): string => scene;
export const finaleHand = (): Object3D | null => hand;

/** The investigator's right hand, read after it has been posed. */
export const setFinaleHand = (h: Object3D | null): void => void (hand = h);

/** A scene begins, or none: the hand is as it was. */
export function noteScene(id: string): void {
  if (scene === id) return;
  scene = id;
  grasp = goal = crumble = 0;
}

export const closeHand = (): void => void ((goal = 1), (crumble = 0));

/** The key lets go: the hand opens and what it held falls away. */
export const openHand = (): void => void ((goal = 0), (crumble = Math.max(crumble, 0.01)));

export function resetHand(): void {
  grasp = goal = crumble = 0;
  scene = '';
}

/** Eases the grasp. `dt` seconds. */
export function stepHand(dt: number): void {
  grasp += (goal - grasp) * Math.min(1, dt * 7);
  if (crumble > 0) crumble = Math.min(1, crumble + dt * 0.85);
}

/** A curl laid over the posed wrist, so the fingers (the hand itself, in this rig) close. */
export function applyGrasp(wrist: Object3D): void {
  if (grasp < 0.001) return;
  wrist.rotateX(grasp * 0.95);
  wrist.rotateZ(-grasp * 0.4);
}
