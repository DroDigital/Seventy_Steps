/**
 * Round 80, atmosphere: the breath in the cold (data/coldBreath.ts). On the Mountains of Madness, in the Vermont hills and the desert night
 * the investigator's breath ghosts out in front of the face at each breath: slow and pale at rest, quicker as they walk, ragged and heavy when
 * they are spent (a sprint, a low stamina bar), and it streams away down the wind. It makes the cold felt and shows the strain with no
 * bar. None on a mount, under a roof or in a close shot (nothing is born within a lens's reach). Render only; reads the body, never writes it.
 */

import type * as THREE from 'three';
import { BREATH, COLD } from '../data/coldBreath';
import { FOGS } from '../data/fogs';
import { darkOf, phaseOf } from '../systems/clock';
import type { Game } from '../systems/components';
import type { Particles } from './particles';
import { worldUniforms } from './worldMaterial';

/** How cold the breath is in `region` at `dark` of the night (0..1) and `stormy` (rain, a storm or a gale): its realm's cold, kept whole in the deep of the night. */
export function coldOf(region: string | null | undefined, dark: number, stormy: boolean): number {
  const cold = COLD[region ?? ''] ?? 0;
  return cold * (BREATH.night + (1 - BREATH.night) * dark) * (1 + (stormy ? BREATH.storm : 0));
}

/** Seconds between breaths: slow at rest, quicker walking, short when spent (a sprint, or the stamina bar below its share). */
export function cycleOf(stamina: number, sprinting: boolean, speed: number): number {
  if (sprinting || stamina < BREATH.winded) return BREATH.period.spent;
  return speed > BREATH.walking ? BREATH.period.walk : BREATH.period.rest;
}

export interface Breath {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
  /** The next frame is a breath out (the debug hook: a still is taken at a frame rate far below the game's, and the breath is brief). */
  rush(): void;
}

export function createBreath(g: Game, particles: Particles): Breath {
  let [next, px, pz, last] = [0, NaN, NaN, -1];
  return {
    rush() {
      next = 0;
    },
    update(camera, time, hidden) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const tr = g.ecs.c.transform.get(g.player.id);
      const ow = g.overworld;
      if (!tr || !ow) return;
      const speed = Number.isNaN(px) || dt <= 0 ? 0 : Math.hypot(tr.pos.x - px, tr.pos.z - pz) / dt;
      [px, pz] = [tr.pos.x, tr.pos.z];
      if (hidden || g.player.mount.active || time < next) return;
      const kind = ow.weather.kind;
      const cold = coldOf(ow.region, darkOf(phaseOf(time)), (kind === 'rain' || kind === 'storm' || kind === 'gale') && ow.weather.amount > 0.3);
      if (cold < BREATH.from) return;
      const sta = g.ecs.c.stamina.get(g.player.id);
      const share = sta && sta.max > 0 ? sta.value / sta.max : 1;
      const spent = g.player.sprinting || share < BREATH.winded;
      next = time + cycleOf(share, g.player.sprinting, speed) * (0.85 + 0.3 * Math.random());
      const [s, c] = [Math.sin(tr.yaw), Math.cos(tr.yaw)]; // yaw 0 faces +z
      const [x, y, z] = [tr.pos.x + s * BREATH.ahead, tr.pos.y + BREATH.head, tr.pos.z + c * BREATH.ahead];
      const cam = camera.position;
      if (Math.hypot(x - cam.x, y - cam.y, z - cam.z) < BREATH.lens) return; // a close shot is not to be clouded
      const wind = FOGS[ow.region ?? '']?.wind ?? FOGS.hub!.wind;
      const blow = 0.5 + 0.5 * worldUniforms.uWind.value; // a gale tears it away
      const [lo, hi] = BREATH.puffs;
      const n = lo + Math.floor(Math.random() * (hi - lo + 1)) + (spent ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const [fwd, spread] = [0.55 * (spent ? 1.3 : 1) * (0.7 + 0.6 * Math.random()), (Math.random() - 0.5) * 0.18];
        particles.spawn({
          x: x + (Math.random() - 0.5) * 0.05, y: y + (Math.random() - 0.5) * 0.04, z: z + (Math.random() - 0.5) * 0.05,
          vx: s * fwd + c * spread + wind[0] * blow, vy: 0.22 + 0.12 * Math.random(), vz: c * fwd - s * spread + wind[1] * blow,
          life: BREATH.life[0] + Math.random() * (BREATH.life[1] - BREATH.life[0]), size: BREATH.size * (0.8 + 0.4 * Math.random()), grow: BREATH.grow,
          color: BREATH.color, alpha: BREATH.alpha * Math.min(1.25, cold) * (spent ? BREATH.spent : 1), drag: 1.4, shape: 'wisp',
        });
      }
    },
  };
}
