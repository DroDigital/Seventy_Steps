/**
 * Round 116, a blast moves the world about it (data/groundSkin.ts BLAST). A horror's quake, a burst of marked ground, a bolt of the storm,
 * a way's plate bursting, a bolt that bursts, a horror's roar as it turns into its next phase and a horror's slam each send a wave out
 * over the land from where it went off. Up to four are kept, the weakest left giving way to a new one; each frame they are written for the
 * shaders (`uBlasts`: the world shader bends the grass, leaves, boughs and cloth away from a passing front and lays the grass down; the
 * mist is thrown out of the ring behind it, shaders/fog.ts) and read here for what the CPU moves (`blastAt`: a flame or a lamp gutters,
 * render/worldLights.ts; the air's motes are carried off, render/particles.ts `AIR_PUSH`). A strong one lays the grass at its heart down
 * over a disc that rises again as a trodden lane does (render/trample.ts). Render only: it reads the simulation's events and nothing
 * the game's rules read.
 */

import type { V3 } from '../core/geom';
import { BLAST } from '../data/groundSkin';
import { SIM } from '../data/tuning';
import { moveDef } from '../systems/actions';
import type { Game } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import { isThemed } from './attackLook';
import { AIR_PUSH } from './particles';
import { trample } from './trample';
import { worldUniforms } from './worldMaterial';

export interface Wave {
  x: number;
  z: number;
  t0: number; // when it went off, on the shaders' clock (render seconds)
  s: number; // how strong, a share of a full blast
}

/** The waves alive now and the clock they were last read at: what the CPU's readers move by. */
export const BLASTS: { waves: Wave[]; time: number } = { waves: [], time: 0 };

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** How long a wave goes on doing something: its front's run, or the mist it threw drifting back. */
export const waveLife = (): number => Math.max((BLAST.reach + 2 * BLAST.width) / BLAST.speed, BLAST.refill * 3);

/** How strongly wave `w` moves what stands at (x, z) at `time`: 0 before its front comes and once it is spent; the push away from its heart is added to `out`. The shaders' `blastAt` is the same. */
export function waveAt(w: Wave, x: number, z: number, time: number, out?: { x: number; z: number }): number {
  const front = (time - w.t0) * BLAST.speed;
  if (front < 0 || front > BLAST.reach + 2 * BLAST.width) return 0;
  const [dx, dz] = [x - w.x, z - w.z];
  const r = Math.hypot(dx, dz);
  const k = (w.s * Math.exp(-(((r - front) / BLAST.width) ** 2)) * (1 - smooth(0.55, 1, front / BLAST.reach))) / (1 + r / BLAST.near);
  if (out && k > 0) {
    out.x += (dx / Math.max(r, 0.3)) * k;
    out.z += (dz / Math.max(r, 0.3)) * k;
  }
  return k;
}

/** How strongly every live wave moves what stands at (x, z) at `time` (summed, at most 1.5); the push is added to `out`. */
export function blastAt(x: number, z: number, time = BLASTS.time, out?: { x: number; z: number }): number {
  let k = 0;
  for (const w of BLASTS.waves) k += waveAt(w, x, z, time, out);
  return Math.min(1.5, k);
}

/** The share of its light and height a flame or a lamp at (x, z) keeps as the fronts pass it (1: all). */
export const gutterAt = (x: number, z: number, time = BLASTS.time): number => (BLASTS.waves.length ? 1 - BLAST.gutter * Math.min(1, blastAt(x, z, time)) : 1);

/** Adds a wave of strength `s` going off at `at`, at `time`; when all the slots are taken, it takes the place of the one with least left in it, if that is less than its own. */
export function addWave(at: { x: number; z: number }, s: number, time: number): void {
  const strength = Math.min(1, s);
  if (!(strength > 0.02) || !Number.isFinite(at.x + at.z)) return;
  const left = (w: Wave): number => w.s * (1 - smooth(0, waveLife(), time - w.t0));
  const wave = { x: at.x, z: at.z, t0: time, s: strength };
  if (BLASTS.waves.length < BLAST.slots) BLASTS.waves.push(wave);
  else {
    const weakest = BLASTS.waves.reduce((a, b) => (left(b) < left(a) ? b : a));
    if (left(weakest) < strength) BLASTS.waves[BLASTS.waves.indexOf(weakest)] = wave;
  }
  if (strength >= BLAST.lay) trample.stamp(at.x, at.z, BLAST.layReach[0] + (BLAST.layReach[1] - BLAST.layReach[0]) * (strength - BLAST.lay) / (1 - BLAST.lay));
}

/** Writes the live waves where the shaders read them (an empty slot has no strength). */
export function writeWaves(time: number): void {
  BLASTS.time = time;
  BLASTS.waves = BLASTS.waves.filter((w) => time - w.t0 < waveLife() && time >= w.t0 - 1);
  const u = worldUniforms.uBlasts.value;
  for (let i = 0; i < BLAST.slots; i++) {
    const w = BLASTS.waves[i];
    if (w) u[i].set(w.x, w.z, w.t0, w.s);
    else u[i].set(0, 0, -1e4, 0);
  }
}

export interface BlastWaves {
  /** Each drawn frame, at the shaders' clock. */
  update(time: number): void;
}

/** Listens for what goes off, and keeps the waves for the frames drawn. */
export function createBlastWaves(g: Game): BlastWaves {
  const pending: { at: { x: number; z: number }; s: number; frame: number }[] = [];
  const add = (at: V3 | { x: number; z: number } | undefined, s: number): void => void (at && pending.push({ at: { x: at.x, z: at.z }, s, frame: g.frame }));
  const of = BLAST.of;
  g.events.on('Quaked', ({ at }) => add(at, of.quake));
  g.events.on('StrikeLanded', ({ at }) => add(at, of.strike));
  g.events.on('WardLanded', ({ at, mute }) => void (!mute && add(at, of.ward)));
  g.events.on('Erupted', ({ at, radius }) => add(at, of.erupt[0] + of.erupt[1] * radius));
  g.events.on('BoltLanded', ({ at, radius, on }) => void (on !== 'spent' && radius >= of.bolt[2] && add(at, of.bolt[0] + of.bolt[1] * radius)));
  g.events.on('BossPhase', ({ entity, phase }) => void (phase > 0 && add(g.ecs.c.transform.get(entity)?.pos, of.roar)));
  g.events.on('Swung', ({ entity, at }) => {
    const h = entity !== g.player.id ? moveDef(g.ecs.c.actor.get(entity)!)?.hit : undefined;
    if (h && isThemed(creatureOf(g, entity)?.id) && (h.reach < 0.05 || Math.abs(h.arc[0] - h.arc[1]) < 1)) add(at, of.slam); // a horror's slam or ring, as the ground answers it (presence.ts)
  });
  AIR_PUSH.push = (x, z, out) => {
    out.x = out.z = 0;
    if (blastAt(x, z, BLASTS.time, out) > 0) [out.x, out.z] = [out.x * BLAST.air, out.z * BLAST.air];
  };
  return {
    update(time) {
      for (const p of pending.splice(0)) addWave(p.at, p.s, time - Math.max(0, g.frame - p.frame) / SIM.hz); // (when it went off, on this clock)
      writeWaves(time);
    },
  };
}
