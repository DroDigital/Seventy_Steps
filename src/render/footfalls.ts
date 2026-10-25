/**
 * The investigator's footfalls (round 80), as the foley (render/audio/foley.ts) counts them: one every `strideAt(speed)` metres walked,
 * none while mounted, in a move, after a jump of more than three metres or once fallen. Two things read them, each with a clock of its
 * own that keeps step with the foley's: the ground's prints and puffs (render/atm/steps.ts) and the ground heard (render/audio/atm/footing.ts).
 * Render only: reads the simulation, writes nothing to it. No Three.js.
 */

import { STEPS } from '../data/bodyTuning';
import type { Game } from '../systems/components';
import { groundAt, type GroundKind } from '../world/groundKind';
import { strideAt } from './audio/foley';

/** Seconds between the body's last step of movement and a frame that sees none that still counts as walking on (three ticks of the 60 Hz simulation). */
const TICKS_BETWEEN = 0.05;

export interface Footfall {
  /** Where the foot came down. */
  x: number;
  y: number;
  z: number;
  /** The way the body was going, radians (0 faces +z). */
  yaw: number;
  /** Which foot: 1 the right, -1 the left. */
  foot: 1 | -1;
  /** Metres a second. */
  speed: number;
  /** Metres between this footfall and the last. */
  stride: number;
  ground: GroundKind;
  /** The body at the footfall, for what trails it. */
  body: { x: number; z: number };
}

export interface StrideClock {
  /** The footfall, if one fell, since the last look; `seconds` is render time. */
  step(seconds: number): Footfall | null;
  /** The seconds the body has walked without stopping, and whether it moves now. */
  readonly walking: { for: number; moving: boolean; sprint: boolean };
}

/** The capped stress the audio last heard (render/audio/atm/footing.ts sets it each frame): -1 until it is known. The picture's haunting keeps to the FX intensity setting through it. */
export const FOOT_MIND = { stress: -1 };

/** Whether a failing mind is followed now: Fractured or Unmoored, and the FX cap not set below that. */
export function followed(band: string, stress: number): boolean {
  return (STEPS.haunt.bands as readonly string[]).includes(band) && (stress < 0 || stress >= STEPS.haunt.stressFrom);
}

export function createStrideClock(g: Game): StrideClock {
  let last: { x: number; z: number } | null = null;
  let [walked, before, foot, heading, movedAt] = [0, 0, 1 as 1 | -1, 0, 0];
  const walking = { for: 0, moving: false, sprint: false };
  return {
    walking,
    step(seconds) {
      const { transform, actor } = g.ecs.c;
      const tr = transform.get(g.player.id);
      const a = actor.get(g.player.id);
      const dt = Math.max(1e-3, seconds - before);
      before = seconds;
      if (!tr || !a) return null;
      const [dx, dz] = last ? [tr.pos.x - last.x, tr.pos.z - last.z] : [0, 0];
      const moved = Math.hypot(dx, dz);
      if (moved === 0 && walking.moving && seconds - movedAt < TICKS_BETWEEN && !g.player.mount.active && a.move === null && !g.cutscene && !g.ecs.c.dead.has(g.player.id)) return (walking.for += dt), null; // a frame between two simulation steps (drawn faster than 60 Hz): the body walks on
      last = { x: tr.pos.x, z: tr.pos.z };
      walking.moving = false;
      if (g.player.mount.active || moved > 3 || a.move !== null || g.ecs.c.dead.has(g.player.id) || g.cutscene) return (walked = 0), (walking.for = 0), null; // mounted, a jump, a move, a fall, a scene: no stride
      const span = moved > 0 && seconds - movedAt <= TICKS_BETWEEN ? seconds - movedAt : dt; // the time the metres took: since the body last moved, not since the last frame
      if (moved > 0) movedAt = seconds;
      const speed = moved / Math.max(1e-3, span);
      if (speed < 0.3) return (walking.for = 0), null;
      walking.moving = true;
      walking.sprint = g.player.sprinting;
      walking.for += dt;
      if (moved > 0.002) heading = Math.atan2(dx, dz);
      walked += moved;
      const stride = strideAt(speed);
      if (walked < stride) return null;
      walked %= stride;
      foot = (foot === 1 ? -1 : 1) as 1 | -1;
      const [fx, fz] = [Math.sin(heading), Math.cos(heading)];
      const [rx, rz] = [-fz, fx]; // the right hand (yaw 0 faces +z; its right is -x)
      const [x, z] = [tr.pos.x + fx * STEPS.ahead + rx * STEPS.across * foot, tr.pos.z + fz * STEPS.ahead + rz * STEPS.across * foot];
      return { x, y: tr.pos.y, z, yaw: heading, foot, speed, stride, ground: groundAt(g, tr.pos.x, tr.pos.y, tr.pos.z), body: { x: tr.pos.x, z: tr.pos.z } };
    },
  };
}
