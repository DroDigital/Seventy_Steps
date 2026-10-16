import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from '../src/ui/menuKit';
import { defaultSettings } from '../src/ui/settings';

const menu = vi.hoisted(() => ({
  open: false,
  otherOpen: false,
  page: null as Page | null,
  start: null as (() => void) | null,
}));

vi.mock('../src/ui/menuKit', () => ({
  createScreen: () => ({
    get open() { return menu.open; },
    show(page: Page) { menu.open = true; menu.page = page; },
    close() { menu.open = false; },
  }),
  menuOpen: () => menu.open || menu.otherOpen,
  onPadStart: (fn: () => void) => { menu.start = fn; },
  button: vi.fn(), el: vi.fn(), footer: vi.fn(), title: vi.fn(),
}));
vi.mock('../src/ui/credits', () => ({ creditsPage: vi.fn() }));
vi.mock('../src/ui/menuPages', () => ({ settingsPage: vi.fn() }));
vi.mock('../src/ui/autosave', () => ({ saveNow: vi.fn() }));
vi.mock('../src/ui/desktop', () => ({ desktop: undefined }));

type Handler = (event: unknown) => void;

async function page(initiallyLocked = false) {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  Object.assign(menu, { open: false, otherOpen: false, page: null, start: null });
  const windowEvents = new Map<string, Handler[]>();
  const documentEvents = new Map<string, Handler[]>();
  const on = (events: Map<string, Handler[]>) => (type: string, fn: Handler): void => {
    events.set(type, [...(events.get(type) ?? []), fn]);
  };
  const fire = (events: Map<string, Handler[]>, type: string, event: unknown = {}): void => {
    events.get(type)?.forEach((fn) => fn(event));
  };
  const canvas = {} as Element;
  const state = { focused: true, held: false };
  const document = {
    pointerLockElement: initiallyLocked ? canvas : null as Element | null,
    visibilityState: 'visible',
    hasFocus: () => state.focused,
    addEventListener: on(documentEvents),
    exitPointerLock: vi.fn(),
  };
  vi.stubGlobal('addEventListener', on(windowEvents));
  vi.stubGlobal('document', document);
  const { createPauseMenu } = await import('../src/ui/pauseMenu');
  const { noteLockAsked } = await import('../src/core/mouseLock');
  const resume = vi.fn();
  const pause = createPauseMenu({
    settings: defaultSettings(), change: vi.fn(), quit: vi.fn(), resume,
    held: () => state.held,
  });
  return {
    pause, resume, state, document, noteLockAsked,
    win: (type: string) => fire(windowEvents, type),
    key: (code: string, repeat = false) => fire(windowEvents, 'keydown', { code, repeat }),
    visibility(value: 'visible' | 'hidden') {
      document.visibilityState = value;
      fire(documentEvents, 'visibilitychange');
    },
    lock() {
      document.pointerLockElement = canvas;
      fire(documentEvents, 'pointerlockchange');
    },
    unlock() {
      document.pointerLockElement = null;
      fire(documentEvents, 'pointerlockchange');
    },
  };
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('automatic pause confirms that the player left the game', () => {
  it('ignores a window blur when the document still has focus', async () => {
    const p = await page();
    p.win('blur');
    vi.advanceTimersByTime(200);
    expect(p.pause.open).toBe(false);
  });

  it('ignores a transient loss of focus that recovers before the delay', async () => {
    const p = await page();
    p.state.focused = false;
    p.win('blur');
    vi.advanceTimersByTime(100);
    p.state.focused = true;
    p.win('focus');
    vi.advanceTimersByTime(100);
    expect(p.pause.open).toBe(false);
  });

  it('pauses after a sustained loss of focus', async () => {
    const p = await page();
    p.state.focused = false;
    p.win('blur');
    expect(p.pause.open).toBe(false);
    vi.advanceTimersByTime(149);
    expect(p.pause.open).toBe(false);
    vi.advanceTimersByTime(1);
    expect(p.pause.open).toBe(true);
  });

  it('pauses immediately when the document becomes hidden', async () => {
    const p = await page();
    p.visibility('hidden');
    expect(p.pause.open).toBe(true);
  });

  it('cancels a pending focus check when a visible document has focus again', async () => {
    const p = await page();
    p.state.focused = false;
    p.win('blur');
    vi.advanceTimersByTime(100);
    p.state.focused = true;
    p.visibility('visible');
    p.state.focused = false; // no new blur: the cancelled check must stay cancelled
    vi.advanceTimersByTime(100);
    expect(p.pause.open).toBe(false);
  });

  it('does not let an old focus check reopen the menu after resuming', async () => {
    const p = await page();
    p.state.focused = false;
    p.win('blur');
    p.key('Escape');
    expect(p.pause.open).toBe(true);
    menu.page?.back?.();
    vi.advanceTimersByTime(200);
    expect(p.pause.open).toBe(false);
    expect(p.resume).toHaveBeenCalledTimes(1);
  });
});

describe('pointer lock loss belongs to a real gameplay capture', () => {
  it('ignores an unlocked event when the mouse was never captured', async () => {
    const p = await page();
    p.unlock();
    vi.advanceTimersByTime(200);
    expect(p.pause.open).toBe(false);
    expect(p.resume).not.toHaveBeenCalled();
  });

  it('pauses when an existing capture is lost', async () => {
    const p = await page();
    p.lock();
    p.unlock();
    expect(p.pause.open).toBe(true);
  });

  it('recognizes a capture already present when the pause handlers are installed', async () => {
    const p = await page(true);
    p.unlock();
    expect(p.pause.open).toBe(true);
  });

  it.each(['menu', 'cutscene'])('does not queue recapture for an unlock during a %s', async (owner) => {
    const p = await page();
    p.lock();
    p.noteLockAsked();
    if (owner === 'menu') menu.otherOpen = true;
    else p.state.held = true;
    p.unlock();
    menu.otherOpen = false;
    p.state.held = false;
    vi.advanceTimersByTime(200);
    expect(p.pause.open).toBe(false);
    expect(p.resume).not.toHaveBeenCalled();
  });
});

describe('the browser release immediately after resuming', () => {
  it('retries capture once after the release has settled', async () => {
    const p = await page();
    p.noteLockAsked();
    p.lock();
    p.unlock();
    vi.advanceTimersByTime(149);
    expect(p.resume).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(p.resume).toHaveBeenCalledTimes(1);
    expect(p.pause.open).toBe(false);
  });

  it('does not recapture after focus is lost while the retry is pending', async () => {
    const p = await page();
    p.noteLockAsked();
    p.lock();
    p.unlock();
    p.state.focused = false;
    p.win('blur');
    vi.advanceTimersByTime(200);
    expect(p.resume).not.toHaveBeenCalled();
    expect(p.pause.open).toBe(true);
  });

  it('does not recapture while the document is hidden', async () => {
    const p = await page();
    p.noteLockAsked();
    p.lock();
    p.unlock();
    p.visibility('hidden');
    vi.advanceTimersByTime(200);
    expect(p.resume).not.toHaveBeenCalled();
  });

  it('does not request capture again if the mouse has already been recaptured', async () => {
    const p = await page();
    p.noteLockAsked();
    p.lock();
    p.unlock();
    vi.advanceTimersByTime(100);
    p.lock();
    vi.advanceTimersByTime(100);
    expect(p.resume).not.toHaveBeenCalled();
    expect(p.pause.open).toBe(false);
  });
});

describe('explicit pause controls', () => {
  it('opens on Escape, while ignoring a repeated keydown', async () => {
    const p = await page();
    p.key('Escape', true);
    expect(p.pause.open).toBe(false);
    p.key('Escape');
    expect(p.pause.open).toBe(true);
  });

  it('opens on the controller Start button', async () => {
    const p = await page();
    menu.start?.();
    expect(p.pause.open).toBe(true);
  });
});
