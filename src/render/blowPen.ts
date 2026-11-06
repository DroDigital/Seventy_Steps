/**
 * What every particle of a quiet blow is drawn with (round 90, render only): the colour, and the one way particles are spawned. A blow has three
 * hues (data/foeBlows.ts): a particle is born in the first, passes through the second and dies in the third (`ParticleSpec.colorMid`), each turned
 * a few percent of a circle and a little lighter or darker by its own throw of the dice, so no two marks are alike. The `Pen` is what the
 * recipes of `blowMarks.ts` and `blowMatter.ts` draw with; `blowKit.ts` builds it.
 */

import type { V3 } from '../core/geom';
import type { FoeBlow } from '../data/foeBlows';
import { FOE_FX } from '../data/fxTuning';
import type { GroundFx } from './groundFx';
import { rotateHue, scaleRgb, type Rgb } from './palette';
import type { ParticleShape, Particles } from './particles';

export interface Tone {
  color: Rgb; // at birth
  colorMid: Rgb; // half way
  colorEnd: Rgb; // at death
}

export const hexRgb = (hex: number): Rgb => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
const clamp1 = (c: Rgb): Rgb => [Math.min(1, Math.max(0, c[0])), Math.min(1, Math.max(0, c[1])), Math.min(1, Math.max(0, c[2]))];

/** A blow's hues with this particle's own turn of hue and its own lightness. */
export function toneOf(hues: FoeBlow['hues'], rng: () => number): Tone {
  const turn = (rng() * 2 - 1) * FOE_FX.jitter.hue;
  const light = 1 + (rng() * 2 - 1) * FOE_FX.jitter.luma;
  const hue = (h: number): Rgb => clamp1(scaleRgb(rotateHue(hexRgb(h), turn), light));
  return { color: hue(hues[0]), colorMid: hue(hues[1]), colorEnd: hue(hues[2]) };
}

/** One particle, as the recipes say it (the colours are a `Tone`). */
export interface Put {
  at: V3;
  v?: V3;
  life: number;
  size: number;
  shape: ParticleShape;
  tone: Tone;
  alpha?: number;
  grow?: number;
  glow?: boolean;
  spin?: number;
  rot?: number;
  thick?: number;
  hold?: number;
  gravity?: number;
  drag?: number;
  floor?: number;
}

export interface Pen {
  rng: () => number;
  ground: GroundFx;
  put(p: Put): void;
  /** Runs `fn` in `seconds` of the game's time (at once for none); a few at most are kept waiting. */
  later(seconds: number, fn: () => void): void;
  /** The height of the ground under `at`, but never above `at`: where what falls from a blow lies. */
  floorOf(at: V3): number;
}

export function createPen(fx: Particles, ground: GroundFx, rng: () => number, later: Pen['later']): Pen {
  return {
    rng,
    ground,
    later,
    floorOf: (at) => Math.min(at.y, fx.ground?.(at.x, at.z) ?? at.y) + 0.02,
    put(p) {
      fx.spawn({
        x: p.at.x, y: p.at.y, z: p.at.z, life: p.life, size: p.size, shape: p.shape,
        color: p.tone.color, colorMid: p.tone.colorMid, colorEnd: p.tone.colorEnd,
        ...(p.v && { vx: p.v.x, vy: p.v.y, vz: p.v.z }),
        ...(p.alpha !== undefined && { alpha: p.alpha }), ...(p.grow !== undefined && { grow: p.grow }), ...(p.glow !== undefined && { glow: p.glow }),
        ...(p.spin !== undefined && { spin: p.spin }), ...(p.rot !== undefined && { rot: p.rot }), ...(p.thick !== undefined && { thick: p.thick }),
        ...(p.hold !== undefined && { hold: p.hold }), ...(p.gravity !== undefined && { gravity: p.gravity }), ...(p.drag !== undefined && { drag: p.drag }),
        ...(p.floor !== undefined && { floor: p.floor }),
      });
    },
  };
}
