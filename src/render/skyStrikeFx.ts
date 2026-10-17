/**
 * A thunderstorm's bolts, seen (round 52). The ring of light that marks where a bolt will fall (a telegraph that fills, with a crackle
 * of sparks rising from its edge as the moment nears), and the bolt itself: a forked line from the cloud, a flash that lights the whole sky,
 * a burst of light and matter, a scar of glassy ground, a shock ring. And the bolts the sky rolls on its own, far off, which are drawn on the
 * far ground so a storm is not only a flicker. Render only; the simulation's events carry all of it (systems/skyStrikes.ts).
 */

import * as THREE from 'three';
import type { V3 } from '../core/geom';
import type { Game } from '../systems/components';
import type { Beams } from './beams';
import { lookOf, type AttackLook } from './attackLook';
import { burst, ELEMENTS, flash, type Element } from './fxKit';
import type { GroundFx } from './groundFx';
import type { Lightning } from './lightning';
import { boltPath } from './lightningPath';
import type { Rgb } from './palette';
import type { Particles } from './particles';

const ARC: Rgb = [0.62, 0.78, 1]; // the colour of the lightning
const WHITE: Rgb = [1, 1, 1];
/** Lightning's own look: pale blue, white at the heart, star-shaped splinters of light. */
export const STORM_LOOK: AttackLook = { ...lookOf(undefined), motif: 'star', danger: ARC, line: ARC, ring: [0.85, 0.92, 1], mind: ARC, core: WHITE, ember: [0.2, 0.3, 0.55], ink: [0.1, 0.12, 0.2], punch: 1.15, twist: 1, pitch: 1 };

/** Light splintering into rays and sparks; its halo (a ring of light opening in the air) is for the elements of the eye and the glyph, and would stand over a bolt like a rainbow. */
const RAYS: Element = { ...ELEMENTS.star, halo: false };

const rand = (a: number, b: number): number => a + (b - a) * Math.random();

export interface SkyStrikeFx {
  update(time: number): void;
  /** A bolt drawn on the far ground, `far` (0 near .. 1 on the horizon) of the way out, in the half of the sky the camera is turned to. */
  distant(far: number, camera: THREE.Camera): void;
}

export function createSkyStrikeFx(g: Game, particles: Particles, ground: GroundFx, beams: Beams, lightning: Lightning): SkyStrikeFx {
  const warns: { at: V3; radius: number; ends: number }[] = [];
  let now = 0;
  g.events.on('StrikeWarned', ({ at, radius, frames }) => {
    ground.warn(at, radius, frames / 60, ARC);
    warns.push({ at: { ...at }, radius, ends: now + frames / 60 });
  });
  g.events.on('StrikeLanded', ({ at, radius }) => {
    warns.length = 0;
    const top = { x: at.x + rand(-4, 4), y: at.y + 85, z: at.z + rand(-4, 4) };
    beams.bolt(boltPath(top, at, Math.random, { segments: 16, sway: 6, forks: 3 }), 0.45, 0.55, ARC, WHITE);
    burst(particles, RAYS, at, radius, STORM_LOOK, 1.2);
    flash(particles, RAYS, at, radius * 1.6, STORM_LOOK, 1);
    ground.scar(at, radius * 1.2, ARC, 'yog_sothoth', 16);
    ground.shock(at, radius * 0.5, radius * 3.2, STORM_LOOK.ring, 'yog_sothoth', 0.6, 1.1);
    lightning.strikeNow(0); // the sky lights, and the thunder is on the heels of the crack
  });
  return {
    update(time) {
      now = time;
      for (let i = warns.length - 1; i >= 0; i--) {
        const w = warns[i]!;
        const left = w.ends - time;
        if (left < -0.3) {
          warns.splice(i, 1);
          continue;
        }
        const k = Math.min(1, Math.max(0, 1 - left / 1.5)); // 0 as it is marked .. 1 as it falls: the crackle thickens
        for (let n = 0; n < 1 + Math.round(k * 4); n++) {
          const a = Math.random() * Math.PI * 2;
          const d = w.radius * (0.2 + 0.85 * Math.random());
          particles.spawn({ x: w.at.x + Math.sin(a) * d, y: w.at.y + 0.1, z: w.at.z + Math.cos(a) * d, vy: 1.5 + 4 * k + Math.random() * 2, vx: Math.sin(a) * 0.4, vz: Math.cos(a) * 0.4, life: 0.35, size: 0.1 + 0.1 * k, grow: 0.5, color: WHITE, colorEnd: ARC, glow: true, shape: Math.random() < 0.4 ? 'spark' : 'streak', stretch: 0.1, spin: 8, hold: 0.3 });
        }
      }
    },
    distant(far, camera) {
      const look = camera.getWorldDirection(new THREE.Vector3());
      const yaw = Math.atan2(look.x, look.z) + rand(-1.2, 1.2);
      const d = 90 + 170 * far;
      const x = camera.position.x + Math.sin(yaw) * d;
      const z = camera.position.z + Math.cos(yaw) * d;
      const base = { x, y: g.world.ground(x, z), z };
      const top = { x: x + rand(-8, 8), y: base.y + 120 + 60 * far, z: z + rand(-8, 8) };
      beams.bolt(boltPath(top, base, Math.random, { segments: 18, sway: 9 + 8 * far, forks: 3 }), 0.4, 0.45 + 1.4 * far, ARC, WHITE);
    },
  };
}
