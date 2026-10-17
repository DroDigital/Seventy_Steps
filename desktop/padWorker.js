/**
 * The shell's controllers (round 36): navigator.getGamepads() lists nothing in Chromium on macOS
 * (Safari's does), so the pads are read here instead, natively: gamepad-node, the browser's Gamepad
 * API over SDL2, with its standard mapping for every controller and its hot-plugging. This runs in
 * a utility process of its own (main.js starts it), so SDL has a plain Node to run in, and a fault in
 * the native module can stop only the pads, never the game. Its state goes to the main process, which
 * hands it to the page (preload.cjs → core/pads.ts), where the browser's own list, when it has any,
 * is still read first.
 */

import { sameSnapshot, snapshot } from './padSnapshot.js';

// SDL names a pad's face buttons by the labels printed on them where it can (a Nintendo-style pad's A is the one on the right), and the Gamepad API's standard mapping, which the game reads, names them by place: 0 is the bottom one, as on the Xbox pad the game was made for. Without this, such a pad's A and B come out swapped: A backs out of a menu and B chooses. It must be set before SDL starts.
process.env.SDL_GAMECONTROLLER_USE_BUTTON_LABELS = '0';

const port = process.parentPort;
const EVERY_MS = 8; // twice a frame: a press is never older than half of one

try {
  const { GamepadManager, getSdl } = await import('gamepad-node');
  let manager = new GamepadManager();
  let last = [];
  const send = (force = false) => {
    const now = snapshot(manager.getGamepads());
    if (!force && sameSnapshot(now, last)) return;
    last = now;
    port.postMessage({ type: 'pads', pads: now });
  };
  const listen = (m) => {
    m.on('gamepadconnected', () => send(true));
    m.on('gamepaddisconnected', () => send(true));
  };
  listen(manager);
  // A fresh manager reads SDL's current list. The process stays up: replacing it wakes the macOS dock.
  const rescan = () => {
    const sdl = getSdl();
    for (const bus of [sdl.controller, sdl.joystick]) {
      bus.removeAllListeners('deviceAdd');
      bus.removeAllListeners('deviceRemove');
    }
    manager.destroy();
    manager = new GamepadManager();
    listen(manager);
    send(true);
  };
  port.on('message', (event) => {
    const data = event?.data ?? event;
    if (data?.type !== 'rescan') return;
    try { rescan(); } catch { /* a failed look leaves the pads as they are; the process stays */ }
  });
  setInterval(send, EVERY_MS);
  port.postMessage({ type: 'ready' });
} catch (e) {
  port.postMessage({ type: 'unavailable', reason: e instanceof Error ? e.message : String(e) }); // the browser's own pads are all there are
}
