import { describe, expect, it } from 'vitest';
import { PLACED } from '../src/render/audio/exposure';
import { createNightVoices } from '../src/render/audio/atm/voices';
import type { AtmAudioContext } from '../src/render/audio/atmosphereAudio';
import { createGame, createWorldGame } from '../src/systems/game';

/** The part of the atmosphere audio hub that reads the world, driven with a game and no WebAudio: it only has to tell the beds true. */
function part(g: ReturnType<typeof createWorldGame>) {
  const ctx = { e: { ctx: null, bed: null, sfx: null, hushed: 0, playing: 0, detune: 0 }, g, sampler: { play: () => false }, recipe: () => false, recorded: () => false, listener: { x: 0, y: 0, z: 0 }, right: { x: 1, y: 0, z: 0 } } as unknown as AtmAudioContext;
  return { ctx, part: createNightVoices(ctx) };
}
const camera = {} as never;
const fx = {} as never;

describe('the night voices part reads the world (render/audio/atm/voices.ts)', () => {
  it('tells the beds the shore at Innsmouth\'s east rim, none in its streets, and nothing in a realm without a sea', () => {
    const g = createWorldGame();
    const { ctx, part: p } = part(g);
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    const put = (region: string, x: number, z: number): void => {
      g.overworld!.region = region;
      Object.assign(at, { x, z });
    };
    const look = (t: number): void => {
      for (let k = 0; k < 12; k++) p.update(fx, t + k * 0.3, camera, false);
    };
    put('innsmouth', 1005, 800);
    look(0);
    expect(PLACED.on).toBe(true);
    expect(PLACED.shore).toBeGreaterThan(0.4);
    expect(PLACED.pan).toBeGreaterThan(0.2); // the sea is east: to the right of a listener whose right is +x
    ctx.right.x = -1;
    look(10);
    expect(PLACED.pan).toBeLessThan(-0.2); // turned about, it is to the left
    ctx.right.x = 1;
    put('innsmouth', 760, 780);
    look(100); // (a journey: the look is taken whole)
    expect(PLACED.shore).toBeLessThan(0.05);
    put('pnakotus', 1005, 800);
    look(200);
    expect(PLACED.shore).toBe(0);
  });

  it('is off in the arena and where the world is not open, and runs a whole second of frames without throwing', () => {
    const arena = createGame();
    const { part: p } = part(arena as never);
    PLACED.on = true;
    p.update(fx, 1, camera, false);
    expect(PLACED.on).toBe(false);
    const g = createWorldGame();
    const { part: q } = part(g);
    for (let k = 0; k < 120; k++) q.update(fx, k / 60, camera, k % 7 === 0);
  });
});
