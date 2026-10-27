/**
 * Input (spec §1): keyboard/mouse and the Gamepad API folded into one InputFrame per 60 Hz step.
 * Presses and releases between two steps are latched, so a quick tap is never lost.
 * Mouse: LMB light, Shift+LMB heavy, RMB block, Shift+RMB parry, MMB lock-on, move to look
 * (click to capture) or flick to switch targets. Keys: WASD move, Space dodge (hold: sprint),
 * F revolver (V reloads it), Q lock-on, R West's Reagent (heal), T Laudanum, E interact (rest at an Elder Sign, pass a gate), arrows look
 * (←/→ switch targets). Pad: standard mapping, Souls layout. The keys are the player's to rebind
 * (bindings.ts); whichever device was used last is the one the prompts name (device.ts); look may
 * be inverted (playtest round 12).
 */

import { lockJustAsked, noteLockAsked, noteLockRefused } from './mouseLock';
import { INPUT, SIM } from '../data/tuning';
import { keyLayout, type Action } from './bindings';
import { useDevice } from './device';
import { PAD_BUTTON } from './padMap';
import { activePad, recalibratePads, takeResync } from './pads';

export const BUTTONS = ['light', 'heavy', 'dodge', 'block', 'parry', 'shoot', 'reload', 'lock', 'item', 'heal', 'throw', 'interact', 'mount'] as const;
export type Button = (typeof BUTTONS)[number];
export type Buttons = Record<Button, boolean>;

export interface InputFrame {
  moveX: number; // -1..1, + = right
  moveY: number; // -1..1, + = forward
  lookX: number; // radians this step, + = turn right
  lookY: number; // radians this step, + = look down
  held: Buttons;
  pressed: Buttons; // went down since the last step
  released: Buttons; // went up since the last step
  switchTarget: -1 | 0 | 1; // lock-on: switch to the target on the left / right
}

export const noButtons = (): Buttons => ({
  light: false,
  heavy: false,
  dodge: false,
  block: false,
  parry: false,
  shoot: false,
  reload: false,
  lock: false,
  item: false,
  heal: false,
  throw: false,
  interact: false,
  mount: false,
});

const noFrames = (): Record<Button, number> => Object.fromEntries(BUTTONS.map((b) => [b, 0])) as Record<Button, number>;

export function emptyInput(): InputFrame {
  return { moveX: 0, moveY: 0, lookX: 0, lookY: 0, held: noButtons(), pressed: noButtons(), released: noButtons(), switchTarget: 0 };
}

/** The buttons the keyboard presses, by the action whose key presses them. */
const KEYED: readonly (readonly [Action, Button])[] = [['dodge', 'dodge'], ['shoot', 'shoot'], ['reload', 'reload'], ['lock', 'lock'], ['heal', 'heal'], ['item', 'item'], ['throw', 'throw'], ['interact', 'interact'], ['mount', 'mount']];
const keyButton = (code: string): Button | undefined => KEYED.find(([a]) => keyLayout[a] === code)?.[1];
/** Standard-mapping pad: RB light, RT heavy, LB block, LT parry, B dodge, X revolver, d-pad left its reload, Y Reagent, d-pad down Laudanum, d-pad up a flask of oil, R3 lock-on, A interact. */
const PAD: Readonly<Record<Button, number>> = { light: PAD_BUTTON.rb, heavy: PAD_BUTTON.rt, block: PAD_BUTTON.lb, parry: PAD_BUTTON.lt, dodge: PAD_BUTTON.b, shoot: PAD_BUTTON.x, reload: PAD_BUTTON.left, lock: PAD_BUTTON.r3, heal: PAD_BUTTON.y, item: PAD_BUTTON.down, throw: PAD_BUTTON.up, interact: PAD_BUTTON.a, mount: PAD_BUTTON.l3 };

/** The buttons the game reads as held (guard, and the dodge that sprints): every other acts on its press alone, so one that stays down for seconds is stuck. */
const HOLDS: ReadonlySet<Button> = new Set<Button>(['dodge', 'block']);
const STUCK_FRAMES = SIM.hz * 2;
/**
 * A key that has been heard to repeat and then says nothing for this long is no longer down (a held key repeats within two seconds at the slowest
 * setting, and goes on). Only the key pressed last is repeated by the system: the others, though held, fall silent from the moment another is
 * pressed, so silence says nothing of them (round 53: a run held on W, then sprinting on Space, stopped dead three and a half seconds in).
 */
const SILENT_MS = 3500;
/** A window that is left and returned to within this long (a notification, an overlay, a stolen focus) has not let go of what the hand held. */
const BLIP_MS = 400;
/** Which bit of a mouse event's `buttons` each button of its `button` is. */
const MOUSE_BIT: Readonly<Record<number, number>> = { 0: 1, 1: 4, 2: 2 };
const isMeta = (code: string): boolean => code === 'MetaLeft' || code === 'MetaRight';

interface PadState {
  id: string;
  lx: number;
  ly: number;
  rx: number;
  ry: number;
  buttons: Buttons;
}

function readPad(): PadState | null {
  const pad = activePad();
  if (!pad) return null;
  const axis = (i: number): number => {
    const v = pad.axes[i] ?? 0;
    return Math.abs(v) < INPUT.deadzone ? 0 : v;
  };
  const buttons = noButtons();
  for (const b of BUTTONS) {
    const btn = pad.buttons[PAD[b]];
    buttons[b] = !!btn && (btn.pressed || btn.value > 0.5);
  }
  return { id: pad.id, lx: axis(0), ly: -axis(1), rx: axis(2), ry: axis(3), buttons };
}

export interface InputDevice {
  poll(): InputFrame;
  /** Lets go of every key and button as if none were down, and takes the pads' sticks, where they lie, for their rest (pausing does it: a stuck key or a drifted stick is set right by it). */
  reset(): void;
  /** What is held and what the pad says, in words, for the frame meter (F3): a player who is walking on alone can say what it hears. */
  describe(): string;
  sensitivity: number; // look speed multiplier (the settings menu)
  invertY: boolean; // up looks down (the settings menu)
}

/** `free`: whether the mouse may look about while the pointer is not captured (no menu has the screen): round 39. */
export function createInput(canvas: HTMLCanvasElement, free: () => boolean = () => false): InputDevice {
  const keys = new Map<string, number>(); // the keys down, and when each last said so (a press or a repeat)
  const repeats = new Set<string>(); // the keys heard to repeat: only those can be told to be let go by their silence (a key whose repeats are off, or whose repeats the system takes, says nothing while held)
  const held = noButtons(); // keyboard + mouse
  const down = noButtons(); // latched since the last poll
  const up = noButtons();
  const mouseButtons = new Map<number, Button>();
  let prevPad = noButtons();
  const muted = new Set<Button>(); // pad buttons held as a menu closed: unheard until let go
  let mouseX = 0;
  let mouseY = 0;
  let flick = 0;
  let flickCooldown = 0;
  let stickArmed = true;
  let keySwitch: -1 | 0 | 1 = 0;
  const heldFor = noFrames();
  let lastPad: PadState | null = null;

  const press = (b: Button): void => {
    if (!held[b]) down[b] = true;
    held[b] = true;
  };
  const release = (b: Button): void => {
    if (held[b]) up[b] = true;
    held[b] = false;
  };
  const captured = (): boolean => document.pointerLockElement === canvas;
  /** The request alone: a key held down asks again with each repeat, and a repeat must not keep the mouse held back (round 91). */
  const request = (): void => {
    try {
      const r: unknown = canvas.requestPointerLock();
      if (r instanceof Promise) r.catch(() => undefined);
    } catch {
      // Pointer lock unavailable: mouse look stays off, arrows and pads still work.
      noteLockRefused(); // a throw brings no pointerlockerror, so the ask ends here, as a refusal ends it in the listener below
    }
  };
  /** Asks the browser for the mouse, and marks the ask: the movement reported before the grant is no look (the mousemove handler). */
  const capture = (): void => {
    noteLockAsked();
    request();
  };

  addEventListener('keydown', (e) => {
    if (e.metaKey && !isMeta(e.code)) return; // a Command shortcut (on macOS a key pressed with Command is never heard to rise, so one taken for the game stays down): not the game's
    if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    if (e.code !== 'Escape' && !captured()) (e.repeat ? request : capture)(); // a key is a gesture the browser takes as leave to capture the mouse: coming back from a menu, the first key press takes it (round 39)
    keys.set(e.code, performance.now()); // held, even by a repeat: a key held down through a menu or a talk walks on once it closes (round 17)
    if (e.repeat) return void repeats.add(e.code);
    repeats.clear(); // a key newly pressed takes the system's repeating from the rest: they are silent now, and still held (round 53)
    useDevice('keys');
    const b = keyButton(e.code);
    if (b) press(b);
    if (e.code === 'ArrowLeft') keySwitch = -1;
    else if (e.code === 'ArrowRight') keySwitch = 1;
  });
  addEventListener('keyup', (e) => {
    if (isMeta(e.code)) return letGo(); // keys let go while Command was down were never heard to rise (a key still held says so again with its next repeat)
    keys.delete(e.code);
    repeats.delete(e.code);
    const b = keyButton(e.code);
    if (b) release(b);
  });
  function letGo(): void { // a key or button let go while the window was elsewhere is never heard to rise: nothing is held on leaving it, or on coming back (round 31)
    keys.clear();
    mouseButtons.clear();
    for (const b of BUTTONS) release(b);
  }
  /** A button the page thinks is down but the mouse says is up: its release was never heard (let go over another window, or under a screenshot's overlay). */
  const reconcile = (e: MouseEvent): void => {
    if (typeof e.buttons !== 'number') return;
    for (const [btn, b] of mouseButtons) {
      if (e.buttons & (MOUSE_BIT[btn] ?? 0)) continue;
      mouseButtons.delete(btn);
      release(b);
    }
  };
  /** What was held when the window was left, for the moment it is back (a blip: round 53). */
  let away: { at: number; keys: string[]; mouse: [number, Button][]; held: Buttons } | null = null;
  const leave = (): void => {
    away ??= { at: performance.now(), keys: [...keys.keys()], mouse: [...mouseButtons], held: { ...held } };
    letGo();
  };
  const comeBack = (): void => {
    const was = away;
    if (!was) return; // (a return is often two events, visibilitychange and focus: the second finds nothing saved, and must not let go of what the first gave back; and a focus with no blur before it held nothing to let go)
    away = null;
    letGo();
    if ( performance.now() - was.at > BLIP_MS) return; // a long absence: nothing is held on coming back (round 31)
    const now = performance.now(); // a short one (a notification, an overlay, focus taken and given back) is not a hand let go: the run goes on, the sprint with it
    for (const code of was.keys) keys.set(code, now);
    for (const [btn, b] of was.mouse) mouseButtons.set(btn, b);
    for (const b of BUTTONS) if (was.held[b]) held[b] = true;
  };
  addEventListener('blur', leave);
  addEventListener('focus', comeBack);
  document.addEventListener('visibilitychange', () => (document.visibilityState === 'hidden' ? leave() : comeBack()));
  canvas.addEventListener('mousedown', (e) => {
    useDevice('keys');
    reconcile(e);
    if (!captured()) capture();
    const b: Button | undefined =
      e.button === 0 ? (e.shiftKey ? 'heavy' : 'light') : e.button === 2 ? (e.shiftKey ? 'parry' : 'block') : e.button === 1 ? 'lock' : undefined;
    if (!b) return;
    e.preventDefault();
    mouseButtons.set(e.button, b);
    press(b);
  });
  addEventListener('mouseup', (e) => {
    const b = mouseButtons.get(e.button);
    if (!b) return;
    mouseButtons.delete(e.button);
    release(b);
  });
  canvas.style.cursor = 'none'; // the world has no pointer; the menus draw their own (ui/cursor.ts)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  let settleUntil = 0; // when a mouse just granted has settled (INPUT.lockSettleMs)
  document.addEventListener('pointerlockchange', () => {
    if (!captured()) return;
    settleUntil = performance.now() + INPUT.lockSettleMs; // (round 60: opening the map lets the mouse go, closing it takes it again, and the first movement the browser reports with it can be the cursor's jump to the middle: the camera turned to another view)
    mouseX = mouseY = flick = 0;
  });
  document.addEventListener('pointerlockerror', () => noteLockRefused()); // a request the browser refuses ends its wait at once: the mouse looks about free as it did (round 87)
  addEventListener('mousemove', (e) => {
    reconcile(e);
    if (!captured() && !free()) return; // (not captured, and the game in play: the mouse looks about all the same, till a key or a click takes it)
    if (!captured() && lockJustAsked(INPUT.lockAskMs)) return; // (asked for and not yet granted: a move reported then, such as the cursor's warp to the middle on the grant, is no look; the wait ends at the grant, at a refusal, or after lockAskMs; round 87)
    if (performance.now() < settleUntil) return;
    mouseX += e.movementX;
    mouseY += e.movementY;
  });

  const key = (code: string): number => (keys.has(code) ? 1 : 0);
  /** Lets go of the keys that were heard to repeat and have been silent: a release that was never heard (round 49). */
  const expire = (now: number): void => {
    for (const [code, at] of keys) {
      if (!repeats.has(code) || now - at < SILENT_MS) continue;
      keys.delete(code);
      const b = keyButton(code);
      if (b) release(b);
    }
  };

  const device: InputDevice = {
    sensitivity: 1,
    invertY: false,
    reset() {
      away = null;
      letGo();
      muted.clear();
      recalibratePads();
    },
    describe() {
      const pad = lastPad;
      const [keyed, clicked] = [[...keys.keys()].join(' '), [...mouseButtons.values()].join(' ')];
      const stick = pad ? `L ${pad.lx.toFixed(2)} ${pad.ly.toFixed(2)} · R ${pad.rx.toFixed(2)} ${pad.ry.toFixed(2)}` : '';
      const buttons = pad ? BUTTONS.filter((b) => pad.buttons[b]).join(' ') : '';
      return `keys ${keyed || '-'} · mouse ${clicked || '-'}\npad ${pad ? `${pad.id.slice(0, 40)} ${stick}${buttons ? ` · ${buttons}` : ''}` : 'none heard'}`;
    },
    poll() {
      const dt = 1 / SIM.hz;
      expire(performance.now());
      const pad = readPad();
      lastPad = pad;
      const f = emptyInput();
      if (pad && (Object.values(pad.buttons).some(Boolean) || Math.hypot(pad.lx, pad.ly, pad.rx, pad.ry) > 0)) useDevice('pad');

      let mx = key(keyLayout.right) - key(keyLayout.left);
      let my = key(keyLayout.forward) - key(keyLayout.back);
      const len = Math.hypot(mx, my);
      if (len > 1) [mx, my] = [mx / len, my / len];
      if (pad && Math.hypot(pad.lx, pad.ly) > Math.hypot(mx, my)) [mx, my] = [pad.lx, pad.ly];
      f.moveX = mx;
      f.moveY = my;

      const kx = key('ArrowRight') - key('ArrowLeft');
      const ky = key('ArrowDown') - key('ArrowUp');
      const k = device.sensitivity;
      f.lookX = k * (mouseX * INPUT.mouseSensitivity + (kx * INPUT.keyLookSpeed + (pad?.rx ?? 0) * INPUT.stickLookSpeed) * dt);
      f.lookY = (device.invertY ? -k : k) * (mouseY * INPUT.mouseSensitivity + (ky * INPUT.keyLookSpeed + (pad?.ry ?? 0) * INPUT.stickLookSpeed) * dt);

      // Target switching: arrow presses, a mouse flick, or a right-stick flick.
      let sw = keySwitch;
      flick = flick * INPUT.flickDecay + mouseX;
      if (flickCooldown > 0) flickCooldown--;
      else if (Math.abs(flick) > INPUT.flickPixels) {
        sw ||= flick > 0 ? 1 : -1;
        flick = 0;
        flickCooldown = INPUT.flickCooldown;
      }
      const rx = pad?.rx ?? 0;
      if (stickArmed && Math.abs(rx) > INPUT.stickFlick) {
        sw ||= rx > 0 ? 1 : -1;
        stickArmed = false;
      } else if (Math.abs(rx) < INPUT.stickRearm) stickArmed = true;
      f.switchTarget = sw;
      keySwitch = 0;
      mouseX = 0;
      mouseY = 0;

      const padHeld = { ...(pad?.buttons ?? noButtons()) };
      if (takeResync()) for (const b of BUTTONS) if (padHeld[b]) muted.add(b);
      for (const b of muted) {
        if (padHeld[b]) padHeld[b] = false;
        else muted.delete(b);
      }
      for (const b of BUTTONS) {
        if (HOLDS.has(b) || !(held[b] || padHeld[b])) heldFor[b] = 0;
        else if (++heldFor[b] > STUCK_FRAMES) { // an action that acts on its press, down for seconds, is stuck (a release not heard, a pad's button that glitched): let go, and heard again when pressed afresh
          release(b);
          for (const [btn, v] of mouseButtons) if (v === b) mouseButtons.delete(btn);
          if (padHeld[b]) {
            padHeld[b] = false;
            muted.add(b);
          }
          heldFor[b] = 0;
        }
        f.held[b] = held[b] || padHeld[b];
        f.pressed[b] = down[b] || (padHeld[b] && !prevPad[b]);
        f.released[b] = up[b] || (!padHeld[b] && prevPad[b]);
        down[b] = false;
        up[b] = false;
      }
      prevPad = padHeld;
      return f;
    },
  };
  return device;
}
