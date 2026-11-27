import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_IDS } from '../src/data/achievements';
import { channel, steamAchieve, steamAppId, steamBinding, steamOn, steamOwnsAutomobileDlc } from '../desktop/steam.js';

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

  it('recognizes itch.io and defaults unmarked builds to Steam', () => {
    expect(channel({ channel: 'itch', steam: { appId: 1234560 } })).toBe('itch'); // (an app id set for Steam does not bring Steam into it)
    expect(channel({ steam: { appId: 1234560 } })).toBe('steam');
    expect(channel({ channel: 'something else' })).toBe('steam');
    expect(channel(null)).toBe('steam');
    expect(channel()).toBe('steam'); // package.json in the repository is the Steam build; itch.io's is packed with -c.extraMetadata.channel=itch
  });

  it('recognizes a build packed for the Microsoft Store', () => {
    expect(channel({ channel: 'microsoft', steam: { appId: 1234560 } })).toBe('microsoft');
  });

  it('does not grant Steam DLC entitlements to a Microsoft Store build', () => {
    const client = { apps: { isSubscribedApp: () => true, isDlcInstalled: () => true } };
    const pkg = { channel: 'microsoft', steam: { appId: 1234560, automobileDlcAppId: 1234561 } };
    expect(steamOwnsAutomobileDlc(client, {}, { ...pkg, channel: 'steam' })).toBe(true);
    expect(steamOwnsAutomobileDlc(client, {}, pkg)).toBe(false);
  });

  it('skips even the diagnostic Steam binding probe for a Microsoft Store build', () => {
    let probes = 0;
    const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
      if (specifier === 'steamworks.js') probes++;
      return nextResolve(specifier, context);
    } });
    try {
      expect(steamBinding({ channel: 'microsoft' })).toBe(false);
      expect(probes).toBe(0);
      steamBinding({ channel: 'itch' });
      expect(probes).toBe(1);
    } finally {
      hooks.deregister();
    }
  });

  it('without Steam, an achievement is simply not passed on', () => {
    expect(steamOn()).toBe(false);
    expect(steamAchieve('colour')).toBe(false);
  });
});
