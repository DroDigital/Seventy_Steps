import { readFileSync, readdirSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PAD_BUTTON, faceSwapped, padSwapped, setPadSwap } from '../src/core/padMap';

/** Round 45: A and B are the buttons that must never trade places again after an update. */
describe('the pad map', () => {
  afterEach(() => setPadSwap(false));

  it('pins the standard mapping: A is 0 and confirms, B is 1 and goes back and dodges', () => {
    expect(PAD_BUTTON).toMatchObject({ a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, select: 8, start: 9, l3: 10, r3: 11, up: 12, down: 13, left: 14, right: 15 });
  });

  it('the switch exchanges A and B in what a pad reads, and nothing else', () => {
    const list = ['a', 'b', 'x', 'y'];
    expect(faceSwapped(list, false)).toEqual(list);
    expect(faceSwapped(list, true)).toEqual(['b', 'a', 'x', 'y']);
    expect(list).toEqual(['a', 'b', 'x', 'y']); // untouched
    setPadSwap(true);
    expect(padSwapped()).toBe(true);
    expect(faceSwapped(list)).toEqual(['b', 'a', 'x', 'y']);
  });

  it('the pad in hand reads B as A when the switch is on', async () => {
    vi.resetModules();
    const down = Array.from({ length: 17 }, (_, i) => ({ pressed: i === 1, value: i === 1 ? 1 : 0 }));
    vi.stubGlobal('navigator', { getGamepads: () => [{ index: 0, id: 'p', connected: true, mapping: 'standard', timestamp: 1, axes: [0, 0, 0, 0], buttons: down }] });
    const map = await import('../src/core/padMap');
    const { activePad } = await import('../src/core/pads');
    activePad(); // first seen: a button down then is ignored; let it go, then press
    down[1] = { pressed: false, value: 0 };
    activePad();
    down[1] = { pressed: true, value: 1 };
    expect(activePad()?.buttons[1].pressed).toBe(true);
    map.setPadSwap(true);
    const r = activePad();
    expect([r?.buttons[0].pressed, r?.buttons[1].pressed]).toEqual([true, false]);
    vi.unstubAllGlobals();
  });
});

/** No reader of a pad may hard-code a button index: they all name it from the one table. */
describe('every reader of a pad names its buttons from the one table', () => {
  const walk = (d: string): string[] => readdirSync(d).flatMap((f) => (!f.includes('.') ? walk(`${d}/${f}`) : f.endsWith('.ts') ? [`${d}/${f}`] : []));
  const readers = walk('src').filter((f) => /\.buttons\[\s*\d|PAD\s*=\s*\{[^}]*\b(a|b|interact|dodge)\s*:\s*\d/.test(readFileSync(f, 'utf8')));
  it('finds no pad index written as a number', () => expect(readers).toEqual([]));

  it('the desktop shell asks SDL for buttons by place, before it loads the pad library', () => {
    const src = readFileSync('desktop/padWorker.js', 'utf8');
    const hint = src.indexOf("SDL_GAMECONTROLLER_USE_BUTTON_LABELS = '0'");
    const load = src.indexOf("import('gamepad-node')");
    expect(hint).toBeGreaterThan(-1);
    expect(load).toBeGreaterThan(hint);
  });

  it('the prompts name A for confirming and B for going back and dodging', () => {
    const g = readFileSync('src/ui/glyphs.ts', 'utf8');
    expect(g).toMatch(/dodge: 'B'/);
    expect(g).toMatch(/interact: 'A'/);
    expect(g).toMatch(/back: 'B'/);
  });
});
