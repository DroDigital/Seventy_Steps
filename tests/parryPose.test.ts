import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES } from '../src/data/moves';
import { skeleton } from '../src/render/figures';
import { pose } from '../src/render/poses';

const figure = () => skeleton('humanoid', { hip: 0.92, shoulder: [0.28, 0.58], hipX: 0.11, neck: [0.64, 0], leg: 0.9, thigh: 0.42, upper: 0.3, fore: 0.28, ankle: 0.07 });
const at = (f: ReturnType<typeof figure>, o: THREE.Object3D): THREE.Vector3 => (f.root.updateMatrixWorld(true), o.getWorldPosition(new THREE.Vector3()));
const posed = (move: string, def: unknown, frame: number) => {
  const f = figure();
  pose(f, { move, def: def as never, frame, speed: 0, stride: 0, guard: false, flinch: 0, rollYaw: 0, time: 0 });
  return f;
};

describe('the parry and the parried (round 46)', () => {
  const parry = PLAYER_MOVES.parry;
  const [p0, p1] = parry.parry!;

  it('the cane is across the face through the window: the hand in front of the chest, near the middle, the blade raised', () => {
    for (let fr = p0 + 1; fr <= p1; fr++) {
      const f = posed('parry', parry, fr);
      const hand = at(f, f.handR);
      expect(hand.z, `frame ${fr}`).toBeGreaterThan(0.25);
      expect(Math.abs(hand.x), `frame ${fr}`).toBeLessThan(0.25);
      expect(hand.y, `frame ${fr}`).toBeGreaterThan(1.0);
      expect(hand.y, `frame ${fr}`).toBeLessThan(1.6);
      const tip = new THREE.Vector3(0, -0.85, 0).applyMatrix4(f.handR.matrixWorld);
      expect(tip.y - hand.y, `frame ${fr}`).toBeGreaterThan(0.3); // the blade points up, not out or down
    }
  });

  it('starts and ends in the guard it came from, and the feet step in while it is held', () => {
    for (const fr of [0, parry.frames - 1]) {
      const f = posed('parry', parry, fr);
      expect(f.armR.rotation.y, `frame ${fr}`).toBeLessThan(0.1);
      expect(f.legR.rotation.x, `frame ${fr}`).toBeGreaterThan(-0.1);
    }
    expect(posed('parry', parry, p0 + 2).legR.rotation.x).toBeLessThan(-0.3);
  });

  it('a parried body is knocked back and then stooped, never dropped to a knee: every joint stays a number, the head above the knees', () => {
    for (let fr = 0; fr < 96; fr += 3) {
      const f = posed('parried', { frames: 96 }, fr);
      for (const j of [f.body, f.torso, f.head, f.armR, f.armL, f.legR, f.legL, f.kneeR, f.kneeL]) expect(Number.isFinite(j.rotation.x + j.rotation.y + j.rotation.z), `frame ${fr}`).toBe(true);
      expect(at(f, f.head).y, `frame ${fr}`).toBeGreaterThan(at(f, f.kneeL).y + 0.5);
    }
    expect(posed('parried', { frames: 96 }, 4).body.rotation.x).toBeLessThan(0); // on its heels
    expect(posed('parried', { frames: 96 }, 40).body.rotation.x).toBeGreaterThan(0.15); // then forward
  });
});
