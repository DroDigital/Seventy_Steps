import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hauntCoverage } from '../src/ui/veil';

describe('the veil haunting the title breathes without a seam', () => {
  const [from, to, secs] = [1, 0.24, 2500]; // drawing back from full cover over 2.5 s, as the title opens

  it('starts where the cover was and settles on the haunting', () => {
    expect(hauntCoverage(from, to, 0, 0)).toBe(from);
    expect(Math.abs(hauntCoverage(from, to, 1, secs) - to)).toBeLessThanOrEqual(0.03 + 1e-9);
  });

  it('never steps from one frame to the next, through the end of the motion and the first breaths', () => {
    const step = (a: number, b: number): number => {
      let worst = 0;
      for (let ms = a; ms < b; ms += 16) {
        const at = (m: number): number => hauntCoverage(from, to, Math.min(1, m / secs), m);
        worst = Math.max(worst, Math.abs(at(ms + 16) - at(ms)));
      }
      return worst;
    };
    expect(step(0, 12000)).toBeLessThan(0.016); // the draw-back itself: brisk, but in no frame a jump
    expect(step(secs - 400, secs + 1200)).toBeLessThan(0.002); // where the motion gives way to the breath: the old breath came in mid-swell, a step of up to 0.03
  });
});

describe('what wakes the title', () => {
  const listeners = new Map<string, ((e: unknown) => void)[]>();
  beforeEach(() => {
    listeners.clear();
    vi.stubGlobal('addEventListener', (type: string, fn: (e: unknown) => void) => listeners.set(type, [...(listeners.get(type) ?? []), fn]));
    vi.stubGlobal('removeEventListener', (type: string, fn: (e: unknown) => void) => listeners.set(type, (listeners.get(type) ?? []).filter((f) => f !== fn)));
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
    vi.stubGlobal('navigator', { getGamepads: () => [] });
  });
  afterEach(() => vi.unstubAllGlobals());
  const send = (type: string, e: object = {}): void => listeners.get(type)?.forEach((fn) => fn(e));

  it('wakes once, on a key, and then stops listening', async () => {
    const { listenForWake } = await import('../src/ui/titleWake');
    const wake = vi.fn();
    listenForWake(wake);
    send('keydown', { key: 'Shift', repeat: false });
    expect(wake).not.toHaveBeenCalled(); // a modifier alone is not a press
    send('keydown', { key: 'Enter', repeat: false });
    send('keydown', { key: 'a', repeat: false });
    expect(wake).toHaveBeenCalledTimes(1);
    expect(listeners.get('keydown')).toEqual([]);
  });

  it('keeps the click that woke it from the menu that comes in under it', async () => {
    const { listenForWake } = await import('../src/ui/titleWake');
    const wake = vi.fn();
    listenForWake(wake);
    send('pointerdown');
    expect(wake).toHaveBeenCalledTimes(1);
    const click = { stopPropagation: vi.fn(), preventDefault: vi.fn() };
    send('click', click);
    expect(click.preventDefault).toHaveBeenCalled();
  });
});
