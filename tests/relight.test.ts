/**
 * The Relight setting (round 78; render/creatureRelight.ts, shaders/sprite.ts): off unless asked for, and it reaches the great ones
 * and the outer gods and no other form.
 */
import { describe, expect, it } from 'vitest';
import { SETTINGS } from '../src/data/playTuning';
import { ENTITIES } from '../src/data/registry';
import { relitOf } from '../src/render/creatureRelight';
import { SPRITE_FRAG, SPRITE_VERT } from '../src/render/shaders/sprite';
import { LANGS } from '../src/data/lang';

describe('the Relight setting', () => {
  it('is off by default and a switch', () => {
    expect(SETTINGS.relight).toEqual([0, 1, 1, 0]);
  });

  it('is named and explained in every language', () => {
    for (const lang of LANGS) {
      expect(lang.table['set.relight' as never]).toBeTruthy();
      expect(lang.table['set.hint.relight' as never]).toBeTruthy();
    }
  });

  it('reaches every form of a great one and an outer god, and no other', () => {
    for (const d of ENTITIES) {
      const want = d.tier === 'great_old_one' || d.tier === 'outer_god' ? 1 : 0;
      expect(relitOf(d.id), d.id).toBe(want);
      expect(relitOf(`${d.id}#boss`), `${d.id}#boss`).toBe(want);
    }
  });

  it('is in the sprite shader, guarded by the form\'s flag and the setting', () => {
    expect(SPRITE_VERT).toContain('attribute float aRelit');
    expect(SPRITE_FRAG).toContain('uniform float uRelight');
    expect(SPRITE_FRAG).toMatch(/vRelit > 0\.5 && uRelight > 0\.0/);
    expect(SPRITE_FRAG).toContain('uniform vec3 uLightDir'); // (the moon's direction is read here, not only by the vertex stage)
  });
});
