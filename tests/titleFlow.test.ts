import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME } from '../src/data/tuning';
import type { Music } from '../src/render/audio/music';
import type { Shell } from '../src/ui/shell';
import type { TitleOptions } from '../src/ui/titleScreen';

const state = vi.hoisted(() => ({ desktop: undefined as object | undefined }));
const play = vi.hoisted(() => vi.fn());
const show = vi.hoisted(() => vi.fn());
vi.mock('../src/ui/desktop', () => ({ get desktop() { return state.desktop; } }));
vi.mock('../src/render/audio/music', () => ({ playMenuMusic: play }));
vi.mock('../src/ui/loading', () => ({ makeAhead: vi.fn() }));
vi.mock('../src/ui/titleScreen', () => ({ showTitle: show }));
vi.mock('../src/systems/save', () => ({ activeSlot: () => 1, useSlot: vi.fn() }));
vi.mock('../src/ui/titleSlots', () => ({ slotLines: () => [] }));

import { title } from '../src/ui/titleFlow';

const pending = (): Promise<void> => new Promise(() => {});
const music = (sounding = pending(), refused = pending()): Music => ({ sounding, refused, setVolume: vi.fn(), fadeOut: vi.fn() });
const shell = (): Shell => ({
  engine: {}, settings: { volume: 1 },
  veil: { darken: vi.fn(), haunt: vi.fn() },
} as unknown as Shell);

beforeEach(() => {
  vi.useFakeTimers();
  state.desktop = undefined;
  play.mockReset();
  show.mockReset();
  show.mockImplementation((options: TitleOptions) => void options.byItself.then(options.open));
});
afterEach(() => vi.useRealTimers());

describe('the title opens independently of desktop audio', () => {
  it('opens the desktop menu even when the audio promises never settle', async () => {
    state.desktop = {};
    play.mockReturnValue(music());
    const s = shell();
    title(s, vi.fn());
    await Promise.resolve();
    expect(s.veil.haunt).toHaveBeenCalledWith(true);
  });

  it('opens the desktop menu when audio was refused, without asking for a key', async () => {
    state.desktop = {};
    play.mockReturnValue(music(pending(), Promise.resolve()));
    const s = shell();
    title(s, vi.fn());
    await Promise.resolve();
    expect(s.veil.haunt).toHaveBeenCalledWith(true);
    expect(s.veil.darken).not.toHaveBeenCalledWith('press any key');
  });

  it('keeps the web gesture gate when the browser refuses audio', async () => {
    play.mockReturnValue(music(pending(), Promise.resolve()));
    const s = shell();
    title(s, vi.fn());
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(THEME.wait * 1000);
    expect(s.veil.darken).toHaveBeenCalledWith('press any key');
    expect(s.veil.haunt).not.toHaveBeenCalled();
  });

  it('still opens the web title when its music starts sounding', async () => {
    let sound = (): void => {};
    play.mockReturnValue(music(new Promise<void>((resolve) => (sound = resolve))));
    const s = shell();
    title(s, vi.fn());
    await Promise.resolve();
    expect(s.veil.haunt).not.toHaveBeenCalled();
    sound();
    await Promise.resolve();
    await Promise.resolve();
    expect(s.veil.haunt).toHaveBeenCalledWith(true);
  });
});
