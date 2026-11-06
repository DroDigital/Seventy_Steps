/**
 * Creatures in lamplight keep their own colour (round 87; render/shaders/sprite.ts `creatureWarmth`, `FX.spriteWarm`): the lantern's and the
 * lamps' light gives a creature all of its brightness and only a share of its hue, so a creature near the lantern is lit, not painted orange
 * (before: the full hue went through the realm's recolour, which multiplies chroma up to 2.5 times, and every form near the player went amber).
 */

import { describe, expect, it } from 'vitest';
import { FX, LANTERN } from '../src/data/tuning';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import { worldUniforms } from '../src/render/worldMaterial';

const luma = (c: readonly number[]): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
/** The shader's `creatureWarmth`, in numbers. */
const warmth = (c: readonly number[], k: number): number[] => c.map((v) => luma(c) + (v - luma(c)) * k);
const chroma = (c: readonly number[]): number => Math.max(...c) - Math.min(...c);

describe('a creature near the lantern keeps its colour (round 87)', () => {
  it('takes a small share of the light’s hue, and the shader and its uniform say so', () => {
    expect(FX.spriteWarm).toBeGreaterThan(0); // (some warmth: the lantern is seen on them)
    expect(FX.spriteWarm).toBeLessThanOrEqual(0.35); // (not the amber they had: 1)
    expect(worldUniforms.uSpriteWarm.value).toBe(FX.spriteWarm);
    expect(SPRITE_FRAG).toMatch(/uniform float uSpriteWarm;/);
    expect(SPRITE_FRAG).toMatch(/vec3 creatureWarmth\(vec3 c\)\s*\{\s*return mix\(vec3\(dot\(c, vec3\(0\.2126, 0\.7152, 0\.0722\)\)\), c, uSpriteWarm\);\s*\}/);
    expect(SPRITE_FRAG.indexOf('creatureWarmth(uLanternColor')).toBeGreaterThan(-1);
    expect(SPRITE_FRAG.indexOf('creatureWarmth(uLanternColor')).toBeLessThan(SPRITE_FRAG.indexOf('t.rgb * light')); // (laid on the light, before the picture is lit by it)
  });

  it('keeps all the brightness of the light and a share of its hue', () => {
    const lantern = LANTERN.color.map((v) => v * 1.15);
    const warmed = warmth(lantern, FX.spriteWarm);
    expect(luma(warmed)).toBeCloseTo(luma(lantern), 6); // as bright
    expect(chroma(warmed)).toBeCloseTo(chroma(lantern) * FX.spriteWarm, 6); // a share as coloured
    expect(chroma(warmed)).toBeLessThan(chroma(lantern) * 0.4);
    expect(warmed[0]).toBeGreaterThan(warmed[2]); // (still warm: red over blue)
    expect(warmth(lantern, 1)).toEqual(lantern); // 1 is the light as it was
    for (const v of warmth([0, 0, 0], FX.spriteWarm)) expect(v).toBe(0); // and no light is none
  });

  it('a form lit by the lantern is closer to its own colour than before', () => {
    const own = [0.35, 0.5, 0.42]; // a green-grey creature
    const lantern = LANTERN.color.map((v) => v * 1.15);
    const lightedBy = (k: number): number[] => warmth(lantern, k).map((l, i) => own[i] * (0.5 + l * 0.65)); // (ambient + the lantern, as the shader sums them)
    const drift = (c: number[]): number => Math.hypot(c[0] / luma(c) - own[0] / luma(own), c[2] / luma(c) - own[2] / luma(own));
    expect(drift(lightedBy(FX.spriteWarm))).toBeLessThan(drift(lightedBy(1)) * 0.5);
  });
});
