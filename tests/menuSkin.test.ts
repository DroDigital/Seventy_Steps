import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachSkin, type Skin } from '../src/ui/menuSkin';

const ctx = new Proxy({}, { get: (_t, k) => (k === 'canvas' ? {} : () => ({ data: [] })), set: () => true });
const style = (): Record<string, string> => ({ cssText: '', clipPath: '', opacity: '', transform: '', filter: '' });

describe('a menu skin that has faded out stops drawing (round 50)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('draws while open, and not at all once the closing fade has ended', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.stubGlobal('document', { createElement: () => ({ style: style(), getContext: () => ctx }) });
    vi.stubGlobal('ResizeObserver', class { observe(): void {} });
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('location', { search: '' });
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    let draws = 0;
    const skin: Skin = { id: 't', name: 't', bleed: 0, pad: '0', openMs: 300, build: () => ({ draw: () => void draws++, words: () => undefined }) };
    const layer = { insertBefore: () => undefined, offsetWidth: 600, offsetHeight: 800, offsetParent: {}, getBoundingClientRect: () => ({ width: 600 }) } as unknown as HTMLElement;
    const panel = { offsetWidth: 594, offsetHeight: 300, isConnected: true, style: style() } as unknown as HTMLElement;
    const api = attachSkin(layer, panel, skin);
    api.open();
    vi.advanceTimersByTime(1000);
    expect(draws).toBeGreaterThan(10);
    let done = 0;
    api.fade(() => void done++);
    vi.advanceTimersByTime(1000);
    expect(done).toBe(1);
    const atClose = draws;
    vi.advanceTimersByTime(5000);
    expect(draws).toBe(atClose); // nothing is drawn behind a screen that has closed
    expect(vi.getTimerCount()).toBe(0);
  });
});
