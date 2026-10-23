/**
 * The audit of the houses (round 63; data/arenaHouses.ts): a body walks at every open horror from four sides of its house, and is
 * stopped at the wall each time; and its gate lets it in. (The screenshots of round 62 showed the boss fog could be entered from another
 * angle than the trail's: a house has none.) Round 69: no puzzle stands at the gate, so it is open from the start. Slow: in the audits (vitest.config.ts).
 */
import { describe, expect, it } from 'vitest';
import { createWorldGame } from '../src/systems/game';
import { courtPoint } from '../src/world/arenaWay';
import { worldLayout, type ArenaPlace } from '../src/world/placements';
import { walkEnd } from './worldHelpers';

const arenas = worldLayout().arenas.filter((a) => a.house);

/** The place `out` metres outside an enclosure's wall (and clear of any piece of it that stands behind the wall's line: a keep's mass), on the ray from the arena's centre at `angle` to the way it faces. */
function outside(a: ArenaPlace, angle: number, out: number): { x: number; z: number } {
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  const dir = { x: a.front.x * c - a.front.z * s, z: a.front.x * s + a.front.z * c };
  let [lo, hi] = [0, 400];
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    const at = { x: a.x + dir.x * mid, z: a.z + dir.z * mid };
    if (a.house!.gap(at) < out || a.house!.props.some((p) => Math.hypot(p.x - at.x, p.z - at.z) < Math.max(p.w, p.d) + 1.5)) lo = mid;
    else hi = mid;
  }
  return { x: a.x + dir.x * hi, z: a.z + dir.z * hi };
}

describe('there is no way in but the gate', () => {
  it('a body walking at the horror from the sides and back is stopped at the wall; from the gate side it comes in', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      for (const turn of [0, 45, 90, 135, 180, 225, 270, 315]) {
        const from = outside(a, (turn * Math.PI) / 180, 7);
        const end = walkEnd(g, a, from, 260);
        expect(a.house!.gap(end), `${a.bosses[0]}: from ${turn}° of the gate`).toBeGreaterThan(-0.5);
      }
    }
  }, 600_000);

  it('the gate lets the investigator in with no discovery made', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      const boss = a.bosses[0]!;
      const end = walkEnd(g, a, courtPoint(a.house!, 6, 0), 420);
      expect(a.house!.gap(end), boss).toBeLessThan(-a.house!.piece.door!.thick / 2 - 1);
    }
  }, 600_000);
});
