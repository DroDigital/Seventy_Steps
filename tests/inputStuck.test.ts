/**
 * Input that sticks (round 49: "the character started walking on its own and I could no longer attack, only block and roll"):
 * the page is told when a key or a button goes down and when it comes up, and where an up is never told (a Command shortcut
 * on macOS, a mouse let go over another window, a pad that drifts or whose button glitches), the game kept believing in the
 * down. Run against the real input, with a page and a pad made up.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUTTONS, type InputDevice, type InputFrame } from '../src/core/input';
import { SIM } from '../src/data/tuning';

type Handler = (e: unknown) => void;
const listeners = (): Map<string, Handler[]> => new Map();

interface Page {
  input: InputDevice;
  key(type: 'keydown' | 'keyup', code: string, o?: { repeat?: boolean; metaKey?: boolean }): void;
  mouse(type: 'mousedown' | 'mouseup' | 'mousemove', o?: { button?: number; buttons?: number; shiftKey?: boolean }): void;
  win(type: string): void;
  pad: { axes: number[]; down: number[] } | null;
  poll(n?: number): InputFrame;
}

async function page(): Promise<Page> {
  vi.resetModules();
  const [win, doc, cv] = [listeners(), listeners(), listeners()];
  const on = (m: Map<string, Handler[]>) => (t: string, f: Handler): void => void m.set(t, [...(m.get(t) ?? []), f]);
  const fire = (m: Map<string, Handler[]>, t: string, e: unknown): void => m.get(t)?.forEach((f) => f(e));
  const canvas = { style: {}, addEventListener: on(cv), requestPointerLock: () => undefined };
  const state: Page['pad'] = null;
  const p = { pad: state } as { pad: Page['pad'] };
  vi.stubGlobal('addEventListener', on(win));
  vi.stubGlobal('document', { pointerLockElement: null, addEventListener: on(doc), visibilityState: 'visible' });
  vi.stubGlobal('navigator', {
    getGamepads: () => [p.pad && ({ index: 0, id: 'Test Pad', connected: true, mapping: 'standard', timestamp: 1, axes: p.pad.axes, buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: p.pad!.down.includes(i), value: p.pad!.down.includes(i) ? 1 : 0 })) })],
  });
  const { createInput } = await import('../src/core/input');
  const input = createInput(canvas as unknown as HTMLCanvasElement);
  const common = { preventDefault: () => undefined };
  const out: Page = {
    input,
    get pad() { return p.pad; },
    set pad(v) { p.pad = v; },
    key: (type, code, o = {}) => fire(win, type, { ...common, code, repeat: false, metaKey: false, ...o }),
    mouse: (type, o = {}) => fire(type === 'mousedown' ? cv : win, type, { ...common, button: 0, buttons: 0, shiftKey: false, movementX: 0, movementY: 0, ...o }),
    win: (t) => fire(win, t, {}),
    poll: (n = 1) => {
      let f = input.poll();
      for (let i = 1; i < n; i++) f = input.poll();
      return f;
    },
  };
  return out;
}
afterEach(() => vi.unstubAllGlobals());

describe('a mouse button whose release was never heard', () => {
  it('is let go as soon as the mouse says no button is down, and the next click is a fresh press', async () => {
    const pg = await page();
    pg.mouse('mousedown', { button: 0, buttons: 1 });
    expect(pg.poll().pressed.light).toBe(true);
    expect(pg.poll().held.light).toBe(true); // down, and its mouseup is never heard
    pg.mouse('mousemove', { buttons: 0 }); // the mouse moves, and says nothing is down
    expect(pg.poll().held.light).toBe(false);
    pg.mouse('mousedown', { button: 0, buttons: 1 });
    expect(pg.poll().pressed.light).toBe(true); // before: held still, so no press, and no blow
  });

  it('is kept while the mouse says it is down', async () => {
    const pg = await page();
    pg.mouse('mousedown', { button: 2, buttons: 2 });
    pg.mouse('mousemove', { buttons: 2 });
    expect(pg.poll().held.block).toBe(true);
  });
});

describe('keys pressed with Command held (macOS never says they rise)', () => {
  it('a key pressed with Command is not the game’s', async () => {
    const pg = await page();
    pg.key('keydown', 'KeyW', { metaKey: true });
    expect(pg.poll().moveY).toBe(0);
  });

  it('keys let go while Command was down are let go when Command rises', async () => {
    const pg = await page();
    pg.key('keydown', 'KeyW');
    expect(pg.poll().moveY).toBe(1);
    pg.key('keydown', 'MetaLeft', { metaKey: true }); // a screenshot's shortcut, W let go under it (its keyup is never sent)
    pg.key('keyup', 'MetaLeft');
    expect(pg.poll().moveY).toBe(0);
  });

  it('a key that is still held says so again with its next repeat', async () => {
    const pg = await page();
    pg.key('keydown', 'KeyW');
    pg.key('keyup', 'MetaLeft');
    pg.key('keydown', 'KeyW', { repeat: true });
    expect(pg.poll().moveY).toBe(1);
  });
});

describe('a button that acts on its press, down for seconds', () => {
  it('is let go, and the next press is heard', async () => {
    const pg = await page();
    pg.mouse('mousedown', { button: 0, buttons: 1 });
    expect(pg.poll().pressed.light).toBe(true);
    const f = pg.poll(SIM.hz * 2 + 5); // no mouse event comes: it is held on alone
    expect(f.held.light).toBe(false);
    pg.mouse('mousedown', { button: 0, buttons: 1 });
    expect(pg.poll().pressed.light).toBe(true);
  });

  it('the guard and the dodge, which are read as held, are not let go', async () => {
    const pg = await page();
    pg.mouse('mousedown', { button: 2, buttons: 2 });
    pg.key('keydown', 'Space');
    const f = pg.poll(SIM.hz * 6);
    expect(f.held.block).toBe(true);
    expect(f.held.dodge).toBe(true);
  });

  it('a pad’s button that glitches down is let go too, and a press of it afterwards is heard', async () => {
    const pg = await page();
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0, 0, 0, 0], down: [5] }; // RB (light) used, then stuck
    expect(pg.poll().pressed.light).toBe(true);
    expect(pg.poll(SIM.hz * 2 + 5).held.light).toBe(false);
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0, 0, 0, 0], down: [5] };
    expect(pg.poll().pressed.light).toBe(true);
  });
});

describe('a key that was heard to repeat, and then goes silent', () => {
  it('is let go after a few seconds: a held key goes on repeating, so its release was lost', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    t.mockReturnValue(600);
    pg.key('keydown', 'KeyW', { repeat: true });
    expect(pg.poll().moveY).toBe(1);
    t.mockReturnValue(600 + 3000);
    expect(pg.poll().moveY).toBe(1); // not yet
    t.mockReturnValue(600 + 4000);
    expect(pg.poll().moveY).toBe(0);
    t.mockRestore();
  });

  it('is kept while it keeps repeating', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    for (let at = 600; at <= 20000; at += 1000) {
      t.mockReturnValue(at);
      pg.key('keydown', 'KeyW', { repeat: true });
      expect(pg.poll().moveY, `at ${at}`).toBe(1);
    }
    t.mockRestore();
  });

  it('is kept however long when it was never heard to repeat (its repeats may be off, or taken by the system)', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyA');
    t.mockReturnValue(60000);
    expect(pg.poll().moveX).toBe(-1);
    t.mockRestore();
  });

  it('the dodge on the space bar is let go the same way', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'Space');
    t.mockReturnValue(700);
    pg.key('keydown', 'Space', { repeat: true });
    expect(pg.poll().held.dodge).toBe(true);
    t.mockReturnValue(700 + 4000);
    expect(pg.poll().held.dodge).toBe(false);
    t.mockRestore();
  });
});

describe('a pad whose stick has drifted', () => {
  it('walks the investigator on alone only for a while: a stick that lies still off centre is at rest there', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0, 0, 0, 0], down: [0] }; // used
    pg.poll();
    pg.pad = { axes: [0.3, -0.3, 0, 0], down: [] }; // it drifts, and the player does not touch it
    expect(Math.hypot(pg.poll().moveX, pg.poll().moveY)).toBeGreaterThan(0.2); // for now it walks
    t.mockReturnValue(5000);
    pg.poll();
    const f = pg.poll();
    expect([f.moveX, f.moveY]).toEqual([0, 0]);
    t.mockRestore();
  });

  it('a stick pushed hard and held is not taken for drift', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0, -1, 0, 0], down: [0] };
    pg.poll();
    t.mockReturnValue(20000);
    pg.poll();
    expect(pg.poll().moveY).toBeCloseTo(1); // forward, held a long time
    t.mockRestore();
  });
});

describe('reset (what pausing does)', () => {
  it('lets go of every key and button', async () => {
    const pg = await page();
    pg.key('keydown', 'KeyW');
    pg.key('keydown', 'KeyD');
    pg.mouse('mousedown', { button: 2, buttons: 2 });
    pg.poll();
    pg.input.reset();
    const f = pg.poll();
    expect([f.moveX, f.moveY]).toEqual([0, 0]);
    for (const b of BUTTONS) expect(f.held[b], b).toBe(false);
  });

  it('takes a drifted stick for its rest at once, and ignores a button held on until it is let go', async () => {
    const pg = await page();
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0.3, 0, 0, 0], down: [4] }; // used (LB), and the stick off a little
    pg.poll();
    expect(pg.poll().moveX).toBeGreaterThan(0.2);
    pg.input.reset();
    const f = pg.poll();
    expect(f.moveX).toBe(0);
    expect(f.held.block).toBe(false); // LB is still down, and unheard until let go
    pg.pad = { axes: [0.3, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0.3, 0, 0, 0], down: [4] };
    expect(pg.poll().held.block).toBe(true);
  });
});

describe('describe (the frame meter, F3)', () => {
  it('names what is held, and what the pad says', async () => {
    const pg = await page();
    pg.key('keydown', 'KeyW');
    pg.mouse('mousedown', { button: 0, buttons: 1 });
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0.4, 0, 0, 0], down: [7] };
    pg.poll();
    const text = pg.input.describe();
    expect(text).toMatch(/keys KeyW/);
    expect(text).toMatch(/mouse light/);
    expect(text).toMatch(/Test Pad/);
    expect(text).toMatch(/L 0\.40/);
    expect(text).toMatch(/heavy/);
  });

  it('says nothing is held when nothing is', async () => {
    const pg = await page();
    pg.poll();
    expect(pg.input.describe()).toBe('keys - · mouse -\npad none heard');
  });
});
