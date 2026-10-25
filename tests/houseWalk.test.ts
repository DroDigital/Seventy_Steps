/**
 * The audit of the houses (round 63; data/arenaHouses.ts): a body walks at every open horror from four sides of its house, and is
 * stopped at the wall each time; and its gate lets it in. (The screenshots of round 62 showed the boss fog could be entered from another
 * angle than the trail's: a house has none.) Round 69: no puzzle stands at the gate, so it is open from the start. Round 78: the horror's mist
 * stands in the gate's opening and E passes it, so the gate side is walked to the mist, which is passed, and on. Slow: in the audits (vitest.config.ts).
 */
import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { fogToPass, passFog } from '../src/systems/fogGates';
import { createWorldGame, stepGame } from '../src/systems/game';
import type { Game } from '../src/systems/components';
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

/** The frames to walk from `from` to the arena's middle at the investigator's pace (0.07 m a frame) and a little over, never fewer than `least`: a place's court may begin further out than a plain house's. */
const walk = (a: ArenaPlace, from: { x: number; z: number }, least: number): number => Math.max(least, Math.ceil(Math.hypot(from.x - a.x, from.z - a.z) / 0.07) + 60);

/** Walked from `from` toward the arena's middle: the body comes up to the mist in the gate's opening, which E passes (it is there to be passed: `fogToPass`), and walks on a few steps; where it ends. */
function comeIn(g: Game, a: ArenaPlace, from: { x: number; z: number }, frames: number): { x: number; z: number } {
  const first = walkEnd(g, a, from, frames);
  const wall = fogToPass(g);
  expect(wall, `${a.bosses[0]}: the mist stands in the gate's opening, to be passed with E (reached ${a.house!.gap(first).toFixed(1)} m from the wall)`).not.toBeNull();
  passFog(g, wall!);
  for (let k = 0; k < 600 && g.player.fogPass; k++) stepGame(g, emptyInput());
  expect(g.player.fogPass, `${a.bosses[0]}: the walk through the mist ends`).toBeNull();
  for (let k = 0; k < 60; k++) stepGame(g, { ...emptyInput(), moveY: 1 });
  return g.ecs.c.transform.get(g.player.id)!.pos;
}

describe('there is no way in but the gate', () => {
  it('a body walking at the horror from the sides and back is stopped at the wall; from the gate side it comes in', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      for (const turn of [0, 45, 90, 135, 180, 225, 270, 315]) {
        const from = outside(a, (turn * Math.PI) / 180, 7);
        const end = turn === 0 ? comeIn(g, a, from, walk(a, from, 260)) : walkEnd(g, a, from, 260); // (a body blocked at the wall slides along it: only the gate side is walked the whole way in, through the mist)
        if (turn === 0) expect(a.house!.gap(end), `${a.bosses[0]}: from the gate side it comes in`).toBeLessThan(-a.house!.piece.door!.thick / 2 - 1); // (round 69 took the seal away: the gate side is open, as the title says; round 71: and the start is nearer or further as a place's pieces stand)
        else expect(a.house!.gap(end), `${a.bosses[0]}: from ${turn}° of the gate`).toBeGreaterThan(-0.5);
      }
    }
  }, 600_000);

  it('the gate lets the investigator in with no discovery made', () => {
    const g = createWorldGame();
    for (const a of arenas) {
      const boss = a.bosses[0]!;
      const from = courtPoint(a.house!, 6, 0);
      const end = comeIn(g, a, from, walk(a, from, 420));
      expect(a.house!.gap(end), boss).toBeLessThan(-a.house!.piece.door!.thick / 2 - 1);
    }
  }, 600_000);
});
