/**
 * Sound through walls (round 80). The simulation already knows that a wall halves how far a footfall is heard and that a
 * horror's fog is a wall (systems/perception.ts), but the investigator's own ears did not: a ghoul behind a wall, a cry from
 * the next room, a horror roaring beyond its fog were as clear as ones in the room. Now a sound is shut off by what stands in
 * the line from the investigator's head to it: stone, a hill or a great column (not a tree, a fence or a post), a horror's fog,
 * a roof between them. `occludedAt` is 0 (clear) to 1; `heard` takes a placed sound's level by it (never to silence) and gives
 * the low-pass it is heard through. A look is kept for a quarter second by the cell the sound falls in and a frame casts at
 * most OCCLUSION.perFrame rays, so a crowd of calls costs no more than a few. Read-only on the simulation.
 */

import type { V3 } from '../../core/geom';
import { OCCLUSION as O } from '../../data/acoustics';
import { engagedFights } from '../../systems/bossFight';
import { fogBetween } from '../../systems/fogGates';
import type { Game } from '../../systems/components';
import { raycast, type Collider } from '../../world/colliders';
import { roofedAt } from '../../world/terrain';
import { dullness } from './cues';

/** Whether a collider stops a sound: a wall (thick and tall) or a great column; not a tree, a fence or a post. */
export function stopsSound(c: Collider): boolean {
  if (c.kind === 'cylinder') return c.radius >= O.great && c.y1 - c.y0 >= O.tall;
  if (c.kind === 'box') return Math.min(c.max.x - c.min.x, c.max.z - c.min.z) >= O.thick && c.max.y - c.min.y >= O.tall;
  return Math.min(c.hx, c.hz) * 2 >= O.thick && c.y1 - c.y0 >= O.tall;
}

/** How shut off a sound is by what lies between (0..1): a fog wall is a wall; a wall in the line is most of one; a roof between, the line clear, is some. */
export function shutOff(fog: boolean, blocked: boolean, roofsDiffer: boolean): number {
  if (fog) return O.fog;
  if (blocked) return roofsDiffer ? O.roofBlocked : O.blocked;
  return roofsDiffer ? O.roof : 0;
}

/** A placed sound (its gain and pan from `placeSound`) as heard through `occ`: its level taken down by up to OCCLUSION.gain, and the low-pass it passes (the distance's, or the wall's, the duller). */
export function heard(p: { gain: number; pan: number }, occ: number): { gain: number; pan: number; lowpass: number; occ: number } {
  const [open, shut] = O.cutoff;
  const wall = open * Math.pow(shut / open, Math.pow(occ, O.curve)); // (the cutoff falls by octaves, as the ear hears it)
  return { gain: p.gain * (1 - O.gain * occ), pan: p.pan, lowpass: Math.min(dullness(p.gain), wall), occ };
}

interface Kept {
  value: number;
  frame: number;
}

export interface Occlusion {
  /** 0 clear .. 1 wholly shut off: how far `at` is from the investigator's ears. */
  occludedAt(at: V3): number;
  /** The last frame's count of rays, for the tests and the debug hooks. */
  readonly rays: number;
}

export function createOcclusion(g: Game): Occlusion {
  const kept = new Map<number, Kept>();
  const [eye, aim] = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];
  let [frame, used, swept, fighting] = [-1, 0, 0, false];
  const cellOf = (at: V3): number => {
    const [i, j, k] = [Math.round(at.x / O.cell), Math.round(at.y / O.cell), Math.round(at.z / O.cell)];
    return ((i * 73856093) ^ (j * 19349663) ^ (k * 83492791)) | 0;
  };
  return {
    get rays() {
      return used;
    },
    occludedAt(at) {
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      if (!me) return 0;
      if (Math.hypot(at.x - me.x, at.z - me.z) < O.near && Math.abs(at.y - me.y) < O.near) return 0; // the investigator's own sounds
      if (g.frame !== frame) [frame, used, fighting] = [g.frame, 0, engagedFights(g).length > 0]; // (in a fight the place is one hall: a pillar does not mute the horror, its fog still does)
      const key = cellOf(at);
      const had = kept.get(key);
      if (had && g.frame - had.frame <= O.keepFrames) return had.value;
      if (used >= O.perFrame) return had?.value ?? 0; // the rays of this frame are spent: the last look stands
      used++;
      Object.assign(eye, { x: me.x, y: me.y + 1.4, z: me.z });
      Object.assign(aim, { x: at.x, y: at.y + 1.2, z: at.z });
      const fog = fogBetween(g, me, at);
      const blocked = !fog && !fighting && raycast(g.world, eye, aim, stopsSound) < 1;
      const roofs = !!g.overworld && roofedAt(me.x, me.z) !== roofedAt(at.x, at.z);
      const value = shutOff(fog, blocked, roofs);
      kept.set(key, { value, frame: g.frame });
      if (kept.size > 256 && g.frame - swept > 120) { // old looks are let go now and then
        swept = g.frame;
        for (const [k, v] of kept) if (g.frame - v.frame > O.keepFrames * 4) kept.delete(k);
      }
      return value;
    },
  };
}
