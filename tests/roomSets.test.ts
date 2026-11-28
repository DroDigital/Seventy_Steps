import { describe, expect, it } from 'vitest';
import { ROOM_SETS } from '../src/data/roomSets';
import { MODEL_INFO } from '../src/data/models/index';
import { SET_KITS } from '../src/data/setKits';
import { DUNGEON } from '../src/data/tuning';
import { reach } from '../src/world/arenaDecor';
import { SET_RULES } from '../src/world/arenaSet';
import { solidGap } from '../src/world/candlePlan';
import { HALL, ROOM_INNER } from '../src/world/hallSet';
import { worldLayout } from '../src/world/placements';

const w = worldLayout();
const rooms = w.dungeons.flatMap((d) => d.layout.rooms.map((r) => ({ d, r, key: `${d.layout.def.id}/${r.def.id}` })));
const setsIn = (d: (typeof w.dungeons)[number], r: (typeof rooms)[number]['r']) => d.decor.filter((p) => p.kind === 'set' && Math.abs(p.x - r.x) < r.half && Math.abs(p.z - r.z) < r.half);

describe("an ordinary room's set (round 79: the library's shelves, the stair's braziers)", () => {
  it('is written for a room that is there, a hall that is no boss\'s, and names only baked models', () => {
    for (const [key, set] of Object.entries(ROOM_SETS)) {
      const room = rooms.find((x) => x.key === key);
      expect(room, `${key} is no room`).toBeTruthy();
      expect(room!.r.def.kind, key).toBe('hall');
      expect(room!.r.def.boss, `${key} has a boss: its hall's set is data/hallSets.ts`).toBeUndefined();
      for (const { piece } of set.puts) expect(!!MODEL_INFO[piece.of] || !!SET_KITS[piece.of], `${key}: ${piece.of}`).toBe(true);
    }
  });

  it('stands its pieces inside the walls, under the roof, clear of walls and pillars, and keeps the middle open', () => {
    for (const { d, r, key } of rooms.filter((x) => x.key in ROOM_SETS)) {
      const placed = setsIn(d, r);
      expect(placed.length, key).toBeGreaterThanOrEqual(2);
      const hearts = new Set(ROOM_SETS[key].puts.filter((u) => u.piece.heart).map((u) => u.piece.of));
      for (const p of placed) {
        const id = p.set!.id;
        expect(Math.abs(p.x - r.x) + 0.01, `${key}: ${id}`).toBeLessThanOrEqual(r.half - DUNGEON.wall / 2); // within the wall's inner face (2026-11-26: a hung piece stands against it, world/wallFlush.ts)
        expect(Math.abs(p.z - r.z) + 0.01, `${key}: ${id}`).toBeLessThanOrEqual(r.half - DUNGEON.wall / 2); // within the wall's inner face (2026-11-26: a hung piece stands against it, world/wallFlush.ts)
        expect(p.h, `${key}: ${id} is taller than its roof`).toBeLessThanOrEqual(DUNGEON.height - 1);
        if (reach(p) <= 0) continue;
        // (a hung piece stands against its wall, touching it and in no pillar or jamb: tests/hungProps.test.ts)
        if (!p.set!.hung) expect(solidGap(d.parts, p.x, p.z, r.level) - reach(p), `${key}: ${id} in a wall or a pillar`).toBeGreaterThanOrEqual(HALL.wall - 0.01);
        if (!hearts.has(id)) expect(Math.hypot(p.x - r.x, p.z - r.z) - reach(p), `${key}: ${id} across the middle`).toBeGreaterThanOrEqual(ROOM_INNER * (r.half - DUNGEON.wall) - 0.01);
      }
    }
  });

  it('leaves the ordinary hall\'s fight circle wider than the room\'s: the room\'s is the smaller', () => {
    expect(ROOM_INNER).toBeLessThan(SET_RULES.inner);
  });
});
