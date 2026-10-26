import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { arrival } from '../src/data/cutscenes';
import type { GameAudio } from '../src/render/audio/gameAudio';
import type { Particles } from '../src/render/particles';
import { createPresence, jolt, presenceOf } from '../src/render/presence';
import { createWorldGame } from '../src/systems/game';

describe('what a colossus does to the ground (round 26)', () => {
  it('is felt the nearer one stands, to nothing at a height and a half away', () => {
    expect(presenceOf(0, 40)).toBe(1);
    expect(presenceOf(60, 40)).toBe(0);
    expect(presenceOf(30, 40)).toBeCloseTo(0.5);
    expect(presenceOf(-5, 40)).toBe(1); // inside its footprint
  });

  it('a blow\'s jolt shudders and dies away within a second', () => {
    expect(jolt(0.3, -0.1)).toBe(0);
    expect(jolt(0.3, 1.2)).toBe(0);
    const peak = Math.max(...Array.from({ length: 40 }, (_, i) => Math.abs(jolt(0.3, i / 40))));
    expect(peak).toBeGreaterThan(0.2);
    expect(Math.abs(jolt(0.3, 0.9))).toBeLessThan(0.01);
  });

  it('a horror\'s arrival strikes the ground the harder the larger it is, and a colossus is heard calling', () => {
    const sets = (scale: Parameters<typeof arrival>[0]) => arrival(scale, 'X', undefined).beats.filter((b) => b.set).map((b) => b.set);
    expect(sets('person')).toEqual([]);
    expect(sets('giant')).toEqual(['boom']);
    expect(sets('colossal')).toEqual(['boom', 'whale']);
  });
});

describe('the camera\'s jolts (round 83: a footfall is felt after a bigger blow too)', () => {
  it('feels a small jolt once an earlier, stronger one has died away, and not while it is still ringing', () => {
    const g = createWorldGame();
    const presence = createPresence(g, { spawn: () => undefined } as unknown as Particles, { sample: () => undefined } as unknown as GameAudio);
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    const camera = new THREE.PerspectiveCamera();
    const shakeAt = (time: number): number => {
      camera.position.set(0, 0, 0);
      presence.update(camera, time);
      return Math.hypot(camera.position.x, camera.position.y);
    };
    presence.update(camera, 0);
    presence.felt({ x: me.x, y: 0, z: me.z }, 0.28, 70); // a phase's quake, at the investigator's feet
    expect(shakeAt(0.05)).toBeGreaterThan(0.01);
    presence.update(camera, 5);
    presence.felt({ x: me.x, y: 0, z: me.z }, 0.05, 24); // a footfall five seconds on
    expect(shakeAt(5.02)).toBeGreaterThan(0.0005);
    presence.update(camera, 6);
    presence.felt({ x: me.x, y: 0, z: me.z }, 0.28, 70);
    presence.update(camera, 6.1);
    presence.felt({ x: me.x, y: 0, z: me.z }, 0.05, 24); // while the big one rings, a small one is no more than it
    expect(shakeAt(6.15)).toBeGreaterThan(0.01);
    expect(shakeAt(7.5)).toBeLessThan(1e-9); // and all is still after a second
  });
});
