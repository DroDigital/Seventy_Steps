/**
 * Every house of the world shut but for its gate, and the open gate leading in to the stake (moved out of enclosure.test.ts on
 * 2026-11-24: it floods every house's ground, some twenty seconds, so it runs with the audits, `npm run audit`, and in CI).
 */
import { describe, expect, it } from 'vitest';
import { HOUSE } from '../src/data/arenaHouses';
import { pieceColliders } from '../src/world/arena';
import { chunkContent } from '../src/world/chunks';
import { closure, CLOSURE } from '../src/world/closure';
import type { Collider } from '../src/world/colliders';
import { worldLayout } from '../src/world/placements';
import { ground } from '../src/world/terrain';
import { chunkOf } from '../src/world/worldMap';

const arenas = worldLayout().arenas.filter((a) => a.house);

describe('every enclosure of the world (an audit)', () => {
  it('shuts every house, and lets the open gate in to the stake', () => {
    for (const a of arenas) {
      const e = a.house!;
      const near: Collider[] = [];
      for (let cx = chunkOf(e.rect.x0 - CLOSURE.margin - 2); cx <= chunkOf(e.rect.x1 + CLOSURE.margin + 2); cx++) {
        for (let cz = chunkOf(e.rect.z0 - CLOSURE.margin - 2); cz <= chunkOf(e.rect.z1 + CLOSURE.margin + 2); cz++) near.push(...chunkContent(cx, cz).colliders);
      }
      const colliders = [...new Set(near)];
      const input = { rect: e.rect, colliders, ground, inside: (p: { x: number; z: number }) => e.gap(p) <= -HOUSE.margin, into: e.stake };
      const shut = closure({ ...input, colliders: [...colliders, ...pieceColliders({ ...e.piece, boxes: e.piece.seal!.boxes })] });
      expect(shut.leak, `${a.bosses[0]}: sealed, a way in at ${shut.leak?.x.toFixed(1)}, ${shut.leak?.z.toFixed(1)}`).toBeNull();
      expect(closure(input).reached, `${a.bosses[0]}: open, the gate leads to the stake before the fog`).toBe(true);
    }
  }, 120_000);
});
