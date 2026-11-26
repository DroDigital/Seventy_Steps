/**
 * The second ways between a dungeon's rooms (round 125, asked: the dungeons designed the way Souls levels are; docs/LEVEL_DESIGN.md):
 * what world/dungeonLinks.ts lays and refuses, and what its pieces do to a body: a window stops feet and eyes, a drop's ledge lets a
 * body down and stops one coming up, a shortcut's seal stops feet until it is taken out.
 */
import { describe, expect, it } from 'vitest';
import type { DungeonDef, LinkDef } from '../src/data/dungeons';
import { link, room, stair } from '../src/data/roomBuild';
import { DUNGEON, LINK } from '../src/data/tuning';
import { hasLineOfSight, resolveCapsule, type Collider, type CollisionWorld } from '../src/world/colliders';
import { floorAt, layoutDungeon, roomAt, type DungeonLayout } from '../src/world/dungeonKit';
import { dungeonParts, partCollider } from '../src/world/dungeonParts';
import { shortcutsOf, shortcutSeal, sideOf, standAt } from '../src/world/shortcutPlan';

/**
 * A small house, cell by cell (x east, z north):  (0,3) boss · (0,2) north, (1,2) north_e · (-2,1) sunk, (-1,1) down, (0,1) hall,
 * (1,1) east · (-2,0) gallery, (-1,0) porch, (0,0) door, (1,0) south_e. The north hall and the hall meet (a shortcut); the gallery
 * stands 2 m above the sunken room (a window, or a drop); the door's corridor and the south-east one meet (an open way).
 */
const ROOMS: DungeonDef['rooms'] = [
  room('door', 'corridor', undefined, 's'),
  room('hall', 'hall', 'door', 'n'),
  room('east', 'corridor', 'hall', 'e'),
  room('north_e', 'corridor', 'east', 'n'),
  room('north', 'hall', 'north_e', 'w'),
  room('south_e', 'corridor', 'east', 's'),
  stair('down', 'hall', 'w', -2),
  room('sunk', 'hall', 'down', 'w'),
  room('porch', 'corridor', 'door', 'w'),
  room('gallery', 'corridor', 'porch', 'w'),
  room('boss', 'hall', 'north', 'n', { boss: ['dr_munoz'] }),
  room('attic', 'corridor', 'north_e', 'n'),
];
const HOUSE: DungeonDef = { id: 'test_house', name: 'Test House', region: 'hub', rooms: ROOMS, links: [link('north', 'hall', 'shortcut'), link('gallery', 'sunk', 'window'), link('south_e', 'door', 'open')] };

const laid = (links: readonly LinkDef[] = HOUSE.links!): DungeonLayout => layoutDungeon({ ...HOUSE, links }, { x: 0, z: 0 }, 0);
const room$ = (d: DungeonLayout, id: string) => d.rooms.find((r) => r.def.id === id)!;

function worldOf(d: DungeonLayout, extra: Collider[] = []): CollisionWorld {
  return {
    colliders: [...dungeonParts(d).parts.filter((p) => p.solid).map(partCollider), ...extra],
    off: new Set(),
    ground: (x, z) => {
      const r = roomAt(d, x, z);
      return r ? floorAt(r, x, z) : 0;
    },
    contain: () => {},
  };
}

describe('the second ways between rooms', () => {
  it('lays a shortcut, an open way and a window among rooms that meet, and keeps windows apart from doorways', () => {
    const d = laid();
    expect(d.errors).toEqual([]);
    const cut = d.doors.find((o) => o.link?.kind === 'shortcut')!;
    expect(cut.link!.id).toBe('test_house:north>hall');
    expect([cut.a.def.id, cut.b?.def.id]).toEqual(['north', 'hall']);
    expect(room$(d, 'hall').doors).toContain('n');
    expect(d.doors.some((o) => o.link?.kind === 'open' && o.a.def.id === 'south_e')).toBe(true);
    expect(d.windows).toHaveLength(1);
    expect(room$(d, 'gallery').windows).toEqual(['n']);
    expect(room$(d, 'gallery').doors).not.toContain('n');
  });

  it('refuses ways the kit cannot build, saying why', () => {
    const fault = (l: LinkDef): string => laid([l]).errors.join('; ');
    expect(fault(link('door', 'north', 'open'))).toMatch(/do not meet/);
    expect(fault(link('gallery', 'sunk', 'open'))).toMatch(/meet level/); // 2 m apart: only a drop or a window
    expect(fault(link('sunk', 'gallery', 'drop'))).toMatch(/a drop falls/); // a drop goes down, from `from`
    expect(fault(link('gallery', 'sunk', 'drop'))).toBe('');
    expect(fault(link('north', 'hall', 'shortcut', { minInsight: 1 }))).toMatch(/only an open way can be hidden/);
    expect(fault(link('down', 'porch', 'open'))).toMatch(/joined only at its far end/);
    expect(fault(link('ghost', 'hall', 'open'))).toMatch(/unknown room/);
    expect(fault(link('north', 'boss', 'open'))).toMatch(/way on its n side already|boss's room/);
    expect(laid([link('east', 'north_e', 'open')]).errors.join()).toMatch(/way on its n side already/);
  });

  it('keeps a boss to its one doorway and its fog', () => {
    const def: DungeonDef = {
      id: 'test_lair', name: 'Test Lair', region: 'hub', rooms: [room('a', 'corridor', undefined, 's'), room('b', 'corridor', 'a', 'n'), room('c', 'corridor', 'b', 'e'), room('boss', 'hall', 'a', 'e', { boss: ['dr_munoz'] })],
      links: [link('c', 'boss', 'open')],
    };
    expect(layoutDungeon(def, { x: 0, z: 0 }, 0).errors.join()).toMatch(/boss's room/);
  });

  it('a window stops feet and eyes at its grate', () => {
    const d = laid();
    const w = worldOf(d);
    const [gallery, sunk] = [room$(d, 'gallery'), room$(d, 'sunk')];
    const win = d.windows[0];
    const eye = gallery.level + LINK.windowSill + 0.6;
    expect(hasLineOfSight(w, { x: win.x, y: eye, z: gallery.z }, { x: win.x, y: eye, z: sunk.z })).toBe(false);
    const feet = { x: win.x, y: gallery.level, z: win.z };
    resolveCapsule(w, feet, 0.45, 1.8);
    expect(Math.abs(feet.z - win.z)).toBeGreaterThanOrEqual(DUNGEON.wall / 2 + 0.45 - 1e-6); // out of the opening, on one side of it
  });

  it("a drop's ledge lets a body down off its sill and stops one climbing back", () => {
    const d = laid([link('gallery', 'sunk', 'drop')]);
    expect(d.errors).toEqual([]);
    const w = worldOf(d);
    const ledge = d.doors.find((o) => o.link?.kind === 'drop')!;
    expect(ledge.level).toBeCloseTo(room$(d, 'gallery').level, 6);
    expect(ledge.level - room$(d, 'sunk').level).toBeCloseTo(2, 6);
    const below = { x: ledge.x, y: room$(d, 'sunk').level, z: ledge.z + 0.6 }; // in the sunken room, against the ledge's face
    resolveCapsule(w, below, 0.45, 1.8);
    expect(below.z - ledge.z).toBeGreaterThanOrEqual(DUNGEON.wall / 2 + 0.45 - 1e-6);
    const sill = { x: ledge.x, y: ledge.level, z: ledge.z + 0.1 }; // on its sill, at its height: the sill does not stop it
    resolveCapsule(w, sill, 0.45, 1.8);
    expect(Math.hypot(sill.x - ledge.x, sill.z - (ledge.z + 0.1))).toBeLessThan(1e-6);
  });

  it('a shortcut is shut by its seal from either side until opened, and knows its sides', () => {
    const d = laid();
    const [s] = shortcutsOf(d);
    expect([s.from, s.to]).toEqual(['north', 'hall']);
    expect(sideOf(s, standAt(s, 'from'))).toBe('from');
    expect(sideOf(s, standAt(s, 'to'))).toBe('to');
    const seal = shortcutSeal(s);
    const w = worldOf(d, [seal]);
    const shut = { x: s.x, y: s.y, z: s.z };
    resolveCapsule(w, shut, 0.45, 1.8);
    expect(Math.hypot(shut.x - s.x, shut.z - s.z)).toBeGreaterThan(DUNGEON.wall / 2); // pushed out of the doorway
    w.off.add(seal);
    const open = { x: s.x, y: s.y, z: s.z };
    resolveCapsule(w, open, 0.45, 1.8);
    expect(Math.hypot(open.x - s.x, open.z - s.z)).toBeLessThan(1e-6);
  });
});
