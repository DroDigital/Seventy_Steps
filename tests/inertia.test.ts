/**
 * Round 116, inertialization (render/inertia.ts, render/poseBlend.ts): a change of pose keeps each joint's speed at the change and comes to
 * rest on the new pose within a moment, with no jump, no frozen frame and no overshoot.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES, type MoveDef } from '../src/data/moves';
import { buildFigure, type Figure } from '../src/render/figures';
import { decayAt, decayOf } from '../src/render/inertia';
import { createPoseBlend, POSE_BLEND, type PoseBlend } from '../src/render/poseBlend';
import { pose, type PoseInput } from '../src/render/poses';

describe('the decay of a difference (render/inertia.ts)', () => {
  const cases: [number, number][] = [[1, 0], [1, -4], [0.4, -30], [2, 5], [0.05, -0.2], [3, -1e3]];
  for (const [x0, v0] of cases) {
    it(`from ${x0} at ${v0}/s: starts where it is, at its speed toward the new pose, and ends at rest without passing through`, () => {
      const d = decayOf(x0, v0, 0.15);
      const h = 1e-8;
      expect(decayAt(d, 0)).toBeCloseTo(x0, 9);
      expect(Math.abs((decayAt(d, h) - decayAt(d, 0)) / h - Math.min(0, v0))).toBeLessThan(0.01 * Math.abs(v0) + 0.05); // a speed away from the pose is not followed
      expect(d.t1).toBeLessThanOrEqual(0.15);
      expect(Math.abs(decayAt(d, d.t1 - 1e-9))).toBeLessThan(1e-6);
      expect(decayAt(d, d.t1 + 0.01)).toBe(0);
      let last = x0;
      for (let t = 0; t <= d.t1; t += d.t1 / 200) {
        const x = decayAt(d, t);
        expect(x).toBeGreaterThanOrEqual(-1e-9); // never past the new pose
        expect(x).toBeLessThanOrEqual(last + 1e-9); // and never back toward the old one
        last = x;
      }
    });
  }

  it('nothing to take away is nothing, and a bad number is no speed', () => {
    expect(decayAt(decayOf(0, -3, 0.15), 0.05)).toBe(0);
    const d = decayOf(1, NaN, 0.15);
    expect(d.v0).toBe(0);
    expect(Number.isFinite(decayAt(d, 0.07))).toBe(true);
  });
});

const STILL: PoseInput = { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, flinch: 0, rollYaw: 0, time: 0 };
const MOVES = PLAYER_MOVES as Readonly<Record<string, MoveDef>>;
const at = (move: string, frame: number, extra: Partial<PoseInput> = {}): PoseInput => ({ ...STILL, move, def: MOVES[move], frame, ...extra });

function draw(f: Figure, blend: PoseBlend, p: PoseInput, time: number): void {
  blend.watch(p.move, p.guard, time, p.frame);
  pose(f, p);
  blend.apply(time);
}

/** The sword arm as the pose alone puts it. */
function armOf(p: PoseInput): THREE.Quaternion {
  const f = buildFigure('player');
  pose(f, p);
  return f.armR.quaternion.clone();
}

describe('a figure carried from one pose into the next (render/poseBlend.ts)', () => {
  it('a joint moving toward its new pose at the change keeps its speed into it, where the crossfade froze it', () => {
    const light = PLAYER_MOVES.light1 as MoveDef;
    const guard = armOf({ ...STILL, guard: true });
    let best = { frame: -1, rate: 0 };
    for (let k = 1; k < light.frames - 1; k++) { // where the sword arm comes back fastest toward the guard's, still far enough off it to keep its speed (nearer, the decay brakes so as not to pass through)
      const [from, to] = [armOf(at('light1', k - 1)).angleTo(guard), armOf(at('light1', k)).angleTo(guard)];
      if (from - to > best.rate && to > 3 * (from - to)) best = { frame: k, rate: from - to };
    }
    expect(best.rate).toBeGreaterThan(0.02);
    const f = buildFigure('player');
    const blend = createPoseBlend(f);
    draw(f, blend, at('light1', best.frame - 1), 0);
    draw(f, blend, at('light1', best.frame), 1 / 60);
    const before = f.armR.quaternion.angleTo(guard);
    draw(f, blend, { ...STILL, guard: true }, 2 / 60); // the guard raised as the arm comes back
    const after = f.armR.quaternion.angleTo(guard);
    expect(before - after).toBeGreaterThan(0.7 * best.rate); // it comes on at the speed it had
    expect(after).toBeGreaterThan(0); // and is not there yet
  });

  it('a second roll out of the first is eased from where the first had him, not jumped to its start', () => {
    const roll = PLAYER_MOVES.roll as MoveDef;
    const start = buildFigure('player');
    pose(start, at('roll', 1));
    let late = { frame: -1, gap: 0 };
    for (let k = Math.floor(roll.frames / 3); k < roll.frames; k++) {
      const g = buildFigure('player');
      pose(g, at('roll', k));
      const gap = g.body.quaternion.angleTo(start.body.quaternion);
      if (gap > late.gap) late = { frame: k, gap };
    }
    expect(late.gap).toBeGreaterThan(0.3); // the two poses are far apart
    const f = buildFigure('player');
    const blend = createPoseBlend(f);
    for (let i = 0; i <= 2; i++) draw(f, blend, at('roll', late.frame - 2 + i), i / 60);
    const end = f.body.quaternion.clone();
    draw(f, blend, at('roll', 1), 3 / 60);
    expect(f.body.quaternion.angleTo(end)).toBeLessThan(0.5 * late.gap); // the first frame of the second is still near where the first had him
    for (let i = 4; i < 20; i++) draw(f, blend, at('roll', i - 2), i / 60);
    const settled = buildFigure('player');
    pose(settled, at('roll', 17));
    expect(f.body.quaternion.angleTo(settled.body.quaternion)).toBeLessThan(1e-6); // and it is the second roll's own within the moment
  });

  it('a figure not drawn for a while takes its new pose at once', () => {
    const f = buildFigure('player');
    const blend = createPoseBlend(f);
    draw(f, blend, at('light1', 8), 0);
    draw(f, blend, { ...STILL, guard: true }, POSE_BLEND.stale + 0.1);
    expect(f.armR.quaternion.angleTo(armOf({ ...STILL, guard: true }))).toBeLessThan(1e-6);
  });

  it('every joint and the pelvis come to rest on the new pose, from any move into any other', () => {
    const moves = ['light1', 'heavy1', 'roll', 'backstep', 'parry', 'shoot', 'stagger'];
    for (const from of moves) {
      for (const to of moves) {
        if (from === to) continue;
        const f = buildFigure('player');
        const blend = createPoseBlend(f);
        const df = MOVES[from];
        for (let i = 0; i < 3; i++) draw(f, blend, at(from, Math.floor(df.frames / 2) + i), i / 60);
        let t = 3 / 60;
        for (let k = 0; k < 14; k++, t += 1 / 60) draw(f, blend, at(to, k), t);
        const alone = buildFigure('player');
        pose(alone, at(to, 13));
        expect(f.armR.quaternion.angleTo(alone.armR.quaternion), `${from} → ${to}`).toBeLessThan(1e-6);
        expect(f.body.position.distanceTo(alone.body.position), `${from} → ${to}`).toBeLessThan(1e-6);
      }
    }
  });
});
