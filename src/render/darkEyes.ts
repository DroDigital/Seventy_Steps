/**
 * Eyes in the dark beyond the lantern (round 78): on the heath and among the trees, now and then a pair of faint eyes hangs in the black at the edge
 * of the lantern's reach, at the height of a hound, blinks once, and is gone when the lantern turns to them or the investigator nears. In Innsmouth
 * the pairs never blink, in the Black Wood they are red, and as the mind frays there is one more of them and the blinks go out of step. They do
 * nothing. Never in a fight or a talk, never near a light; one batch of halos, depth-tested, so the trees hide them (the Lurking Fear, the Shadow
 * over Innsmouth, the waiting whippoorwills). The rules are darkEyeRules.ts's; render only, and Math.random is not the simulation's stream.
 */

import type * as THREE from 'three';
import { EYES } from '../data/dreadPicture';
import { WORLD } from '../data/tuning';
import type { Game } from '../systems/components';
import { dawnOf, phaseOf } from '../systems/clock';
import { roofedAt } from '../world/terrain';
import { hasLineOfSight } from '../world/colliders';
import { calmOf } from './dreadCalm';
import { blinkIn, eyesIn, heightOf, lifeOf, maySettle, pairsFor, restOf, risen, shut, vanishes } from './darkEyeRules';
import { newGaze, offsetTo, readGaze } from './gaze';
import { createHalos } from './halos';
import { DREAD_AIR } from './shock';
import { woodOf } from './volumetricFog';

interface Slot {
  on: boolean; // a pair hangs here
  until: number; // seconds: when it rests until, off; when its time is up, on
  born: number;
  life: number;
  x: number;
  y: number;
  z: number;
  stared: number;
  gone: number; // seconds since it began to go (-1: not going)
  blinkAt: number; // seconds of its next blink
  late: number; // the second eye's lag behind the first (a fraying mind)
  tint: readonly [number, number, number];
  blinks: boolean;
  tried: number; // seconds of the last try at a place
}

export interface DarkEyes {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
  /** Debug: puts a pair `metres` ahead of the lens now (null: none could be put). */
  force(metres: number, offset?: number): { x: number; y: number; z: number } | null;
  readonly out: number;
}

export function createDarkEyes(scene: THREE.Scene, g: Game): DarkEyes {
  const slots: Slot[] = Array.from({ length: EYES.max + 1 }, () => ({ on: false, until: 0, born: 0, life: 0, x: 0, y: 0, z: 0, stared: 0, gone: -1, blinkAt: 0, late: 0, tint: [1, 1, 1], blinks: true, tried: -1e9 }));
  const halos = createHalos(slots.length * 2, 0.35);
  scene.add(halos.mesh);
  const gaze = newGaze();
  let last = -1;

  /** Tries to put a pair in `slot` at `r` metres from the lens `a` radians off its heading; true if it hangs. */
  function settle(slot: Slot, time: number, sanity: number, region: string, r: number, a: number, wood: number): boolean {
    const look = eyesIn(region);
    if (!look) return false;
    const b = gaze.look + a;
    const [x, z] = [gaze.x + Math.sin(b) * r, gaze.z + Math.cos(b) * r];
    const y0 = g.world.ground(x, z);
    const lit = Math.max(...[[0, 0], [14, 0], [-14, 0], [0, 14], [0, -14]].map(([dx, dz]) => g.lit?.({ x: x + dx, y: y0, z: z + dz }) ?? 0));
    const spot = { distance: r, offset: a, lit, sea: y0 < WORLD.seaLevel + 0.2, roofed: roofedAt(x, z), wood, roll: Math.random() };
    if (!maySettle(spot)) return false;
    const y = y0 + heightOf(Math.random());
    if (!hasLineOfSight(g.world, { x: gaze.x, y: gaze.y, z: gaze.z }, { x, y, z })) return false;
    Object.assign(slot, { on: true, born: time, life: lifeOf(Math.random()), x, y, z, stared: 0, gone: -1, tint: look.rgb, blinks: look.blinks, late: sanity < EYES.uneasy ? 0.1 + 0.12 * Math.random() : 0 });
    slot.blinkAt = time + blinkIn(Math.random());
    return true;
  }

  return {
    get out() {
      return slots.filter((s) => s.on).length;
    },
    force(metres, offset = 0.5) {
      const slot = slots.find((s) => !s.on) ?? slots[0];
      slot.tried = -1e9;
      const region = g.overworld?.region ?? 'arkham';
      const look = eyesIn(region) ?? eyesIn('arkham')!;
      const b = gaze.look + offset;
      const [x, z] = [gaze.x + Math.sin(b) * metres, gaze.z + Math.cos(b) * metres];
      const y = g.world.ground(x, z) + heightOf(0.4);
      Object.assign(slot, { on: true, born: last - EYES.fadeIn, life: 600, x, y, z, stared: 0, gone: -1, tint: look.rgb, blinks: look.blinks, late: g.mind.sanity < EYES.uneasy ? 0.15 : 0, blinkAt: last + 3 });
      return { x, y, z };
    },
    update(camera, time, hidden) {
      if (last < 0) for (const [i, s] of slots.entries()) s.until = time + 8 + 12 * i + 30 * Math.random(); // (the first are not out at once, nor together)
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      readGaze(camera, gaze);
      const grey = 1 - 0.7 * dawnOf(phaseOf(time)); // the last hour's grey thins them
      const region = g.overworld?.region ?? null;
      const calm = calmOf(g, time);
      const world = { calm, hidden: hidden || !g.overworld || !eyesIn(region) || DREAD_AIR.cap <= 0 }; // (none at FX intensity 0)
      const room = pairsFor(g.mind.sanity);
      halos.begin();
      for (const [i, s] of slots.entries()) {
        if (s.on) {
          const [dx, dz] = [s.x - gaze.x, s.z - gaze.z];
          const off = Math.abs(offsetTo(gaze, s.x, s.z));
          s.stared = off < EYES.stare ? s.stared + dt : Math.max(0, s.stared - dt * 0.5);
          if (s.gone < 0 && (i >= room || vanishes({ age: time - s.born, life: s.life, stared: s.stared, distance: Math.hypot(dx, dz), lit: 0 }, world))) s.gone = 0;
          else if (s.gone >= 0) s.gone += dt;
          if (s.gone > EYES.fadeOut) {
            [s.on, s.until, s.gone] = [false, time + restOf(Math.random()), -1];
            continue;
          }
          const a = (s.gone >= 0 ? 1 - s.gone / EYES.fadeOut : risen(time - s.born)) * EYES.gain * grey;
          if (s.blinks && time > s.blinkAt + EYES.blink + s.late) s.blinkAt = time + blinkIn(Math.random());
          const [yaw, side] = [Math.atan2(dx, dz), EYES.span];
          const [sx, sz] = [Math.cos(yaw) * side, -Math.sin(yaw) * side]; // the pair is turned to the lens
          for (const k of [-1, 1] as const) {
            const closed = s.blinks && shut(time, s.blinkAt, k > 0 ? s.late : 0);
            if (!closed) halos.put(s.x + sx * k, s.y, s.z + sz * k, EYES.radius, s.tint, a);
          }
        } else if (!world.hidden && calm && i < room && time >= s.until && time - s.tried > 0.5) {
          s.tried = time;
          const a = (Math.random() * 2 - 1) * EYES.arc;
          const r = EYES.from + (EYES.far - EYES.from) * Math.random();
          settle(s, time, g.mind.sanity, region!, r, a, woodOf(region, gaze.x + Math.sin(gaze.look + a) * r, gaze.z + Math.cos(gaze.look + a) * r));
        }
      }
      halos.end();
    },
  };
}
