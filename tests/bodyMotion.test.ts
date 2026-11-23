/**
 * Round 116, the investigator's body answers what truly happens to it: his lantern swings from how his belt moves through the world
 * (render/lanternSwing.ts, lantern.py's pendulum solved live), and a blow rocks him the way it came (render/hitReact.ts).
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { buildFigure, type Figure } from '../src/render/figures';
import { applyHitReact, HIT_REACT, kickByBlow, kickHitReact, newHitReact, reacting, stepHitReact } from '../src/render/hitReact';
import { LANTERN_SWING, newSwing, stepSwing, swingLantern, type Swing } from '../src/render/lanternSwing';
import { pose, type PoseInput } from '../src/render/poses';

const STILL: PoseInput = { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, flinch: 0, rollYaw: 0, time: 0 };

describe("the lantern's pendulum (render/lanternSwing.ts)", () => {
  const push = (s: Swing, seconds: number, ax: number, az: number, hz = 60): Swing => {
    for (let i = 0; i < seconds * hz; i++) stepSwing(s, ax, az, 1 / hz);
    return s;
  };

  it('hangs still when nothing moves it', () => {
    expect(push(newSwing(), 3, 0, 0)).toMatchObject({ x: 0, z: 0, vx: 0, vz: 0 });
  });

  it('lags behind a start, swings on at a stop, and rings down after', () => {
    expect(push(newSwing(), 0.15, 0, 6).z).toBeLessThan(-0.05);
    expect(push(newSwing(), 0.15, 0, -6).z).toBeGreaterThan(0.05);
    const s = push(newSwing(), 0.3, 6, -6);
    push(s, 4, 0, 0);
    expect(Math.abs(s.x) + Math.abs(s.z)).toBeLessThan(0.01);
  });

  it('is stopped by his hip and never swings past its most', () => {
    let [least, most] = [0, 0];
    const s = newSwing();
    for (let i = 0; i < 240; i++) {
      stepSwing(s, 40, 40, 1 / 60); // (pushed hard toward his left: the bob is thrown toward his body)
      least = Math.min(least, s.x);
      most = Math.max(most, Math.abs(s.x), Math.abs(s.z));
    }
    expect(least).toBeGreaterThan(LANTERN_SWING.wall - 0.06);
    expect(most).toBeLessThanOrEqual(LANTERN_SWING.tilt + 1e-9);
  });

  it('swings alike at any frame rate', () => {
    const at = [30, 60, 144].map((hz) => {
      const s = newSwing();
      for (let i = 0; i < 0.4 * hz; i++) stepSwing(s, 0, i / hz < 0.2 ? 7 : -3, 1 / hz);
      return s.z;
    });
    expect(Math.abs(at[0] - at[2])).toBeLessThan(0.02);
    expect(Math.abs(at[1] - at[2])).toBeLessThan(0.01);
  });

  it('survives a bad number and a long stall', () => {
    const s = newSwing();
    stepSwing(s, NaN, Infinity, 1 / 60);
    stepSwing(s, 3, 3, 5);
    expect(Number.isFinite(s.x + s.z + s.vx + s.vz)).toBe(true);
  });
});

describe("the lantern on the investigator's figure", () => {
  /** Where the cage hangs from its pivot, in the world: the lantern group's own downward axis. */
  const hangOf = (f: Figure): THREE.Vector3 => new THREE.Vector3(0, -1, 0).applyQuaternion(f.lantern!.getWorldQuaternion(new THREE.Quaternion()));
  const run = (f: Figure, s: Swing, from: number, frames: number, move: (t: number) => void, still = false): number => {
    let t = from;
    for (let i = 0; i < frames; i++, t += 1 / 60) {
      move(t);
      pose(f, { ...STILL, time: t });
      swingLantern(f, s, t, still);
    }
    return t;
  };

  it('hangs plumb from a still figure, however the torso stands', () => {
    const f = buildFigure('player');
    const s = newSwing();
    run(f, s, 0, 30, () => f.torso.rotation.set(0.3, 0, 0.2));
    expect(hangOf(f).angleTo(new THREE.Vector3(0, -1, 0))).toBeLessThan(1e-3);
  });

  it('lags behind as he sets off at a run, and swings on as he stops dead', () => {
    const f = buildFigure('player');
    const s = newSwing();
    let t = run(f, s, 0, 10, () => {});
    let [z, speed, behind, ahead] = [0, 0, 0, 0];
    for (let i = 0; i < 20; i++) (t = run(f, s, t, 1, () => f.root.position.set(0, 0, (z += (speed = Math.min(6, speed + 0.6)) / 60))), (behind = Math.min(behind, hangOf(f).z))); // up to a run over a sixth of a second
    expect(behind).toBeLessThan(-0.15); // the cage behind the pivot
    for (let i = 0; i < 20; i++) (t = run(f, s, t, 1, () => {}), (ahead = Math.max(ahead, hangOf(f).z)));
    expect(ahead).toBeGreaterThan(0.1); // and thrown ahead when he stops dead
  });

  it('is thrown out of a turn on the spot, and is not shaken by a blow\'s hitstop', () => {
    const f = buildFigure('player');
    const s = newSwing();
    let t = run(f, s, 0, 10, () => {});
    let yaw = 0;
    t = run(f, s, t, 12, () => f.root.rotation.set(0, (yaw += 0.12), 0));
    expect(Math.abs(s.x) + Math.abs(s.z)).toBeGreaterThan(0.03);
    const [held, calm] = [newSwing(), newSwing()];
    const g = buildFigure('player');
    for (let i = 0; i < 30; i++, t += 1 / 60) { // the same pose twice over, one of them shaken in a hitstop
      const shake = i >= 10;
      f.root.position.set(shake ? (Math.random() - 0.5) * 0.07 : 0, 0, shake ? (Math.random() - 0.5) * 0.07 : 0);
      for (const [fig, sw] of [[f, held], [g, calm]] as const) (pose(fig, { ...STILL, time: t }), swingLantern(fig, sw, t, shake));
    }
    expect(Math.abs(held.x - calm.x) + Math.abs(held.z - calm.z)).toBeLessThan(1e-9);
  });
});

describe('a blow rocks the one it lands on (render/hitReact.ts)', () => {
  const peak = (r = newHitReact()): { torso: { x: number; z: number; at: number }; head: { at: number } } => {
    const out = { torso: { x: 0, z: 0, at: 0 }, head: { at: 0 } };
    let [best, headBest] = [0, 0];
    for (let i = 1; i <= 90; i++) {
      stepHitReact(r, 1 / 60);
      const m = Math.hypot(r.torso.x, r.torso.z);
      if (m > best) [best, out.torso] = [m, { x: r.torso.x, z: r.torso.z, at: i / 60 }];
      const hm = Math.hypot(r.head.x, r.head.z);
      if (hm > headBest) [headBest, out.head.at] = [hm, i / 60];
    }
    return out;
  };
  const struck = (from: { x: number; z: number }, outcome: Parameters<typeof kickByBlow>[3] = 'hit', damage = 30) => {
    const r = newHitReact();
    kickByBlow(r, from, { x: 0, z: 0, yaw: 0 }, outcome, damage); // facing +z; his right is −x
    return r;
  };

  it('throws him back from a blow in front, forward from one behind, and away from one at either flank', () => {
    expect(peak(struck({ x: 0, z: 2 })).torso.x).toBeLessThan(-0.08);
    expect(peak(struck({ x: 0, z: -2 })).torso.x).toBeGreaterThan(0.08);
    expect(peak(struck({ x: -2, z: 0 })).torso.z).toBeLessThan(-0.08); // struck from his right: thrown to his left
    expect(peak(struck({ x: 2, z: 0 })).torso.z).toBeGreaterThan(0.08);
  });

  it('snaps in a few frames, the head after the torso, and settles with a little give', () => {
    const r = struck({ x: 0, z: 2 });
    const p = peak(newHitReact());
    expect(p.torso.at).toBe(0); // (nothing struck, nothing moves)
    const q = peak(r);
    expect(q.torso.at).toBeGreaterThan(0.04);
    expect(q.torso.at).toBeLessThan(0.15);
    expect(q.head.at).toBeGreaterThan(q.torso.at);
    const s = struck({ x: 0, z: 2 });
    let crossed = false;
    for (let i = 0; i < 90; i++) (stepHitReact(s, 1 / 60), (crossed ||= s.torso.x > 0));
    expect(crossed).toBe(true); // it overshoots, a little...
    expect(Math.abs(s.torso.x) + Math.abs(s.head.x)).toBeLessThan(0.01); // ...and is still in a second and a half
  });

  it('a blow on the guard rocks him less than one that lands, a stagger more, a dodge not at all; and blows piled up never pass the most', () => {
    const size = (o: Parameters<typeof kickByBlow>[3]): number => Math.abs(peak(struck({ x: 0, z: 2 }, o)).torso.x);
    expect(size('dodged')).toBe(0);
    expect(size('blocked')).toBeLessThan(size('hit'));
    expect(size('hit')).toBeLessThan(size('stagger'));
    const r = newHitReact();
    for (let i = 0; i < 30; i++) (kickHitReact(r, -1, 0, 'kill', 2), stepHitReact(r, 1 / 60));
    expect(Math.abs(r.torso.x)).toBeLessThanOrEqual(HIT_REACT.most + 1e-9);
  });

  it('is laid on the figure by turns of its joints, and leaves a figure at rest as posed', () => {
    const f = buildFigure('player');
    pose(f, STILL);
    const [torso, head] = [f.torso.quaternion.clone(), f.head.quaternion.clone()];
    const rest = newHitReact();
    applyHitReact(f, rest);
    expect(f.torso.quaternion.angleTo(torso)).toBe(0);
    const r = struck({ x: 0, z: 2 });
    for (let i = 0; i < 5; i++) stepHitReact(r, 1 / 60);
    expect(reacting(r)).toBe(true);
    applyHitReact(f, r);
    expect(f.torso.quaternion.angleTo(torso)).toBeGreaterThan(0.05);
    expect(f.head.quaternion.angleTo(head)).toBeGreaterThan(0.02);
  });
});
