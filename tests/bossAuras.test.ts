import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { BOSS_AURAS } from '../src/data/bossAuras';
import { getEntity } from '../src/data/registry';
import { createBossAuras } from '../src/render/bossAuras';
import { worldUniforms } from '../src/render/worldMaterial';
import { spawnCreature } from '../src/systems/creatures';
import { createGame, createWorldGame } from '../src/systems/game';

describe('boss-specific visual presences', () => {
  it('assigns distinct motifs only to scripted bosses', () => {
    expect(new Set(Object.values(BOSS_AURAS).map(p => p.style)).size).toBeGreaterThanOrEqual(7);
    for (const id of Object.keys(BOSS_AURAS)) expect(getEntity(id)?.bossScript, id).toBeDefined();
    expect(BOSS_AURAS.cthulhu.style).toBe('tide');
    expect(BOSS_AURAS.hastur.style).toBe('veil');
    expect(BOSS_AURAS.yog_sothoth.style).toBe('geometry');
    expect(BOSS_AURAS.shub_niggurath.style).toBe('bloom');
    expect(BOSS_AURAS.colour_out_of_space.style).toBe('prism');
    expect(BOSS_AURAS.deep_one).toBeUndefined();
  });

  it('follows the interpolated painted body, animates and grows stronger with the fight', () => {
    const g = createGame();
    const id = spawnCreature(g, 'hastur', { x: 0, z: 0, yaw: 0 })!;
    const tr = g.ecs.c.transform.get(id)!;
    tr.prev = { ...tr.pos, x: 2, y: 1, z: 0 };
    tr.pos = { ...tr.pos, x: 6, y: 3, z: 0 };
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(4, 8, 18);
    const scene = new THREE.Scene();
    let deep = 0;
    const auras = createBossAuras(scene, g, () => ({ bottom: 2, top: 12 }), new Map([[id, 8]]), { deep: () => deep, voice: () => 0 });
    auras.update(camera, 1, 0.5);
    const aura = scene.getObjectByName(`boss-aura:${id}`)!;
    expect(aura.userData.style).toBe('veil');
    expect(aura.position.toArray()).toEqual([4, 4, 0]);
    expect(aura.children).toHaveLength(2); // a veil behind the picture and points orbiting it
    const material = (aura.children[0] as THREE.Mesh).material as THREE.ShaderMaterial;
    const before = material.uniforms.uAlpha.value;
    const time = material.uniforms.uTime.value;
    expect(before).toBeGreaterThan(0);
    expect(material.uniforms.uHeight.value).toBe(10);
    deep = 1;
    auras.update(camera, 2, 0.5);
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBe(aura);
    expect(material.uniforms.uTime.value).toBeGreaterThan(time);
    expect(material.uniforms.uAlpha.value).toBeGreaterThan(before);
    const previousMind = worldUniforms.uMind.value;
    try {
      worldUniforms.uMind.value = 0;
      auras.update(camera, 3, 0.5);
      const clear = material.uniforms.uAlpha.value;
      worldUniforms.uMind.value = 1;
      auras.update(camera, 4, 0.5);
      expect(material.uniforms.uAlpha.value).toBeGreaterThan(clear);
    } finally {
      worldUniforms.uMind.value = previousMind;
    }
  });

  it('gives a boss decoy the same kind of presence and phase as its source', () => {
    const g = createGame(), scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
    const boss = spawnCreature(g, 'nyarlathotep', { x: -2, z: 0, yaw: 0 })!;
    const decoy = spawnCreature(g, 'nyarlathotep', { x: 2, z: 0, yaw: 0 })!;
    g.ecs.c.fight.delete(decoy);
    g.ecs.c.phantom.set(decoy, { life: 60, decoy: true });
    g.ecs.c.minion.set(decoy, boss);
    camera.position.set(0, 4, 15);
    const asked: number[] = [];
    const auras = createBossAuras(scene, g, () => ({ bottom: 0, top: 4 }), new Map(), { deep: id => (asked.push(id), 0.5), voice: () => 0 });
    auras.update(camera, 1, 1);
    expect(scene.getObjectByName(`boss-aura:${boss}`)?.userData.style).toBe('chaos');
    expect(scene.getObjectByName(`boss-aura:${decoy}`)?.userData.style).toBe('chaos');
    expect(asked).toEqual([boss, boss]);
  });

  it('does not reveal unroused or hidden bosses and removes their effects when absent or distant', () => {
    const g = createWorldGame();
    const id = spawnCreature(g, 'yog_sothoth', { x: 0, z: 0, yaw: 0 })!;
    const fight = g.ecs.c.fight.get(id)!;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 8, 20);
    const auras = createBossAuras(scene, g, () => ({ bottom: 0, top: 10 }), new Map(), { deep: () => 0, voice: () => 0 });
    const update = () => auras.update(camera, 1, 1);
    fight.engaged = false;
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeUndefined();
    fight.engaged = true;
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeDefined();
    const brain = g.ecs.c.brain.get(id)!;
    const state = brain.state;
    brain.state = 'hidden';
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeUndefined();
    brain.state = state;
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeDefined();
    camera.position.set(1000, 8, 1000);
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeUndefined();
    camera.position.set(0, 8, 20);
    update();
    g.ecs.c.dead.set(id, true);
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeUndefined();
    g.ecs.c.dead.delete(id);
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeDefined();
    g.ecs.despawn(id);
    update();
    expect(scene.getObjectByName(`boss-aura:${id}`)).toBeUndefined();
  });

  it('bounds the number of simultaneous effects and retains the nearest bosses', () => {
    const g = createGame(), scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
    for (let i = 0; i < 10; i++) spawnCreature(g, 'hastur', { x: i * 2, z: 0, yaw: 0 });
    camera.position.set(0, 5, 8);
    const auras = createBossAuras(scene, g, () => ({ bottom: 0, top: 8 }), new Map(), { deep: () => 0, voice: () => 0 });
    auras.update(camera, 1, 1);
    const shown = scene.children.filter(o => o.name.startsWith('boss-aura:'));
    expect(shown).toHaveLength(8);
    expect(Math.max(...shown.map(o => o.position.x))).toBe(14);
  });
});
