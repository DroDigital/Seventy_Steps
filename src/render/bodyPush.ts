/**
 * Round 78, the ground answers the body: the investigator, a rig and the nearest three bodies awake part the grass they go through (the
 * world shader's SWAY block reads `uBodies`), lay a lane of it down that rises again over a few seconds (render/trample.ts), and, in
 * soaked weather, ring the puddles where a boot or a hoof lands (the fragment shader's `uStep`). Dunwich's unseen horror is kept out of
 * it on purpose: the grass that bent for it would give away where it stands. Render only; it reads the simulation and writes the shared
 * uniforms (render/worldMaterial.ts) and nothing else.
 */

import type { Entity } from '../core/ecs';
import { BODY_PUSH as B, FOOT_RINGS as F, TRAMPLE as T } from '../data/groundSkin';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { trample } from './trample';
import { wetness } from './wetness';
import { worldUniforms } from './worldMaterial';

export interface Pushed {
  x: number;
  y: number; // the feet
  z: number;
  r: number;
}

export interface BodyPush {
  /** Each drawn frame: where the camera is, the clock the shaders run on, whether a roof is over it, and how far the picture is from the last step to the next. */
  update(eye: { x: number; z: number }, time: number, enclosed: boolean, alpha: number): void;
}

/** Whether a body is on the ground and in the world to be seen: the shadows' own rule (render/shadows.ts), and not a hovering thing. */
function standing(g: Game, id: Entity): boolean {
  const c = g.ecs.c;
  const model = c.model.get(id);
  if (!model || model.startsWith('fx:') || isAbsent(g, id) || isUnseen(g, id) || c.brain.get(id)?.state === 'hidden') return false;
  return (c.brain.get(id)?.def.params.hover ?? 0) <= B.hover;
}

const clampR = (r: number): number => Math.min(B.most, Math.max(B.least, r));

const near: number[] = new Array(B.slots - 1).fill(Infinity); // (the distances, squared, of the foes kept)

/**
 * The bodies that part the grass this frame, as they are drawn (between the last step and the next by `alpha`): the investigator first (or the
 * rig they ride), then up to the nearest three standing within `BODY_PUSH.reach` of the eye. Returns how many were written to `out`.
 */
export function chooseBodies(g: Game, eye: { x: number; z: number }, alpha: number, out: Pushed[]): number {
  const c = g.ecs.c;
  const lerp = (a: number, b: number): number => a + (b - a) * alpha;
  let n = 0;
  const mine = c.transform.get(g.player.id);
  if (mine && !isAbsent(g, g.player.id)) {
    out[n++].r = g.player.mount.active ? B.rig : B.foot;
    out[0].x = lerp(mine.prev.x, mine.pos.x);
    out[0].y = lerp(mine.prev.y, mine.pos.y);
    out[0].z = lerp(mine.prev.z, mine.pos.z);
  }
  const first = n;
  let kept = 0;
  for (const [id, body] of c.body) {
    if (id === g.player.id) continue;
    const tr = c.transform.get(id);
    if (!tr) continue;
    const [x, z] = [lerp(tr.prev.x, tr.pos.x), lerp(tr.prev.z, tr.pos.z)];
    const d = (x - eye.x) ** 2 + (z - eye.z) ** 2;
    if (d > B.reach * B.reach || (kept === near.length && d >= near[kept - 1]) || !standing(g, id)) continue;
    let k = kept;
    if (kept === near.length) k--; // it takes the place of the farthest...
    else kept++;
    for (; k > 0 && near[k - 1] > d; k--) {
      near[k] = near[k - 1]; // ...and those farther than it give way
      Object.assign(out[first + k], out[first + k - 1]);
    }
    near[k] = d;
    const slot = out[first + k];
    [slot.x, slot.y, slot.z, slot.r] = [x, lerp(tr.prev.y, tr.pos.y), z, clampR(body.radius)];
  }
  return first + kept;
}

/** The distance a stride covers, and the feet's sides: on foot and under a rig. */
function stride(g: Game): { len: number; side: number; hold: number } {
  return g.player.mount.active ? { len: F.rigStride, side: F.side * 4, hold: 0.9 } : { len: F.stride, side: F.side, hold: 0 };
}

export function createBodyPush(g: Game): BodyPush {
  const slots = Array.from({ length: B.slots }, (): Pushed => ({ x: 0, y: 0, z: 0, r: 0 }));
  const u = worldUniforms;
  let last = -1;
  const was = { x: 0, z: 0, set: false }; // where the investigator was drawn last
  let walked = 0; // metres since the last step
  let foot = 1; // which foot lands next
  let ring = 0; // the next of the rings to be written
  let quiet = true;

  const empty = (): void => {
    for (const b of u.uBodies.value) b.set(0, -1e4, 0, 0);
    u.uTrampleBox.value.w = 0;
    for (const s of u.uStep.value) s.set(0, 0, -100, 0);
    if (!quiet) trample.clear(), trample.upload();
    quiet = true;
    was.set = false;
  };

  /** Lays a ring where the boot landed: a stride on, alternating the feet. */
  const step = (x: number, z: number, yaw: number, time: number, speed: number): void => {
    const s = stride(g);
    const [fx, fz] = [Math.sin(yaw), Math.cos(yaw)]; // forward
    const [rx, rz] = [-Math.cos(yaw), Math.sin(yaw)]; // and to the right
    const k = Math.min(1, speed / F.quick);
    const strength = s.hold || F.strength[0] + (F.strength[1] - F.strength[0]) * k;
    u.uStep.value[ring].set(x + rx * s.side * foot + fx * 0.1, z + rz * s.side * foot + fz * 0.1, time, strength);
    ring = (ring + 1) % F.slots;
    foot = -foot;
  };

  return {
    update(eye, time, enclosed, alpha) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const tr = g.ecs.c.transform.get(g.player.id);
      if (enclosed || !tr || !g.overworld || isAbsent(g, g.player.id)) return empty();
      const n = chooseBodies(g, eye, alpha, slots);
      if (n === 0) return empty();
      const me = slots[0];
      if (was.set && Math.hypot(me.x - was.x, me.z - was.z) > B.leap) {
        trample.clear(); // a journey: nothing was walked between
        for (const s of u.uStep.value) s.set(0, 0, -100, 0);
        walked = 0;
      }
      const moved = was.set ? Math.hypot(me.x - was.x, me.z - was.z) : 0;
      const along = was.set && moved < B.leap;
      const [fromX, fromZ] = [along ? was.x : me.x, along ? was.z : me.z];
      was.x = me.x;
      was.z = me.z;
      was.set = true;
      quiet = false;
      for (let i = 0; i < B.slots; i++) {
        const b = u.uBodies.value[i];
        if (i < n) b.set(slots[i].x, slots[i].y, slots[i].z, slots[i].r);
        else b.set(0, -1e4, 0, 0);
      }
      trample.recentre(me.x, me.z);
      trample.decay(dt);
      for (let i = 1; i < n; i++) trample.stamp(slots[i].x, slots[i].z, Math.max(T.least, slots[i].r * T.reach));
      trample.sweep(fromX, fromZ, me.x, me.z, Math.max(T.least, me.r * T.reach)); // (the investigator's lane is unbroken, however slow the frame)
      trample.upload();
      u.uTrampleBox.value.set(trample.cx, trample.cz, 1 / T.cell, T.size / 2);
      if (wetness.value > F.wet && moved < B.leap) {
        walked += moved;
        if (walked >= stride(g).len) {
          walked = 0;
          step(me.x, me.z, tr.yaw, time, dt > 0 ? moved / dt : 0);
        }
      }
    },
  };
}
