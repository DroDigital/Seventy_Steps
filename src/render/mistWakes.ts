/**
 * The low mist parts for what moves through it (round 83; render only, read-only on the simulation): the investigator,
 * the people and the creatures nearest the lens each carve it, a gap before and about the body and a trail that closes
 * slowly behind it, with the mist turned a little about its edge (shaders/fog.ts `wakeAt`). Things come out of the mist
 * instead of being cut from it, and a pack's path across a field is read in it. What is unseen (an unrevealed stalker,
 * a horror not yet roused), what is hidden, dead, a flyer (it is not on the ground) or a spectre leaves none, so the mist tells nothing the picture does not (render/traceless.ts). The Fog setting scales it, as
 * it scales the mist itself.
 */

import type { Entity } from '../core/ecs';
import { MIST_WAKES } from '../data/fxTuning';
import { SIM } from '../data/tuning';
import type { Game } from '../systems/components';
import type { PostPass } from './postPass';
import { leavesNone } from './traceless';

const SLOTS = MIST_WAKES.slots;

export interface Wake {
  /** Where the body stands and where its trail ends (x, z, x, z), its breadth, how much it clears, the height it clears to, how far it turns the mist. */
  seg: readonly [number, number, number, number];
  info: readonly [number, number, number, number];
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** The wake of a body `speed` metres a second along (dx, dz) (unit) at (x, z), of breadth `radius` and `height` metres, or null if it moves too little to part the mist. */
export function wakeOf(x: number, z: number, dx: number, dz: number, speed: number, radius: number, height: number): Wake | null {
  if (speed < MIST_WAKES.minSpeed) return null;
  const pace = clamp01((speed - MIST_WAKES.minSpeed) / (MIST_WAKES.fullSpeed - MIST_WAKES.minSpeed));
  const trail = Math.min(MIST_WAKES.trailMost, speed * MIST_WAKES.trail);
  const breadth = Math.min(MIST_WAKES.radius[1], Math.max(MIST_WAKES.radius[0], radius * 1.3 + 0.35));
  return {
    seg: [x, z, x - dx * trail, z - dz * trail],
    info: [breadth, MIST_WAKES.strength * (0.35 + 0.65 * pace), Math.min(MIST_WAKES.height, 0.9 + height * 0.5), MIST_WAKES.turn],
  };
}

export interface MistWakes {
  /** Lays this frame's wakes into the post pass's uniforms: bodies as they are drawn, `alpha` between two ticks, `at` the lens. */
  update(post: PostPass, at: { x: number; z: number }, alpha: number): void;
}

export function createMistWakes(g: Game): MistWakes {
  const found: { wake: Wake; d: number; me: boolean }[] = [];
  const c = g.ecs.c;
  const consider = (id: Entity, at: { x: number; z: number }, alpha: number): void => {
    const [tr, body] = [c.transform.get(id), c.body.get(id)];
    if (!tr || !body) return;
    const me = id === g.player.id;
    if (!me && leavesNone(g, id)) return;
    const [x, z] = [tr.prev.x + (tr.pos.x - tr.prev.x) * alpha, tr.prev.z + (tr.pos.z - tr.prev.z) * alpha];
    const d = Math.hypot(x - at.x, z - at.z);
    if (d > MIST_WAKES.reach) return;
    const [vx, vz] = [(tr.pos.x - tr.prev.x) * SIM.hz, (tr.pos.z - tr.prev.z) * SIM.hz];
    const speed = Math.hypot(vx, vz);
    const wake = speed > 0 ? wakeOf(x, z, vx / speed, vz / speed, speed, body.radius, body.height) : null;
    if (wake) found.push({ wake, d, me });
  };
  return {
    update(post, at, alpha) {
      found.length = 0;
      for (const id of c.body.keys()) consider(id, at, alpha);
      found.sort((a, b) => Number(b.me) - Number(a.me) || a.d - b.d);
      const n = Math.min(SLOTS, found.length);
      const u = post.uniforms;
      for (let i = 0; i < n; i++) {
        u.uWakeSeg.value[i].set(...found[i].wake.seg);
        u.uWakeInfo.value[i].set(...found[i].wake.info);
      }
      u.uWakeCount.value = n;
    },
  };
}
