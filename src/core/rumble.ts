/**
 * The controller's rumble (2026-11-03): pulses laid over one another and sent to the pad in hand. The
 * Gamepad API plays one effect at a time (a new one cuts the last), so the pulses live here, are mixed
 * to one pair of motor strengths a frame (`mixAt`, pure: the loudest of each motor), and the pair is sent
 * when it changes, or again before the last send runs out, each send short so that a game that stops
 * (a hidden tab, a pause) stops the motors too. The browser's pads are reached through their
 * `vibrationActuator`; the desktop shell's, read natively, through its bridge (desktop/padWorker.js).
 */

import { RUMBLE, type PulseSpec } from '../data/rumble';
import { padTarget } from './pads';

export interface Pulse extends PulseSpec {
  at: number; // when it begins, in ms (performance.now's clock)
}

/** How hard `p` drives each motor at `now`: nothing before it begins or after it ends; its last `fade` share falls to nothing. */
export function pulseAt(p: Pulse, now: number): [number, number] {
  const t = (now - p.at) / Math.max(1, p.ms);
  if (t < 0 || t >= 1) return [0, 0];
  const fade = p.fade ?? 1;
  const k = fade <= 0 || t < 1 - fade ? 1 : (1 - t) / fade;
  return [p.strong * k, p.weak * k];
}

/** The pair of strengths the pulses make at `now`: the strongest of each motor, never past 1. */
export function mixAt(pulses: readonly Pulse[], now: number): [number, number] {
  let [s, w] = [0, 0];
  for (const p of pulses) {
    const [ps, pw] = pulseAt(p, now);
    [s, w] = [Math.max(s, ps), Math.max(w, pw)];
  }
  return [Math.min(1, s), Math.min(1, w)];
}

type Send = (strong: number, weak: number, ms: number) => void;

interface Actuator {
  playEffect?(type: 'dual-rumble', p: { startDelay: number; duration: number; strongMagnitude: number; weakMagnitude: number }): Promise<unknown>;
  reset?(): Promise<unknown>;
}

/** Sends a pair to the pad in hand, wherever it is read from; silently nothing where it cannot rumble. */
export const sendToPad: Send = (strong, weak, ms) => {
  const to = padTarget();
  if (!to) return;
  try {
    if (to.source === 'shell') {
      (globalThis as { desktop?: { rumble?: (index: number, strong: number, weak: number, ms: number) => void } }).desktop?.rumble?.(to.index, strong, weak, ms);
      return;
    }
    const pad = navigator.getGamepads?.()[to.index] as (Gamepad & { vibrationActuator?: Actuator }) | null | undefined;
    const act = pad?.vibrationActuator;
    if (!act?.playEffect) return;
    const done = strong <= 0 && weak <= 0 && act.reset ? act.reset() : act.playEffect('dual-rumble', { startDelay: 0, duration: ms, strongMagnitude: strong, weakMagnitude: weak });
    void done?.catch?.(() => undefined); // a newer effect cuts this one short: that is not a fault
  } catch {
    // no rumble here
  }
};

export interface Rumbler {
  /** Adds a pulse beginning `delay` ms from `now`, at `scale` of its strength (the setting is applied in `update`). */
  add(spec: PulseSpec, now: number, scale?: number, delay?: number): void;
  /** Mixes the pulses at `now` and sends the pair, times `gain` (the setting; 0 stops the motors), when it is worth sending. */
  update(now: number, gain: number): void;
  /** Lets go of every pulse and stops the motors. */
  stop(now: number): void;
  readonly live: number;
}

export function createRumbler(send: Send = sendToPad): Rumbler {
  let pulses: Pulse[] = [];
  let [lastS, lastW, sentAt] = [0, 0, -Infinity];
  const r: Rumbler = {
    get live() {
      return pulses.length;
    },
    add(spec, now, scale = 1, delay = 0) {
      if (scale <= 0 || spec.ms <= 0) return;
      pulses.push({ ...spec, strong: Math.min(1, spec.strong * scale), weak: Math.min(1, spec.weak * scale), at: now + delay });
    },
    update(now, gain) {
      pulses = pulses.filter((p) => now < p.at + p.ms);
      const [s, w] = mixAt(pulses, now).map((v) => Math.min(1, v * Math.max(0, gain))) as [number, number];
      const off = s < 0.01 && w < 0.01;
      const wasOff = lastS < 0.01 && lastW < 0.01;
      if (off && wasOff) return;
      const changed = Math.abs(s - lastS) >= RUMBLE.step || Math.abs(w - lastW) >= RUMBLE.step || off !== wasOff;
      if (!changed && now - sentAt < RUMBLE.every) return;
      send(off ? 0 : s, off ? 0 : w, off ? 0 : RUMBLE.hold);
      [lastS, lastW, sentAt] = [off ? 0 : s, off ? 0 : w, now];
    },
    stop(now) {
      pulses = [];
      r.update(now, 0);
    },
  };
  return r;
}
