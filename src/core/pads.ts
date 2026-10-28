/**
 * The pad in hand (playtest round 13; no pad was heard in the desktop shell): Chromium may list a
 * phantom device first (a virtual pad, a headset's buttons, a wheel's driver), and taking the first
 * connected one read that phantom. The pad chosen is the standard-mapped one used most recently,
 * else any pad used most recently. Round 36: Chromium on macOS lists no pad to the page at all, so the
 * desktop shell reads them natively (SDL2, desktop/padWorker.js) and hands them over its bridge in the
 * Gamepad API's own shape; those are read as the browser's are, the browser's list first.
 */

import { faceSwapped } from './padMap';

/** A pad as the Gamepad API gives it, and as the desktop shell's bridge does. */
interface PadLike {
  readonly index: number;
  readonly id: string;
  readonly connected: boolean;
  readonly mapping: string;
  readonly timestamp: number;
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean; readonly value: number }[];
}
type Source = 'browser' | 'shell';
const STAY_MS = 4000; // a pad used this lately keeps the hand, whichever list is newer: the same pad may be in both

/** What the game reads of a pad: buttons and sticks as the pad reports them, less what it only ever reports at rest. */
export interface PadReading {
  readonly id: string;
  readonly mapping: string;
  readonly axes: readonly number[];
  readonly buttons: readonly { pressed: boolean; value: number }[];
}

/**
 * What is known of each pad seen (round 31: in the desktop shell attacks failed and the investigator
 * walked on alone, and the pad that was wanted was not heard). A pad is not believed until it is used:
 * a button pressed that was not pressed when it was first seen, or a stick moved well off where it
 * lay. Buttons already down when first seen (a trigger that rests at 1, a wheel's pedal) are ignored
 * until let go once, and an axis that lay off centre (a trigger read as a stick) is read from there;
 * none of these can then hold a button down, or push the stick, for ever.
 */
interface Seen {
  rest: number[];
  stuck: Set<number>; // buttons down since first seen, ignored until let go
  armedAt: number; // timestamp of the last real use (0: not yet used)
  raw: number[]; // the axes as last read, and the buttons then down: what a recalibration takes as the pad's rest
  down: number[];
  still: { at: number; v: number }[]; // for each axis, where it has lain and since when (a stick that has drifted lies quite still, a thumb does not)
  trig: Trig[]; // the two triggers' rest, learned apart from a stick's (macOS, below)
}
/**
 * Where a trigger rests, once that is known. `mode` 0 is not yet known, 1 an ordinary pull (the value
 * rises through a half), 2 a rest below zero (a pull rises toward 0), −1 a rest near zero (a pull falls).
 */
interface Trig {
  rest: number;
  mode: -1 | 0 | 1 | 2;
  still: number; // frames a reading near −0.5 has sat, before that may be believed to be its rest
  calm: boolean; // a near-zero sample was seen while the trigger was still unknown
}
const SIT = 12; // long enough that one held sample is not a rest, short of a player reaching for the trigger
const seen = new Map<string, Seen>();
const PUSH = 0.5; // how far off its rest an axis must be to count as used
const DRIFT_MAX = 0.4; // a stick lying still this far or less off its rest has drifted: that is its rest now (further off, it is held)
const DRIFT_MS = 4000; // ...once it has lain so long
const STEADY = 0.015; // and has not moved more than this
let report = '';
let listed = -1; // how many devices the browser lists (-1: it has not been asked)
let blocked = ''; // why it could not be asked
let shellPads = 0; // how many the desktop shell's SDL worker reports
const events: string[] = []; // the pads the browser has said it saw come and go
let shellIds = new Set<string>();
let source: Source | null = null; // the list the pad in hand was last read from
/** The pads the desktop shell reads natively (none on the web, or where its worker could not start). */
function shellList(): PadLike[] {
  try {
    const list = (globalThis as { desktop?: { pads?: () => PadLike[] } }).desktop?.pads?.() ?? [];
    const ids = new Set(list.map((p) => p.id));
    for (const id of ids) if (!shellIds.has(id)) events.push(`connected (shell): ${id}`);
    for (const id of shellIds) if (!ids.has(id)) events.push(`gone (shell): ${id}`);
    shellIds = ids;
    return list.filter((p) => p.connected);
  } catch {
    return [];
  }
}
if (typeof addEventListener === 'function') {
  addEventListener('gamepadconnected', (e) => void events.push(`connected: ${(e as GamepadEvent).gamepad.id} (${(e as GamepadEvent).gamepad.mapping || 'no mapping'})`));
  addEventListener('gamepaddisconnected', (e) => void events.push(`gone: ${(e as GamepadEvent).gamepad.id}`));
}
/** A line for the controls page: what pad is heard, or what to do. */
export const padReport = (): string => report;
/** What the browser itself says of pads, for the controls page (round 33: the desktop shell heard none, and nothing said why). */
export const padFacts = (): string => [blocked ? `the browser refused: ${blocked}` : listed < 0 ? 'not asked yet' : `${listed} device${listed === 1 ? '' : 's'} listed by the browser`, `${shellPads} by the shell's SDL`, ...events.slice(-3)].join(' · ');

const downOf = (p: PadLike): number[] => p.buttons.flatMap((b, i) => (b.pressed || b.value > 0.5 ? [i] : []));

/**
 * A trigger as a pull of 0..1. An ordinary one already says so (`pressed`, or a value past a half).
 * macOS does not. SDL recenters a trigger on the joystick axis's initial state, so one may rest near
 * −0.5 and only reach 0 when pulled, or rest at 0 and fall below it, and `.pressed` (value > 0.6)
 * never trips. The first negative sample is not that rest: a trigger that falls may be seen first
 * while it is held, and taking the hold as the rest inverts it from then on. A negative value is a
 * pull from zero, unless it sits near −0.5, the recentered rest. Safari leaves the button at 0 and
 * puts the trigger on axis 4, at −1 until it is pulled toward 1.
 */
function mendTrigger(t: Trig, b: { pressed: boolean; value: number }, axis: number | undefined, axisRest: number): { pressed: boolean; value: number } {
  const value = Number.isFinite(b.value) ? b.value : 0;
  const axisN = axis !== undefined && Number.isFinite(axis) ? axis : undefined;
  const fromAxis = axisN !== undefined && axisRest < -0.4 ? Math.max(0, (axisN - axisRest) / (1 - axisRest)) : 0;
  if (fromAxis >= 0.12) return { pressed: true, value: Math.min(1, fromAxis) };
  const up = { pressed: false, value: 0 };
  const pulled = (travel: number) => (travel > 0.18 ? { pressed: true, value: Math.min(1, travel / Math.max(0.45, travel)) } : up);
  const ordinary = b.pressed || value > 0.5;
  if (t.mode === 1) return ordinary ? { pressed: true, value: value > 0 ? value : 1 } : up;
  if (t.mode === 2) {
    if (value < t.rest) t.rest = value;
    return pulled(value - t.rest);
  }
  if (t.mode === -1) return value < -0.12 ? pulled(-value) : up;
  if (ordinary) {
    t.mode = 1;
    t.rest = 0;
    return { pressed: true, value: value > 0 ? value : 1 };
  }
  if (value >= -0.05) {
    if (t.still > 0 && t.still < SIT) {
      t.mode = -1;
      t.rest = 0;
    }
    t.calm = true;
    return up;
  }
  if (value > -0.12) return up;
  // Near −0.5 may be the recentered rest. Anything further from it, or a fall after a real zero, is a pull.
  if (t.calm || Math.abs(value + 0.5) > 0.012) {
    t.mode = -1;
    t.rest = 0;
    return pulled(-value);
  }
  t.rest = t.still === 0 ? value : Math.min(t.rest, value);
  t.still++;
  if (t.still >= SIT) t.mode = 2;
  return up;
}

function read(p: PadLike, from: Source, now = performance.now()): { reading: PadReading; used: number } {
  const key = `${from}:${p.index}:${p.id}`;
  let s = seen.get(key);
  if (!s) {
    s = { rest: [...p.axes], stuck: new Set(downOf(p)), armedAt: 0, raw: [...p.axes], down: [], still: p.axes.map((v) => ({ at: now, v })), trig: [{ rest: 0, mode: 0, still: 0, calm: false }, { rest: 0, mode: 0, still: 0, calm: false }] };
    seen.set(key, s);
  }
  [s.raw, s.down] = [[...p.axes], downOf(p)];
  const axes = p.axes.map((v, i) => {
    if (p.mapping === 'standard' && i < 4 && Math.abs(v) < 0.1) s.rest[i] = 0; // a stick seen at centre rests at centre
    const lay = (s.still[i] ??= { at: now, v });
    if (Math.abs(v - lay.v) > STEADY) [lay.at, lay.v] = [now, v];
    else if (i < 4 && now - lay.at > DRIFT_MS && Math.abs(v - (s.rest[i] ?? 0)) < DRIFT_MAX && !s.down.length) s.rest[i] = v; // round 49: a stick that has drifted off centre and lies there is at rest there (it walked the investigator on alone); round 53: not while a button is held (a stick held steady through a sprint is not a stick at rest)
    const r = s.rest[i] ?? 0;
    const d = v - r;
    return Math.abs(r) > 0.3 ? (Math.abs(d) > 0.2 ? d : 0) : Math.abs(r) > 0.02 ? d : v; // an axis that lay off centre is read from where it lay
  });
  const buttons = p.buttons.map((b, i) => {
    const trig = i === 6 ? s.trig[0] : i === 7 ? s.trig[1] : undefined;
    const src = trig ? mendTrigger(trig, b, p.axes[i === 6 ? 4 : 5], s.rest[i === 6 ? 4 : 5] ?? 0) : b;
    const down = src.pressed || src.value > 0.5;
    if (s.stuck.has(i)) {
      if (!down) s.stuck.delete(i);
      return { pressed: false, value: 0 };
    }
    return { pressed: src.pressed, value: src.value };
  });
  const used = buttons.some((b) => b.pressed || b.value > 0.5) || p.axes.some((v, i) => Math.abs(v - (s.rest[i] ?? 0)) > PUSH) ? p.timestamp : 0;
  if (used) s.armedAt = Math.max(s.armedAt, used);
  return { reading: { id: p.id, mapping: p.mapping, axes, buttons }, used: s.armedAt };
}

/** The best of a list's pads: of those used, the standard-mapped one used most recently, else any used most recently. */
type Used = { reading: PadReading; used: number };
function bestOf(list: readonly (PadLike | null)[], from: Source): { best: Used | null; heard: number } {
  let best: Used | null = null;
  let heard = 0;
  for (const p of list) {
    if (!p || !p.connected) continue;
    heard++;
    const r = read(p, from);
    if (!r.used) continue;
    const std = r.reading.mapping === 'standard';
    const bestStd = best?.reading.mapping === 'standard';
    if (!best || (std && !bestStd) || (std === bestStd && r.used > best.used)) best = r;
  }
  return { best, heard };
}

/** The pad in hand: of those used, the standard-mapped one used most recently, else any used most recently; null while none has been touched. */
export function activePad(): PadReading | null {
  let list: (Gamepad | null)[] = [];
  try {
    if (typeof navigator.getGamepads !== 'function') throw new Error('this window has no gamepad interface');
    list = [...navigator.getGamepads()];
    listed = list.filter(Boolean).length;
    blocked = '';
  } catch (e) {
    blocked = e instanceof Error ? e.message : String(e);
    listed = -1;
  }
  const shell = shellList(); // (a page not allowed pads hears none of the browser's, and the shell's still)
  shellPads = shell.length;
  const [web, native] = [bestOf(list, 'browser'), bestOf(shell, 'shell')];
  const [webUsed, nativeUsed] = [web.best, native.best];
  const now = performance.now();
  let best = webUsed ?? nativeUsed;
  if (webUsed && nativeUsed) { // the same pad in both lists: stay with the one in hand (no flipping between two readings of it)
    const stay = source === 'shell' ? nativeUsed : webUsed;
    const other = stay === webUsed ? nativeUsed : webUsed;
    best = now - stay.used < STAY_MS || stay.used >= other.used ? stay : other;
    const [stdWeb, stdNative] = [webUsed.reading.mapping === 'standard', nativeUsed.reading.mapping === 'standard'];
    if (stdWeb !== stdNative) best = stdWeb ? webUsed : nativeUsed; // a pad the browser lists in its own raw order (not 'standard') and the shell reads in the standard one: the standard one, or A and B are the wrong buttons (round 39)
  }
  source = best ? (best === nativeUsed ? 'shell' : 'browser') : null;
  if (best) inHand = best.reading.id;
  const heard = Math.max(web.heard, native.heard); // (the same pad may be in both lists)
  report = best ? `${best.reading.id}${best.reading.mapping === 'standard' ? '' : ' (not a standard layout: some buttons may differ)'}` : heard ? `${heard} controller${heard > 1 ? 's' : ''} found: press a button on the one to use` : '';
  return best ? { ...best.reading, buttons: faceSwapped(best.reading.buttons) as PadReading['buttons'] } : null; // (A and B exchanged when the player's switch is on: core/padMap.ts)
}

/** Takes every pad's sticks, where they lie now, for where they rest (one off by up to `DRIFT_MAX`), and ignores the buttons held now until they are let go: what pausing does, so that a pad that has drifted, or has a button that stuck, is set right by it. */
export function recalibratePads(): void {
  for (const s of seen.values()) {
    s.raw.forEach((v, i) => {
      if (i < 4 && Math.abs(v - (s.rest[i] ?? 0)) < DRIFT_MAX) s.rest[i] = v;
    });
    s.stuck = new Set(s.down);
  }
}

let resync = false;
let inHand = '';
/** The id of the pad last in hand ('' before any): whose buttons the prompts name (ui/glyphs.ts, core/padFamily.ts). */
export const padInHand = (): string => inHand;
/** Buttons held now are not heard by the game until they are let go (a menu closed by the pad's B, or chosen with A). */
export const muteHeldPad = (): void => void (resync = true);
/** Taken once by the game's input: whether it must mute the buttons held now. */
export function takeResync(): boolean {
  const r = resync;
  resync = false;
  return r;
}
