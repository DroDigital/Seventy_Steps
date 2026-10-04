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
  const { GamepadManager } = await import('gamepad-node');
  const manager = new GamepadManager();
  let last = [];
  const send = (force = false) => {
    const now = snapshot(manager.getGamepads());
    if (!force && sameSnapshot(now, last)) return;
    last = now;
    port.postMessage({ type: 'pads', pads: now });
  };
  manager.on('gamepadconnected', () => send(true));
  manager.on('gamepaddisconnected', () => send(true));
  setInterval(send, EVERY_MS);
  port.postMessage({ type: 'ready' });
} catch (e) {
  port.postMessage({ type: 'unavailable', reason: e instanceof Error ? e.message : String(e) }); // the browser's own pads are all there are
}
