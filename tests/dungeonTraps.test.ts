/**
 * The dungeons' traps (2026-11-27; data/dungeonTraps.ts, world/trapPlan.ts, systems/dungeonTraps.ts): each dungeon's its own, laid only where
 * it is fair (open floor, clear of doorways, never in a sign's room or a horror's), each pit room cut in its dungeon's own form and still
 * crossed on foot, and every mechanism warning before it strikes, striking, sparing the sheltered and never taking a body twice in a breath.
 */
import { describe, expect, it } from 'vitest';
import { DUNGEON_TRAPS, type TrapKind } from '../src/data/dungeonTraps';
import { TRAP } from '../src/data/tuning';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { trapRun } from '../src/systems/dungeonTraps';
import { roomPoint } from '../src/world/dungeonKit';
import { partCollider } from '../src/world/dungeonParts';
import { worldLayout } from '../src/world/placements';
import { trapPlan, type TrapPiece } from '../src/world/trapPlan';
import { ground } from '../src/world/terrain';
import { goTo, record, run, sendAway } from './worldHelpers';

const dungeons = () => worldLayout().dungeons;
const pieces = (): { d: string; p: TrapPiece }[] => dungeons().flatMap((d) => (trapPlan(d)?.pieces ?? []).map((p) => ({ d: d.layout.def.id, p })));

describe('each dungeon’s own traps (2026-11-27)', () => {
  it('are of the dungeon’s own kind and matter: none shared, some dungeons with two, some with none', () => {
    const pairs = Object.values(DUNGEON_TRAPS).flatMap((s) => s.traps.map((t) => `${t.kind}:${t.look}`));
    expect(new Set(pairs).size).toBe(pairs.length);
    const counts = dungeons().map((d) => DUNGEON_TRAPS[d.layout.def.id]?.traps.length ?? 0);
    expect(counts.filter((n) => n === 0).length).toBeGreaterThan(0);
    expect(counts.filter((n) => n >= 2).length).toBeGreaterThan(5);
    const kinds = new Set(Object.values(DUNGEON_TRAPS).flatMap((s) => s.traps.map((t) => t.kind)));
    expect(kinds.size).toBe(9);
  });

  it('are laid in rooms of their dungeon, never a sign’s, a horror’s or the way in, and every room named holds some', () => {
    for (const d of dungeons()) {
      const own = DUNGEON_TRAPS[d.layout.def.id];
      if (!own) continue;
      const plan = trapPlan(d)!;
      own.traps.forEach((t, i) => {
        for (const id of t.rooms) {
          const r = d.layout.rooms.find((x) => x.def.id === id);
          expect(r, `${d.layout.def.id}/${id}`).toBeDefined();
          expect(!r!.def.sign && !r!.def.boss && r!.index !== 0, `${d.layout.def.id}/${id}: a sign, a horror or the way in`).toBe(true);
          expect(plan.pieces.filter((p) => p.trap === i && p.room === r!.index).length, `${d.layout.def.id}/${id}: ${t.kind} laid`).toBeGreaterThan(0);
        }
      });
    }
  });

  it('stand on open floor, clear of every doorway', () => {
    for (const { d, p } of pieces()) {
      const L = dungeons().find((x) => x.layout.def.id === d)!.layout;
      if (p.kind !== 'watcher') expect(Math.abs(ground(p.at.x, p.at.z) - p.at.y), `${d}: ${p.kind} on its floor`).toBeLessThan(0.05);
      for (const o of L.doors) if (o.a.index === p.room || o.b?.index === p.room) expect(Math.hypot(o.x - p.at.x, o.z - p.at.z), `${d}: ${p.kind} by a door`).toBeGreaterThan(TRAP.clear.door);
    }
  });

  it('cut each dungeon’s pits in a form of its own, and every pit room is still crossed on foot from door to door', () => {
    const forms = dungeons().filter((d) => d.layout.rooms.some((r) => r.def.kind === 'pit')).map((d) => DUNGEON_TRAPS[d.layout.def.id]?.pit);
    expect(forms.every(Boolean)).toBe(true);
    expect(new Set(forms).size).toBe(forms.length);
    expect(forms).not.toContain('square');
    for (const d of dungeons()) {
      for (const r of d.layout.rooms.filter((x) => x.def.kind === 'pit')) {
        const blocks = d.parts.filter((p) => p.room === r.index && p.solid).map(partCollider);
        const free = (u: number, v: number): boolean => {
          const q = roomPoint(r, u, v);
          return blocks.every((c) => (c.kind === 'box' ? q.x < c.min.x - 0.3 || q.x > c.max.x + 0.3 || q.z < c.min.z - 0.3 || q.z > c.max.z + 0.3 || c.max.y < r.level + 0.1 || c.min.y > r.level + 2 : true));
        };
        const step = 0.5;
        const h = r.half - 0.8;
        const key = (u: number, v: number): string => `${u},${v}`;
        const seen = new Set<string>();
        const queue: [number, number][] = [[0, -6.5]]; // (on the half-metre grid the probes are on)
        while (queue.length) {
          const [u, v] = queue.pop()!;
          if (seen.has(key(u, v)) || Math.abs(u) > h || Math.abs(v) > h || !free(u, v)) continue;
          seen.add(key(u, v));
          queue.push([u + step, v], [u - step, v], [u, v + step], [u, v - step]);
        }
        for (const [u, v] of [[0, 6.5], [6.5, 0], [-6.5, 0]] as const) expect(seen.has(key(u, v)), `${d.layout.def.id}/${r.def.id}: (${u}, ${v}) reached`).toBe(true);
      }
    }
  });
});

/** A game with the investigator stood at `at`, free of the peace of arriving and of foes. */
function standAt(at: { x: number; z: number }): Game {
  const g = createWorldGame();
  goTo(g, at.x, at.z);
  sendAway(g);
  run(g, 1);
  for (const [id] of [...g.ecs.c.combatant]) if (id !== g.player.id) g.ecs.despawn(id); // (the room's own foes are no part of it)
  g.player.peace = null;
  return g;
}

const first = (kind: TrapKind) => pieces().find(({ p }) => p.kind === kind)!;
const hp = (g: Game): number => g.ecs.c.health.get(g.player.id)!.hp;

describe('the traps at work', () => {
  it('a spiked tile rattles first, then strikes the one who stays on it, and not again within the grace', () => {
    const { p } = first('spikes');
    const g = standAt(p.at);
    const blows: { frame: number; damage: number }[] = [];
    g.events.on('Hit', (h) => void (h.target === g.player.id && !g.ecs.c.combatant.has(h.attacker) && blows.push({ frame: g.frame, damage: h.damage }))); // a trap's blow comes from no one (the room's foes stream back, and are none of it)
    run(g, 2);
    expect(trapRun(g)!.live.find((l) => l.p === p)!.state).toBe('warn');
    expect(blows).toEqual([]); // warned, not struck yet
    run(g, TRAP.spikes.warn + 4);
    expect(blows.length).toBe(1);
    expect(blows[0]!.damage).toBeLessThanOrEqual(TRAP.spikes.damage * 1.6);
    run(g, TRAP.grace - 10);
    expect(blows.length).toBe(1); // still on the tile: the grace holds
  });

  it('a pressure plate looses darts from the wall along its line', () => {
    const { p } = first('darts');
    const g = standAt(p.at);
    const sprung = record(g, 'TrapSprung');
    const before = hp(g);
    run(g, TRAP.darts.warn + 60);
    expect(sprung.filter((s) => s.kind === 'darts').length).toBe(TRAP.darts.volley);
    expect(hp(g)).toBeLessThan(before);
  });

  it('a boulder rolls the room’s length once its plate is pressed, striking the one who stays in its lane', () => {
    const { p } = first('boulder');
    const g = standAt(p.at);
    run(g, 3);
    expect(trapRun(g)!.live.find((l) => l.p === p)!.state).toBe('warn');
    const before = hp(g);
    run(g, TRAP.boulder.warn + 120);
    expect(hp(g)).toBeLessThan(before);
  });

  it('nothing wakes while the investigator is at peace', () => {
    const { p } = first('spikes');
    const g = standAt(p.at);
    g.player.peace = { since: g.frame, risen: false, left: 1e6 };
    const before = hp(g);
    run(g, 200);
    expect(hp(g)).toBe(before);
  });
});
