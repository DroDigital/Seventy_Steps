/**
 * Round 108: every dungeon its own build and every boss hall its own lore. Each dungeon is named in data/dungeonLooks.ts, every boss hall
 * has its lore and no two are alike, laid on its emblem (no sigil: those were taken out again, asked), nothing of it is drawn outside
 * its walls or above its roof, its light is no anomaly's hue, and every pillar form stands within its collider's height.
 */

import { describe, expect, it } from 'vitest';
import { DUNGEON_LOOKS, KIT_PILLARS, type PillarForm } from '../src/data/dungeonLooks';
import { HALL_LORE } from '../src/data/hallLore';
import { KITS } from '../src/data/kits';
import { DUNGEON } from '../src/data/tuning';
import { floorRange, kitOfRoom } from '../src/world/dungeonKit';
import type { CylPart } from '../src/world/dungeonParts';
import { worldLayout } from '../src/world/placements';
import { roomStyle } from '../src/world/roomStyle';
import { hallLore, loreOf } from '../src/render/hallLore';
import { ANOMALY_HUES, rgbToHsv } from '../src/render/palette';
import { pillarPieces } from '../src/render/pillarForms';
import { local } from '../src/render/roomWalls';

const w = worldLayout();
const bossHalls = w.dungeons.flatMap((d) => d.layout.rooms.filter((r) => r.def.kind === 'hall' && r.def.boss).map((r) => ({ d: d.layout, r })));
const hueGap = (a: number, b: number): number => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
const anomalous = (c: readonly [number, number, number]): boolean => {
  const [h, s, v] = rgbToHsv(c);
  return s > 0.3 && v > 0.08 && ANOMALY_HUES.some((a) => hueGap(h, a) < 0.1);
};
const points = (g: { getAttribute(n: string): { count: number; getX(i: number): number; getY(i: number): number; getZ(i: number): number } }) => {
  const p = g.getAttribute('position');
  return Array.from({ length: p.count }, (_, i) => ({ x: p.getX(i), y: p.getY(i), z: p.getZ(i) }));
};

describe('each dungeon\'s own build and each boss hall\'s lore (round 108)', () => {
  it('names every dungeon but the Stairs of Slumber, and only dungeons', () => {
    const ids = w.dungeons.map((d) => d.layout.def.id);
    for (const id of ids.filter((i) => i !== 'slumber')) expect(DUNGEON_LOOKS[id], id).toBeDefined();
    for (const id of Object.keys(DUNGEON_LOOKS)) expect(ids, id).toContain(id);
    for (const k of Object.keys(KITS)) expect(KIT_PILLARS[k as keyof typeof KIT_PILLARS], k).toBeDefined();
  });

  it('gives every boss hall its lore, and no two halls the same', () => {
    expect(bossHalls.length).toBeGreaterThanOrEqual(27);
    const used = new Set<string>();
    const signs = new Set<string>();
    for (const { d, r } of bossHalls) {
      const lore = loreOf(r);
      expect(lore, `${d.def.id}/${r.def.id}`).toBeDefined();
      used.add(r.def.boss![0]);
      signs.add(JSON.stringify(lore));
      expect(['rings', 'squares', 'quincunx'], `${d.def.id}/${r.def.id}`).toContain(roomStyle(d, r).floor); // round 32's emblem, no sigil
      expect(roomStyle(d, r).pillars).toBe(lore!.pillars);
    }
    for (const id of Object.keys(HALL_LORE)) expect(used, id).toContain(id);
    expect(signs.size).toBe(Object.keys(HALL_LORE).length);
  });

  it('lights no hall in an anomaly\'s hue', () => {
    for (const [id, lore] of Object.entries(HALL_LORE)) {
      expect(anomalous(lore.glow), id).toBe(false);
    }
  });

  it('draws all of a hall inside its walls', () => {
    for (const { d, r } of bossHalls) {
      const kit = kitOfRoom(d, r);
      const floor = floorRange(r)[1];
      const name = `${d.def.id}/${r.def.id}`;
      for (const dressed of hallLore(d, r, kit, [0.5, 0.5, 0.5], { x: 0, z: 0 }, [])) {
        expect(dressed.geo, name).toBeDefined();
        for (const p of points(dressed.geo!)) {
          expect(Number.isFinite(p.x + p.y + p.z), name).toBe(true);
          const [u, v] = local(r, p);
          expect(Math.max(Math.abs(u), Math.abs(v)), `${name} ${dressed.kind}`).toBeLessThan(r.half + 0.05);
          expect(p.y, name).toBeGreaterThan(floor - 0.3); // (a leaning block is sunk a little in the floor)
          if (kit.roof !== 'open') expect(p.y, name).toBeLessThan(floor + DUNGEON.height + 0.05);
        }
      }
    }
  });

  it('draws every pillar form within its height, and at an eye\'s height no wider than its collider and a hand', () => {
    const part: CylPart = { shape: 'cyl', look: 'pillar', solid: true, room: 0, x: 3, z: -2, radius: 0.9, y0: 0, y1: 6 };
    for (const form of new Set<PillarForm>([...Object.values(KIT_PILLARS), ...Object.values(DUNGEON_LOOKS).map((l) => l.pillar), 'stalagmite', 'toad'])) {
      const pieces = pillarPieces(form, part, [0.6, 0.6, 0.6]);
      expect(pieces.length, form).toBeGreaterThan(0);
      for (const { geo } of pieces) for (const p of points(geo)) {
        const out = Math.hypot(p.x - part.x, p.z - part.z);
        expect(out, form).toBeLessThan(part.radius * 1.8);
        if (p.y > part.y0 + 1.2 && p.y < part.y0 + 3.7) expect(out, `${form} at ${p.y.toFixed(1)} m`).toBeLessThan(part.radius + 0.33); // where an eye stands, a pace off its collider
        expect(p.y, form).toBeGreaterThan(part.y0 - 0.2); // (a standing stone is sunk a little)
        expect(p.y, form).toBeLessThan(part.y1 + 0.7); // (a stalagmite's stalactite runs up into the roof)
      }
    }
  });
});
