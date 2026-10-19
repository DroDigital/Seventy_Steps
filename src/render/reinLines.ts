/**
 * The driver's reins (round 57): flexible lines from the driver's two hands (or, with no rider, from a place where they would be)
 * to the horse's bit. Slack they sag and sway; a pull draws them straight; a slap sends a ripple down them to the horse. One dynamic
 * line-strip mesh, rewritten each frame without allocating.
 */
import * as THREE from 'three';
import type { Point } from './mountKit';
import type { CarriageArt } from './mountCarriage';

/** The hands, in the mount's own frame. */
export interface ReinHands { left: Point; right: Point }
/** What the hands are doing to the lines: `pull` 0 slack to 1 hauled in; `lift`, `snap` the arms' slap; `ripple` the wave's place from the hands (0) to the bit (1), -1 for none. */
export interface ReinCue { pull: number; lift: number; snap: number; ripple: number }
export const NO_CUE: ReinCue = Object.freeze({ pull: 0, lift: 0, snap: 0, ripple: -1 });

const bitAt = new THREE.Vector3();

export function animateReins(art: CarriageArt, time: number, speed: number, hands?: ReinHands, cue: ReinCue = NO_CUE): void {
  const attr = art.reinsPosition;
  const lines = art.draft ? 2 : 4;
  let bit: Point | null = null;
  if (art.draft) {
    const mount = art.draft.root.parent;
    mount?.updateMatrixWorld(true);
    art.draft.bit.getWorldPosition(bitAt);
    mount?.worldToLocal(bitAt);
    bit = [bitAt.x, bitAt.y, bitAt.z];
  }
  let vertex = 0;
  for (let i = 0; i < lines; i++) {
    const horse = i < 2 ? -1 : 1, side = i % 2 ? 1 : -1;
    const fist = hands ? (art.draft ? (side > 0 ? hands.left : hands.right) : horse > 0 ? hands.left : hands.right) : null; // a hand holds the line of its own side, or of the horse on its side
    const start: Point = fist ? [fist[0] + (art.draft ? 0 : side * 0.014), fist[1], fist[2]] : [art.draft ? side * 0.16 : horse * 0.12, 1.72 + art.body.position.y, 0.48];
    const end: Point = bit
      ? [bit[0] + side * 0.05, bit[1] + Math.sin(time * 5) * Math.min(0.04, speed * 0.006), bit[2]]
      : [horse * 0.67 + side * 0.13, 1.93 + Math.sin(time * 5 + horse) * Math.min(0.065, speed * 0.009), 3.76];
    // Slack they hang in a curve that sways; hauled in they run nearly straight; hands raised for a slap take them taut, and the snap lets them loop.
    const sag = (0.18 + Math.sin(time * 6 + i) * 0.018) * (0.12 + 0.88 * (1 - cue.pull)) * (1 - 0.45 * cue.lift) * (1 + 0.9 * cue.snap);
    const point = (t: number): Point => {
      const wave = cue.ripple < 0 ? 0 : Math.exp(-(((t - cue.ripple) / 0.16) ** 2)) * Math.sin(Math.PI * t) ** 0.6; // the ripple runs out to the bit, thinning as it goes
      return [start[0] + (end[0] - start[0]) * t + side * 0.03 * wave, start[1] + (end[1] - start[1]) * t - Math.sin(t * Math.PI) * sag + 0.2 * wave, start[2] + (end[2] - start[2]) * t];
    };
    for (let j = 0; j < 14; j++) {
      const a = point(j / 14), c = point((j + 1) / 14), r = 0.009;
      for (const p of [[a[0] - r, a[1], a[2]], [a[0] + r, a[1], a[2]], [c[0] + r, c[1], c[2]], [a[0] - r, a[1], a[2]], [c[0] + r, c[1], c[2]], [c[0] - r, c[1], c[2]]]) attr.setXYZ(vertex++, p[0], p[1], p[2]);
    }
  }
  attr.needsUpdate = true;
}
