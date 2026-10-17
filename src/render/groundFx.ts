/**
 * What a blow leaves on the ground and sends along it (render only, round 51), drawn as decals: the
 * scar of an eruption, a slam or a landed bolt (burnt ground whose cracks cool and go out), the shock
 * rings that race out of a burst, and the sigil drawn for a summoning or an arrival. Each is born from
 * a game event by `attackFx` and lives on its own clock, in the horror's own mark and colours. And the
 * slash: the arc a swing has just swept, lit as it opens and gone in a quarter of a second.
 */

import type { V3 } from '../core/geom';
import { aoeLook, type AoeStyle } from './aoeLook';
import type { Decals } from './decals';
import type { Rgb } from './palette';

const MAX = 56;

type Item =
  | { kind: 'scar'; at: V3; r: number; life: number; color: Rgb; mark: AoeStyle; born: number }
  | { kind: 'shock'; at: V3; r: number; to: number; width: number; life: number; color: Rgb; mark: AoeStyle; born: number }
  | { kind: 'sigil'; at: V3; r: number; life: number; color: Rgb; mark: AoeStyle; born: number }
  | { kind: 'slash'; at: V3; r: number; yaw: number; arc: readonly [number, number]; life: number; color: Rgb; mark: AoeStyle; born: number };

export interface GroundFx {
  /** Burnt ground of `radius` that cools over `life` seconds. */
  scar(at: V3, radius: number, color: Rgb, who?: string, life?: number): void;
  /** A ring racing out from `from` to `to` metres across `life` seconds. */
  shock(at: V3, from: number, to: number, color: Rgb, who?: string, life?: number, width?: number): void;
  /** A circle drawn in about `at` and held, then let go. */
  sigil(at: V3, radius: number, color: Rgb, who?: string, life?: number): void;
  /** The arc (degrees, as a hit's) a swing of `radius` metres has swept about `at`, facing `yaw`. */
  slash(at: V3, radius: number, yaw: number, arc: readonly [number, number], color: Rgb, who?: string, life?: number): void;
  count(): number;
  draw(decals: Decals, time: number): void;
}

const ease = (t: number): number => 1 - (1 - t) * (1 - t);

export function createGroundFx(): GroundFx {
  const items: Item[] = [];
  let now = 0;
  const add = (it: Item): void => {
    if (items.length >= MAX) items.shift();
    items.push(it);
  };
  return {
    scar: (at, r, color, who, life = 9) => add({ kind: 'scar', at: { ...at }, r, life, color, mark: aoeLook(who), born: now }),
    shock: (at, from, to, color, who, life = 0.55, width = 1.4) => add({ kind: 'shock', at: { ...at }, r: from, to, width, life, color, mark: aoeLook(who), born: now }),
    sigil: (at, r, color, who, life = 2.2) => add({ kind: 'sigil', at: { ...at }, r, life, color, mark: aoeLook(who), born: now }),
    slash: (at, r, yaw, arc, color, who, life = 0.26) => add({ kind: 'slash', at: { ...at }, r, yaw, arc, life, color, mark: aoeLook(who), born: now }),
    count: () => items.length,
    draw(decals, time) {
      now = time;
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
        } else if (it.kind === 'slash') decals.sector(x, y, z, it.yaw, it.r, it.arc, 1, it.color, (1 - t) * (1 - t));
        else decals.sigil(x, y, z, it.r, Math.min(1, t / 0.3), it.color, t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
      }
    },
  };
}
