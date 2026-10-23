/**
 * The audit of the houses (round 63; data/arenaHouses.ts): a body walks at every open horror from four sides of its house, and is
 * stopped at the wall each time; and its gate lets it in. (The screenshots of round 62 showed the boss fog could be entered from another
 * angle than the trail's: a house has none.) Round 69: no puzzle stands at the gate, so it is open from the start. Slow: in the audits (vitest.config.ts).
 */
import { describe, expect, it } from 'vitest';
import { createWorldGame } from '../src/systems/game';
import { courtPoint } from '../src/world/arenaWay';
import { worldLayout } from '../src/world/placements';
import { ringOf, walkIn } from './worldHelpers';

const arenas = worldLayout().arenas.filter((a) => a.house);

describe('there is no way in but the gate', () => {
  it('a body walking at the horror from the sides and back is stopped at the wall; from the gate side it comes in', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      const P = ringOf(a).radius;
      const gateAt = Math.atan2(a.front.z, a.front.x);
      for (const turn of [0, 45, 90, 135, 180, 225, 270, 315]) {
        const t = gateAt + (turn * Math.PI) / 180;
        const from = { x: a.x + Math.cos(t) * (P + 7), z: a.z + Math.sin(t) * (P + 7) };
        const reached = walkIn(g, a, from, 260);
        if (turn === 0) expect(reached, `${a.bosses[0]}: the open gate`).toBeLessThan(P - a.house!.piece.door!.thick / 2 - 1);
        else expect(reached, `${a.bosses[0]}: from ${turn}° of the gate`).toBeGreaterThan(P - 0.5);
      }
    }
  }, 600_000);

  it('the gate lets the investigator in with no discovery made', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      expect(walkIn(g, a, courtPoint(a.house!, 6, 0), 420), a.bosses[0]!).toBeLessThan(ringOf(a).radius - a.house!.piece.door!.thick / 2 - 1);
    }
  }, 600_000);
});
