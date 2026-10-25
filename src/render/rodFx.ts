/**
 * The lightning rods of a walled court (round 67; world/enclosureBailey.ts says where their tips are): every few seconds, whatever the
 * sky, a bolt leaps from the cloud to a rod, as it has for a hundred years: the forked line, a flare of rays at the tip, the sky's flash
 * and the thunder after (render/lightning.ts). It falls while the investigator is near and not in the fight: seen from the court it is
 * what tells a place from afar. A court out of sight does not count its seconds, and one the investigator comes to begins part way through
 * its wait. Render only.
 */

import type { V3 } from '../core/geom';
import { ROD } from '../data/tuning';
import type { Game } from '../systems/components';
import { worldLayout } from '../world/placements';
import type { Beams } from './beams';
import { burst, ELEMENTS, flash, type Element } from './fxKit';
import type { Lightning } from './lightning';
import { boltPath } from './lightningPath';
import type { Particles } from './particles';
import { STORM_LOOK } from './skyStrikeFx';

const RAYS: Element = { ...ELEMENTS.star, halo: false };
const WHITE = [1, 1, 1] as const;
const ARC = [0.62, 0.78, 1] as const;

export interface RodFx {
  update(camera: V3, time: number, hidden: boolean): void;
}

export function createRodFx(g: Game, particles: Particles, beams: Beams, lightning: Lightning): RodFx {
  const courts = worldLayout().arenas.flatMap((a) => (a.house?.rods?.length ? [{ x: a.x, z: a.z, radius: a.radius, rods: a.house.rods, next: NaN, turn: 0 }] : []));
  const between = ([lo, hi]: readonly [number, number]): number => lo + (hi - lo) * Math.random();
  return {
    update(camera, time, hidden) {
      for (const c of courts) {
        const away = Math.hypot(camera.x - c.x, camera.z - c.z);
        if (hidden || away > ROD.near + c.radius + 40) {
          c.next = NaN; // a court out of sight is not counting its seconds
          continue;
        }
        if (Number.isNaN(c.next)) c.next = time + between(ROD.every) * Math.random(); // it begins part way through its wait, so arriving is not a signal
        if (time < c.next) continue;
        c.next = time + between(ROD.every);
        if (away < c.radius + ROD.quiet) continue; // not in the fight
        const tip = c.rods.length > 2 ? c.rods[Math.floor(Math.random() * c.rods.length)]! : c.rods[c.turn++ % ROD.keepEvery === ROD.keepEvery - 1 ? c.rods.length - 1 : 0]!; // (a court of many rods, a storm's: any of them)
        const top = { x: tip.x + (Math.random() - 0.5) * 8, y: tip.y + 80, z: tip.z + (Math.random() - 0.5) * 8 };
        beams.bolt(boltPath(top, tip, Math.random, { segments: 14, sway: 4, forks: 3 }), 0.4, 0.45, ARC, WHITE);
        burst(particles, RAYS, tip, 1.4, STORM_LOOK, 0.9);
        flash(particles, RAYS, tip, 2.2, STORM_LOOK, 0.5);
        if (g.overworld) lightning.strikeNow(ROD.far);
      }
    },
  };
}
