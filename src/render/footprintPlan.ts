/**
 * What a footfall leaves (round 78): given the ground, how soaked it is and how lately the investigator was in the sea, whether it keeps
 * a print, how long, and how plainly. And the second set that follows a failing mind: bare, larger, a stride behind and to one side.
 * Pure: render/atm/steps.ts lays what this says.
 */

import { LOOKS, STEPS, type PrintLook } from '../data/bodyTuning';
import type { GroundKind } from '../world/groundKind';
import type { Footfall } from './footfalls';

export interface Print {
  look: number; // index into LOOKS (the shader's)
  life: number; // seconds
  alpha: number; // 0..1
}

const index = (look: PrintLook): number => LOOKS.indexOf(look);

/**
 * `soaked`: how wet the rain has left the ground (0..1, render/wetness.ts); `dripping`: how much is left of the seconds after leaving the
 * sea (1 just out, 0 dry again). The sea's own shallows keep nothing.
 */
export function printOn(ground: GroundKind, soaked: number, dripping: number): Print | null {
  if (ground === 'water') return null;
  const dry = STEPS.dry[ground];
  if (dry) return { look: index(dry.look), life: dry.life, alpha: dry.alpha };
  if (dripping > 0.02) return { look: index('wet'), life: STEPS.afterWater.seconds * dripping, alpha: STEPS.afterWater.alpha * Math.min(1, dripping * 1.6) };
  const seconds = STEPS.soaked[ground];
  if (seconds && soaked > STEPS.soakedAbove) return { look: index('wet'), life: seconds * soaked, alpha: STEPS.soakedAlpha * soaked };
  return null;
}

export interface Laid {
  x: number;
  z: number;
  yaw: number;
  foot: 1 | -1;
  bare: boolean; // the dread's: bare, larger, no heel
  scale: number;
  fadeIn: number; // seconds
  print: Print;
}

/** The prints one footfall lays: its own, and, every `every`th when the mind is followed, the other. `n`: how many footfalls there have been. */
export function laid(f: Footfall, print: Print, haunted: boolean, n: number, drift: number): Laid[] {
  const own: Laid = { x: f.x, z: f.z, yaw: f.yaw, foot: f.foot, bare: false, scale: 1, fadeIn: STEPS.fadeIn, print };
  if (!haunted || n % STEPS.haunt.every !== 0 || f.ground === 'water') return [own];
  const [fx, fz] = [Math.sin(f.yaw), Math.cos(f.yaw)];
  const [lx, lz] = [fz, -fx]; // to the left
  const back = f.stride * STEPS.haunt.behind;
  const side = STEPS.haunt.aside * (1 + 0.2 * drift); // (it does not keep the exact line)
  const them: Laid = {
    x: f.body.x - fx * back + lx * side,
    z: f.body.z - fz * back + lz * side,
    yaw: f.yaw + 0.12 * drift,
    foot: (-f.foot) as 1 | -1,
    bare: true,
    scale: STEPS.haunt.scale,
    fadeIn: STEPS.haunt.fadeIn,
    print: { look: print.look, life: STEPS.haunt.life, alpha: STEPS.haunt.alpha * print.alpha },
  };
  return [own, them];
}
