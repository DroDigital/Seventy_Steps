import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES, type MoveDef } from '../src/data/moves';
import { buildFigure, type Figure } from '../src/render/figures';
import { newPose, playerClip, sampleClip } from '../src/render/playerClips';
import { playerStride } from '../src/render/playerPose';
import { pose, type PoseInput } from '../src/render/poses';
import { WEAPON_IDS } from '../src/data/weapons';

const STILL: PoseInput = { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, flinch: 0, rollYaw: 0, time: 0 };
const def = (move: string): MoveDef => (PLAYER_MOVES as Record<string, MoveDef>)[move];
const UP = new THREE.Vector3(0, 1, 0);

/** Whether an object and everything it hangs from is shown. */
const shown = (o: THREE.Object3D | null): boolean => (o ? o.visible && shown(o.parent) : true);

/** Where the right hand is, in the figure's frame, for a move at a frame and a roll's direction. */
function handAt(f: Figure, move: string, frame: number, rollYaw: number): THREE.Vector3 {
  pose(f, { ...STILL, move, def: def(move), frame, rollYaw });
  f.root.updateMatrixWorld(true);
  return f.handR.getWorldPosition(new THREE.Vector3());
}

describe('the investigator posed from his clips (render/playerPose.ts)', () => {
  it('shows the muzzle’s flash on the frames the shot leaves, and only then', () => {
    const f = buildFigure('player');
    const { frame } = def('shoot').shot!;
    const flash = f.flash!.children[0] as THREE.Mesh;
    for (let at = 0; at < def('shoot').frames; at++) {
      pose(f, { ...STILL, move: 'shoot', def: def('shoot'), frame: at });
      expect(shown(flash), `@${at}`).toBe(at >= frame && at < frame + 2);
    }
  });

  it('rolls in the direction he is going, not forward, when he is locked on and rolls aside', () => {
    const f = buildFigure('player');
    const frames = [6, 12, 18, 24, 30];
    for (const yaw of [Math.PI / 2, -Math.PI / 2, Math.PI]) {
      for (const frame of frames) {
        const ahead = handAt(f, 'roll', frame, 0);
        const aside = handAt(f, 'roll', frame, yaw);
        const want = ahead.clone().applyAxisAngle(UP, yaw);
        expect(aside.distanceTo(want), `yaw ${yaw.toFixed(2)} @${frame}`).toBeLessThan(1e-4);
      }
    }
  });

  it('holds a guard\u2019s weapon as the guard clip made it, and tips a carried weapon only when it is not raised', () => {
    const f = buildFigure('player');
    const want = newPose();
    for (const weapon of WEAPON_IDS) {
      const input = { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: true, time: 0.4, weapon };
      expect(playerStride(f, input), weapon).toBe(true);
      sampleClip(playerClip(`${weapon}.guard`)!, input.time * 60, want);
      const [x, y, z, w] = [...want.q.subarray(5 * 4, 5 * 4 + 4)];
      const angle = 2 * Math.acos(Math.min(1, Math.abs(f.handR.quaternion.x * x + f.handR.quaternion.y * y + f.handR.quaternion.z * z + f.handR.quaternion.w * w)));
      expect(angle, `${weapon} guard`).toBeLessThan(2e-3);
    }
    playerStride(f, { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, time: 0.4, weapon: 'rapier' });
    const carried = f.handR.quaternion.clone();
    playerStride(f, { move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, time: 0.4, weapon: 'cane' });
    expect(carried.angleTo(f.handR.quaternion)).toBeGreaterThan(0.5); // the rapier is carried tipped forward
  });

  it('carries every weapon with its point above the ground at every speed of the walk and every step', () => {
    const f = buildFigure('player');
    const low = new THREE.Vector3();
    for (const weapon of WEAPON_IDS) {
      const mesh = f.arms![weapon];
      expect(mesh, weapon).toBeTruthy();
      for (const speed of [0, 0.3, 0.6, 1, 1.4, 2.2, 2.6, 3, 3.5, 4.2, 6.4]) {
        let lowest = Infinity;
        for (let i = 0; i < 48; i++) {
          pose(f, { ...STILL, speed, stride: (i / 48) * 2 * Math.PI, time: 1.3, weapon });
          f.root.updateMatrixWorld(true);
          mesh.traverse((o) => {
            const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
            const at = g?.getAttribute('position');
            for (let v = 0; at && v < at.count; v++) lowest = Math.min(lowest, low.fromBufferAttribute(at, v).applyMatrix4(o.matrixWorld).y);
          });
        }
        expect(lowest, `${weapon} at ${speed} m/s`).toBeGreaterThan(0);
      }
    }
  });

  it('kneels with the weapon in his hand clear of the ground', () => {
    const f = buildFigure('player');
    const low = new THREE.Vector3();
    for (const weapon of WEAPON_IDS) {
      for (let k = 0; k <= 1.0001; k += 0.0625) {
        pose(f, { ...STILL, time: 1.3, weapon, kneel: k });
        f.root.updateMatrixWorld(true);
        let lowest = Infinity;
        f.arms![weapon].traverse((o) => {
          const at = ((o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined)?.getAttribute('position');
          for (let v = 0; at && v < at.count; v++) lowest = Math.min(lowest, low.fromBufferAttribute(at, v).applyMatrix4(o.matrixWorld).y);
        });
        expect(lowest, `${weapon}, kneel ${k.toFixed(4)}`).toBeGreaterThan(0);
      }
    }
  });

  it('kneels with both boots on the ground, not through it, standing or walking as he begins', () => {
    const f = buildFigure('player');
    for (const [speed, stride] of [[0, 0], [1.6, 1.1], [1.6, 3.4]]) {
      for (let k = 0; k <= 1.0001; k += 0.025) {
        pose(f, { ...STILL, speed, stride, time: 3, kneel: k });
        f.root.updateMatrixWorld(true);
        for (const foot of [f.footR, f.footL]) expect(new THREE.Box3().setFromObject(foot).min.y, `speed ${speed} stride ${stride} kneel ${k.toFixed(3)}`).toBeGreaterThan(-0.025);
      }
    }
  });

  it('rolls on a slope without his knees folding while he is upside down', () => {
    const f = buildFigure('player');
    const knees = (slope: number, frame: number): number[] => {
      pose(f, { ...STILL, move: 'roll', def: def('roll'), frame, ground: (x: number, z: number) => slope * (z + 0.3 * x) });
      return [f.kneeR.rotation.x, f.kneeL.rotation.x];
    };
    for (let frame = 0; frame < def('roll').frames; frame++) {
      const [flat, tilted] = [knees(0, frame), knees(0.01, frame)];
      expect(Math.abs(tilted[0] - flat[0]) + Math.abs(tilted[1] - flat[1]), `frame ${frame}`).toBeLessThan(0.15);
    }
  });

  it('turns only the roll: a blow or a backstep takes no yaw', () => {
    const f = buildFigure('player');
    for (const move of ['light1', 'backstep']) {
      const a = handAt(f, move, 8, 0);
      const b = handAt(f, move, 8, 1.2);
      expect(a.distanceTo(b), move).toBeLessThan(1e-6);
    }
  });
});
