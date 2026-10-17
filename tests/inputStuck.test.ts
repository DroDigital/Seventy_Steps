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
  vis(state: 'hidden' | 'visible'): void;
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
  const docStub = { pointerLockElement: null, addEventListener: on(doc), visibilityState: 'visible' };
  vi.stubGlobal('document', docStub);
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
    vis: (state) => {
      docStub.visibilityState = state;
      fire(doc, 'visibilitychange', {});
    },
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

describe('a run that goes on through a sprint, a roll and a blink of the window (round 53: it stopped dead, and no one knew why)', () => {
  /** The system repeats only the key pressed last: W is held and silent from the moment Space goes down. */
  it('W held, then Space for the sprint: W is still down, ten seconds into the run', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    t.mockReturnValue(600);
    pg.key('keydown', 'KeyW', { repeat: true });
    t.mockReturnValue(1200);
    pg.key('keydown', 'Space'); // the sprint: from here the system repeats Space, and W says nothing
    for (let at = 1700; at <= 12000; at += 33) {
      t.mockReturnValue(at);
      if (at % 990 < 33) pg.key('keydown', 'Space', { repeat: true });
      pg.poll();
    }
    const f = pg.poll();
    expect(f.moveY).toBe(1); // before: W was let go at 4.1 seconds, and the investigator stood sprinting nowhere
    expect(f.held.dodge).toBe(true);
    t.mockRestore();
  });

  it('and when the sprint is let go, W, which the system no longer repeats, is still held', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    t.mockReturnValue(600);
    pg.key('keydown', 'KeyW', { repeat: true });
    t.mockReturnValue(1000);
    pg.key('keydown', 'Space');
    t.mockReturnValue(1300);
    pg.key('keyup', 'Space'); // a roll
    t.mockReturnValue(15000);
    expect(pg.poll().moveY).toBe(1);
    pg.key('keyup', 'KeyW');
    expect(pg.poll().moveY).toBe(0); // and a release that is heard is a release
    t.mockRestore();
  });

  it('a key that repeats on alone and then falls silent, with no other key pressed since, is still let go', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    t.mockReturnValue(600);
    pg.key('keydown', 'KeyW', { repeat: true });
    t.mockReturnValue(600 + 4000);
    expect(pg.poll().moveY).toBe(0);
    t.mockRestore();
  });

  it('a window left and returned to within a blink does not let go of the run or the sprint', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    pg.key('keydown', 'Space');
    pg.mouse('mousedown', { button: 2, buttons: 2 });
    pg.poll();
    t.mockReturnValue(1000);
    pg.win('blur');
    expect(pg.poll().moveY).toBe(0); // away: nothing is held
    t.mockReturnValue(1120);
    pg.win('focus');
    const f = pg.poll();
    expect(f.moveY).toBe(1); // before: the run was gone, and the system repeats only the last key to bring one back
    expect(f.held.dodge).toBe(true);
    expect(f.held.block).toBe(true);
    expect(f.pressed.dodge).toBe(false); // a sprint carried on, not begun again
    t.mockRestore();
  });

  it('a return that is two events, the page shown and the window focused, keeps the run the first gave back (Codex, PR #132)', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    pg.key('keydown', 'Space');
    pg.poll();
    t.mockReturnValue(1000);
    pg.vis('hidden');
    pg.win('blur'); // both come, and the second finds the first's saved state kept
    expect(pg.poll().moveY).toBe(0);
    t.mockReturnValue(1100);
    pg.vis('visible');
    pg.win('focus'); // before: this second return let go of what the first had restored
    const f = pg.poll();
    expect(f.moveY).toBe(1);
    expect(f.held.dodge).toBe(true);
    t.mockRestore();
  });

  it('a window left for longer holds nothing on its return, and a hidden page the same', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    pg.key('keydown', 'Space');
    pg.poll();
    t.mockReturnValue(1000);
    pg.win('blur');
    t.mockReturnValue(3000);
    pg.win('focus');
    const f = pg.poll();
    expect([f.moveX, f.moveY]).toEqual([0, 0]);
    expect(f.held.dodge).toBe(false);
    t.mockRestore();
  });

  it('pausing (reset) while away forgets what was held: nothing comes back after a menu', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.key('keydown', 'KeyW');
    pg.poll();
    t.mockReturnValue(1000);
    pg.win('blur');
    pg.input.reset();
    t.mockReturnValue(1100);
    pg.win('focus');
    expect(pg.poll().moveY).toBe(0);
    t.mockRestore();
  });

  it('on a pad, a stick held forward and the sprint button held for ten seconds stay as they are', async () => {
    const t = vi.spyOn(performance, 'now');
    t.mockReturnValue(0);
    const pg = await page();
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    for (const at of [100, 2500, 5000, 7500, 10000]) {
      t.mockReturnValue(at);
      pg.pad = { axes: [0, -0.3, 0, 0], down: [1] }; // a light push (under what is taken for a stick at rest) and B (the dodge) held
      pg.poll();
    }
    const f = pg.poll();
    expect(f.moveY).toBeCloseTo(0.3, 1); // before: taken for drift after four seconds, and the sprint went nowhere
    expect(f.held.dodge).toBe(true);
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
  it('maps the mount to B and L3 with one press per release, independently of dodge', async () => {
    const pg = await page();
    pg.key('keydown', 'KeyB');
    expect(pg.poll().pressed.mount).toBe(true);
    expect(pg.poll().pressed.mount).toBe(false);
    pg.key('keyup', 'KeyB');
    pg.poll();
    pg.pad = { axes: [0, 0, 0, 0], down: [] };
    pg.poll();
    pg.pad = { axes: [0, 0, 0, 0], down: [10] };
    const f = pg.poll();
    expect(f.pressed.mount).toBe(true);
    expect(f.pressed.dodge).toBe(false);
    expect(pg.poll().pressed.mount).toBe(false);
  });

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
