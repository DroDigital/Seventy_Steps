import { describe, expect, it } from 'vitest';
import { WORLD } from '../src/data/tuning';
import { createGame, createWorldGame } from '../src/systems/game';
import { chunkContent } from '../src/world/chunks';
import { groundAt, patchAt } from '../src/world/groundKind';
import { kitOfRoom } from '../src/world/dungeonKit';
import { worldLayout } from '../src/world/placements';
import { chunkOf } from '../src/world/worldMap';
import { findGround } from './footHelpers';

describe('what is under a foot (round 78)', () => {
  const g = createWorldGame();

  it('the arena is stone, and the sea wades', () => {
    expect(groundAt(createGame(), 0, 0, 0)).toBe('stone');
    expect(groundAt(g, 0, WORLD.seaLevel - 1, 0)).toBe('water');
  });

  it("a region's ground is its biome's: the Mountains are snow, Innsmouth mud, Pnakotus sand, the Black Wood leaves", () => {
    for (const [region, kind] of [['mountains', 'snow'], ['innsmouth', 'mud'], ['pnakotus', 'sand'], ['black_wood', 'leaves'], ['yuggoth', 'flesh']] as const) {
      expect(findGround(g, region, kind), `${region} ${kind}`).not.toBeNull();
    }
  });

  it('a road is a road, and a dungeon room is its kit\'s floor (boards for a timber house)', () => {
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    const road = [-2, -1, 0, 1, 2].flatMap((dx) => [-2, -1, 0, 1, 2].flatMap((dz) => chunkContent(chunkOf(at.x) + dx, chunkOf(at.z) + dz).roads))[0];
    expect(groundAt(g, (road.a.x + road.b.x) / 2, 1, (road.a.z + road.b.z) / 2)).toBe('road');
    const floors = new Map<string, string>();
    for (const { layout } of worldLayout().dungeons) for (const room of layout.rooms) {
      const floor = kitOfRoom(layout, room).floor;
      const kind = groundAt(g, room.x, 1, room.z);
      floors.set(floor, kind);
    }
    expect(floors.get('wood')).toBe('boards');
    expect(floors.get('slab')).toBe('slab');
    expect(floors.get('mud')).toBe('mud');
    expect(floors.get('cobble')).toBe('cobble');
  });

  it("the biome's patches lie where the ground shader lays them: some of a field, never all, and the same point every time", () => {
    let patched = 0;
    for (let i = 0; i < 4000; i++) patched += patchAt(i * 3.7, i * 1.9 + 11) ? 1 : 0;
    expect(patched / 4000).toBeGreaterThan(0.1);
    expect(patched / 4000).toBeLessThan(0.6);
    expect(patchAt(123.4, -567.8)).toBe(patchAt(123.4, -567.8));
    const here = createWorldGame();
    const field = findGround(here, 'hub', 'grass')!;
    expect(field).not.toBeNull();
    const patch = findGround(here, 'hub', 'leaves')!; // the hub's patch ground
    expect(patch).not.toBeNull();
  });
});
