/**
 * The mouse taken again (round 60: "when walking normally, opening the map, closing the map again, and then look around, the
 * camera then seems to glitch and reset on a different viewpoint"). Opening the map lets the mouse go and closing it asks for
 * it back at once; the first movement a browser reports with a freshly granted lock can be the cursor's jump to the middle of
 * the window, not a hand, and read as a look it spun the camera to another view. Run against the real input, with a page made up.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InputDevice } from '../src/core/input';
import { INPUT } from '../src/data/tuning';

type Handler = (e: unknown) => void;

interface Page {
  input: InputDevice;
  /** The browser grants the lock (the canvas is `pointerLockElement`) and says so. */
  grant(): void;
  /** The mouse is let go (a menu, Esc) and the browser says so. */
  release(): void;
  move(dx: number, dy: number): void;
  /** `ms` of the page's clock go by. */
  wait(ms: number): void;
}

async function page(free = false): Promise<Page> {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['performance'] });
  const [win, doc, cv] = [new Map<string, Handler[]>(), new Map<string, Handler[]>(), new Map<string, Handler[]>()];
  const on = (m: Map<string, Handler[]>) => (t: string, f: Handler): void => void m.set(t, [...(m.get(t) ?? []), f]);
  const fire = (m: Map<string, Handler[]>, t: string, e: unknown): void => m.get(t)?.forEach((f) => f(e));
  const canvas = { style: {}, addEventListener: on(cv), requestPointerLock: () => undefined };
  const docStub = { pointerLockElement: null as unknown, addEventListener: on(doc), visibilityState: 'visible' };
  vi.stubGlobal('addEventListener', on(win));
  vi.stubGlobal('document', docStub);
  vi.stubGlobal('navigator', { getGamepads: () => [] });
  const { createInput } = await import('../src/core/input');
  const input = createInput(canvas as unknown as HTMLCanvasElement, () => free);
  return {
    input,
    grant: () => {
      docStub.pointerLockElement = canvas;
      fire(doc, 'pointerlockchange', {});
    },
    release: () => {
      docStub.pointerLockElement = null;
      fire(doc, 'pointerlockchange', {});
    },
    move: (dx, dy) => fire(win, 'mousemove', { buttons: 0, movementX: dx, movementY: dy }),
    wait: (ms) => void vi.advanceTimersByTime(ms),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('a mouse just taken again (round 60)', () => {
  it('turns the camera for a hand on it, as it always did', async () => {
    const pg = await page();
    pg.grant();
    pg.wait(INPUT.lockSettleMs + 50);
    pg.move(40, -20);
    const f = pg.input.poll();
    expect(f.lookX).toBeGreaterThan(0);
    expect(f.lookY).toBeLessThan(0);
  });

  it('does not read the movement the browser reports with the lock as a look: the jump to the middle of the window', async () => {
    const pg = await page();
    pg.grant();
    pg.move(640, -360); // the cursor's jump
    pg.move(5, 2);
    const f = pg.input.poll();
    expect([f.lookX, f.lookY]).toEqual([0, 0]);
  });

  it('after the map: let go, taken again, a jump at once is not read, and the hand that follows is', async () => {
    const pg = await page();
    pg.grant();
    pg.wait(1000);
    pg.move(10, 0);
    pg.input.poll();
    pg.release(); // the map opens
    pg.wait(3000);
    pg.grant(); // and closes: the mouse is asked for again
    pg.move(-700, 400);
    expect(pg.input.poll().lookX).toBe(0);
    pg.wait(INPUT.lockSettleMs + 50);
    pg.move(-30, 0);
    expect(pg.input.poll().lookX).toBeLessThan(0);
  });

  it('forgets what had built up before the lock was granted, so a look about with the mouse free is not carried into it', async () => {
    const pg = await page(true); // no menu has the screen, the mouse is not yet taken: it looks about all the same
    pg.move(300, 100);
    pg.grant(); // a key takes it
    expect([pg.input.poll().lookX, pg.input.poll().lookY]).toEqual([0, 0]);
  });
});
