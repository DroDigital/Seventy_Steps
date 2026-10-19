/**
 * The driver's hands on the reins (round 57): slaps at a gallop, a pull to stop, a hand drawn into a turn: the state the simulation
 * keeps (systems/mountReins.ts), what the arms and the reins' ripple make of it, and a ride through the real movement system.
 */
import { describe, expect, it } from 'vitest';
import { emptyInput } from '../src/core/input';
import { MOUNT_QUEST, MOUNT_TRAVERSAL as T } from '../src/data/mounts';
import { QUESTS } from '../src/data/quests';
import { SIM } from '../src/data/tuning';
import { teleport } from '../src/systems/checkpoints';
import type { Game } from '../src/systems/components';
import { createWorldGame } from '../src/systems/game';
import { REINS, createReins, slapAt, stepReins, type ReinState } from '../src/systems/mountReins';
import { controlMount, selectMount, toggleMount } from '../src/systems/mounts';
import { movementSystem } from '../src/systems/movement';

const DT = 1 / SIM.hz;

/** The speeds a rig comes through: accelerate (or brake) toward `to` at `rate` m/s², then hold, for `seconds`. */
function ride(r: ReinState, plan: { to: number; seconds: number; rate?: number; sprint?: boolean; yaw?: number }[], from = 0): number {
  let speed = from;
  for (const leg of plan) {
    for (let i = 0; i < leg.seconds * SIM.hz; i++) {
      const rate = leg.rate ?? (leg.to > speed ? T.acceleration : T.braking);
      speed = leg.to > speed ? Math.min(leg.to, speed + rate * DT) : Math.max(leg.to, speed - rate * DT);
      stepReins(r, DT, speed, leg.yaw ?? 0, leg.sprint ?? false);
    }
  }
  return speed;
}

describe('the hands slap the reins at a gallop (round 57)', () => {
  it('urge the horse into a gallop with two quick slaps, then now and then', () => {
    const r = createReins();
    ride(r, [{ to: T.cruise, seconds: 2 }]);
    expect(r.begun).toBe(0); // a cruise is not urged
    const begun: number[] = [];
    let t = 0, seen = 0;
    let speed: number = T.cruise;
    for (let i = 0; i < 30 * SIM.hz; i++, t += DT) {
      speed = Math.min(T.gallop, speed + T.acceleration * DT);
      stepReins(r, DT, speed, 0, true);
      if (r.begun > seen) { seen = r.begun; begun.push(t); }
    }
    expect(begun[0]).toBeLessThan(0.6); // as the gallop is taken
    expect(begun[1] - begun[0]).toBeGreaterThan(REINS.again - 0.01); // the second of the pair, no sooner than the first is done with
    expect(begun[1] - begun[0]).toBeLessThan(0.9);
    const gaps = begun.slice(2).map((v, i) => v - begun[i + 1]);
    for (const gap of gaps) {
      expect(gap).toBeGreaterThan(REINS.every[0] - 0.02);
      expect(gap).toBeLessThan(REINS.every[1] + 0.05);
    }
    expect(begun.length).toBeGreaterThan(9);
    expect(begun.length).toBeLessThan(30);
    expect(r.struck).toBeGreaterThanOrEqual(r.begun - 1); // each lands, a moment after it begins
  });

  it('a slap lands once, a moment into it, and is always begun by the hand before it is heard', () => {
    const r = createReins();
    ride(r, [{ to: T.gallop, seconds: 1, sprint: true }]);
    const before = r.struck;
    r.slapAge = 0; r.begun++;
    let lands = 0;
    for (let i = 0; i < 2 * SIM.hz; i++) { const was = r.struck; stepReins(r, DT, T.gallop, 0, true); if (r.struck > was) lands++; if (r.slapAge < REINS.strikeAt) expect(r.struck).toBe(before + lands); }
    expect(lands).toBeGreaterThanOrEqual(1);
  });

  it('are not given at a walk or a cruise, or while the horse is being pulled up', () => {
    const r = createReins();
    ride(r, [{ to: 2, seconds: 5 }, { to: T.cruise, seconds: 10 }]);
    expect(r.begun).toBe(0);
    ride(r, [{ to: T.cruise, seconds: 5, sprint: false }], T.cruise);
    expect(r.begun).toBe(0);
    const s = createReins();
    ride(s, [{ to: T.gallop, seconds: 4, sprint: true }, { to: 0, seconds: 2, sprint: true }]);
    const slaps = s.begun;
    ride(s, [{ to: 0, seconds: 5, sprint: true }]);
    expect(s.begun).toBe(slaps); // no slap at a standstill with the stick still down
  });
});

describe('a pull to stop (round 57)', () => {
  it('hauls both hands in as the rig is braked from a gallop, holds while it comes to rest, and lets go after', () => {
    const r = createReins();
    ride(r, [{ to: T.gallop, seconds: 3, sprint: true }]);
    expect(r.pull).toBe(0);
    let peak = 0, stopped = -1, released = -1;
    let speed: number = T.gallop;
    for (let i = 0; i < 4 * SIM.hz; i++) {
      speed = Math.max(0, speed - T.braking * DT);
      stepReins(r, DT, speed, 0, false);
      peak = Math.max(peak, r.pull);
      if (speed === 0 && stopped < 0) stopped = i * DT;
      if (stopped >= 0 && r.pull < 0.05 && released < 0) released = i * DT;
    }
    expect(r.halts).toBe(1);
    expect(r.haltSpeed).toBeGreaterThan(8);
    expect(peak).toBeGreaterThan(0.9);
    expect(r.pull).toBe(0);
    expect(released - stopped).toBeGreaterThan(REINS.hold); // kept a moment after it stands
    expect(released - stopped).toBeLessThan(1.2);
  });

  it('is gentler for a gentle slowing, and a halt is counted only for a hard one', () => {
    const r = createReins();
    ride(r, [{ to: T.cruise, seconds: 2 }, { to: 4, seconds: 1, rate: 3 }]);
    expect(r.pull).toBeGreaterThan(0.2);
    expect(r.pull).toBeLessThan(0.5);
    expect(r.halts).toBe(0);
    const s = createReins();
    ride(s, [{ to: T.cruise, seconds: 2 }, { to: 0, seconds: 1 }]); // braked to a standstill from a cruise
    expect(s.halts).toBe(1);
    ride(s, [{ to: 0, seconds: 3 }]);
    ride(s, [{ to: 1.5, seconds: 2 }, { to: 0, seconds: 2 }], 0); // a walk stopped is not a haul at the reins
    expect(s.halts).toBe(1);
  });

  it('a rig that meets a wall (its speed gone at once) is hauled up on', () => {
    const r = createReins();
    ride(r, [{ to: T.gallop, seconds: 3, sprint: true }]);
    stepReins(r, DT, 0, 0, true);
    for (let i = 0; i < 5; i++) stepReins(r, DT, 0, 0, true);
    expect(r.pull).toBeGreaterThan(0.9);
    expect(r.halts).toBe(1);
  });
});

describe('a turn draws the inside hand (round 57)', () => {
  it('to the left for a left turn and to the right for a right turn, and lets go as the rig comes straight', () => {
    const r = createReins();
    ride(r, [{ to: T.cruise, seconds: 2, yaw: 1.1 }], T.cruise);
    expect(r.guide).toBeGreaterThan(0.95);
    ride(r, [{ to: T.cruise, seconds: 2, yaw: -1.1 }], T.cruise);
    expect(r.guide).toBeLessThan(-0.95);
    ride(r, [{ to: T.cruise, seconds: 2, yaw: 0 }], T.cruise);
    expect(Math.abs(r.guide)).toBeLessThan(0.02);
  });

  it('is deterministic: the same ride gives the same hands', () => {
    const a = createReins(), b = createReins();
    for (const r of [a, b]) ride(r, [{ to: T.gallop, seconds: 8, sprint: true }, { to: 0, seconds: 2 }]);
    expect(a).toEqual(b);
  });
});

describe('what a slap shows (round 57)', () => {
  it('raises the hands, snaps them down on the strike, and sends a ripple down the reins to the bit', () => {
    expect(slapAt(0)).toEqual({ lift: 0, snap: 0, ripple: -1, arrive: 0 });
    expect(slapAt(REINS.strikeAt).lift).toBeGreaterThan(0.95);
    expect(slapAt(REINS.strikeAt - 0.001).snap).toBe(0);
    expect(slapAt(REINS.strikeAt + 0.1).snap).toBeGreaterThan(0.95);
    expect(slapAt(REINS.strikeAt + 0.1).lift).toBeLessThan(slapAt(REINS.strikeAt).lift);
    let last = -1;
    for (let age = REINS.strikeAt; age < REINS.strikeAt + REINS.rippleSeconds; age += 0.01) { const { ripple } = slapAt(age); expect(ripple).toBeGreaterThanOrEqual(last); last = ripple; }
    expect(slapAt(REINS.strikeAt + REINS.rippleSeconds).arrive).toBeLessThan(0.01); // it has gone
    const arrives = Array.from({ length: 100 }, (_, i) => slapAt(REINS.strikeAt + (REINS.rippleSeconds * i) / 99).arrive);
    expect(Math.max(...arrives)).toBeGreaterThan(0.95);
    expect(arrives.indexOf(Math.max(...arrives))).toBeGreaterThan(70); // at the bit, not the hands
    expect(slapAt(REINS.total)).toEqual({ lift: 0, snap: 0, ripple: -1, arrive: 0 });
    for (let age = -0.2; age < 1.2; age += 0.013) for (const v of Object.values(slapAt(age))) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('riding the world gives the hands their work (round 57)', () => {
  function openGame(): Game {
    const g = createWorldGame();
    g.world = { ground: () => 0, colliders: [], off: new Set(), contain: () => {} };
    teleport(g, { x: 256, z: 240, yaw: 0 });
    g.overworld!.quests.set(MOUNT_QUEST, QUESTS[MOUNT_QUEST].stages.length);
    return g;
  }
  const hold = (g: Game, on: boolean, gallop = false): void => {
    g.camera.yaw = 0;
    const input = emptyInput();
    input.moveY = on ? 1 : 0;
    input.held.dodge = gallop && on;
    input.pressed.dodge = gallop && on && !pressed;
    pressed = gallop && on;
    controlMount(g, input);
  };
  let pressed = false; // the stick is pressed once, then held: as a hand does it

  it('a gallop is slapped, stopping is a pull, and a new summon starts with quiet hands', () => {
    const g = openGame();
    expect(selectMount(g, 'grey')).toBe(true);
    expect(toggleMount(g)).toBe(true);
    for (let i = 0; i < 4.5 * SIM.hz; i++) { hold(g, true, true); movementSystem(g, DT); } // (the open ground runs out some sixty metres on)
    const r = g.player.mount.reins;
    expect(g.player.mount.speed).toBeCloseTo(T.gallop, 0);
    expect(r.gallop).toBe(true);
    expect(r.begun).toBeGreaterThanOrEqual(3);
    expect(r.struck).toBeGreaterThanOrEqual(2);
    const halts = r.halts;
    for (let i = 0; i < 2 * SIM.hz; i++) { hold(g, false); movementSystem(g, DT); }
    expect(g.player.mount.speed).toBe(0);
    expect(g.player.mount.reins.halts).toBe(halts + 1);
    toggleMount(g);
    toggleMount(g);
    expect(g.player.mount.reins).toEqual(createReins());
  });

  it('the motor car has a wheel, not reins: its hands are never worked', () => {
    const g = openGame();
    g.player.mount.automobileOwned = true;
    expect(selectMount(g, 'automobile')).toBe(true);
    expect(toggleMount(g)).toBe(true);
    for (let i = 0; i < 4 * SIM.hz; i++) { hold(g, true, true); movementSystem(g, DT); }
    for (let i = 0; i < 2 * SIM.hz; i++) { hold(g, false); movementSystem(g, DT); }
    expect(g.player.mount.reins).toEqual(createReins());
  });
});
