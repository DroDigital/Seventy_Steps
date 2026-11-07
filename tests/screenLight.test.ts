/**
 * Round 113's screen light (shaders/contact.ts, shaders/wetReflect.ts, render/softParticles.ts, the far map of render/moonShadow.ts):
 * each is read where it should be, and goes with the setting that governs it.
 */
import { describe, expect, it } from 'vitest';
import { LIGHTING, PARTICLE_SOFT, SHADOW } from '../src/data/tuning';
import { POST_FRAG } from '../src/render/shaders/post';
import { SHADOW_GLSL } from '../src/render/shaders/shadow';
import { WORLD_FRAG } from '../src/render/shaders/world';
import { SOFT_GLSL } from '../src/render/softParticles';

describe('the picture\'s finer light (round 113)', () => {
  it('shades a point by what stands a hand\'s breadth toward its light, but never a person, and never past its strength', () => {
    const src = POST_FRAG.replace(/\s+/g, ' ');
    expect(src).toContain('if (!person) crease *= contactShadow(uv, bayer4(cell) + 0.5);');
    expect(src).toContain('contactMarch(off, lv, min(uContact.y, far - 0.3), jitter, false)'); // the lantern's carrier casts no shadow from it
    expect(LIGHTING.contact.strength).toBeGreaterThan(0);
    expect(LIGHTING.contact.strength).toBeLessThanOrEqual(0.8);
  });

  it('mirrors wet ground the world shader marks, in alpha above a person\'s mark', () => {
    expect(WORLD_FRAG).toContain('if (alpha > 0.999) alpha -= 0.08 * clamp(shine, 0.0, 1.0);');
    expect(1 - 0.08).toBeGreaterThan(0.9); // never read as a person (below 0.9) or the Colour (below 0.5)
    expect(POST_FRAG).toContain('wetReflect(uv, (1.0 - centre.a) / 0.08');
    expect(LIGHTING.sheenMirror.strength).toBeLessThan(1);
  });

  it('reads the far moon map where the near one gives out', () => {
    expect(SHADOW_GLSL).toContain('return moonLitFar(wp, n, ndl);');
    expect(SHADOW.far.range).toBeGreaterThan(SHADOW.range * 2);
    expect(SHADOW.far.every).toBeGreaterThanOrEqual(1);
  });

  it('thins a particle out before what stands behind it', () => {
    expect(SOFT_GLSL).toContain('clamp(behind / uSoft, 0.0, 1.0)');
    expect(PARTICLE_SOFT).toBeGreaterThan(0);
  });
});
