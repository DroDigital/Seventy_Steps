import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES, type MoveDef } from '../src/data/moves';
import { WEAPON_IDS } from '../src/data/weapons';
import { buildFigure } from '../src/render/figures';
import { cadence } from '../src/render/gait';
import { pose, type PoseInput } from '../src/render/poses';

const BASE: PoseInput = { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, flinch: 0, rollYaw: 0, time: 0 };
const FRAME = 1 / 60;

/** The lowest point of a figure's weapon in its own frame, where the ground is y = 0. */
function lowest(f: ReturnType<typeof buildFigure>, weapon: string): number {
  f.root.updateMatrixWorld(true);
  const at = new THREE.Vector3();
  let low = Infinity;
  f.arms![weapon].traverse((o) => {
    const points = ((o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined)?.getAttribute('position');
    for (let i = 0; points && i < points.count; i++) low = Math.min(low, at.fromBufferAttribute(points, i).applyMatrix4(o.matrixWorld).y);
  });
  return low;
}

describe('getting up from a rest and walking off (the kneel over his clips)', () => {
  it('turns no part more than a stride’s clip does between frames, and keeps weapon and boots off the floor, as the kneel lets go while he gathers speed', () => {
    const f = buildFigure('player');
    const boots = (): number => Math.min(...[f.footR, f.footL].map((foot) => new THREE.Box3().setFromObject(foot).min.y));
    for (const weapon of WEAPON_IDS) {
      for (const target of [1.6, 4.2]) { // (the kneel lets go at 3 a second and his speed comes at 14: actorViews.ts)
        for (let start = 0; start < 6; start++) {
          let [speed, stride, kneel, time] = [0, (start / 6) * 2 * Math.PI, 1, 0];
          let last: THREE.Quaternion[] | undefined;
          for (let n = 0; n < 120; n++) {
            speed += (target - speed) * Math.min(1, FRAME * 14);
            stride += 2 * Math.PI * cadence(speed) * FRAME;
            kneel = kneel - kneel * Math.min(1, FRAME * 3) < 0.004 ? 0 : kneel - kneel * Math.min(1, FRAME * 3);
            time += FRAME;
            pose(f, { ...BASE, speed, stride, time, kneel, weapon });
            const turned = [f.handR, f.kneeR, f.kneeL, f.legR, f.legL, f.elbowR].map((j) => j.quaternion.clone());
            if (last) turned.forEach((q, i) => expect(q.angleTo(last![i]), `${weapon} to ${target} m/s, part ${i}, step ${n}`).toBeLessThan(0.8)); // (a run's own knee turns 0.54 in a frame)
            last = turned;
            if (kneel > 0) {
              expect(lowest(f, weapon), `${weapon} to ${target} m/s, step ${n}`).toBeGreaterThan(0);
              expect(boots(), `${weapon} to ${target} m/s, step ${n}`).toBeGreaterThan(-0.05);
            }
          }
        }
      }
    }
  });

  it('turns the weapon in his hand smoothly as the stride goes on while he is down', () => {
    const f = buildFigure('player');
    for (const weapon of WEAPON_IDS) {
      for (const speed of [3, 4.2]) {
        for (const kneel of [0.3, 0.6, 0.9]) {
          let last: THREE.Quaternion | undefined;
          for (let stride = 0; stride < 2 * Math.PI; stride += 0.01) {
            pose(f, { ...BASE, speed, stride, time: 1, kneel, weapon });
            if (last) expect(f.handR.quaternion.angleTo(last), `${weapon} at ${speed} m/s, kneel ${kneel}, stride ${stride.toFixed(2)}`).toBeLessThan(0.1);
            last = f.handR.quaternion.clone();
          }
        }
      }
    }
  });

  it('leaves a move to its own clip: a kneel eased in beside a blow, a roll or a shot changes nothing of it', () => {
    const f = buildFigure('player');
    const moves = ['light1', 'heavy1', 'roll', 'backstep', 'shoot', 'parry'] as const;
    for (const move of moves) {
      const def = (PLAYER_MOVES as Record<string, MoveDef>)[move];
      for (const frame of [0, Math.floor(def.frames / 2), def.frames - 1]) {
        pose(f, { ...BASE, move, def, frame });
        const plain = [f.body.position.y, ...[f.kneeR, f.kneeL, f.footR, f.footL, f.legR, f.legL].map((j) => j.quaternion.clone())] as const;
        pose(f, { ...BASE, move, def, frame, kneel: 1 });
        [f.kneeR, f.kneeL, f.footR, f.footL, f.legR, f.legL].forEach((j, i) => expect(j.quaternion.angleTo(plain[i + 1] as THREE.Quaternion), `${move} @${frame} joint ${i}`).toBeLessThan(1e-6));
        expect(f.body.position.y, `${move} @${frame}`).toBeCloseTo(plain[0], 9);
      }
    }
  });
});
