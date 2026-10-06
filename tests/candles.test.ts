import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES } from '../src/data/moves';
import { candleFor, candlesOf, CANDLE } from '../src/systems/candles';
import { signPlace } from '../src/systems/checkpoints';
import { strike } from '../src/systems/combat';
import { createWorldGame } from '../src/systems/game';
import { applySave, parseSave, snapshot } from '../src/systems/save';
import { roomAt } from '../src/world/dungeonKit';
import { gatePlan } from '../src/world/gatePlan';
import { worldLayout } from '../src/world/placements';
import { deathblow, goTo, record, run } from './worldHelpers';

/** Round 45: the candles before the fog (Elden Ring's Stakes of Marika; systems/candles.ts). */
describe('the candles before the fog', () => {
  const fogs = gatePlan(worldLayout()).fogs;

  it('stands one before each horror\'s fog, each with a place of its own', () => {
    const list = candlesOf();
    expect(list.length).toBe(fogs.length);
    expect(new Set(list.map((c) => c.id)).size).toBe(list.length);
  });

  it('a doorway\'s stands a few paces back from it, on the side the boss\'s room is not, in a room and in no wall or pillar', () => {
    for (const f of fogs.filter((w) => w.kind === 'doorway')) {
      const dungeon = worldLayout().dungeons.find((d) => f.id.startsWith(`${d.layout.def.id}:`))!;
      const bossRoom = dungeon.layout.rooms.find((r) => f.id.split(':')[1] === r.def.id)!;
      const { x, z } = f.stake;
      expect(Math.hypot(x - f.x, z - f.z), f.id).toBeLessThan(10);
      expect(Math.hypot(x - bossRoom.x, z - bossRoom.z) > Math.hypot(f.x - bossRoom.x, f.z - bossRoom.z), `${f.id}: beyond the door`).toBe(true);
      const room = roomAt(dungeon.layout, x, z);
      expect(room, `${f.id}: in a room`).toBeDefined();
      expect(room, `${f.id}: not in the boss's own room`).not.toBe(bossRoom);
      for (const p of dungeon.parts) {
        if (!p.solid) continue;
        const inside = p.shape === 'box' ? x > p.min.x - 0.6 && x < p.max.x + 0.6 && z > p.min.z - 0.6 && z < p.max.z + 0.6 && p.max.y > f.y + 0.3 && p.min.y < f.y + 1.2 : Math.hypot(x - p.x, z - p.z) < p.radius + 0.6 && p.y1 > f.y + 0.3 && p.y0 < f.y + 1.2;
        expect(inside, `${f.id}: not in ${p.look} at ${x.toFixed(1)}, ${z.toFixed(1)}`).toBe(false);
      }
    }
  });

  it('a ring\'s stands outside it, on the way from the nearest Elder Sign', () => {
    for (const f of fogs.filter((w) => w.kind === 'ring')) expect(Math.hypot(f.stake.x - f.x, f.stake.z - f.z), f.id).toBeCloseTo(f.radius + 9, 3);
  });

  it('takes the flame when passed, once, and is kept in the save', () => {
    const g = createWorldGame();
    const c = candlesOf()[0];
    const lit = record(g, 'CandleLit');
    goTo(g, c.x + 3, c.z);
    run(g, CANDLE.every * 2);
    expect(g.overworld!.candles.has(c.id)).toBe(true);
    expect(lit.length).toBe(1);
    run(g, 60);
    expect(lit.length).toBe(1);
    const copy = createWorldGame();
    applySave(copy, parseSave(JSON.stringify(snapshot(g)))!);
    expect(copy.overworld!.candles.has(c.id)).toBe(true);
  });

  it('is not taken from afar', () => {
    const g = createWorldGame();
    const c = candlesOf()[0];
    goTo(g, c.x + CANDLE.light + 3, c.z);
    run(g, CANDLE.every * 2);
    expect(g.overworld!.candles.has(c.id)).toBe(false);
  });

  it('wakes the fallen beside a lit candle that reaches them, and at the Elder Sign when none does', () => {
    const g = createWorldGame();
    const c = candlesOf()[0];
    g.overworld!.candles.add(c.id);
    goTo(g, c.x + 30, c.z);
    run(g, 1);
    expect(candleFor(g, { x: c.x + 30, z: c.z })).toMatchObject({ x: c.x, z: c.z });
    strike(g, g.player.id, g.player.id, deathblow);
    run(g, PLAYER_MOVES.death.frames + 5);
    expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: c.x, z: c.z });
    expect(g.player.kneeling).toBeNull();

    goTo(g, c.x + CANDLE.reach + 40, c.z);
    run(g, 1);
    strike(g, g.player.id, g.player.id, deathblow);
    run(g, PLAYER_MOVES.death.frames + 5);
    const home = signPlace(g.overworld!.sign)!.rest;
    expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: home.x, z: home.z });
  });

  it('is no place to rest: only the Elder Sign it never replaces sets where the investigator rises when no candle reaches', () => {
    const g = createWorldGame();
    expect(g.overworld!.candles.size).toBe(0);
    expect(candleFor(g, { x: 0, z: 0 })).toBeNull();
  });
});
