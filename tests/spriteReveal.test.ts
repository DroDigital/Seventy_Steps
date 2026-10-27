/**
 * Inside the player's lantern light every enemy shows the colours it was drawn in (round 93; render/shaders/sprite.ts, `FX.spriteReveal`): the
 * realm's recolour (round 83) is the realm's mood in the dark, and gives way as the lantern lights the creature, whole within a few metres
 * and gone again at the edge of the light, or as the lantern gutters out.
 */

import { describe, expect, it } from 'vitest';
import { FX, LANTERN } from '../src/data/tuning';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import { SPRITE_GRADE_GLSL } from '../src/render/shaders/spriteGrade';
import { worldUniforms } from '../src/render/worldMaterial';

const luma = (c: readonly number[]): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** The shader's `lanternFalloff` at the lantern's range and decay (the uniforms the world sets: render/worldMaterial.ts, lantern.ts). */
const falloff = (d: number, range: number, decay: number): number => {
  const x = Math.min(1, Math.max(0, d / range));
  const win = 1 - x ** 4;
  return (win * win) / (1 + decay * d * d);
};
/** How far a creature `d` metres from the lantern (facing it, `gain` of the light left) shows its own colours: 0 the realm's, 1 as drawn. */
const shown = (d: number, gain = 1, shade = 1): number =>
  smoothstep(FX.spriteReveal[0], FX.spriteReveal[1], luma(LANTERN.color.map((v) => v * LANTERN.intensity * gain)) * falloff(d, LANTERN.range, LANTERN.decay) * shade);

describe('a creature in the lantern\'s light shows its own colours (round 93)', () => {
  it('is published to the shader, which mixes the recolour away by the lantern\'s light on the creature, after the light and before the mist', () => {
    expect(worldUniforms.uSpriteReveal.value.toArray()).toEqual([...FX.spriteReveal]);
    expect(FX.spriteReveal[0]).toBeGreaterThan(0);
    expect(FX.spriteReveal[1]).toBeGreaterThan(FX.spriteReveal[0]);
    expect(SPRITE_FRAG).toMatch(/uniform vec2 uSpriteReveal;/);
    expect(SPRITE_GRADE_GLSL).toMatch(/const vec4 SPRITE_DRAWN = vec4\(1\.0, 0\.0, 1\.0, 0\.0\)/); // no turn, no lift, no cast: spriteTone's PLAIN
    const src = SPRITE_FRAG.replace(/\s+/g, ' ');
    const at = (s: string): number => src.indexOf(s);
    expect(at('smoothstep(uSpriteReveal.x, uSpriteReveal.y, dot(uLanternColor * lanternAt(uLanternPos - vWorld) * vShade.y,')).toBeGreaterThan(at('t.rgb * light')); // the lantern's own light on it, as the light sums it
    expect(at('spriteGraded(t.rgb * dot(light, vec3(0.2126, 0.7152, 0.0722)), SPRITE_DRAWN)')).toBeGreaterThan(-1); // its own colours, in all the light's brightness and none of its colour
    expect(at('SPRITE_DRAWN')).toBeLessThan(at('float fog = vFog * uFogAmount'));
  });

  it('shows a share of the drawn colours at the most, so a lit creature keeps part of its realm\'s tint and the light\'s colour (round 95)', () => {
    expect(worldUniforms.uSpriteRevealMost.value).toBe(FX.spriteRevealMost);
    expect(FX.spriteRevealMost).toBeGreaterThan(0.25); // its own colours still read in the light
    expect(FX.spriteRevealMost).toBeLessThan(1); // and the realm's are not all taken away
    expect(SPRITE_FRAG).toMatch(/uniform float uSpriteRevealMost;/);
    expect(SPRITE_FRAG).toContain('SPRITE_DRAWN), shown * uSpriteRevealMost)');
  });

  it('is whole within a few metres of the lantern, partial toward the edge of its light, and the realm\'s again beyond it', () => {
    expect(shown(0)).toBe(1);
    expect(shown(2)).toBe(1);
    expect(shown(4)).toBeGreaterThan(0.95); // (about as far as the pool reads as lit on the ground)
    expect(shown(5.5)).toBeGreaterThan(0.2);
    expect(shown(5.5)).toBeLessThan(0.95);
    expect(shown(7.5)).toBeLessThan(0.1);
    expect(shown(LANTERN.range)).toBe(0);
    expect(shown(30)).toBe(0);
    let last = 2;
    for (let d = 0; d <= 12; d += 0.25) { // never brighter with distance
      const s = shown(d);
      expect(s).toBeLessThanOrEqual(last + 1e-12);
      last = s;
    }
  });

  it('goes with the lantern: as it gutters the realm\'s colours return, and a creature turned from it takes less', () => {
    expect(shown(3, 1)).toBe(1);
    expect(shown(3, 0.3)).toBeLessThan(0.5);
    expect(shown(3, 0)).toBe(0);
    expect(shown(3, 1, 0.3)).toBeLessThan(shown(3, 1, 1));
  });
});
