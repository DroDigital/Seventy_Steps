import { describe, expect, it } from 'vitest';
import { HALL_SETS } from '../src/data/hallSets';
import { ROOM_SETS } from '../src/data/roomSets';
import { MODEL_INFO } from '../src/data/models/index';
import { PROP_KINDS } from '../src/data/regions';
import { SET_KITS } from '../src/data/setKits';
import { DUNGEON } from '../src/data/tuning';
import { reach } from '../src/world/arenaDecor';
import { SET_RULES } from '../src/world/arenaSet';
import { solidGap } from '../src/world/candlePlan';
import { roomPoint } from '../src/world/dungeonKit';
import { HALL, hallProps } from '../src/world/hallSet';
import { worldLayout } from '../src/world/placements';
import { DIRS } from '../src/world/worldMap';

const w = worldLayout();
const halls = w.dungeons.flatMap((d) => d.layout.rooms.filter((r) => r.def.kind === 'hall' && r.def.boss).map((r) => ({ d, r, boss: r.def.boss![0]! })));
const setsIn = (d: (typeof w.dungeons)[number], r: (typeof halls)[number]['r']) => d.decor.filter((p) => p.kind === 'set' && Math.abs(p.x - r.x) < r.half && Math.abs(p.z - r.z) < r.half);

describe("a boss hall's set (round 62: the halls were a heart, braziers and two rows of one prop)", () => {
  it('is written for every boss hall, and for nothing else', () => {
    for (const { boss, d } of halls) expect(HALL_SETS[boss], `${d.layout.def.id}: ${boss}`).toBeTruthy();
    const names = new Set(halls.map((h) => h.boss));
    for (const id of Object.keys(HALL_SETS)) expect(names.has(id), `${id} is no hall's boss`).toBe(true);
  });

  it('names only what is there: a baked model, a built piece, a world prop', () => {
    for (const [id, set] of Object.entries(HALL_SETS)) {
      for (const { piece } of set.puts) {
        const known = piece.of.startsWith('prop:') ? (PROP_KINDS as readonly string[]).includes(piece.of.slice(5)) : !!MODEL_INFO[piece.of] || !!SET_KITS[piece.of];
        expect(known, `${id}: ${piece.of}`).toBe(true);
      }
    }
  });

  it('stands in some dungeon every baked model a hall or a room set names (a put can be written and never fit its hall)', () => {
    const named = new Set([...Object.values(HALL_SETS), ...Object.values(ROOM_SETS)].flatMap((s) => s.puts.map((u) => u.piece.of)).filter((id) => !!MODEL_INFO[id]));
    const stood = new Set(w.dungeons.flatMap((d) => d.decor.filter((p) => p.kind === 'set' && p.set).map((p) => p.set!.id)));
    expect(named.size).toBeGreaterThan(80);
    expect([...named].filter((id) => !stood.has(id)), 'named by a set and placed in no dungeon').toEqual([]);
  });

  it('stands a real set in each hall: pieces enough, all inside its walls, none taller than its roof allows', () => {
    for (const { d, r, boss } of halls) {
      const placed = setsIn(d, r);
      expect(placed.length, `${boss}`).toBeGreaterThanOrEqual(6);
      for (const p of placed) {
        expect(Math.abs(p.x - r.x) + 0.01, `${boss}: ${p.set!.id}`).toBeLessThan(r.half - DUNGEON.wall);
        expect(Math.abs(p.z - r.z) + 0.01, `${boss}: ${p.set!.id}`).toBeLessThan(r.half - DUNGEON.wall);
        expect(p.h, `${boss}: ${p.set!.id} is taller than its roof`).toBeLessThanOrEqual(DUNGEON.height - 1);
      }
    }
  });

  it('keeps the fight clear, the walls and pillars clear, and the doorways open', () => {
    for (const { d, r, boss } of halls) {
      const solids = setsIn(d, r).filter((p) => reach(p) > 0);
      const hearts = new Set(HALL_SETS[boss].puts.filter((u) => u.piece.heart).map((u) => u.piece.of)); // (round 74: a great piece at a hall's edge is a heart, which the fight's circle does not bar: it stands against the wall, clear of the doors and the room's things)
      for (const p of solids.filter((q) => !hearts.has(q.set!.id))) {
        expect(Math.hypot(p.x - r.x, p.z - r.z) - reach(p), `${boss}: ${p.set!.id} in the fight`).toBeGreaterThanOrEqual(SET_RULES.inner * (r.half - DUNGEON.wall) - 0.01);
        expect(solidGap(d.parts, p.x, p.z, r.level) - reach(p), `${boss}: ${p.set!.id} in a wall or a pillar`).toBeGreaterThanOrEqual(HALL.wall - 0.01);
      }
      for (const side of r.doors) {
        const a = DIRS[side];
        for (let t = 0.5; t <= HALL.doorDepth; t += 0.5) {
          const [x, z] = [r.x + a.x * (r.half - t), r.z + a.z * (r.half - t)];
          for (const p of solids) expect(Math.hypot(p.x - x, p.z - z) - reach(p), `${boss}: ${p.set!.id} before a doorway`).toBeGreaterThanOrEqual(1.5);
        }
      }
    }
  });

  it('leaves the room\'s own things their room: the Elder Sign, the gate, the tome', () => {
    for (const { d, r, boss } of halls) {
      const places = [r.def.sign ? [6, 4.5 - r.half] : null, r.def.gate ? [0, r.half - 4] : null, r.def.tome ? [-8, 8] : null].filter((u): u is number[] => !!u);
      for (const u of places) {
        const at = roomPoint(r, u[0]!, u[1]!);
        for (const p of setsIn(d, r).filter((q) => reach(q) > 0)) expect(Math.hypot(p.x - at.x, p.z - at.z) - reach(p), `${boss}: ${p.set!.id}`).toBeGreaterThanOrEqual(HALL.thing - 0.01);
      }
    }
  });

  it('is placed the same way twice', () => {
    for (const { d, r, boss } of halls.slice(0, 4)) expect(hallProps(boss, r, d.parts, [])).toEqual(hallProps(boss, r, d.parts, []));
  });
});
