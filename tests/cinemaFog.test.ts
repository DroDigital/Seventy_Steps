/**
 * A cutscene's lens stays inside the fog (round 66: "address the initial display of only the boss fog"). The investigator is walked a
 * step inside the wall before a horror and the horror wakes there; a lens behind them, or far from a great horror, was on the other side
 * of an opaque wall for the first seconds of its arrival.
 */

import { describe, expect, it } from 'vitest';
import { ARRIVAL, type Scale } from '../src/data/cutscenes';
import { fogKeeper } from '../src/render/cinemaFog';
import { frameOf, type Anchor } from '../src/render/cinemaPlan';
import { fogsAround, insideLine, lensInside, sideOf } from '../src/systems/fogGates';
import type { FogWall } from '../src/world/gatePlan';

const wall = (o: Partial<FogWall>): FogWall => ({ id: 'w', kind: 'ring', x: 0, z: 0, y: 0, yaw: 0, width: 0, radius: 20, height: 4, theme: 'ash' as never, region: 'x', bosses: [], spawns: [], stake: { x: 0, z: 0, yaw: 0 }, candle: {} as never, ...o });
const ring = (radius: number): FogWall => wall({ kind: 'ring', radius });
/** A doorway at z = `at` with the hall on the side of smaller z. */
const doorway = (at: number): FogWall => wall({ kind: 'doorway', z: at, yaw: Math.PI, width: 4.4 });
const STEP = 1.8; // metres the investigator is walked inside the wall (systems/fogGates.ts)

describe('the lens keeps inside the fog (round 66)', () => {
  it('knows the walls a point stands inside, and the lens that is clear of them', () => {
    const r = ring(20);
    expect(lensInside([r], { x: 0, z: 10 })).toBe(true);
    expect(lensInside([r], { x: 0, z: 19.5 })).toBe(false); // inside, but not clear of it
    expect(lensInside([r], { x: 0, z: 23 })).toBe(false);
    const d = doorway(10);
    expect(lensInside([d], { x: 0, z: 5 })).toBe(true);
    expect(lensInside([d], { x: 0, z: 12 })).toBe(false);
    expect(lensInside([d], { x: 9, z: 12 })).toBe(true); // well off to the side of the opening: the wall is not in the way
    expect(sideOf(d, { x: 0, z: 5 })).toBeGreaterThan(0);
  });

  it('draws a lens in along its line as far as the inside goes', () => {
    const r = ring(20);
    const k = insideLine([r], { x: 0, z: 0 }, { x: 0, z: 40 });
    expect(k).toBeGreaterThan(0.45);
    expect(k).toBeLessThan(0.5);
    expect(insideLine([r], { x: 0, z: 0 }, { x: 0, z: 10 })).toBe(1);
    expect(fogsAround({ overworld: undefined } as never, { x: 0, z: 0 })).toEqual([]); // no world, no walls
  });

  it('turns a lens that stood behind the investigator to their side, and not to the other, frame after frame', () => {
    const r = ring(20);
    const me = { x: 0, z: 20 - STEP };
    const keep = fogKeeper();
    const ask = (x: number, z: number) => keep([r], { on: me, head: { x: me.x, y: 1.5, z: me.z }, toward: { x: 0, z: 0 }, pos: { x, y: 2, z }, turn: true });
    const a = ask(0.05, me.z + 3); // straight behind, a hair to one side
    expect(lensInside([r], a)).toBe(true);
    expect(Math.hypot(a.x - me.x, a.z - me.z)).toBeCloseTo(3, 3); // swung, not drawn in: the same distance from them
    expect(a.x).toBeGreaterThan(0.5); // and to the side it was on
    const b = ask(-0.02, me.z + 3); // the other side of straight behind: it keeps to the first
    expect(Math.sign(b.x)).toBe(Math.sign(a.x));
    expect(ask(0, me.z - 4)).toEqual({ x: 0, y: 2, z: me.z - 4 }); // inside already: untouched
  });

  it('draws in a lens it cannot turn to, and one on the horror', () => {
    const r = ring(20);
    const horror = { x: 0, z: 0 };
    const keep = fogKeeper();
    const pulled = keep([r], { on: horror, head: { x: 0, y: 8, z: 0 }, toward: { x: 0, z: 20 - STEP }, pos: { x: 0, y: 3, z: -40 }, turn: false });
    expect(lensInside([r], pulled)).toBe(true);
    expect(pulled.z).toBeLessThan(-10); // as near the wall as it may be
    expect(pulled.y).toBeGreaterThan(3); // along its line to the head: the picture's height follows
    expect(keep([], { on: horror, head: { x: 0, y: 8, z: 0 }, toward: null, pos: { x: 0, y: 3, z: -40 }, turn: false })).toEqual({ x: 0, y: 3, z: -40 });
  });

  const HEIGHT: Record<Scale, number> = { person: 2.2, large: 5, giant: 12, colossal: 34 };
  const WALLS: [string, (reach: number) => FogWall, (reach: number) => Anchor][] = [
    ['an open arena', (reach) => ring(reach + STEP), (reach) => ({ x: 0, y: 0, z: reach, yaw: Math.PI, height: 1.8 })],
    ['a hall', (reach) => doorway(reach + STEP), (reach) => ({ x: 0, y: 0, z: reach, yaw: Math.PI, height: 1.8 })],
  ];

  for (const [where, make, stand] of WALLS) {
    for (const reach of [12, 18, 30, 46]) {
      it(`every arrival of every size stays inside the fog, ${where}, the investigator ${reach} m from the horror`, () => {
        const w = make(reach);
        for (const scale of Object.keys(ARRIVAL) as Scale[]) {
          const horror: Anchor = { x: 0, y: 0, z: 0, yaw: 0, height: HEIGHT[scale] };
          const me = stand(reach);
          const keep = fogKeeper();
          ARRIVAL[scale].forEach((sh, i) => {
            for (const u of [0, 0.25, 0.5, 0.75, 1]) {
              const on = sh.on === 'target' ? horror : me;
              const f = frameOf(sh, u, on, sh.on === 'target' ? me : horror, i * 3 + u * sh.dur);
              const at = `${scale} shot ${i} at ${u}`;
              if (sh.on === 'player') expect(lensInside([w], f.pos), `${at}: the lens beside the investigator is already inside`).toBe(true);
              const head = { x: on.x, y: on.y + on.height * 0.85, z: on.z };
              const lens = keep([w], { on, head, toward: sh.on === 'target' ? me : horror, pos: f.pos, turn: sh.on === 'player' });
              expect(lensInside([w], lens), at).toBe(true);
            }
          });
        }
      });
    }
  }
});
