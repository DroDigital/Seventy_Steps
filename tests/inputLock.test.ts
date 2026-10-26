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
  /** A key pressed (or repeated, with `repeat`): a key asks the browser for the mouse. */
  press(code: string, repeat?: boolean): void;
  /** A menu closing asks for the mouse back, as main.ts's capture does: the same mark and the same request. */
  ask(): void;
  /** How many times the page has asked the browser for the mouse. */
  asks(): number;
}

async function page(free = false, refuse = false): Promise<Page> {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ['performance'] });
  const [win, doc, cv] = [new Map<string, Handler[]>(), new Map<string, Handler[]>(), new Map<string, Handler[]>()];
  const on = (m: Map<string, Handler[]>) => (t: string, f: Handler): void => void m.set(t, [...(m.get(t) ?? []), f]);
  const fire = (m: Map<string, Handler[]>, t: string, e: unknown): void => m.get(t)?.forEach((f) => f(e));
  let requests = 0;
  const request = (): void => {
    requests += 1;
    if (refuse) fire(doc, 'pointerlockerror', {}); // the browser refuses the request, and says so (the Pointer Lock API's error event)
  };
  const canvas = { style: {}, addEventListener: on(cv), requestPointerLock: request };
  const docStub = { pointerLockElement: null as unknown, addEventListener: on(doc), visibilityState: 'visible' };
  vi.stubGlobal('addEventListener', on(win));
  vi.stubGlobal('document', docStub);
  vi.stubGlobal('navigator', { getGamepads: () => [] });
  const { createInput } = await import('../src/core/input');
  const { noteLockAsked } = await import('../src/core/mouseLock');
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
    press: (code, repeat = false) => fire(win, 'keydown', { buttons: 0, code, repeat, metaKey: false }),
    ask: () => {
      noteLockAsked();
      request();
    },
    asks: () => requests,
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

describe('a lock asked for and not yet granted (round 87)', () => {
  it('reads nothing the browser reports between the ask and the grant: the cursor warped to the middle', async () => {
    const pg = await page(true); // the menus are closed and the lock is not granted: a free look would read this move
    pg.ask(); // the map closes and asks for the mouse back
    pg.move(640, -360); // the cursor is warped to the middle before the browser grants the lock
    expect(pg.input.poll().lookX).toBe(0);
    pg.grant();
    pg.wait(INPUT.lockSettleMs + 50);
    pg.move(40, 0);
    expect(pg.input.poll().lookX).toBeGreaterThan(0);
  });

  it('reads a hand again once the ask has gone unanswered for lockAskMs', async () => {
    const pg = await page(true);
    pg.press('KeyW'); // a key asks for the mouse; the browser refuses
    pg.wait(INPUT.lockAskMs + 50);
    pg.move(40, 0);
    expect(pg.input.poll().lookX).toBeGreaterThan(0);
  });

  it('keeps the free look for a mouse nothing has asked for', async () => {
    const pg = await page(true);
    pg.move(40, 0);
    expect(pg.input.poll().lookX).toBeGreaterThan(0);
  });

  it('a key held down asks again with each repeat, and a repeat does not hold the mouse back', async () => {
    const pg = await page(true);
    pg.press('KeyW');
    pg.wait(INPUT.lockAskMs + 50);
    pg.press('KeyW', true); // the repeat asks again: the browser may yet grant it
    expect(pg.asks()).toBe(2);
    pg.move(40, 0);
    expect(pg.input.poll().lookX).toBeGreaterThan(0);
  });

  it('a refused request ends the wait at once: the hand reads straight after the refusal', async () => {
    const pg = await page(true, true); // the browser refuses every request
    pg.press('KeyW'); // a key asks for the mouse, and is refused
    pg.move(40, 0);
    expect(pg.input.poll().lookX).toBeGreaterThan(0);
  });

  it('with every request refused, a key every 300 ms does not hold the look back: the mouse looks about free as before', async () => {
    const pg = await page(true, true);
    let turned = 0;
    for (let i = 0; i < 10; i++) {
      pg.press('KeyW');
      pg.move(10, 0);
      turned += pg.input.poll().lookX;
      pg.wait(300);
    }
    expect(turned).toBeCloseTo(10 * 10 * INPUT.mouseSensitivity, 6);
  });
});
