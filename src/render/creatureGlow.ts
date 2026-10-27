/**
 * What glows about a creature's picture (split from creatureViews.ts, round 83): the faint halo about the eyes (and the
 * marks that glow) of a sprite, which comes out of the dark as the investigator nears and out of a mist once the creature
 * has seen them; a failing mind sees them swell and burn; and a horror's voice and its phase make them flare. The atlas
 * knows where the eyes are in each frame of the generated sprites, `REVIEWED_EYES` in each reviewed form's front view.
 * Render only.
 */

import * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { BOSS_PRESENCE } from '../data/fxTuning';
import { REVIEWED_EYES } from '../data/reviewedLook';
import { FOG_EYES, LIGHT } from '../data/tuning';
import type { Game } from '../systems/components';
import { sight } from '../systems/perception';
import type { Look } from './creatureLook';
import { createHalos } from './halos';
import { CELL, type SpriteAtlas } from './sprites/atlas';
import { MIST } from './volumetricFog';
import { worldUniforms } from './worldMaterial';

const EYES_MIND = { swell: 0.7, gain: 0.8 } as const; // how much more a failing mind (0..1) sees of their glow: wider, and brighter

export interface CreatureGlow {
  readonly mesh: THREE.Mesh;
  begin(): void;
  end(): void;
  /** A halo about a horror's body at (x, y, z), `radius` metres, in `rgb` at `gain`. */
  halo(x: number, y: number, z: number, radius: number, rgb: ArrayLike<number>, gain: number): void;
  /** A faint glow about the eyes of a generated sprite drawn at (x, y, z), `size` metres, in atlas cell `cell`. */
  eyes(cell: number, x: number, y: number, z: number, size: number, flip: boolean, look: Look, eye: THREE.Vector3, out?: number): void;
  /** The eyes of a reviewed form seen from the front (the art holds them only there), where `REVIEWED_EYES` has them; `flare` (0..1): its voice. */
  reviewedEyes(key: string, size: { width: number; height: number; groundOffset: number }, x: number, y: number, z: number, look: Look, eye: THREE.Vector3, out: number, flare: number): void;
  /** 0..1: how far this creature's eyes have come out of the mist (it sees the investigator, in a mist: they come out of it, not on), dimmed in a blink now and then (round 35). */
  mistLook(id: Entity, time: number): number;
  forget(live: ReadonlySet<Entity>): void;
}

export function createCreatureGlow(g: Game, atlas: SpriteAtlas, flat: THREE.Vector3, capacity: number): CreatureGlow {
  const glows = createHalos(capacity, 0.55);
  const looking = new Map<Entity, number>(); // 0..1: how far a creature's eyes have come out of the mist (round 35)
  const rgbOf = new Float32Array(3);
  /** A faint glow at (px, py, pz), `spread` metres wide, in colour `rgb`: eyes, or a mark that glows, that look out of the dark as the investigator nears, or out of a mist once they have seen them. */
  const glow = (px: number, py: number, pz: number, spread: number, rgb: ArrayLike<number>, look: Look, eye: THREE.Vector3, out = 0, flare = 0): void => {
    const [lo, hi] = LIGHT.eyes;
    const d = Math.hypot(px - eye.x, py - eye.y, pz - eye.z);
    const near = Math.max(1 - THREE.MathUtils.smoothstep(d, lo, hi), out * (1 - THREE.MathUtils.smoothstep(d, hi, hi + FOG_EYES.reach))); // in a mist, one that has seen the investigator looks out of it from far off
    const mind = worldUniforms.uMind.value; // a failing mind sees them swell and burn
    const gain = (LIGHT.eyeGlow.gain * (1 + EYES_MIND.gain * mind) * (1 + BOSS_PRESENCE.eyes * flare) + FOG_EYES.boost * out) * near * look.opacity * (1 - look.sink) * (1 - (look.dissolve ?? 0)) * (look.appear ?? 1);
    if (gain > 0.01) glows.put(px, py, pz, LIGHT.eyeGlow.radius * (1 + FOG_EYES.swell * out + EYES_MIND.swell * mind + 0.5 * flare) + spread, rgb, gain);
  };
  return {
    mesh: glows.mesh,
    begin: glows.begin,
    end: glows.end,
    halo: (x, y, z, radius, rgb, gain) => void glows.put(x, y, z, radius, rgb, gain),
    eyes(cell, x, y, z, size, flip, look, eye, out = 0) {
      const k = cell * 4;
      if (!atlas.eyes[k + 3]) return;
      const [ex, ey] = [atlas.eyes[k] / CELL, atlas.eyes[k + 1] / CELL];
      const along = (flip ? 0.5 - ex : ex - 0.5) * size;
      glow(x + flat.x * along, y + (1 - ey) * size, z + flat.z * along, (atlas.eyes[k + 2] / CELL) * size, atlas.eyeColors.subarray(cell * 3, cell * 3 + 3), look, eye, out);
    },
    reviewedEyes(key, size, x, y, z, look, eye, out, flare) {
      const found = REVIEWED_EYES[key];
      if (!found) return;
      const [ex, ey, spread, r, gr, b] = found;
      rgbOf.set([r, gr, b]);
      const along = (ex - 0.5) * size.width;
      glow(x + flat.x * along, y - size.groundOffset - look.sink * size.height * 0.3 + (1 - ey) * size.height, z + flat.z * along, spread * size.width, rgbOf, look, eye, out, flare);
    },
    mistLook(id, time) {
      const br = g.ecs.c.brain.get(id);
      const foggy = Math.min(1, Math.max(0, (MIST.thickness - FOG_EYES.from) / FOG_EYES.span));
      const sees = foggy > 0 && !!br && br.state !== 'hidden' && br.state !== 'return' && br.state !== 'follow' && sight(g, id, g.player.id, br.def.params) >= FOG_EYES.sees;
      const was = looking.get(id) ?? 0;
      const amt = was + ((sees ? foggy : 0) - was) * Math.min(1, (sees ? FOG_EYES.rise : FOG_EYES.fall) / 60);
      looking.set(id, amt);
      return amt * (Math.sin(time * 0.9 + id * 7.3) > 0.985 ? 0.15 : 1);
    },
    forget(live) {
      for (const id of looking.keys()) if (!live.has(id)) looking.delete(id);
    },
  };
}
