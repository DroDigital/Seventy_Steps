/**
 * The tread (round 80, atmosphere): in the quiet of a mind that is failing, something walks behind. Fractured on, every minute or two and
 * for a few seconds at a time, a second set of footsteps shadows the investigator's own, a half-stride behind them, softer and duller, on
 * the same ground; when they stop, theirs stop, and a moment later one step more lands, nearer, and the night goes still. Standing still
 * when it comes, instead: four to seven slow steps from behind the listener, closing, and nothing at the instant the investigator turns to
 * face them (they walk on, if the investigator does). Never in a fight, a talk, a cutscene or a menu, on a horse, in the water or near
 * death; each step is a take of the ground's own steps (never the same one twice running), pitched down and low-passed; it follows
 * `fx.stress`. Read-only on the simulation, writes only the sound. The numbers are data/mindSounds.ts.
 */

import type { V3 } from '../../core/geom';
import { MIND_EARS, MIND_SOUNDS, TREAD_SETS } from '../../data/mindSounds';
import { SAMPLE_SETS } from '../../data/samples';
import { engagedFights } from '../../systems/bossFight';
import { fighting } from '../../systems/sanity';
import { HEART } from '../feel';
import type { AtmAudioContext } from './atmosphereAudio';
import { indoorsAt, strideAt, surfaceAt } from './foley';
import { indoorLift } from './footing';

const T = MIND_EARS.tread;
const A = T.approach;
const between = (r: readonly [number, number], k: number): number => r[0] + (r[1] - r[0]) * k;
const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));

/** The second of the next episode, from `seconds`: never below the Fractured line, then every so often, sooner as the mind goes, drawn 0.6 to 1.4 times over. */
export function nextEpisodeAt(seconds: number, stress: number, rand: () => number): number {
  if (stress < T.from) return Infinity;
  return seconds + Math.max(T.gap, between(T.every, clamp((stress - T.from) / (1 - T.from))) * (0.6 + 0.8 * rand()));
}

/** How many footfalls a tread keeps up with, and how many steps come from behind a still listener. */
export const treadSteps = (rand: () => number): number => Math.round(between(T.steps, rand()));
export const approachSteps = (rand: () => number): number => Math.round(between(A.steps, rand()));

/** Seconds a follower's step falls after the investigator's own, from the time between their last two: a half-stride, a little different each time. */
export const followDelay = (interval: number, rand: () => number): number => clamp(interval, 0.2, 1.2) * between(T.delay, rand());

/** Seconds without a footfall of the investigator's that mean they have stopped, by the time between their last two. */
export const stopAfter = (interval: number): number => Math.max(T.stop, T.stopBy * interval);

/** How far behind the listener the `i`th of `n` approaching steps lands, metres: closing from the first distance to the last. */
export const approachDistance = (i: number, n: number): number => A.from + (A.to - A.from) * (n <= 1 ? 1 : i / (n - 1));

/** Whether a look along (fx, fz) is turned toward a bearing (dx, dz), both unit: within about fifty degrees of it. */
export const turnedToward = (fx: number, fz: number, dx: number, dz: number): boolean => fx * dx + fz * dz > A.turned;

type Mode = 'idle' | 'tread' | 'approach';

export interface Follower {
  update(stress: number, seconds: number, paused: boolean): void;
}

export function createFollower(ctx: AtmAudioContext): Follower {
  const { g, sampler } = ctx;
  let mode: Mode = 'idle';
  let [due, left, side, lastStep, interval] = [Infinity, 0, 1, -1e9, 0.5]; // when the next begins; steps it still keeps; which ear; when the investigator last stepped, and the time between the last two
  let [walked, last, before]: [number, V3 | null, number] = [0, null, 0];
  let [stepAt, index, count] = [0, 0, 0]; // an approach: when its next step falls, which, of how many
  const back = { x: 0, z: 0 }; // an approach: the bearing behind the listener

  /** foley.ts's stride, kept again here (its own is private to it): whether the investigator has just put a foot down. */
  function stepped(seconds: number): boolean {
    const [tr, a] = [g.ecs.c.transform.get(g.player.id), g.ecs.c.actor.get(g.player.id)];
    const dt = Math.max(1e-3, seconds - before);
    before = seconds;
    if (!tr || !a) return false;
    const moved = last ? Math.hypot(tr.pos.x - last.x, tr.pos.z - last.z) : 0;
    last = { ...tr.pos };
    if (g.player.mount.active || moved > 3 || a.move !== null || g.ecs.c.dead.has(g.player.id)) {
      walked = 0; // mounted, a jump, a move or a fall: no stride
      return false;
    }
    const speed = moved / dt;
    if (speed < 0.3) return false;
    walked += moved;
    const stride = strideAt(speed);
    if (walked < stride) return false;
    walked %= stride;
    return true;
  }

  /** Whether this is a moment for it: on foot, in the world, at ease. */
  function allowed(): boolean {
    const { player } = g;
    if (!g.overworld || g.cutscene || player.mount.active || player.listening || player.kneeling || HEART.need > 0 || g.ecs.c.dead.has(player.id) || g.ecs.c.actor.get(player.id)?.move) return false;
    const p = g.ecs.c.transform.get(player.id)!.pos;
    return surfaceAt(g, p.x, p.y, p.z) !== 'water' && engagedFights(g).length === 0 && !fighting(g);
  }

  /** One of the ground's steps, as a follower's: heavier, duller, to one side. */
  function step(stress: number, delay: number, o: { gain?: number; lowpass?: number; pitch?: number; pan?: number } = {}): void {
    const p = g.ecs.c.transform.get(g.player.id)!.pos;
    side = -side;
    sampler.play(SAMPLE_SETS[TREAD_SETS[surfaceAt(g, p.x, p.y, p.z)]], {
      gain: (o.gain ?? between(T.gain, stress)) * indoorLift(indoorsAt(g, p.x, p.y, p.z)), // (on a dungeon room's floor as much louder as the investigator's own steps are, round 86)
      pan: o.pan ?? T.pan * side,
      pitch: o.pitch ?? between(T.pitch, Math.random()),
      lowpass: o.lowpass ?? T.lowpass,
      delay,
    });
  }

  const finish = (seconds: number, stress: number): void => {
    mode = 'idle';
    due = nextEpisodeAt(seconds, stress, Math.random);
  };

  return {
    update(stress, seconds, paused) {
      if (paused) return;
      const stepNow = stepped(seconds);
      if (stepNow) [interval, lastStep] = [seconds - lastStep < 1.5 ? seconds - lastStep : interval, seconds];
      if (stress < T.from || (mode !== 'idle' && !allowed())) {
        if (mode !== 'idle' || due !== Infinity) finish(seconds, stress); // (a fight, a talk, a cutscene: it is gone without a sound)
        return;
      }
      if (due === Infinity) due = nextEpisodeAt(seconds, stress, Math.random); // the first, a while after the line is crossed
      const fwd = { x: ctx.right.z, z: -ctx.right.x }; // where the camera looks (right = forward x up)
      if (mode === 'idle') {
        if (seconds < due) return;
        if (!allowed()) return void (due = seconds + 6);
        if (seconds - lastStep < 0.6) [mode, left] = ['tread', treadSteps(Math.random)];
        else if (seconds - lastStep > A.still) {
          [mode, count, index, stepAt] = ['approach', approachSteps(Math.random), 0, seconds + A.lead];
          [back.x, back.z] = [-fwd.x, -fwd.z];
        } else due = seconds + 1;
        return;
      }
      if (mode === 'tread') {
        const tr = g.ecs.c.transform.get(g.player.id)!;
        const [px, pz] = [Math.sin(tr.yaw), Math.cos(tr.yaw)]; // the way they face: looking the other way along it is to look at what is behind
        if (turnedToward(fwd.x, fwd.z, -px, -pz)) return finish(seconds, stress);
        if (stepNow) {
          step(stress, followDelay(interval, Math.random));
          if (--left <= 0) finish(seconds, stress);
        } else if (seconds - lastStep > stopAfter(interval)) {
          const L = T.last; // they have stopped: one step more, a moment on, nearer
          step(stress, Math.max(0, between(L.wait, Math.random()) - (seconds - lastStep - stopAfter(interval))), { gain: L.gain, lowpass: L.lowpass, pitch: L.pitch, pan: 0.12 * side });
          finish(seconds, stress);
        }
        return;
      }
      if (stepNow) return void ([mode, left] = ['tread', Math.max(4, count - index) + 2]); // they walk on, and it comes with them
      if (turnedToward(fwd.x, fwd.z, back.x, back.z)) return finish(seconds, stress); // turned to face it: nothing, on the instant
      if (seconds < stepAt) return;
      const d = approachDistance(index, count);
      const near = 1 - (d - A.to) / (A.from - A.to);
      step(stress, 0, { gain: between(A.gain, near) * (0.8 + 0.2 * stress), lowpass: between(A.lowpass, near), pan: 0.3 * side * (1 - 0.4 * near) });
      stepAt = seconds + between(A.gap, Math.random());
      if (++index >= count) {
        if (stress >= MIND_EARS.tide.from && Math.random() < A.breath) ctx.recipe('mind:breath', MIND_SOUNDS.breath, { gain: 0.8, pan: 0.6 * side, vary: 0.8, pitch: 0.95 });
        finish(seconds, stress);
      }
    },
  };
}
