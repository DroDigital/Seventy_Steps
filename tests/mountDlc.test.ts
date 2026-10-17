import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { automobileDlcAppId, steamOwnsAutomobileDlc } from '../desktop/steam.js';

const pkg = { steam: { appId: 100, automobileDlcAppId: 200 } };
const client = (owns: boolean, installed: boolean) => ({ apps: {
  isSubscribedApp: vi.fn(() => owns), isDlcInstalled: vi.fn(() => installed),
} });

describe('the optional cosmetic automobile DLC', () => {
  it('requires a configured positive Steam DLC id distinct from the base game', () => {
    expect(automobileDlcAppId({}, null)).toBeUndefined();
    expect(automobileDlcAppId({}, { steam: { automobileDlcAppId: 0 } })).toBeUndefined();
    expect(automobileDlcAppId({}, pkg)).toBe(200);
    expect(automobileDlcAppId({ STEAM_AUTOMOBILE_DLC_APP_ID: '300' }, pkg)).toBe(300);
    for (const id of ['x', '-1', '1.5', 'Infinity', '4294967296', '100', '', '0xc8', '2e2', ' 200 ']) {
      expect(automobileDlcAppId({ STEAM_AUTOMOBILE_DLC_APP_ID: id }, pkg), id).toBeUndefined();
    }
  });

  it('grants access only when Steam reports both ownership and installation', () => {
    for (const owns of [false, true]) for (const installed of [false, true]) {
      const steam = client(owns, installed);
      expect(steamOwnsAutomobileDlc(steam, {}, pkg)).toBe(owns && installed);
      expect(steam.apps.isSubscribedApp).toHaveBeenCalledWith(200);
      if (owns) expect(steam.apps.isDlcInstalled).toHaveBeenCalledWith(200);
    }
  });

  it('stays locked without a verified entitlement, with no binding or store errors escaping', () => {
    expect(steamOwnsAutomobileDlc()).toBe(false);
    expect(steamOwnsAutomobileDlc(null, {}, pkg)).toBe(false);
    expect(steamOwnsAutomobileDlc({}, {}, pkg)).toBe(false);
    expect(steamOwnsAutomobileDlc(client(true, true), {}, null)).toBe(false);
    expect(steamOwnsAutomobileDlc(client(true, true), {}, { ...pkg, channel: 'itch' })).toBe(false);
    expect(steamOwnsAutomobileDlc({ apps: { isSubscribedApp: () => { throw Error('offline'); } } }, {}, pkg)).toBe(false);
  });

  it('reads Steam again on refresh instead of caching ownership from a previous check', () => {
    const steam = client(true, false);
    expect(steamOwnsAutomobileDlc(steam, {}, pkg)).toBe(false);
    steam.apps.isDlcInstalled.mockReturnValue(true);
    expect(steamOwnsAutomobileDlc(steam, {}, pkg)).toBe(true);
    steam.apps.isSubscribedApp.mockReturnValue(false);
    expect(steamOwnsAutomobileDlc(steam, {}, pkg)).toBe(false);
  });

  it('exposes only a fixed ownership read through the sandboxed preload', async () => {
    const invoke = vi.fn((channel: string) => Promise.resolve(channel === 'desktop:pads-get' ? [] : true));
    let bridge: { ownsAutomobileDlc(): Promise<boolean> } | undefined;
    const runPreload = new Function('require', 'process', readFileSync('desktop/preload.cjs', 'utf8'));
    runPreload(() => ({
      contextBridge: { exposeInMainWorld: (_key: string, value: typeof bridge) => { bridge = value; } },
      ipcRenderer: { on: vi.fn(), invoke },
    }), { argv: [] });
    expect(await bridge!.ownsAutomobileDlc()).toBe(true);
    expect(invoke).toHaveBeenLastCalledWith('desktop:automobile-dlc');
  });
});
