import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REVIEWED_LIFT } from '../src/data/reviewedLook';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';

const manifest = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

describe('what the renderer adds to the reviewed art (tools/reviewed_look.py)', () => {
  it('lights the edge only of forms the pack holds, between 0 and 1', () => {
    for (const [key, lift] of Object.entries(REVIEWED_LIFT)) {
      expect(manifest.entities[key], key).toBeDefined();
      expect(lift).toBeGreaterThan(0);
      expect(lift).toBeLessThanOrEqual(1);
    }
  });

  it('lights the near-black figures and leaves the pale ones alone, the darker the more', () => {
    expect(REVIEWED_LIFT.black_man).toBeGreaterThan(0.5);
    expect(REVIEWED_LIFT.umr_at_tawil).toBeGreaterThan(0);
    expect(REVIEWED_LIFT.shub_niggurath).toBeGreaterThan(REVIEWED_LIFT.umr_at_tawil);
    for (const pale of ['other_gods', 'albino_penguin', 'ghast', 'moon_beast']) expect(REVIEWED_LIFT[pale], pale).toBeUndefined();
  });

  it('is read by the sprite shader from the reviewed batches only', () => {
    expect(SPRITE_FRAG).toContain('float lift = uReviewed > 0.5 ? vOutside : 0.0');
  });
});
