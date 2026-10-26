import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PLAYER_MOVES } from '../src/data/moves';
import { SIM } from '../src/data/tuning';
import { lookOf } from '../src/render/creatureViews';
import { creatureModel } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';
import {
  attackFrame, directionForAngle, lastFrame, loopFrame, reactionFrame,
  resolveDirectionalClip, spriteDirection, viewAngle, type DirectionalClips,
} from '../src/render/sprites/directional';

const radians = (degrees: number): number => degrees * Math.PI / 180;
const ORIGIN = { x: 0, z: 0 };
const renderedActor = () => {
  const g = createGame({ creature: 'deep_one' });
  const id = [...g.ecs.c.model].find(([, model]) => model === creatureModel('deep_one'))![0];
  const actor = g.ecs.c.actor.get(id)!;
  actor.moves = PLAYER_MOVES;
  actor.move = null;
  return { g, id, actor, transform: g.ecs.c.transform.get(id)! };
};

describe('camera-relative reviewed creature sprites', () => {
  it('faces the camera with front, opposite with back, and chooses the correct profiles', () => {
    expect(spriteDirection(0, ORIGIN, { x: 0, z: 4 })).toBe('front');
    expect(spriteDirection(0, ORIGIN, { x: 0, z: -4 })).toBe('back');
    expect(spriteDirection(0, ORIGIN, { x: 4, z: 0 })).toBe('left');
    expect(spriteDirection(0, ORIGIN, { x: -4, z: 0 })).toBe('right');
    expect(spriteDirection(Math.PI / 2, ORIGIN, { x: 4, z: 0 })).toBe('front');
    expect(spriteDirection(Math.PI / 2, ORIGIN, { x: -4, z: 0 })).toBe('back');
    expect(spriteDirection(Math.PI / 2, ORIGIN, { x: 0, z: 4 })).toBe('right');
    expect(spriteDirection(Math.PI / 2, ORIGIN, { x: 0, z: -4 })).toBe('left');
  });

  it('makes each selected profile point in the projected world heading, using a real camera', () => {
    const origin = new THREE.Vector3(0, 0, 0);
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const heading = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
      for (const sign of [-1, 1]) {
        const perpendicular = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        camera.position.copy(perpendicular.multiplyScalar(sign * 5));
        camera.lookAt(origin);
        camera.updateMatrixWorld(true);
        camera.updateProjectionMatrix();
        const projectedHeading = heading.clone().project(camera).x - origin.clone().project(camera).x;
        expect(Math.abs(projectedHeading)).toBeGreaterThan(0.1);
        expect(spriteDirection(yaw, origin, camera.position)).toBe(projectedHeading < 0 ? 'left' : 'right');
      }
    }
  });

  it('uses creature-to-camera bearing regardless of creature position or wrapped yaw', () => {
    const creature = { x: 7, z: -8 };
    const camera = { x: 11, z: -8 };
    expect(viewAngle(Math.PI * 5 / 2, creature, camera)).toBeCloseTo(0);
    expect(spriteDirection(-Math.PI * 3 / 2, creature, camera)).toBe('front');
    expect(viewAngle(2, creature, creature)).toBe(0);
  });

  it('prevents front/profile and rear/profile flicker at all four boundaries', () => {
    expect(directionForAngle(radians(54), 'front')).toBe('front');
    expect(directionForAngle(radians(56), 'front')).toBe('left');
    expect(directionForAngle(radians(36), 'left')).toBe('left');
    expect(directionForAngle(radians(34), 'left')).toBe('front');
    expect(directionForAngle(radians(-54), 'front')).toBe('front');
    expect(directionForAngle(radians(-56), 'front')).toBe('right');
    expect(directionForAngle(radians(-36), 'right')).toBe('right');
    expect(directionForAngle(radians(-34), 'right')).toBe('front');
    expect(directionForAngle(radians(144), 'left')).toBe('left');
    expect(directionForAngle(radians(146), 'left')).toBe('back');
    expect(directionForAngle(radians(126), 'back')).toBe('back');
    expect(directionForAngle(radians(124), 'back')).toBe('left');
    expect(directionForAngle(radians(-144), 'right')).toBe('right');
    expect(directionForAngle(radians(-146), 'right')).toBe('back');
    expect(directionForAngle(radians(-126), 'back')).toBe('back');
    expect(directionForAngle(radians(-124), 'back')).toBe('right');
    expect(directionForAngle(radians(-179), 'back')).toBe('back');
    expect(directionForAngle(radians(179), 'back')).toBe('back');
  });

  it('honors authored right frames and the explicit single-mirror flag', () => {
    const clips: DirectionalClips<number> = {
      front: { attack: { frames: [1, 2, 3, 4], mirror_horizontal: false }, hurt: { frames: [5, 6], mirror_horizontal: false } },
      left: { move: { frames: [10, 11, 12, 13], mirror_horizontal: false } },
      right: { move: { frames: [20, 21, 22, 23], mirror_horizontal: false } },
    };
    expect(resolveDirectionalClip(clips, 'right', 'move')).toBe(clips.right!.move);
    clips.right!.move = { frames: clips.left!.move!.frames, mirror_horizontal: true };
    expect(resolveDirectionalClip(clips, 'right', 'move')).toEqual({ frames: [10, 11, 12, 13], mirror_horizontal: true });
    expect(resolveDirectionalClip(clips, 'back', 'attack')).toBe(clips.front!.attack);
    expect(resolveDirectionalClip(clips, 'right', 'hurt')).toBe(clips.front!.hurt);
    expect(resolveDirectionalClip(clips, 'back', 'move')).toBeUndefined();
  });

  it.each([2, 4, 6, 8])('plays every %i-frame walk pose in order and wraps directly to the first', (count) => {
    expect(Array.from({ length: count }, (_, i) => loopFrame((i + 0.5) / count, count))).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(loopFrame(1 - 1e-6, count)).toBe(count - 1);
    expect(loopFrame(1, count)).toBe(0);
    expect(loopFrame(-1e-6, count)).toBe(count - 1);
    expect(loopFrame(125.5, count)).toBe(Math.floor(count / 2));
  });

  it('keeps normalized foot phase when a direction has a different accepted frame count', () => {
    expect([4, 6, 8].map((n) => loopFrame(0.51, n))).toEqual([2, 3, 4]);
    expect(loopFrame(0.9, 4, 1.25)).toBe(2);
    expect(loopFrame(1.25, 4, 1.25)).toBe(0);
  });

  it('keeps the original three attack beats aligned to the unchanged simulation windows', () => {
    expect(attackFrame(8, 32, 9, 13, 3)).toBe(0);
    expect(attackFrame(9, 32, 9, 13, 3)).toBe(1);
    expect(attackFrame(12, 32, 9, 13, 3)).toBe(1);
    expect(attackFrame(13, 32, 9, 13, 3)).toBe(2);
    expect(attackFrame(31, 32, 9, 13, 3)).toBe(2);
  });

  it.each([3, 4, 6, 8])('uses every authored %i-frame attack pose without changing attack duration', (count) => {
    const timeline = Array.from({ length: 90 }, (_, frame) => attackFrame(frame, 90, 30, 60, count));
    expect([...new Set(timeline)]).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(timeline[29]).toBe(Math.floor(count / 3) - 1);
    expect(timeline[30]).toBe(Math.floor(count / 3));
    expect(timeline[60]).toBe(Math.floor(count * 2 / 3));
    expect(attackFrame(200, 90, 30, 60, count)).toBe(count - 1);
  });

  it.each([2, 4])('plays all %i hurt poses once and holds the last for a completed reaction or death', (count) => {
    const timeline = Array.from({ length: 34 }, (_, frame) => reactionFrame(frame, 34, count));
    expect([...new Set(timeline)]).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(reactionFrame(100, 34, count)).toBe(count - 1);
    expect(reactionFrame(-1, 34, count)).toBe(0);
    expect(lastFrame(count)).toBe(count - 1);
  });
});

describe('authored counts in the live creature state selector', () => {
  it.each([2, 4])('uses every authored %i-frame idle pose and returns directly to idle_0', (count) => {
    const { g, id } = renderedActor();
    const frames = Array.from({ length: count }, (_, i) => lookOf(g, id, 1.25 * (i + 0.5) / count, { idle: count })!.frame);
    expect(frames).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(lookOf(g, id, 1.25, { idle: count })).toMatchObject({ state: 'idle', frame: 0 });
  });

  it.each([2, 4, 6, 8])('uses the accepted %i-frame movement count while an actor walks or evades', (count) => {
    const { g, id, actor, transform } = renderedActor();
    transform.pos.x = transform.prev.x + 1 / SIM.hz;
    const frames = Array.from({ length: count }, (_, i) => lookOf(g, id, (i + 0.5) / count, { move: count })!);
    expect(frames.map((look) => look.frame)).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(frames.every((look) => look.state === 'move')).toBe(true);
    expect(lookOf(g, id, 1 - 1e-6, { move: count })!.frame).toBe(count - 1);
    expect(lookOf(g, id, 1, { move: count })!.frame).toBe(0);
    actor.move = 'evade';
    expect(lookOf(g, id, 0.5 - 1e-6, { move: count })).toMatchObject({ state: 'move', frame: count - 1 });
    expect(lookOf(g, id, 0.5, { move: count })).toMatchObject({ state: 'move', frame: 0 });
  });

  it.each([3, 4])('plays every %i-frame attack pose and keeps the damaging beat on its simulation window', (count) => {
    const { g, id, actor } = renderedActor();
    actor.move = 'light1';
    const frames = Array.from({ length: PLAYER_MOVES.light1.frames }, (_, frame) => {
      actor.frame = frame;
      const look = lookOf(g, id, 100, { attack: count })!;
      expect(look.state).toBe('attack');
      expect(look.frame).toBeLessThan(count);
      expect(look.lash === 1).toBe(frame >= 9 && frame < 13);
      return look.frame;
    });
    expect([...new Set(frames)]).toEqual(Array.from({ length: count }, (_, i) => i));
    expect(frames[8]).toBe(0);
    expect(frames[9]).toBe(1);
    expect(frames[12]).toBe(1);
    expect(frames[13]).toBe(2);
    actor.frame = 12;
    actor.frozen = true;
    expect(lookOf(g, id, 200, { attack: count })).toEqual(lookOf(g, id, 400, { attack: count }));
  });

  it.each([2, 4])('plays every %i-frame reaction pose and uses the final hurt pose throughout death', (count) => {
    const { g, id, actor } = renderedActor();
    for (const move of ['stagger', 'guardBreak', 'parried']) {
      actor.move = move;
      const frames = Array.from({ length: actor.moves[move].frames }, (_, frame) => {
        actor.frame = frame;
        return lookOf(g, id, 0, { hurt: count })!.frame;
      });
      expect([...new Set(frames)]).toEqual(Array.from({ length: count }, (_, i) => i));
    }
    actor.move = 'death';
    for (const share of [0, 0.5, 1]) {
      actor.frame = actor.moves.death.frames * share;
      expect(lookOf(g, id, 0, { hurt: count })).toMatchObject({ state: 'hurt', frame: count - 1, sink: share * 0.4, opacity: 1, dissolve: share });
    }
  });

  it('retains hidden, unrevealed and absent visibility rules for imported art', () => {
    const { g, id } = renderedActor();
    const brain = g.ecs.c.brain.get(id)!;
    brain.state = 'hidden';
    expect(lookOf(g, id, 0, { move: 8 })).toBeNull();
    brain.state = 'idle';
    g.ecs.c.unseen.set(id, { revealed: 0 });
    expect(lookOf(g, id, 0)).toBeNull();
    g.ecs.c.unseen.set(id, { revealed: 1 });
    expect(lookOf(g, id, 0)).not.toBeNull();
    g.ecs.c.layer.set(id, { shown: false, open: 0 });
    expect(lookOf(g, id, 0)).toBeNull();
    g.ecs.c.layer.delete(id);
    g.ecs.c.dead.set(id, true);
    expect(lookOf(g, id, 0)).toBeNull();
  });

  it('keeps the invisible-stalker shimmer and reveals its accepted attack and hurt poses', () => {
    const { g, id, actor } = renderedActor();
    const brain = g.ecs.c.brain.get(id)!;
    brain.def = { ...brain.def, params: { ...brain.def.params, hide: 'invisible' } };
    expect(lookOf(g, id, 0, { idle: 4 })).toMatchObject({ state: 'idle', opacity: 0.2 });
    actor.move = 'light1';
    actor.frame = 9;
    expect(lookOf(g, id, 0, { attack: 4 })).toMatchObject({ state: 'attack', opacity: 1 });
    actor.move = 'stagger';
    expect(lookOf(g, id, 0, { hurt: 4 })).toMatchObject({ state: 'hurt', opacity: 1 });
  });
});
