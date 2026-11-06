import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '../src/ui/menuKit';

const state = vi.hoisted(() => ({ open: false, other: false, page: null as Page | null, padDown: false, buttons: [] as { text: string; run: () => void; hidden: boolean }[], elements: [] as FakeElement[] }));

class FakeElement {
  style = { cssText: '' };
  dataset: Record<string, string> = {};
  value = '';
  textContent = '';
  className = '';
  hidden = false;
  listeners = new Map<string, (e: any) => void>();
  setAttribute() {}
  addEventListener(type: string, fn: (e: any) => void) { this.listeners.set(type, fn); }
}

vi.mock('../src/ui/menuKit', () => ({
  createScreen: () => ({
    get open() { return state.open; },
    show(page: Page) { state.open = true; state.page = page; page.build({} as HTMLElement); },
    close() { state.open = false; },
  }),
  menuOpen: () => state.open || state.other,
  title: vi.fn(),
  el: (_parent: unknown, _tag: string, text = '') => { const el = new FakeElement(); el.textContent = text; state.elements.push(el); return el; },
  button: (_parent: unknown, text: string, run: () => void) => { const b = { text, run, hidden: false }; state.buttons.push(b); return b; },
}));
vi.mock('../src/core/pads', () => ({ activePad: () => ({ buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 15 && state.padDown, value: i === 15 && state.padDown ? 1 : 0 })) }) }));

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

async function setup() {
  Object.assign(state, { open: false, other: false, page: null, padDown: false, buttons: [], elements: [] });
  vi.useFakeTimers({ toFake: ['performance'] });
  let key: ((e: any) => void) | undefined;
  let frame: (() => void) | undefined;
  vi.stubGlobal('addEventListener', (type: string, fn: (e: any) => void) => { if (type === 'keydown') key = fn; });
  vi.stubGlobal('requestAnimationFrame', (fn: () => void) => { frame = fn; });
  const { createDeveloperConsole } = await import('../src/ui/developerConsole');
  const execute = vi.fn((line: string) => `Done: ${line}`);
  const onOpen = vi.fn();
  const console = createDeveloperConsole({ commands: [{ command: 'spawn ghoul', description: 'Spawn a ghoul' }, { command: 'warp boss', description: 'Go to the boss' }], execute, onOpen });
  return {
    console, execute, onOpen,
    key: () => key?.({ code: 'Backquote', repeat: false, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() }),
    frame: (down: boolean, after = 0) => { vi.advanceTimersByTime(after); state.padDown = down; frame?.(); },
  };
}

describe('developer console', () => {
  it('opens with the keyboard and executes both typed and browsed commands', async () => {
    const p = await setup();
    p.key();
    expect(p.console.open).toBe(true);
    expect(p.onOpen).toHaveBeenCalledOnce();
    const input = state.elements.find((el) => el.dataset.menuText !== undefined)!;
    input.value = 'spawn ghoul';
    input.listeners.get('input')?.({});
    expect(state.buttons.find((b) => b.text === 'warp boss')?.hidden).toBe(true);
    input.listeners.get('keydown')?.({ key: 'Enter', stopPropagation: vi.fn(), preventDefault: vi.fn() });
    expect(p.execute).toHaveBeenCalledWith('spawn ghoul');
    state.buttons.find((b) => b.text === 'warp boss')?.run();
    expect(p.execute).toHaveBeenCalledWith('warp boss');
    expect(state.elements.some((el) => el.textContent === 'Done: warp boss')).toBe(true);
    state.page?.back?.();
    expect(p.console.open).toBe(false);
  });

  it('opens on two separate right-pad taps and ignores holds and other menus', async () => {
    const p = await setup();
    p.frame(true);
    p.frame(true, 100);
    expect(p.console.open).toBe(false);
    p.frame(false);
    p.frame(true, 100);
    expect(p.console.open).toBe(true);
    state.page?.back?.();
    state.other = true;
    p.frame(false);
    p.frame(true, 100);
    p.frame(false);
    p.frame(true, 100);
    expect(p.console.open).toBe(false);
  });
});
