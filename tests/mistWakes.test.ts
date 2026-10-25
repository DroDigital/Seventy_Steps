/**
 * The low mist parts for what moves through it (round 78; render/mistWakes.ts, shaders/fog.ts, data/fxTuning.ts MIST_WAKES): the
 * investigator's body first, then the nearest bodies in sight; none that is still, hidden, unseen or far; the shader carves the mist
 * along each trail and turns it about the edge.
 */
import { describe, expect, it } from 'vitest';
import { MIST_WAKES } from '../src/data/fxTuning';
import { SIM } from '../src/data/tuning';
import { createMistWakes, wakeOf } from '../src/render/mistWakes';
import type { PostPass } from '../src/render/postPass';
import { FOG_GLSL, WAKE_SLOTS } from '../src/render/shaders/fog';
import { createGame } from '../src/systems/game';
import { spawnCreature } from '../src/systems/creatures';
import * as THREE from 'three';

const post = () => ({ uniforms: { uWakeCount: { value: 0 }, uWakeSeg: { value: Array.from({ length: WAKE_SLOTS }, () => new THREE.Vector4()) }, uWakeInfo: { value: Array.from({ length: WAKE_SLOTS }, () => new THREE.Vector4()) } } }) as unknown as PostPass;

describe('a wake', () => {
  it('is none for a body that is still, and grows with its pace', () => {
    expect(wakeOf(0, 0, 1, 0, MIST_WAKES.minSpeed - 0.01, 0.4, 1.8)).toBeNull();
    const walk = wakeOf(0, 0, 1, 0, 1.5, 0.4, 1.8)!;
    const run = wakeOf(0, 0, 1, 0, MIST_WAKES.fullSpeed, 0.4, 1.8)!;
    expect(run.info[1]).toBeGreaterThan(walk.info[1]);
    expect(run.info[1]).toBeCloseTo(MIST_WAKES.strength, 5);
    expect(walk.info[1]).toBeGreaterThan(0);
  });

  it('trails behind the body, no longer than its most, and is as broad as the body but never past its limits', () => {
    const fast = wakeOf(10, 4, 0, 1, 12, 0.4, 1.8)!;
    expect(fast.seg.slice(0, 2)).toEqual([10, 4]);
    expect(fast.seg[2]).toBe(10);
    expect(fast.seg[3]).toBeCloseTo(4 - MIST_WAKES.trailMost, 5);
    expect(wakeOf(0, 0, 1, 0, 2, 0.01, 1)!.info[0]).toBe(MIST_WAKES.radius[0]);
    expect(wakeOf(0, 0, 1, 0, 2, 40, 40)!.info[0]).toBe(MIST_WAKES.radius[1]);
    expect(wakeOf(0, 0, 1, 0, 2, 0.4, 40)!.info[2]).toBe(MIST_WAKES.height);
  });
});

describe('the wakes laid each frame', () => {
  const setup = () => {
    const g = createGame();
    const move = (id: number, x: number, z: number, speed: number): void => {
      const tr = g.ecs.c.transform.get(id)!;
      tr.pos = { ...tr.pos, x, z };
      tr.prev = { ...tr.pos, x: x - speed / SIM.hz, z };
    };
    return { g, move, wakes: createMistWakes(g), out: post() };
  };

  it('lays the investigator\'s first, then the nearest moving bodies, and leaves out the still, the hidden and the far', () => {
    const { g, move, wakes, out } = setup();
    const near = spawnCreature(g, 'deep_one', { x: 6, z: 0, yaw: 0 })!;
    const nearer = spawnCreature(g, 'ghoul', { x: 3, z: 0, yaw: 0 })!;
    const still = spawnCreature(g, 'mi_go', { x: 4, z: 0, yaw: 0 })!;
    const far = spawnCreature(g, 'gug', { x: 400, z: 0, yaw: 0 })!;
    const hidden = spawnCreature(g, 'deep_one', { x: 5, z: 1, yaw: 0 })!;
    g.ecs.c.brain.get(hidden)!.state = 'hidden';
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    move(g.player.id, me.x, me.z, 3);
    move(near, 6, 0, 3);
    move(nearer, 3, 0, 3);
    move(still, 4, 0, 0);
    move(far, 400, 0, 3);
    move(hidden, 5, 1, 3);
    wakes.update(out, { x: 0, z: 0 }, 1);
    expect(out.uniforms.uWakeCount.value).toBe(3);
    expect((out.uniforms.uWakeSeg.value as THREE.Vector4[])[0].x).toBeCloseTo(me.x, 5); // the investigator's
    expect((out.uniforms.uWakeSeg.value as THREE.Vector4[])[1].x).toBeCloseTo(3, 5); // then the nearer
    expect((out.uniforms.uWakeSeg.value as THREE.Vector4[])[2].x).toBeCloseTo(6, 5);
  });

  it('lays no more than there are slots, and none on a frame where nothing moves', () => {
    const { g, move, wakes, out } = setup();
    for (let i = 0; i < 14; i++) move(spawnCreature(g, 'ghoul', { x: 2 + i, z: 3, yaw: 0 })!, 2 + i, 3, 2);
    wakes.update(out, { x: 0, z: 0 }, 1);
    expect(out.uniforms.uWakeCount.value).toBe(WAKE_SLOTS);
    for (const id of g.ecs.c.body.keys()) move(id, g.ecs.c.transform.get(id)!.pos.x, g.ecs.c.transform.get(id)!.pos.z, 0);
    wakes.update(out, { x: 0, z: 0 }, 1);
    expect(out.uniforms.uWakeCount.value).toBe(0);
  });
});

describe('the mist shader', () => {
  it('clears the low mist along each trail and turns the noise about its edge, only while a body is moving', () => {
    expect(FOG_GLSL).toMatch(/uniform vec4 uWakeSeg\[8\]/);
    expect(FOG_GLSL).toMatch(/uniform vec4 uWakeInfo\[8\]/);
    expect(FOG_GLSL).toMatch(/uWakeCount > 0 && low > 1e-4 \? wakeAt\(p\)/);
    expect(FOG_GLSL).toMatch(/low \*= 1\.0 - wake\.x/);
    expect(FOG_GLSL).toMatch(/uFogDrift\.x \+ wake\.y/);
    expect(WAKE_SLOTS).toBe(MIST_WAKES.slots);
  });
});
