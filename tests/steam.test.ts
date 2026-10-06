import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_IDS } from '../src/data/achievements';
import { steamAchieve, steamAppId, steamOn } from '../desktop/steam.js';

describe('Steam (round 47)', () => {
  it("every achievement's id is a Steam API name, and docs/STEAM.md lists each one", () => {
    const doc = readFileSync('docs/STEAM.md', 'utf8');
    for (const id of ACHIEVEMENT_IDS) {
      expect(id).toMatch(/^[A-Za-z0-9_]+$/);
      expect(doc).toContain(`| \`${id}\` |`);
    }
  });

  it('takes the app id from the environment, then package.json, and none at 0', () => {
    expect(steamAppId({}, { steam: { appId: 0 } })).toBeUndefined();
    expect(steamAppId({}, { steam: { appId: 1234560 } })).toBe(1234560);
    expect(steamAppId({ STEAM_APP_ID: '480' }, { steam: { appId: 1234560 } })).toBe(480);
    expect(steamAppId({ STEAM_APP_ID: 'x' }, null)).toBeUndefined();
  });

  it('without Steam, an achievement is simply not passed on', () => {
    expect(steamOn()).toBe(false);
    expect(steamAchieve('colour')).toBe(false);
  });
});
