/**
 * A dungeon's room is dry however far below the sea's level its floor lies (round 122): the Stairs of Slumber run from 6 m above it to
 * 117 m below, and the bodies on them were drawn wading in a sea that is not there (darkened, wavering and the colour of the water: "a
 * wobbly grey goo"), their steps splashed and rings spread on the air over them. Out on the open sea all of it still holds.
 */

import { describe, expect, it } from 'vitest';
import { WORLD } from '../src/data/tuning';
import { createBodyGround } from '../src/render/bodyGround';
import { surfaceAt } from '../src/render/audio/foley';
import { createWorldGame } from '../src/systems/game';
import { floorAt, roomPoint } from '../src/world/dungeonKit';
import { groundAt } from '../src/world/groundKind';
import { worldLayout } from '../src/world/placements';

describe('a dungeon room below the sea (round 122)', () => {
  const g = createWorldGame();
  const stairs = worldLayout().dungeons.find((d) => d.layout.def.id === 'slumber')!.layout;
  const deep = stairs.rooms.filter((r) => Math.min(r.level, r.level + r.rise) < WORLD.seaLevel - 1);

  it('holds rooms below the sea: the cavern of flame and the seven hundred steps', () => {
    expect(deep.map((r) => r.def.id)).toContain('cavern');
    expect(deep.length).toBeGreaterThan(15);
  });

  it('draws no body there wading, and no step there splashes', () => {
    const ground = createBodyGround(g);
    deep.forEach((r, k) => {
      const p = roomPoint(r, 0, 0);
      const y = floorAt(r, p.x, p.z);
      expect(y, r.def.id).toBeLessThan(WORLD.seaLevel);
      expect(ground.of(1000 + k, p.x, y, p.z, 0)[0], `${r.def.id}: a body wades`).toBe(0);
      expect(groundAt(g, p.x, y, p.z), r.def.id).not.toBe('water');
      expect(surfaceAt(g, p.x, y, p.z), r.def.id).toBe('stone');
    });
  });

  it('still wades in the open sea', () => {
    let sea: { x: number; z: number } | null = null;
    for (let x = -4000; x < 4000 && !sea; x += 97) if (g.world.ground(x, -3000) < WORLD.seaLevel - 1) sea = { x, z: -3000 };
    expect(sea).not.toBeNull();
    const y = g.world.ground(sea!.x, sea!.z);
    expect(createBodyGround(g).of(2000, sea!.x, y, sea!.z, 0)[0]).toBe(WORLD.seaLevel + 10000);
    expect(groundAt(g, sea!.x, y, sea!.z)).toBe('water');
    expect(surfaceAt(g, sea!.x, y, sea!.z)).toBe('water');
  });
});
