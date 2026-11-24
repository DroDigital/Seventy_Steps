/**
 * A breather is seen to walk through the whole game step (moved out of npcLife.test.ts on 2026-11-24: four minutes of the whole
 * world's game, some seventeen seconds, so it runs with the audits, `npm run audit`, and in CI).
 */
import { describe, expect, it } from 'vitest';
import { distXZ } from '../src/core/geom';
import { CLOCK, SIM } from '../src/data/tuning';
import { createWorldGame } from '../src/systems/game';
import { npcEntity } from '../src/systems/npcs';
import { place } from './helpers';

/** A world game with the investigator far from everyone, and the frame set to `phase` of the night. */
function night(phase: number) {
  const g = createWorldGame();
  place(g, g.player.id, -5000, -5000, 0);
  g.frame = Math.round(((phase - CLOCK.start + 1) % 1) * CLOCK.night * SIM.hz);
  return g;
}

describe('the people are seen to walk, when they do (rounds 35 and 39)', () => {
  it('a breather has a step between where they were and are, through the whole game step (the movement system left it alone: they stood in their walk)', async () => {
    const { stepGame } = await import('../src/systems/game');
    const { emptyInput } = await import('../src/core/input');
    const g = night(0.05);
    const e = npcEntity(g, 'gilman')!;
    const tr = g.ecs.c.transform.get(e)!;
    let walked = 0;
    let longest = 0;
    for (let i = 0; i < 60 * 240; i++) {
      stepGame(g, emptyInput());
      const d = distXZ(tr.prev, tr.pos);
      if (d > 1e-4) walked++;
      longest = Math.max(longest, d * SIM.hz);
    }
    expect(walked).toBeGreaterThan(60 * 2); // some seconds of walking in four minutes: the breathers
    expect(longest).toBeLessThan(1.6); // an unhurried walk, m/s
  }, 90000);
});
