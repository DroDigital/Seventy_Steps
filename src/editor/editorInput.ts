/**
 * The world editor's keys and mouse (round 110, development builds only). Heard before the game's
 * own listeners (capture, on the window), and kept from them while the editor is open, so nothing
 * of the game moves, pauses or takes the mouse; F8 is heard always.
 */

export interface EditorInputHooks {
  active(): boolean;
  toggle(): void;
  /** A key not taken by the flight: whether it did something. */
  command(e: KeyboardEvent): boolean;
  click(x: number, y: number): void;
  /** The right button pressed: whether it is to look about (else it undid a move). */
  right(): boolean;
  look(dx: number, dy: number): void;
  wheel(dy: number): void;
}

const typing = (t: EventTarget | null): boolean => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;

export function wireEditorInput(canvas: HTMLCanvasElement, keys: Set<string>, io: { looking: boolean; mouse: [number, number] }, h: EditorInputHooks): void {
  addEventListener('keydown', (e) => {
    if (e.code === 'F8') {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!e.repeat) h.toggle();
      return;
    }
    if (!h.active()) return;
    e.stopImmediatePropagation(); // nothing of the game hears a key while the editor is open
    if (typing(e.target)) return void (e.code === 'Escape' && (e.target as HTMLElement).blur());
    keys.add(e.code);
    if (!io.looking && h.command(e)) e.preventDefault();
  }, true);
  addEventListener('keyup', (e) => {
    if (!h.active()) return;
    e.stopImmediatePropagation();
    keys.delete(e.code);
  }, true);
  addEventListener('mousedown', (e) => {
    if (!h.active() || e.target !== canvas) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    if (e.button === 2) io.looking = h.right();
    else if (e.button === 0) h.click(e.clientX, e.clientY);
  }, true);
  addEventListener('mouseup', (e) => void (e.button === 2 && (io.looking = false)), true);
  addEventListener('mousemove', (e) => {
    if (!h.active()) return;
    e.stopImmediatePropagation();
    io.mouse = [e.clientX, e.clientY];
    if (io.looking) h.look(e.movementX, e.movementY);
  }, true);
  canvas.addEventListener('wheel', (e) => {
    if (!h.active()) return;
    e.preventDefault();
    h.wheel(e.deltaY);
  }, { passive: false });
}
