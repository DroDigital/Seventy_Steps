/** What a creature is made of, as a colour (round 78; render/creatureMatter.ts, data/reviewedLook.ts REVIEWED_MATTER). */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REVIEWED_MATTER } from '../src/data/reviewedLook';
import { matterColour } from '../src/render/creatureMatter';
import type { ReviewedManifest } from '../src/render/sprites/reviewed';

const manifest = JSON.parse(readFileSync('public/creatures/reviewed/index.json', 'utf8')) as ReviewedManifest;

describe('a creature\'s matter', () => {
  it('is measured for every reviewed form, a colour in range', () => {
    expect(Object.keys(REVIEWED_MATTER).sort()).toEqual(Object.keys(manifest.entities).sort());
    for (const [key, rgb] of Object.entries(REVIEWED_MATTER)) for (const c of rgb) expect(c >= 0 && c <= 1, key).toBe(true);
  });

  it('is lifted, so a clot of the darkest body (a shoggoth\'s) is not lost on dark ground', () => {
    const shoggoth = matterColour('creature:shoggoth')!;
    for (let i = 0; i < 3; i++) expect(shoggoth[i]).toBeGreaterThan(REVIEWED_MATTER.shoggoth[i]);
    expect(Math.max(...shoggoth)).toBeLessThan(0.3);
  });

  it('follows a variant, and has none for what is not a creature of the drawn art', () => {
    expect(matterColour('creature:ghoul#eldritch')).toBeDefined();
    expect(matterColour('prop:barrel')).toBeUndefined();
    expect(matterColour('creature:nobody')).toBeUndefined();
    expect(matterColour(undefined)).toBeUndefined();
  });
});
