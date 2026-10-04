import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ACTS, SEATED } from '../src/data/npcActs';
import { NPCS } from '../src/data/npcs';
import { npcFigure } from '../src/render/npcFigures';
import { pipeBeat } from '../src/render/npcActs';
import { pose } from '../src/render/poses';

const input = (kind: (typeof ACTS)[string]['kind'], k: number, time: number) => ({ move: null, def: undefined, frame: 0, speed: 0, stride: 0, guard: false, flinch: 0, rollYaw: 0, time, act: { kind, k } });

/** The lowest point of a foot, in the figure's own frame (the figure stands at the origin). */
function sole(f: ReturnType<typeof npcFigure>): number {
  f.root.updateMatrixWorld(true);
  return Math.min(...[f.footR, f.footL].map((j) => new THREE.Box3().setFromObject(j).min.y));
}

describe('the people at what they do (round 39)', () => {
  const kinds = NPCS.filter((n) => !n.creature).map((n) => [n.id, ACTS[n.id].kind] as const);

  it('every act poses every joint to a number, at every moment of its cycle and every share of it', () => {
    for (const [id, kind] of kinds) {
      const f = npcFigure(id);
      for (let t = 0; t < 60; t += 0.37) {
        for (const k of [0, 0.3, 1]) {
          pose(f, input(kind, k, t));
          for (const j of [f.torso, f.head, f.armR, f.armL, f.elbowR, f.elbowL, f.handR, f.handL, f.legR, f.legL, f.kneeR, f.kneeL, f.footR, f.footL]) {
            expect(Number.isFinite(j.rotation.x + j.rotation.y + j.rotation.z), `${id} ${kind} t=${t}`).toBe(true);
          }
          expect(Number.isFinite(f.body.position.y), id).toBe(true);
        }
      }
    }
  });

  it('those who sit sit low, with their feet on the ground; those who stand stand', () => {
    for (const [id, kind] of kinds) {
      const f = npcFigure(id);
      pose(f, input(kind, 1, 3));
      if (SEATED.has(kind)) expect(f.body.position.y, id).toBeLessThan(f.hip - 0.3);
      else expect(f.body.position.y, id).toBeGreaterThan(f.hip - 0.12);
      const low = sole(f);
      expect(Math.abs(low), `${id} ${kind} sole at ${low.toFixed(2)}`).toBeLessThan(0.16);
    }
  });

  it('what they hold and sit on is hidden until they are at it, and shown then', () => {
    const f = npcFigure('zadok'); // sits, and holds a bottle
    const shown = (): number => {
      let n = 0;
      f.root.traverse((o) => o instanceof THREE.Mesh && o.visible && (o.parent === f.handR || o.parent === f.root) && n++);
      return n;
    };
    pose(f, { ...input('drink', 0, 0), act: undefined });
    const before = shown();
    pose(f, input('drink', 1, 1));
    expect(shown()).toBeGreaterThan(before);
  });
});

describe('Peaslee and Morgan at their places (round 39)', () => {
  it('Peaslee has a chair and a table set where he is put, and a book; Morgan a pipe with its bowl and a mouth to draw it at', () => {
    const peaslee = npcFigure('peaslee');
    expect(peaslee.fixture?.children.length).toBeGreaterThan(1);
    const morgan = npcFigure('morgan');
    expect(morgan.pipe && morgan.mouth).toBeTruthy();
    expect(morgan.fixture).toBeUndefined();
  });

  it('the pipe is drawn on and let out for a good part of each cycle, never both at once', () => {
    let drawn = 0;
    let out = 0;
    for (let t = 0; t < 15; t += 0.1) {
      const b = pipeBeat(t);
      if (b.draw > 0.5) drawn++;
      if (b.out > 0.5) out++;
      expect(Math.min(b.draw, b.out), `t=${t}`).toBeLessThan(0.3);
    }
    expect(drawn).toBeGreaterThan(20);
    expect(out).toBeGreaterThan(8);
  });

  it('a seated reader sits on the chair: the thighs level, the soles on the ground', () => {
    const f = npcFigure('peaslee');
    pose(f, input('read', 1, 3));
    expect(Math.abs(sole(f))).toBeLessThan(0.2);
  });
});
