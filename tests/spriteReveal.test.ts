/**
 * Inside the player's lantern light every enemy shows the colours it was drawn in (round 93; render/shaders/sprite.ts, `FX.spriteReveal`): the
 * realm's recolour (round 83) is the realm's mood in the dark, and gives way as the lantern lights the creature, whole within a few metres
 * and gone again at the edge of the light, or as the lantern gutters out.
 */

import { describe, expect, it } from 'vitest';
import { LOOKS } from '../src/data/looks';
import { REVIEWED_MATTER } from '../src/data/reviewedLook';
import { FX, LANTERN } from '../src/data/tuning';
import type { Rgb } from '../src/render/palette';
import { gradeTints } from '../src/render/realmPalette';
import { toneOf, type Tone } from '../src/render/spriteTone';
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
    expect(SPRITE_GRADE_GLSL).toMatch(/vec4 spriteToneBack\(vec4 tone, float k\)/); // the tone of a smaller share (round 95)
    const src = SPRITE_FRAG.replace(/\s+/g, ' ');
    const at = (s: string): number => src.indexOf(s);
    expect(at('smoothstep(uSpriteReveal.x, uSpriteReveal.y, dot(uLanternColor * lanternAt(uLanternPos - vWorld) * vShade.y,')).toBeGreaterThan(at('t.rgb * light')); // the lantern's own light on it, as the light sums it
    expect(at('col = spriteGraded(col, spriteToneBack(vTone, 1.0 - shown * uSpriteRevealMost))')).toBeGreaterThan(at('vec3 col = glow ? t.rgb : t.rgb * light')); // the lit colour, the light's own colour on it
    expect(at('spriteToneBack(vTone,')).toBeLessThan(at('float fog = vFog * uFogAmount'));
  });

  it('takes back most of the realm\'s tint, not all of it, so a lit creature is mostly its own colour with a trace of its realm (round 95)', () => {
    expect(worldUniforms.uSpriteRevealMost.value).toBe(FX.spriteRevealMost);
    expect(FX.spriteRevealMost).toBeGreaterThan(0.4); // its own colours read in the light
    expect(FX.spriteRevealMost).toBeLessThan(1); // and the realm is not all taken away
    expect(FX.spriteGrade * (1 - FX.spriteRevealMost)).toBeCloseTo(0.2, 6); // the share left in full light
    expect(SPRITE_FRAG).toMatch(/uniform float uSpriteRevealMost;/);
  });

  it('gives in the light the tone of a smaller share: the same turn, lift and fill, scaled, so the hue goes back along the wheel and the colour stays whole (round 95)', () => {
    const back = (t: Tone, k: number): Tone => { const a = Math.atan2(t.sin, t.cos) * k; return { cos: Math.cos(a), sin: Math.sin(a), boost: 1 + (t.boost - 1) * k, fill: t.fill * k }; }; // spriteToneBack, as the shader has it
    let turned = 0;
    for (const id of Object.keys(LOOKS)) {
      const mid = gradeTints(LOOKS[id])[2] as Rgb;
      for (const key of Object.keys(REVIEWED_MATTER)) {
        const form = REVIEWED_MATTER[key] as Rgb;
        for (const k of [1, 0.7, 1 - FX.spriteRevealMost]) {
          const got = back(toneOf(form, mid, FX.spriteGrade), k), want = toneOf(form, mid, FX.spriteGrade * k);
          expect(Math.atan2(got.sin, got.cos), `${key} in ${id}`).toBeCloseTo(Math.atan2(want.sin, want.cos), 9);
          expect(got.fill, `${key} in ${id}`).toBeCloseTo(want.fill, 9);
          expect(got.boost).toBeGreaterThanOrEqual(1);
          expect(got.boost, `${key} in ${id}`).toBeLessThanOrEqual(want.boost + 1e-9); // (where the lift is held at its most, a little less lift than the smaller share's own)
        }
        if (Math.abs(toneOf(form, mid, FX.spriteGrade).sin) > 0.05) turned++;
      }
    }
    expect(turned).toBeGreaterThan(100); // (the test has dull forms to turn)
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
