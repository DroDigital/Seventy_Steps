/**
 * The Stairs of Slumber as The Dream-Quest of Unknown Kadath has them (round 122): seventy steps of light slumber down to a cavern of
 * flame, where the bearded priests Nasht and Kaman-Thah shake their pshent-bearing heads; seven hundred steps of deeper slumber down to
 * the Gate of Deeper Slumber, which opens on the enchanted wood of groping oaks and phosphorescent fungi.
 */

import { describe, expect, it } from 'vitest';
import { lookOf } from '../src/data/dungeonLooks';
import { KITS } from '../src/data/kits';
import { DUNGEON } from '../src/data/tuning';
import { setPieces } from '../src/render/setShapes';
import { roomPoint } from '../src/world/dungeonKit';
import { roomSetProps } from '../src/world/hallSet';
import { worldLayout } from '../src/world/placements';
import { DIRS } from '../src/world/worldMap';

describe('the Stairs of Slumber as the tale has them (round 122)', () => {
  const d = worldLayout().dungeons.find((x) => x.layout.def.id === 'slumber')!;
  const room = (id: string) => d.layout.rooms.find((r) => r.def.id === id)!;

  it('the cavern of flame is a wide cavern of raw rock, lit by the flame at its heart', () => {
    const cavern = room('cavern');
    expect(cavern.size).toBe(3);
    expect(KITS.dreamflame.trim).toBe('none'); // no cornice or pilaster
    expect(KITS.dreamflame.flames).toBe(0); // no iron sconce on its walls
    expect(lookOf('slumber', 'dreamflame', 'dream')).toMatchObject({ pillar: 'stalagmite', roof: 'stalactites' });
    const set = roomSetProps('slumber/cavern', cavern, d.parts);
    const flame = set.filter((p) => p.set?.id === 'cleft');
    expect(flame).toHaveLength(1);
    expect(Math.hypot(flame[0].x - cavern.x, flame[0].z - cavern.z)).toBeLessThan(0.5);
    const fires = setPieces(flame[0], [0.6, 0.6, 0.6]).filter((p) => p.light === 'fire');
    expect(Math.max(...fires.map((f) => f.flame ?? 1))).toBeGreaterThanOrEqual(2.5); // a flame taller than a man
    expect(set.filter((p) => p.set?.id === 'priest')).toHaveLength(2); // Nasht and Kaman-Thah
    const vents = set.filter((p) => p.set?.id === 'vent'); // (round 123: a cavern of flame, fire breaking out of fissures about the flame)
    expect(vents).toHaveLength(4);
    for (const v of vents) expect(setPieces(v, [0.6, 0.6, 0.6]).filter((p) => p.light === 'fire')).toHaveLength(1);
    const post = roomPoint(cavern, ...cavern.def.allyAt!); // and the priests' own place kept clear
    for (const p of set) expect(Math.hypot(p.x - post.x, p.z - post.z), p.set?.id).toBeGreaterThan(2.5);
  });

  it('the way from each of its doorways to the flame is clear of its ring of stalagmites', () => {
    const cavern = room('cavern');
    const pillars = d.parts.filter((p) => p.shape === 'cyl' && p.look === 'pillar' && p.room === cavern.index);
    expect(pillars.length).toBeGreaterThan(4);
    for (const side of cavern.doors) {
      const door = { x: cavern.x + DIRS[side].x * cavern.half, z: cavern.z + DIRS[side].z * cavern.half };
      for (const p of pillars) {
        if (p.shape !== 'cyl') continue;
        const [dx, dz] = [door.x - cavern.x, door.z - cavern.z];
        const t = Math.max(0, Math.min(1, ((p.x - cavern.x) * dx + (p.z - cavern.z) * dz) / (dx * dx + dz * dz)));
        expect(Math.hypot(p.x - cavern.x - t * dx, p.z - cavern.z - t * dz)).toBeGreaterThan(p.radius + 2);
      }
    }
  });

  it("the priests' effigies are seated, crowned with the pshent, and stand under the cavern's roof", () => {
    const priests = roomSetProps('slumber/cavern', room('cavern'), d.parts).filter((p) => p.set?.id === 'priest');
    for (const p of priests) {
      const geo = setPieces(p, [0.6, 0.6, 0.6])[0].geo!;
      geo.computeBoundingBox();
      const top = geo.boundingBox!.max.y;
      expect(top).toBeGreaterThan(3.5); // a colossus
      expect(top).toBeLessThanOrEqual(p.h + 0.05); // its crown's knob is its height...
      expect(top).toBeLessThan(DUNGEON.height - 0.5); // ...under the vault
    }
  });

  it('the light slumber is the priests\' Egyptian temple, the deeper slumber bare, and its last reach overgrown by the enchanted wood', () => {
    expect(lookOf('slumber', 'dream', 'dream')).toMatchObject({ pillar: 'lotus', frieze: 'stars', roof: 'coffers' });
    expect(roomSetProps('slumber/threshold', room('threshold'), d.parts).filter((p) => p.set?.id === 'sphinx')).toHaveLength(2);
    expect(lookOf('slumber', 'dreamdeep', 'dream')).toMatchObject({ frieze: 'none' });
    const wood = lookOf('slumber', 'dreamabyss', 'dream');
    expect(wood.roof).toBe('roots');
    expect(wood.items).toContain('roots');
    expect(wood.items).toContain('growth');
  });
});
