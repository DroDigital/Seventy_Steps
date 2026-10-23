/**
 * What a blow leaves on the ground and sends along it (render only, round 51), drawn as decals: the
 * scar of an eruption, a slam or a landed bolt (burnt ground whose cracks cool and go out), the shock
 * rings that race out of a burst, and the sigil drawn for a summoning or an arrival. Each is born from
 * a game event by `attackFx` and lives on its own clock, in the horror's own mark and colours. And the
 * slash: the arc a swing has just swept, lit as it opens and gone in a quarter of a second.
 */

import type { V3 } from '../core/geom';
import { INDICATOR } from '../data/fxTuning';
import { aoeLook, type AoeStyle } from './aoeLook';
import type { Decals } from './decals';
import type { Rgb } from './palette';

const MAX = 56;

type Item =
  | { kind: 'scar'; at: V3; r: number; life: number; color: Rgb; mark: AoeStyle; born: number }
  | { kind: 'shock'; at: V3; r: number; to: number; width: number; life: number; color: Rgb; mark: AoeStyle; born: number }
  | { kind: 'sigil'; at: V3; r: number; life: number; color: Rgb; mark: AoeStyle; born: number }
  | { kind: 'warn'; at: V3; r: number; life: number; color: Rgb; mark: AoeStyle; born: number; fill: number }
  | { kind: 'slash'; at: V3; r: number; yaw: number; arc: readonly [number, number]; life: number; color: Rgb; mark: AoeStyle; born: number };

export interface GroundFx {
  /** Burnt ground of `radius` that cools over `life` seconds (kept to the share `INDICATOR.scar` of them: a blow's mark does not linger). */
  scar(at: V3, radius: number, color: Rgb, who?: string, life?: number): void;
  /** A ring racing out from `from` to `to` metres across `life` seconds. */
  shock(at: V3, from: number, to: number, color: Rgb, who?: string, life?: number, width?: number): void;
  /** A circle drawn in about `at` and held, then let go (in `INDICATOR.sigil` of `life`). */
  sigil(at: V3, radius: number, color: Rgb, who?: string, life?: number): void;
  /** The arc (degrees, as a hit's) a swing of `radius` metres has swept about `at`, facing `yaw`. */
  slash(at: V3, radius: number, yaw: number, arc: readonly [number, number], color: Rgb, who?: string, life?: number): void;
  /** A telegraph for a bolt that will fall on `at` in `seconds`: it fills as the time runs out, and holds full a tenth of a second more. */
  warn(at: V3, radius: number, seconds: number, color: Rgb): void;
  /** A mark drawn every frame for as long as the game says so (`draw` lays it, or nothing): a vigil's ring (round 64). */
  steady(draw: (decals: Decals, time: number) => void): void;
  count(): number;
  draw(decals: Decals, time: number): void;
}

const ease = (t: number): number => 1 - (1 - t) * (1 - t);

export function createGroundFx(): GroundFx {
  const items: Item[] = [];
  const steadies: ((decals: Decals, time: number) => void)[] = [];
  let now = 0;
  const add = (it: Item): void => {
    if (items.length >= MAX) items.shift();
    items.push(it);
  };
  return {
    scar: (at, r, color, who, life = 9) => add({ kind: 'scar', at: { ...at }, r, life: life * INDICATOR.scar, color, mark: aoeLook(who), born: now }),
    shock: (at, from, to, color, who, life = 0.55, width = 1.4) => add({ kind: 'shock', at: { ...at }, r: from, to, width, life, color, mark: aoeLook(who), born: now }),
    sigil: (at, r, color, who, life = 2.2) => add({ kind: 'sigil', at: { ...at }, r, life: life * INDICATOR.sigil, color, mark: aoeLook(who), born: now }),
    slash: (at, r, yaw, arc, color, who, life = 0.26) => add({ kind: 'slash', at: { ...at }, r, yaw, arc, life, color, mark: aoeLook(who), born: now }),
    warn: (at, r, seconds, color) => add({ kind: 'warn', at: { ...at }, r, life: seconds + 0.12, fill: seconds / (seconds + 0.12), color, mark: aoeLook('yog_sothoth'), born: now }), // (the star: lines of light drawn on it)
    steady: (draw) => void steadies.push(draw),
    count: () => items.length,
    draw(decals, time) {
      now = time;
      for (const d of steadies) d(decals, time);
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]!;
        const t = (time - it.born) / it.life;
        if (t >= 1) {
          items.splice(i, 1);
          continue;
        }
        if (t < 0) continue;
        decals.style(it.mark);
        const { x, y, z } = it.at;
        if (it.kind === 'scar') decals.scar(x, y, z, it.r, t, it.color, 0.95);
        else if (it.kind === 'shock') {
          const r = it.r + (it.to - it.r) * ease(t);
          decals.ring(x, y, z, r, it.width * (1 - 0.5 * t), it.color, 1 - t * t);
        } else if (it.kind === 'warn') {
          decals.disc(x, y, z, it.r, Math.min(1, t / it.fill), it.color, 1);
          decals.ring(x, y, z, it.r + 0.7 + 0.3 * Math.sin(time * 14), 0.2, it.color, 0.55);
        } else if (it.kind === 'slash') decals.sector(x, y, z, it.yaw, it.r, it.arc, 1, it.color, (1 - t) * (1 - t));
        else decals.sigil(x, y, z, it.r, Math.min(1, t / 0.3), it.color, t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
      }
    },
  };
}
