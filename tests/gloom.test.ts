import { describe, expect, it } from 'vitest';
import { DUNGEONS } from '../src/data/dungeons';
import { DUNGEON_LIGHT, NIGHT_DARK } from '../src/data/lifeTuning';
import { KITS } from '../src/data/kits';
import { LANTERN } from '../src/data/tuning';
import { mistTone } from '../src/render/volumetricFog';
import { kitOfRoom } from '../src/world/dungeonKit';
import { adapted, darkShare, gloomAt, moonShare, roomGloom } from '../src/world/gloom';
import { worldLayout } from '../src/world/placements';

describe('round 58: the dark under a roof is the lantern\'s to walk through', () => {
  it('every kit has a gloom between none and the deepest; the cellar, the crypt and the mine are blackest, the library, church and marble hall keep their candles', () => {
    for (const [id, kit] of Object.entries(KITS)) {
      expect(kit.gloom, id).toBeGreaterThanOrEqual(0);
      expect(kit.gloom, id).toBeLessThanOrEqual(1);
    }
    for (const id of ['cellar', 'crypt', 'mine', 'basalt', 'drowned', 'masonry'] as const) expect(KITS[id].gloom, id).toBeGreaterThanOrEqual(0.85);
    for (const id of ['library', 'church', 'marble', 'timber', 'townhouse'] as const) expect(KITS[id].gloom, id).toBeLessThanOrEqual(0.8);
    expect(KITS.marble.gloom).toBeLessThan(KITS.crypt.gloom);
  });

  it('the narrow ways are darker than the halls they join, a great hall the least, and a refuge and an arena are lit above their kit', () => {
    const kit = KITS.masonry;
    const room = (kind: 'corridor' | 'hall' | 'stair' | 'pit' | 'well', extra: object = {}) => ({ id: 'x', kind, dir: 'n', ...extra }) as never;
    expect(roomGloom(kit, room('corridor'))).toBeGreaterThan(roomGloom(kit, room('hall')));
    expect(roomGloom(kit, room('hall'))).toBeGreaterThan(roomGloom(kit, room('hall', { wide: true })));
    expect(roomGloom(kit, room('well'))).toBeGreaterThan(roomGloom(kit, room('hall')));
    expect(roomGloom(kit, room('hall', { sign: { id: 's', name: 'S' } }))).toBeLessThanOrEqual(DUNGEON_LIGHT.refuge);
    expect(roomGloom(kit, room('hall', { boss: ['cthulhu'] }))).toBeLessThanOrEqual(DUNGEON_LIGHT.arena);
    expect(roomGloom(KITS.mine, room('corridor'))).toBeLessThanOrEqual(1);
  });

  it('in the world: every room of every dungeon has a gloom within bounds, every Elder Sign room a refuge and every arena a readable one', () => {
    let rooms = 0;
    for (const d of worldLayout().dungeons) {
      for (const r of d.layout.rooms) {
        const g = roomGloom(kitOfRoom(d.layout, r), r.def);
        rooms++;
        expect(g, `${d.layout.def.id}/${r.def.id}`).toBeGreaterThanOrEqual(0);
        expect(g, `${d.layout.def.id}/${r.def.id}`).toBeLessThanOrEqual(1);
        if (r.def.sign) expect(g).toBeLessThanOrEqual(DUNGEON_LIGHT.refuge);
        if (r.def.boss) expect(g).toBeLessThanOrEqual(DUNGEON_LIGHT.arena);
      }
    }
    expect(rooms).toBeGreaterThan(50);
    expect(DUNGEONS.length).toBeGreaterThan(5);
  });

  it('gloomAt finds the room where one stands, and is nothing on open ground', () => {
    const d = worldLayout().dungeons.find((x) => x.layout.def.id === 'library')!;
    const corridor = d.layout.rooms.find((r) => r.def.kind === 'corridor')!;
    expect(gloomAt(corridor.x, corridor.z)).toBeCloseTo(roomGloom(kitOfRoom(d.layout, corridor), corridor.def), 9);
    expect(gloomAt(corridor.x, corridor.z)).toBeGreaterThan(0.5);
    expect(gloomAt(-1e6, -1e6)).toBe(0);
  });

  it('a deeper gloom takes more of the night and more of the moon, from the old room to the deepest', () => {
    expect(darkShare(0)).toBe(DUNGEON_LIGHT.dark);
    expect(darkShare(1)).toBe(DUNGEON_LIGHT.deep);
    expect(darkShare(0.5)).toBeGreaterThan(darkShare(0.2));
    expect(darkShare(2)).toBe(darkShare(1));
    expect(moonShare(0)).toBe(DUNGEON_LIGHT.moon);
    expect(moonShare(1)).toBe(DUNGEON_LIGHT.moonDeep);
    expect(moonShare(0.7)).toBeLessThan(moonShare(0.3));
    expect(DUNGEON_LIGHT.deep).toBeGreaterThan(DUNGEON_LIGHT.dark * 2); // the old room took 0.35 of the dark; the darkest take all of it
  });

  it('the eye widens where the lantern has gone out, a little, and never past what the dark was', () => {
    expect(adapted(0.9, 1)).toBe(0.9);
    expect(adapted(0.9, 0)).toBeCloseTo(0.9 * (1 - DUNGEON_LIGHT.adapt), 9);
    expect(adapted(0.9, 0.5)).toBeGreaterThan(adapted(0.9, 0));
    expect(adapted(0.9, 0.5)).toBeLessThan(0.9);
    expect(DUNGEON_LIGHT.adapt).toBeLessThanOrEqual(0.25); // a lantern that is gone is still missed
    expect(adapted(0, 0)).toBe(0);
  });

  it('the night keeps floors that leave only the lantern, the lamps and the moon\'s shapes, and the mist has no light of its own by night but its share', () => {
    expect(NIGHT_DARK.ambient).toBeLessThanOrEqual(0.12);
    expect(NIGHT_DARK.mist).toBeLessThanOrEqual(0.15);
    expect(NIGHT_DARK.sky).toBeLessThanOrEqual(0.2);
    expect(NIGHT_DARK.moon).toBeLessThanOrEqual(0.15);
    expect(mistTone(0)).toBe(1);
    expect(mistTone(1)).toBeCloseTo(NIGHT_DARK.fog, 9);
    expect(mistTone(0.5)).toBeGreaterThan(mistTone(0.9));
    expect(mistTone(-3)).toBe(1);
    expect(mistTone(7)).toBeCloseTo(NIGHT_DARK.fog, 9);
    expect(NIGHT_DARK.fog).toBeGreaterThan(0.05); // never black: the horizon is a faint line to walk toward
  });

  it('the lantern lights a pool, not a corridor: a tighter range and a lower flame than before, but a pool all the same', () => {
    expect(LANTERN.range).toBeLessThanOrEqual(9);
    expect(LANTERN.range).toBeGreaterThanOrEqual(7);
    expect(LANTERN.intensity).toBeLessThan(1.5);
    expect(LANTERN.intensity).toBeGreaterThan(0.9);
  });
});
