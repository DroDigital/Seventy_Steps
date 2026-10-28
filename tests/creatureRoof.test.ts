import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FX } from '../src/data/tuning';
import { createCreatureRoof, type CreatureRoof } from '../src/render/creatureRoof';
import { PLAIN, toneForForm } from '../src/render/spriteTone';

const SEPIA = [0.46, 0.44, 0.41] as const; // a form of the older art, drawn dull (round 83)
const COLD = [0.3, 0.45, 0.6] as const; // a cold realm's mid-tone

/** Lays a creature's share from `from` to `to` seconds in steps of a twentieth, as the views do each frame. */
function run(roof: CreatureRoof, id: number, roofed: boolean, from: number, to: number): number {
  let sky = NaN;
  for (let i = 1; i <= Math.round((to - from) * 20); i++) sky = roof.sky(id, roofed, from + i / 20);
  return sky;
}

describe("a drawn creature's share of the open sky (round 96: render/creatureRoof.ts)", () => {
  it('is the open sky for a creature in the air, and a roof for one under it from the first sight', () => {
    const roof = createCreatureRoof();
    expect(roof.sky(1, false, 0)).toBe(1);
    expect(roof.sky(2, true, 0)).toBe(0); // (a creature first seen indoors is not faded in from the sky)
  });

  it("comes off at a roof's door quickly: each frame closes its share of the gap, as the coat does", () => {
    const roof = createCreatureRoof();
    roof.sky(1, false, 0);
    expect(run(roof, 1, true, 0, 0.2)).toBeCloseTo((1 - 0.05 / FX.spriteRoof[0]) ** 4, 6); // four frames of a twentieth
    expect(run(roof, 1, true, 0.2, FX.spriteRoof[0])).toBeLessThan(0.4); // most of the way in one time constant
    expect(run(roof, 1, true, FX.spriteRoof[0], 5)).toBeLessThan(0.01);
  });

  it('goes back on under the sky more slowly, over its own time constant, FX.spriteRoof[1]', () => {
    const roof = createCreatureRoof();
    roof.sky(1, true, 0);
    expect(run(roof, 1, false, 0, FX.spriteRoof[0])).toBeLessThan(0.2); // (after the door's time, still well short of the sky)
    expect(run(roof, 1, false, FX.spriteRoof[0], 30)).toBeGreaterThan(0.999);
    expect(FX.spriteRoof[1]).toBeGreaterThan(FX.spriteRoof[0]);
  });

  it('forgets a creature no longer drawn, so one that comes back is not eased from where it left', () => {
    const roof = createCreatureRoof();
    roof.sky(1, true, 0);
    roof.sky(2, true, 0);
    roof.forget(new Set([1]));
    expect(roof.sky(1, false, 0.05)).toBeCloseTo(0.05 / FX.spriteRoof[1], 6); // (kept: eased out of the roof)
    expect(roof.sky(2, false, 0.05)).toBe(1); // (forgotten: first seen in the air)
  });

  it("under a roof a creature's tone is the one it was drawn with; in the air it takes its realm's", () => {
    expect(toneForForm('deep_one', SEPIA, COLD, FX.spriteGrade * 0)).toEqual(PLAIN);
    expect(Math.abs(toneForForm('deep_one', SEPIA, COLD, FX.spriteGrade).sin)).toBeGreaterThan(0.05);
  });

  it('is what the creature views read each frame, for every reviewed picture (creatureViews.ts)', () => {
    const src = readFileSync('src/render/creatureViews.ts', 'utf8');
    expect(src).toContain('sky = roofs.sky(id, roofedAt(x, z), time)');
    expect(src).toContain('(worldUniforms.uSpriteGrade.value as number) * sky');
    expect(src).toContain('roofs.forget(seen)');
  });
});
