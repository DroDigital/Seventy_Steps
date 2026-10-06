import { describe, expect, it } from 'vitest';
import { getEntity } from '../src/data/registry';
import { START_SIGN } from '../src/data/sites';
import { signPlace } from '../src/systems/checkpoints';
import { chunkContent } from '../src/world/chunks';
import { FIRST_HOUR, gentle } from '../src/world/planSpawns';
import { chunkOf } from '../src/world/worldMap';

describe('the first hour', () => {
  it('only gentle foes stand about the first Elder Sign: lesser, light blows, plain in sight', () => {
    const s = signPlace(START_SIGN)!;
    const [cx, cz] = [chunkOf(s.x), chunkOf(s.z)];
    const found: string[] = [];
    let n = 0;
    for (let i = -6; i <= 6; i++) {
      for (let j = -6; j <= 6; j++) {
        for (const w of chunkContent(cx + i, cz + j).spawns) {
          if (w.id.startsWith('ally:') || Math.hypot(w.at.x - s.x, w.at.z - s.z) >= FIRST_HOUR) continue;
          n++;
          if (!gentle(w.entity)) found.push(`${w.entity} (${w.id}) ${Math.hypot(w.at.x - s.x, w.at.z - s.z).toFixed(0)} m`);
        }
      }
    }
    expect(n).toBeGreaterThan(3); // (there are foes: the world is not emptied for it)
    expect(found).toEqual([]);
  });

  it('what counts as gentle is what a first fight can bear', () => {
    expect(gentle('rat_swarm')).toBe(true);
    expect(gentle('being_from_beyond')).toBe(false);
    expect(gentle('elder_thing')).toBe(false);
    expect(getEntity('cthulhu_cultist')).toBeDefined();
  });
});
