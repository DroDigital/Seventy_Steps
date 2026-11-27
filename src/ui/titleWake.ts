/**
 * What wakes the title (2026-11-27): any key, click or pad button, heard before any menu is open. The
 * title had a page of its own for this, a pulsing "press any key" under the dark, and it showed for a
 * beat as the dark drew back even when nothing had been pressed (the theme sounding opened it); now
 * nothing stands there, and the only call is the veil's own words, said only when the browser asks
 * for a press. A click that woke it is not also a choice of the menu that comes in under it.
 */

import { activePad } from '../core/pads';

const SWALLOW_MS = 1500; // how long the waking click may take to come, to be kept from the menu

/** Calls `wake` once, on the first key, click or pad button; returns a function that stops listening. */
export function listenForWake(wake: () => void): () => void {
  let done = false;
  let frame = 0;
  let held: Set<number> | null = null; // the pad's buttons held when first read: a press is one pressed since
  const swallow = (e: MouseEvent): void => {
    e.stopPropagation();
    e.preventDefault();
  };
  const stop = (): void => {
    done = true;
    removeEventListener('keydown', onKey, true);
    removeEventListener('pointerdown', onPointer, true);
    cancelAnimationFrame(frame);
  };
  const fire = (): void => {
    if (done) return;
    stop();
    wake();
  };
  function onKey(e: KeyboardEvent): void {
    if (e.repeat || ['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return; // (a modifier alone is a hand on its way somewhere else)
    fire();
  }
  function onPointer(): void {
    addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallow, true), SWALLOW_MS);
    fire();
  }
  const poll = (): void => {
    if (done) return;
    const pad = activePad();
    const down = new Set<number>();
    pad?.buttons.forEach((b, i) => (b.pressed || b.value > 0.5) && down.add(i));
    if (held && [...down].some((i) => !held!.has(i))) return fire();
    held = down;
    frame = requestAnimationFrame(poll);
  };
  addEventListener('keydown', onKey, true);
  addEventListener('pointerdown', onPointer, true);
  frame = requestAnimationFrame(poll);
  return stop;
}
