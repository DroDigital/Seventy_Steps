/**
 * The driver's hands on the reins (round 57): what a rider of a horse-drawn rig does with them, as a state the simulation keeps and
 * the picture and the sound both read, like the gait's cycle count (mountGait.ts): at a gallop the reins are slapped on the horse's back,
 * twice to open it and now and then after; stopping is a pull, hard and held till the rig stands, and let go; a turn is a hand drawn
 * to the side it is going. Presentation only: nothing here changes the ride. No Three.js; stepped once a frame by `moveMounted`.
 */
import { hash2 } from '../core/rng';

export const REINS = Object.freeze({
  gallopAt: 8.6, // m/s: with sprint held, above this the driver is urging a gallop (a cruise is 7, a gallop 10.5)
  gallopHeld: 8.0, // and the gallop is over below this
  strikeAt: 0.38, // seconds into a slap the reins come down on the horse's back
  rippleSeconds: 0.34, // the run of the ripple from the hands to the bit
  total: 0.86, // seconds a slap is on the picture: the arms' part and then the ripple's
  again: 0.5, // seconds into a slap the next may begin
  every: Object.freeze([1.15, 2.5] as const), // seconds between slaps at a gallop
  burst: 0.1, // seconds after a gallop begins that the first falls
  brake: -2.5, // m/s²: slowing faster than this is a pull
  hard: 0.55, // how much of a pull is a halt: the snort and the hoof's scrape
  release: 2.2, // per second: how fast the hands let go after the rig stands
  hold: 0.25, // seconds the pull is kept after the braking stops
});

export interface ReinState {
  gallop: boolean;
  /** Seconds since the slap that is under way began; `REINS.total` or more: none. */
  slapAge: number;
  /** Slaps begun since the summon, and landed (the reins on the horse's back: the sound, the ripple). */
  begun: number;
  struck: number;
  /** Seconds to the next slap at a gallop, and how many of a burst are still to give. */
  nextIn: number;
  burst: number;
  /** 0 slack to 1 hauled in: both hands drawn back to the chest. `hold` keeps it while the rig comes to rest. */
  pull: number;
  hold: number;
  /** Hard pulls (halts) since the summon, and the speed the last began at. `recent` is the speed of the last moments (a decaying peak): a rig stopped dead by a wall was going fast a step ago. */
  halts: number;
  recent: number;
  haltSpeed: number;
  pulling: boolean;
  /** -1 (right) to 1 (left): the turn the hands are in. */
  guide: number;
  accel: number;
  lastSpeed: number;
}

export const createReins = (): ReinState => ({ gallop: false, slapAge: REINS.total, begun: 0, struck: 0, nextIn: 0, burst: 0, pull: 0, hold: 0, halts: 0, recent: 0, haltSpeed: 0, pulling: false, guide: 0, accel: 0, lastSpeed: 0 });

const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
const ease = (t: number): number => { const c = clamp(t); return c * c * (3 - 2 * c); };

/** One frame of the hands: `speed` m/s, `yawRate` rad/s (left positive), `sprinting` the gallop held. */
export function stepReins(r: ReinState, dt: number, speed: number, yawRate: number, sprinting: boolean): void {
  if (!(dt > 0)) return;
  r.accel += ((speed - r.lastSpeed) / dt - r.accel) * Math.min(1, dt * 14);
  const was = r.gallop;
  r.gallop = r.gallop ? speed > REINS.gallopHeld : sprinting && speed > REINS.gallopAt;
  if (r.gallop && !was) { r.nextIn = REINS.burst; r.burst = 1; }

  if (r.slapAge < REINS.total) {
    const before = r.slapAge;
    r.slapAge += dt;
    if (before < REINS.strikeAt && r.slapAge >= REINS.strikeAt) r.struck++;
  }
  if (r.gallop && r.pull < 0.15) {
    r.nextIn -= dt;
    if (r.nextIn <= 0 && r.slapAge >= REINS.again) {
      r.slapAge = 0;
      r.begun++;
      if (r.burst > 0) { r.burst--; r.nextIn = 0.3; } else r.nextIn = REINS.every[0] + (REINS.every[1] - REINS.every[0]) * hash2(r.begun, 5, 13);
    }
  }

  r.recent = Math.max(speed, r.recent - dt * 8);
  if (r.accel < REINS.brake && r.recent > 1) {
    r.pull += (clamp(-r.accel / 12, 0.35, 1) - r.pull) * Math.min(1, dt * 20);
    r.hold = REINS.hold;
    if (!r.pulling && r.pull > REINS.hard && r.recent > 2.5) { r.pulling = true; r.halts++; r.haltSpeed = r.recent; }
  } else if (r.hold > 0) r.hold -= dt;
  else r.pull = Math.max(0, r.pull - dt * REINS.release);
  if (r.pull < 0.1) r.pulling = false;

  r.guide += (clamp(yawRate / 1.1, -1, 1) - r.guide) * Math.min(1, dt * 8);
  r.lastSpeed = speed;
}

/** What a slap `age` seconds old shows: the arms raised (`lift`), snapped down (`snap`), and the ripple's place on the reins, 0 at the hands to 1 at the bit (-1: none). */
export function slapAt(age: number): { lift: number; snap: number; ripple: number; arrive: number } {
  if (!(age >= 0) || age >= REINS.total) return { lift: 0, snap: 0, ripple: -1, arrive: 0 };
  const s = REINS.strikeAt;
  const lift = age < s ? ease(age / s) : 1 - ease((age - s) / 0.3) * 0.85 - 0.15 * ease((age - s - 0.3) / 0.2);
  const snap = age < s ? 0 : age < s + 0.1 ? ease((age - s) / 0.1) : 1 - ease((age - s - 0.1) / 0.28);
  const ripple = age < s ? -1 : clamp((age - s) / REINS.rippleSeconds);
  const arrive = ripple < 0 ? 0 : Math.sin(Math.PI * clamp((ripple - 0.7) / 0.3));
  return { lift: clamp(lift), snap: clamp(snap), ripple, arrive };
}
