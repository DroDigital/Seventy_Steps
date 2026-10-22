/**
 * The audit of the houses (round 63; data/arenaHouses.ts): a body walks at every open horror from four sides of its house, and is
 * stopped at the wall each time, the shut gate included; and once the horror is found its gate lets them in. (The screenshots of round 62
 * showed the boss fog could be entered from another angle than the trail's: a house has none.) Slow: in the audits (vitest.config.ts).
 */
import { describe, expect, it } from 'vitest';
import { foundKey } from '../src/data/discoveries';
import { createWorldGame } from '../src/systems/game';
import { refreshSeals } from '../src/systems/seals';
import { courtPoint } from '../src/world/arenaWay';
import { worldLayout } from '../src/world/placements';
import { walkIn } from './worldHelpers';

const arenas = worldLayout().arenas.filter((a) => a.house);

describe('there is no way in but the gate', () => {
  it('a body walking at the horror from the gate side and from the sides and back is stopped at the wall, the shut gate included', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      const P = a.house!.radius;
      const gateAt = Math.atan2(a.front.z, a.front.x);
      for (const turn of [0, 45, 90, 135, 180, 225, 270, 315]) {
        const t = gateAt + (turn * Math.PI) / 180;
        const from = { x: a.x + Math.cos(t) * (P + 7), z: a.z + Math.sin(t) * (P + 7) };
        expect(walkIn(g, a, from, 260), `${a.bosses[0]}: from ${turn}° of the gate`).toBeGreaterThan(P - 0.5);
      }
    }
  }, 600_000);

  it('and once the horror is found, the gate lets the investigator in', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      const boss = a.bosses[0]!;
      g.overworld!.told.add(foundKey(boss));
      refreshSeals(g);
      expect(walkIn(g, a, courtPoint(a.house!, 6, 0), 420), boss).toBeLessThan(a.house!.radius - a.house!.piece.door!.thick / 2 - 1);
    }
  }, 600_000);
});
