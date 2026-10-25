/**
 * The bodies that leave no mark (round 83; render/traceless.ts): a flyer, a spectre and one that is hidden part no mist, lay no
 * print in soft ground and give no breath or dust, as a body on the ground that is seen does.
 */
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { SIM } from '../src/data/tuning';
import { createCreatureAir } from '../src/render/creatureAir';
import { createCreatureTracks } from '../src/render/creatureTracks';
import { createMistWakes } from '../src/render/mistWakes';
import type { Particles, ParticleSpec } from '../src/render/particles';
import type { PostPass } from '../src/render/postPass';
import { WAKE_SLOTS } from '../src/render/shaders/fog';
import { leavesNone } from '../src/render/traceless';
import { spawnCreature } from '../src/systems/creatures';
import { createWorldGame } from '../src/systems/game';

const post = () => ({ uniforms: { uWakeCount: { value: 0 }, uWakeSeg: { value: Array.from({ length: WAKE_SLOTS }, () => new THREE.Vector4()) }, uWakeInfo: { value: Array.from({ length: WAKE_SLOTS }, () => new THREE.Vector4()) } } }) as unknown as PostPass;

const setup = () => {
  const g = createWorldGame();
  g.overworld!.region = REGIONS.find((r) => r.biome.texture === 'snow')!.id as never;
  const me = g.ecs.c.transform.get(g.player.id)!.pos;
  const ground = spawnCreature(g, 'ghoul', { x: me.x + 4, z: me.z, yaw: 0 })!;
  const flyer = spawnCreature(g, 'winged_hybrid', { x: me.x - 4, z: me.z, yaw: 0 })!;
  const spectre = spawnCreature(g, 'moon_bog_wraith', { x: me.x - 4, z: me.z + 3, yaw: 0 })!;
  const hidden = spawnCreature(g, 'deep_one', { x: me.x - 4, z: me.z - 3, yaw: 0 })!;
  const mine = new Set([ground, flyer, spectre, hidden]);
  for (const [id, brain] of g.ecs.c.brain) if (!mine.has(id)) brain.state = 'hidden'; // (the world's own creatures are put out of the count)
  g.ecs.c.brain.get(hidden)!.state = 'hidden';
  const all = [ground, flyer, spectre, hidden];
  const z0 = new Map(all.map((id) => [id, g.ecs.c.transform.get(id)!.pos.z]));
  const walk = (id: number, step: number): void => { // a pace of 2 m/s along z
    const tr = g.ecs.c.transform.get(id)!;
    const z = z0.get(id)! + step * 0.5;
    tr.pos = { ...tr.pos, z, y: g.world.ground(tr.pos.x, z) };
    tr.prev = { ...tr.pos, z: z - 2 / SIM.hz };
  };
  return { g, me, ground, flyer, spectre, hidden, all, walk };
};

describe('which bodies leave nothing', () => {
  it('is a flyer, a spectre and a hidden one, and not a body on the ground that is seen', () => {
    const s = setup();
    expect(leavesNone(s.g, s.ground)).toBe(false);
    for (const id of [s.flyer, s.spectre, s.hidden]) expect(leavesNone(s.g, id), String(id)).toBe(true);
  });

  it('leaves out of the mist\'s wakes all that leave none', () => {
    const s = setup();
    const out = post();
    const wakes = createMistWakes(s.g);
    for (const id of s.all) {
      const tr = s.g.ecs.c.transform.get(id)!;
      tr.prev = { ...tr.pos, z: tr.pos.z - 2 / SIM.hz };
    }
    wakes.update(out, { x: s.me.x, z: s.me.z }, 1);
    expect(out.uniforms.uWakeCount.value).toBe(1); // the one on the ground
  });

  it('leaves out of the prints in soft ground, and of the breath in the cold, all that leave none', () => {
    const s = setup();
    const scene = new THREE.Scene();
    const prints = createCreatureTracks(scene, s.g);
    const mesh = scene.children[0] as THREE.InstancedMesh;
    const puffs: ParticleSpec[] = [];
    const air = createCreatureAir(s.g, { spawn: (p: ParticleSpec) => void puffs.push(p), update: () => undefined } as unknown as Particles);
    for (let step = 0; step <= 10; step++) {
      for (const id of s.all) s.walk(id, step);
      prints.update({ x: s.me.x, z: s.me.z }, step * 0.2, 1, false);
    }
    for (let t = 0; t < 12; t += 0.25) air.update(new THREE.Vector3(s.me.x, s.me.y, s.me.z), t, 1, false);
    expect(mesh.count).toBeGreaterThan(0);
    const m = new THREE.Matrix4();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, m);
      expect(m.elements[12]).toBeGreaterThan(s.me.x); // all on the ground creature's side
    }
    const near = (id: number): number => { // the puffs breathed within a body's own reach of where it stands (the people breathe too: they are somewhere else)
      const at = s.g.ecs.c.transform.get(id)!.pos;
      return puffs.filter((p) => Math.hypot(p.x - at.x, p.z - at.z) < 1.5).length;
    };
    expect(near(s.ground)).toBeGreaterThan(0);
    for (const id of [s.flyer, s.spectre, s.hidden]) expect(near(id), String(id)).toBe(0);
  });
});
