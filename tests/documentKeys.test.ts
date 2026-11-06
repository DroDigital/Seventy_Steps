import { describe, expect, it, vi } from 'vitest';
import { documentPage } from '../src/ui/dialogue';

// The screens are stood in for: what is under test is which keys put a note or tome away, not how it is drawn.
vi.mock('../src/ui/menuKit', () => ({
  createScreen: () => ({}),
  el: () => ({}),
  button: () => ({}),
  frame: () => '',
}));

/** A key as the page hears it: `repeat` for a key still held down (the system repeats it). */
const key = (code: string, repeat = false) => ({ code, repeat, preventDefault: vi.fn() }) as unknown as KeyboardEvent;

describe('a note or tome is put away by a fresh press, never by a key held down', () => {
  it('closes on a fresh E, Space or Enter', () => {
    for (const code of ['KeyE', 'Space', 'Enter']) {
      const back = vi.fn();
      const e = key(code);
      documentPage('Necronomicon', back).keys?.(e);
      expect(back, code).toHaveBeenCalledTimes(1);
      expect(e.preventDefault, code).toHaveBeenCalled();
    }
  });

  it('a repeat closes nothing, and Space or Enter is not left to press the focused button', () => {
    for (const code of ['KeyE', 'Space', 'Enter']) {
      const back = vi.fn();
      const e = key(code, true);
      documentPage('Necronomicon', back).keys?.(e);
      expect(back, code).not.toHaveBeenCalled();
      expect(e.preventDefault, code).toHaveBeenCalled();
    }
  });

  it('movement and other keys neither close the page nor are taken from the world', () => {
    for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft']) {
      const back = vi.fn();
      const e = key(code);
      documentPage('Necronomicon', back).keys?.(e);
      expect(back, code).not.toHaveBeenCalled();
      expect(e.preventDefault, code).not.toHaveBeenCalled();
    }
  });
});
