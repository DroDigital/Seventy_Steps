import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SaveStore } from '../src/systems/save';
import type { Desktop } from '../src/ui/desktop';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function browserStore(local: SaveStore | null, files?: Desktop['store']) {
  vi.stubGlobal('window', { localStorage: local });
  vi.stubGlobal('desktop', files && { store: files });
  return (await import('../src/ui/autosave')).browserStore();
}

const denied = (): never => { throw new Error('profile storage denied'); };
const localStore = (getItem: SaveStore['getItem']): SaveStore => ({ getItem, setItem: vi.fn(), removeItem: vi.fn() });

describe('profile storage at startup', () => {
  it('keeps desktop files usable when legacy browser storage refuses reads', async () => {
    const local = localStore(denied);
    const files = { get: (key: string) => key === 'save' ? 'desktop save' : null, set: vi.fn(() => true), remove: vi.fn(() => true) };
    const store = (await browserStore(local, files))!;
    expect(store.getItem('save')).toBe('desktop save');
    expect(store.getItem('slot')).toBeNull();
    store.setItem('settings', 'new settings');
    expect(files.set).toHaveBeenCalledWith('settings', 'new settings');
    expect(local.removeItem).not.toHaveBeenCalled();
  });

  it('returns a legacy save even when copying it into desktop files fails', async () => {
    const local = localStore(() => 'legacy save');
    const files = { get: () => null, set: vi.fn(denied), remove: vi.fn(() => true) };
    const store = (await browserStore(local, files))!;
    expect(store.getItem('save')).toBe('legacy save');
    expect(store.getItem('save')).toBe('legacy save');
    expect(files.set).toHaveBeenCalledWith('save', 'legacy save');
    expect(local.removeItem).not.toHaveBeenCalled();
    expect(local.setItem).not.toHaveBeenCalled();
  });

  it('starts with the first slot when web storage exists but cannot be read', async () => {
    const store = (await browserStore(localStore(denied)))!;
    const { recallSlot } = await import('../src/systems/save');
    expect(recallSlot(store)).toBe(1);
    expect(store.getItem('settings')).toBeNull();
  });

  it('migrates readable legacy data without replacing an existing desktop value', async () => {
    const local = localStore(() => 'legacy');
    const data = new Map([['save', 'desktop']]);
    const files = { get: (key: string) => data.get(key) ?? null, set: vi.fn((key: string, value: string) => (data.set(key, value), true)), remove: vi.fn(() => true) };
    const store = (await browserStore(local, files))!;
    expect(store.getItem('save')).toBe('desktop');
    expect(store.getItem('settings')).toBe('legacy');
    expect(data.get('save')).toBe('desktop');
    expect(data.get('settings')).toBe('legacy');
    expect(local.removeItem).not.toHaveBeenCalled();
  });
});
