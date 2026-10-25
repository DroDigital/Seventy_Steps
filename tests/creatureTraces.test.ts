/**
 * What a walking body leaves and gives the air (round 83; render/creatureTracks.ts, render/creatureAir.ts, data/fxTuning.ts PRINTS, BODY_AIR):
 * prints in soft ground only, at a stride, alternating the feet, by the pace and not for the hidden, the flying or the drowned, nor for
 * the investigator (round 80 lays theirs); a pale breath in the cold and dust from a hard run over dry ground.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BODY_AIR, PRINTS } from '../src/data/fxTuning';
import { REGIONS } from '../src/data/regions';
import { SIM } from '../src/data/tuning';
import { breathGap, createCreatureAir, groundOf } from '../src/render/creatureAir';
import { createCreatureTracks, printAlpha, softGround } from '../src/render/creatureTracks';
import type { Particles, ParticleSpec } from '../src/render/particles';
import { SPRITE_FRAG } from '../src/render/shaders/sprite';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';

const regionOf = (texture: string): string => REGIONS.find((r) => r.biome.texture === texture)!.id;

const setup = (texture: string) => {
  const g = createWorldGame();
  g.overworld!.region = regionOf(texture) as never;
  const scene = new THREE.Scene();
  const prints = createCreatureTracks(scene, g);
  const mesh = scene.children[0] as THREE.InstancedMesh;
  const puffs: ParticleSpec[] = [];
  const particles = { spawn: (p: ParticleSpec) => void puffs.push(p), update: () => undefined } as unknown as Particles;
  const air = createCreatureAir(g, particles);
  /** Walks the body `id` to (x, z) at `speed`, a tick at a time. */
  const walk = (id: number, x: number, z: number, speed: number): void => {
    const tr = g.ecs.c.transform.get(id)!;
    tr.prev = { ...tr.pos };
    tr.pos = { ...tr.pos, x, z, y: g.world.ground(x, z) };
    const k = speed / SIM.hz / Math.max(1e-6, Math.hypot(x - tr.prev.x, z - tr.prev.z));
    tr.prev = { ...tr.pos, x: x - (x - tr.prev.x) * k, z: z - (z - tr.prev.z) * k };
  };
  const walker = (): number => { // a ghoul set down a little way off, to walk about
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    return spawnCreature(g, 'ghoul', { x: me.x + 3, z: me.z, yaw: 0 })!;
  };
  return { g, scene, prints, mesh, air, puffs, walk, walker };
};

describe('a print', () => {
  it('is whole at first, fades over the last of its life, and is gone after it', () => {
    expect(printAlpha(0, 20)).toBe(1);
    expect(printAlpha(20 * (1 - PRINTS.fade) - 0.01, 20)).toBe(1);
    expect(printAlpha(19, 20)).toBeGreaterThan(0);
    expect(printAlpha(19, 20)).toBeLessThan(1);
    expect(printAlpha(20, 20)).toBe(0);
    expect(printAlpha(-1, 20)).toBe(0);
  });

  it('is kept longest in snow, and only soft ground keeps one', () => {
    expect(PRINTS.soft.snow.seconds).toBeGreaterThan(PRINTS.soft.mud.seconds);
    expect(PRINTS.soft.mud.seconds).toBeGreaterThan(PRINTS.soft.sand.seconds);
    expect(softGround(regionOf('snow'))).toBe(PRINTS.soft.snow);
    expect(softGround(regionOf('slab'))).toBeUndefined();
    expect(softGround(null)).toBeUndefined();
  });
});

describe('a body walking in soft ground', () => {
  it('lays a print at each stride, alternating its feet about the way it goes, and none while it stands', () => {
    const { g, prints, mesh, walk, walker } = setup('snow');
    const me = walker();
    const start = g.ecs.c.transform.get(me)!.pos;
    prints.update({ x: start.x, z: start.z }, 0, 1, false); // (seen first)
    expect(mesh.count).toBe(0);
    for (let step = 1; step <= 12; step++) {
      walk(me, start.x, start.z + step * 0.4, 2);
      prints.update({ x: start.x, z: start.z }, step * 0.2, 1, false);
    }
    expect(mesh.count).toBeGreaterThanOrEqual(3);
    expect(mesh.count).toBeLessThanOrEqual(8);
    const [a, b] = [new THREE.Matrix4(), new THREE.Matrix4()];
    mesh.getMatrixAt(0, a);
    mesh.getMatrixAt(1, b);
    expect(Math.sign(a.elements[12] - start.x)).toBe(-Math.sign(b.elements[12] - start.x)); // one to each side
    const before = mesh.count;
    for (let i = 0; i < 20; i++) {
      walk(me, start.x, start.z + 12 * 0.4, 0);
      prints.update({ x: start.x, z: start.z }, 3 + i * 0.1, 1, false);
    }
    expect(mesh.count).toBe(before); // standing leaves none
  });

  it('leaves none on ground that is not soft, or in a room under a roof', () => {
    for (const [texture, enclosed] of [['slab', false], ['snow', true]] as const) {
      const { g, prints, mesh, walk, walker } = setup(texture);
      const me = walker();
      const p = g.ecs.c.transform.get(me)!.pos;
      for (let step = 0; step <= 12; step++) {
        walk(me, p.x, p.z + step * 0.4, 2);
        prints.update({ x: p.x, z: p.z }, step * 0.2, 1, enclosed);
      }
      expect(mesh.count, `${texture} ${enclosed}`).toBe(0);
    }
  });

  it('leaves none for the investigator: round 80 lays theirs', () => {
    const { g, prints, mesh, walk } = setup('snow');
    const me = g.player.id;
    const p = g.ecs.c.transform.get(me)!.pos;
    for (let step = 0; step <= 12; step++) {
      walk(me, p.x, p.z + step * 0.4, 2);
      prints.update({ x: p.x, z: p.z }, step * 0.2, 1, false);
    }
    expect(mesh.count).toBe(0);
  });

  it('leaves none from what is hidden, and a creature near leaves its own', () => {
    const { g, prints, mesh, walk } = setup('mud');
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    const seen = spawnCreature(g, 'ghoul', { x: me.x + 4, z: me.z, yaw: 0 })!;
    const hidden = spawnCreature(g, 'deep_one', { x: me.x - 4, z: me.z, yaw: 0 })!;
    g.ecs.c.brain.get(hidden)!.state = 'hidden';
    for (let step = 0; step <= 10; step++) {
      walk(seen, me.x + 4, me.z + step * 0.5, 2);
      walk(hidden, me.x - 4, me.z + step * 0.5, 2);
      prints.update({ x: me.x, z: me.z }, step * 0.2, 1, false);
    }
    expect(mesh.count).toBeGreaterThan(0);
    for (let i = 0; i < mesh.count; i++) {
      const m = new THREE.Matrix4();
      mesh.getMatrixAt(i, m);
      expect(m.elements[12]).toBeGreaterThan(me.x); // all on the seen one's side
    }
  });

  it('takes over the oldest print once the ring is full', () => {
    const { g, prints, mesh, walk, walker } = setup('snow');
    const me = walker();
    const p = g.ecs.c.transform.get(me)!.pos;
    prints.update({ x: p.x, z: p.z }, 0, 1, false);
    for (let step = 1; step <= PRINTS.capacity * 3; step++) {
      walk(me, p.x, p.z + step * 0.5, 2);
      prints.update({ x: p.x, z: p.z + step * 0.5 }, step * 0.1, 1, false);
    }
    expect(mesh.count).toBe(PRINTS.capacity);
  });
});

describe('what a body gives the air', () => {
  it('breathes a pale cloud in the cold, not in the warm, each body to its own beat', () => {
    const cold = setup('snow');
    const me = cold.g.ecs.c.transform.get(cold.g.player.id)!.pos;
    spawnCreature(cold.g, 'ghoul', { x: me.x + 3, z: me.z, yaw: 0 });
    for (let t = 0; t < 12; t += 0.25) cold.air.update(new THREE.Vector3(me.x, me.y, me.z), t, 1, false);
    expect(cold.puffs.length).toBeGreaterThanOrEqual(4);
    for (const p of cold.puffs) expect(p.color).toEqual(BODY_AIR.breath.color);
    const warm = setup('grass');
    for (let t = 0; t < 12; t += 0.25) warm.air.update(new THREE.Vector3(me.x, me.y, me.z), t, 1, false);
    expect(warm.puffs.length).toBe(0);
    expect(new Set([1, 2, 3, 4, 5].map(breathGap)).size).toBe(5);
    for (const id of [1, 2, 3]) {
      expect(breathGap(id)).toBeGreaterThanOrEqual(BODY_AIR.breathSeconds[0]);
      expect(breathGap(id)).toBeLessThan(BODY_AIR.breathSeconds[1]);
    }
  });

  it('kicks up dust at a hard run over dry ground, not at a walk', () => {
    const { g, air, puffs, walk, walker } = setup('sand');
    const me = walker();
    const p = g.ecs.c.transform.get(me)!.pos;
    let z = p.z;
    for (let t = 0; t < 4; t += 0.1) {
      walk(me, p.x, (z += 0.1), 1.5);
      air.update(new THREE.Vector3(p.x, p.y, z), t, 1, false);
    }
    expect(puffs.length).toBe(0);
    for (let t = 4; t < 8; t += 0.1) {
      walk(me, p.x, (z += 0.1), BODY_AIR.dustSpeed + 1);
      air.update(new THREE.Vector3(p.x, p.y, z), t, 1, false);
    }
    expect(puffs.length).toBeGreaterThanOrEqual(5);
    expect(groundOf(regionOf('snow'))).toEqual({ cold: true, dusty: false });
    expect(groundOf(regionOf('sand'))).toEqual({ cold: false, dusty: true });
  });
});

describe('the creatures in the rain', () => {
  it('are darker in their mid-tones and deeper in colour as the world is soaked, and only then', () => {
    expect(SPRITE_FRAG).toMatch(/uniform float uWet/);
    expect(SPRITE_FRAG).toMatch(/!glow && uWet > 0\.02\) col = mix\(col, col \* col, 0\.35 \* uWet\)/);
  });
});
