/**
 * The investigator posed from his clips (round 78, playerClips.ts): the carried gaits (idle, walk, run and sprint, blended by ground speed as gait.ts blends its own, their
 * phase the stride's), the guard's arms over them, and a clip for each move he makes, made for the weapon in his hand where the weapon changes it. Anything without a clip
 * is posed by hand (poses.ts), as the people and the creatures are. Poses are cut from his figure's joints, so these set the same ones.
 */

import type { MoveDef } from '../data/moves';
import type { Figure } from './figures';
import { blendAt } from './gait';
import { applyPose, clipTime, mixPose, newPose, playerClip, sampleClip, type Clip, type ClipPose } from './playerClips';

/** What the move needs shown in his hands: the sword-cane's blade, and what the off-hand holds (the groups of his figure: flask, laudanum, syringe, powder, match, book). */
export interface Held {
  drawn: boolean;
  props: readonly string[];
}

const UPPER = [1, 2, 3, 4, 5, 6, 7, 8]; // torso, head, and the arms: the joints of PLAYER_JOINTS a guard or a swallow sets while the legs walk on
const CARRY: Readonly<Record<string, number>> = { cane: 0, axe: 0.15, razor: 0, cutlass: 0.2, rapier: 0.8 }; // how far a carried weapon is tipped forward off the hanging line, radians, so its point clears the ground
const [A, B, C, D, E] = [newPose(), newPose(), newPose(), newPose(), newPose()];
const SPECIFIC = /^(light|heavy)\d|^parry$|^guard$/;

export interface PlayerInput {
  move: string | null;
  def: MoveDef | undefined;
  frame: number;
  speed: number;
  stride: number; // radians
  guard: boolean;
  time: number;
  weapon: string;
}

/** The id of the clip a move is made as: by weapon for a blow, a parry or a guard, else by its own name. */
export const idOf = (weapon: string, move: string): string => (SPECIFIC.test(move) ? `${weapon}.${move}` : move);

/** The gaits at this speed and stride, written into `out`; false if the clips are not there. */
function carried(p: PlayerInput, out: ClipPose): boolean {
  const [idle, walk, run, sprint] = ['idle', 'walk', 'run', 'sprint'].map((id) => playerClip(id));
  if (!idle || !walk || !run || !sprint) return false;
  const w = blendAt(p.speed);
  const phase = (((p.stride / (2 * Math.PI)) % 1) + 1) % 1;
  sampleClip(idle, p.time * 60, A);
  if (w.stride > 0.001) {
    sampleClip(walk, phase * walk.n, B);
    sampleClip(run, phase * run.n, C);
    mixPose(B, C, w.run);
    if (w.sprint > 0.001) mixPose(B, sampleClip(sprint, phase * sprint.n, D), w.sprint);
    mixPose(A, B, w.stride, out);
  } else out.q.set(A.q), out.body.set(A.body);
  return true;
}

/** Joints `which` of `from` onto `into`. */
function overlay(into: ClipPose, from: ClipPose, which: readonly number[]): void {
  for (const j of which) into.q.set(from.q.subarray(j * 4, j * 4 + 4), j * 4);
}

const held = (f: Figure, h: Held): void => {
  f.held = h;
};

/** The figure standing, walking or running, the guard's arms up if it is raised. Sets the pose and returns true, or returns false (no clips). */
export function playerStride(f: Figure, p: PlayerInput): boolean {
  if (!carried(p, A)) return false;
  if (p.guard) {
    const g = playerClip(`${p.weapon}.guard`);
    if (g) overlay(A, sampleClip(g, p.time * 60, B), UPPER);
  }
  applyPose(f, A);
  f.handR.rotateX(CARRY[p.weapon] ?? 0);
  held(f, { drawn: p.guard, props: [] }); // a guard raised has the sword-cane's blade out
  return true;
}

/** The figure in the middle of a move, from its clip. Returns false if there is none. */
export function playerMove(f: Figure, p: PlayerInput): boolean {
  if (!p.move || !p.def) return false;
  const clip: Clip | undefined = playerClip(idOf(p.weapon, p.move));
  if (!clip) return false;
  const t = clipTime(clip, p.def, p.frame);
  sampleClip(clip, t, E);
  if (p.def.walk && carried(p, A)) {
    overlay(A, E, UPPER); // a swallow, a shot of Reagent, a reload: the legs walk on
    applyPose(f, A);
  } else applyPose(f, E);
  const until = clip.marks.props ?? Infinity; // what the hand holds goes at this frame (a flask, once thrown)
  held(f, { drawn: clip.drawn, props: t < until ? clip.props : [] });
  if (f.flash && p.def.shot) f.flash.visible = p.frame >= p.def.shot.frame && p.frame < p.def.shot.frame + 2; // the muzzle's flash as the shot leaves
  return true;
}
