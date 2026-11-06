import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES } from '../src/data/moves';
import { candleFor, candlesOf, CANDLE } from '../src/systems/candles';
import { signPlace } from '../src/systems/checkpoints';
import { strike } from '../src/systems/combat';
import { riseAt } from '../src/systems/death';
import { createWorldGame } from '../src/systems/game';
import { applySave, parseSave, snapshot } from '../src/systems/save';
import { ASIDE, propGap, solidGap } from '../src/world/candlePlan';
import { candleBody } from '../src/render/candleShapes';
import { propCollider } from '../src/world/props';
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
    for (const f of fogs.filter((w) => !w.gate)) {
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

  it('an arena\'s stake stands in its court, a stride inside the ring a sleeping horror wakes at, on the way from the nearest Elder Sign', () => {
    const { wakes } = gatePlan(worldLayout());
    for (const f of fogs.filter((w) => w.gate)) {
      const wake = wakes.find((w) => w.id === f.id)!;
      expect(Math.hypot(f.stake.x - wake.x, f.stake.z - wake.z), f.id).toBeCloseTo(wake.radius + 9, 3);
    }
  });

  it('is set aside the way, not on it (round 62): a few paces from where the fallen wake, near enough that passing the stake takes its flame', () => {
    for (const f of fogs) {
      const away = Math.hypot(f.candle.x - f.stake.x, f.candle.z - f.stake.z);
      expect(away, f.id).toBeLessThanOrEqual(ASIDE.far + 1e-6);
      expect(away, `${f.id}: not on the stake`).toBeGreaterThan(0.45);
    }
    for (const c of candlesOf()) expect(Math.hypot(c.x - c.rise.x, c.z - c.rise.z), c.id).toBeLessThan(CANDLE.light - 1);
  });

  it('an arena\'s stands clear of the pieces of its set and of its stones', () => {
    for (const f of fogs.filter((w) => w.gate)) {
      const a = worldLayout().arenas.find((x) => f.id === `ring:${worldLayout().arenas.indexOf(x)}:${x.bosses[0]}`)!;
      for (const p of a.decor) if (propCollider(p)) expect(propGap(p, f.candle.x, f.candle.z), `${f.id}: ${p.kind} ${p.set?.id ?? ''}`).toBeGreaterThanOrEqual(ASIDE.clear - 1e-6);
    }
  });

  it('a hall\'s stands at the foot of a wall or a pillar when there is one near, in a room and in none of them', () => {
    for (const f of fogs.filter((w) => !w.gate)) {
      const dungeon = worldLayout().dungeons.find((d) => f.id.startsWith(`${d.layout.def.id}:`))!;
      const bossRoom = dungeon.layout.rooms.find((r) => f.id.split(':')[1] === r.def.id)!;
      const room = roomAt(dungeon.layout, f.candle.x, f.candle.z);
      expect(room, `${f.id}: in a room`).toBeDefined();
      expect(room, `${f.id}: not the boss's own`).not.toBe(bossRoom);
      expect(solidGap(dungeon.parts, f.candle.x, f.candle.z, f.y), `${f.id}: not in a wall or a pillar`).toBeGreaterThan(0.2);
    }
    const against = fogs.filter((w) => !w.gate).filter((f) => solidGap(worldLayout().dungeons.find((d) => f.id.startsWith(`${d.layout.def.id}:`))!.parts, f.candle.x, f.candle.z, f.y) < 1.3);
    expect(against.length, 'most stand against something').toBeGreaterThan(fogs.filter((w) => !w.gate).length / 2);
  });

  it('every look of a candle is one the shapes make, and each arena\'s set names one that is', () => {
    for (const look of ['cairn', 'skull', 'grave', 'driftwood', 'votive'] as const) expect(candleBody(look).top, look).toBeGreaterThan(0.3);
    for (const c of candlesOf()) expect(['cairn', 'skull', 'grave', 'driftwood', 'votive'], c.id).toContain(c.look);
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
    expect(candleFor(g, { x: c.x + 30, z: c.z })).toMatchObject({ x: c.rise.x, z: c.rise.z });
    strike(g, g.player.id, g.player.id, deathblow);
    run(g, PLAYER_MOVES.death.frames + 5);
    expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: c.rise.x, z: c.rise.z });
    expect(g.player.kneeling).toBeNull();

    g.player.peace = null; // (the rising's peace would hold off the blow: round 88)
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

  it('asks where to rise when a screen is there to ask: at the candle, or at the Elder Sign, as chosen', () => {
    for (const where of ['candle', 'sign'] as const) {
      const g = createWorldGame();
      const c = candlesOf()[0];
      g.player.ask = true;
      g.overworld!.candles.add(c.id);
      const asked = record(g, 'RiseChoice');
      goTo(g, c.x + 20, c.z);
      run(g, 1);
      strike(g, g.player.id, g.player.id, deathblow);
      run(g, PLAYER_MOVES.death.frames + 30);
      expect(asked.length).toBe(1);
      expect(asked[0].wall).toBe(c.wall);
      expect(g.player.rising).not.toBeNull();
      expect(g.ecs.c.actor.get(g.player.id)!.move).toBe('death'); // they wait
      riseAt(g, where);
      const at = where === 'candle' ? c.rise : signPlace(g.overworld!.sign)!.rest;
      expect(g.ecs.c.transform.get(g.player.id)!.pos).toMatchObject({ x: at.x, z: at.z });
      expect(g.player.rising).toBeNull();
      expect(g.ecs.c.actor.get(g.player.id)!.move).toBeNull();
    }
  });

  it('reaches a hundred metres', () => {
    expect(CANDLE.reach).toBe(100);
  });
});
