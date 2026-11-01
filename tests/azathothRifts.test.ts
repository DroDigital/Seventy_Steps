import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { ATTACKS, compileAttack } from '../src/data/attacks';
import { st } from '../src/data/entities/kit';
import { getEntity } from '../src/data/registry';
import { createRifts } from '../src/render/rifts';
import { startMove } from '../src/systems/actions';
import { resetFight, setArena } from '../src/systems/bossFight';
import { AZATHOTH_SIGNATURE } from '../src/systems/signatures/azathoth';
import { layMark } from '../src/systems/strikes';
import { calm, bossGame, engage } from './bossHelpers';
import { place, scriptedGame, steps } from './helpers';
import { record } from './worldHelpers';

const rays = ['blind_rays', 'chaos_rays'] as const;
const rifts = ['rift_tentacles', 'rift_cascade'] as const;

describe('Azathoth across the whole fight', () => {
  it('introduces rays and rifts in the first phase and develops both in later phases', () => {
    const phases = getEntity('azathoth')!.bossScript!.phases;
    expect(phases[0].attacks.map((a) => a.id)).toEqual(expect.arrayContaining(['blind_rays', 'rift_tentacles']));
    for (const phase of phases) {
      expect(phase.attacks.some((a) => (rays as readonly string[]).includes(a.id))).toBe(true);
      expect(phase.attacks.some((a) => (rifts as readonly string[]).includes(a.id))).toBe(true);
    }
    expect(phases[3].attacks.map((a) => a.id)).toEqual(expect.arrayContaining(['chaos_rays', 'rift_cascade']));
    for (const id of [...rays, ...rifts]) {
      expect(ATTACKS[id].windup, id).toBeGreaterThanOrEqual(78);
      expect(ATTACKS[id].recovery, id).toBeGreaterThanOrEqual(80);
    }
    for (const id of rifts) {
      const m = ATTACKS[id].marks!;
      expect(m.delay).toBeGreaterThanOrEqual(75);
      expect(ATTACKS[id].recovery).toBeGreaterThanOrEqual(m.delay + (m.count - 1) * m.stagger);
      expect(m.look).toBe('rift');
      expect(ATTACKS[id].power).toBeGreaterThanOrEqual(1.3);
    }
  });

  it.each([0, 1, 2, 3])('the opening rays strike direction %i once, only after the wind-up', (direction) => {
    const { g, player, deepOne } = scriptedGame();
    const a = g.ecs.c.actor.get(deepOne)!;
    a.moves = { ...a.moves, blind_rays: compileAttack('blind_rays', st(500, 50, 20, 3, 1, 5), 1.9) };
    expect(a.moves.blind_rays.track).toBeUndefined();
    expect(a.moves.blind_rays.sweep?.arms).toBe(4);
    place(g, deepOne, 0, 5, 0);
    const angle = direction * Math.PI / 2;
    place(g, player, Math.sin(angle) * 6, 5 + Math.cos(angle) * 6, 0);
    const hits = record(g, 'Hit');
    startMove(a, 'blind_rays');
    steps(g, ATTACKS.blind_rays.windup - 1);
    expect(hits.filter((h) => h.attacker === deepOne)).toHaveLength(0);
    steps(g, ATTACKS.blind_rays.active + 3);
    expect(hits.filter((h) => h.attacker === deepOne && h.target === player)).toHaveLength(1);
  });

  it('opens visible marks well before a damaging tentacle erupts, and clears rifts when the fight resets', () => {
    const b = bossGame('azathoth', undefined, 20);
    const { g, boss, fight } = b;
    const p = g.ecs.c.transform.get(boss)!.pos;
    setArena(g, boss, { x: p.x, z: p.z, radius: 44 });
    engage(b);
    calm(b);
    const hits = record(g, 'Hit');
    const erupted = record(g, 'Erupted');
    startMove(g.ecs.c.actor.get(boss)!, 'rift_tentacles');
    steps(g, ATTACKS.rift_tentacles.windup + 1);
    const marks = [...g.ecs.c.mark].filter(([, m]) => m.owner === boss && m.look === 'rift');
    expect(marks.length).toBeGreaterThanOrEqual(3);
    const [first, mark] = marks.sort((a, b) => a[1].delay - b[1].delay)[0];
    const at = g.ecs.c.transform.get(first)!.pos;
    place(g, g.player.id, at.x, at.z, 0);
    g.ecs.c.health.get(g.player.id)!.immortal = true;
    steps(g, mark.delay - 2);
    expect(erupted.filter((e) => e.by === boss)).toHaveLength(0);
    expect(hits.filter((h) => h.attacker === boss && h.target === g.player.id)).toHaveLength(0);
    steps(g, 4);
    expect(erupted.some((e) => e.by === boss && e.look === 'rift')).toBe(true);
    expect(hits.some((h) => h.attacker === boss && h.target === g.player.id && h.damage > 0)).toBe(true);
    resetFight(g, boss, fight);
    expect([...g.ecs.c.mark.values()].some((m) => m.owner === boss && m.look === 'rift')).toBe(false);
    expect(fight.arenaFloor).toBeUndefined();
  });

  it('holds its noise answer until the current attack and warnings have cleared', () => {
    const b = bossGame('azathoth', undefined, 20);
    const { g, boss, fight } = b;
    engage(b);
    calm(b);
    const at = g.ecs.c.transform.get(g.player.id)!.pos;
    const mark = layMark(g, boss, at, { radius: 2, delay: 80, damage: 20, poise: 20, look: 'rift' });
    const actor = g.ecs.c.actor.get(boss)!;
    startMove(actor, 'blind_rays');
    fight.sig.heed = 1.2;
    fight.sig.rest = 0;
    AZATHOTH_SIGNATURE.step!(g, boss, fight);
    expect(g.ecs.c.mark.size).toBe(1);
    expect(fight.sig.heed).toBeGreaterThan(1);
    g.ecs.despawn(mark);
    AZATHOTH_SIGNATURE.step!(g, boss, fight);
    expect(g.ecs.c.mark.size).toBe(0);
    actor.move = null;
    AZATHOTH_SIGNATURE.step!(g, boss, fight);
    expect(g.ecs.c.mark.size).toBe(1);
    expect(fight.sig.heed).toBe(0);
  });

  it('renders a rift as it opens, then closes and removes it after the mark is gone', () => {
    const { g, deepOne } = scriptedGame();
    const mark = layMark(g, deepOne, { x: 0, z: 2 }, { radius: 2, delay: 90, damage: 20, poise: 10, look: 'rift' });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 3, 10);
    const renderer = createRifts(scene, g);
    renderer.update(0, camera);
    expect(scene.children).toHaveLength(1);
    const mesh = scene.children[0] as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
    const before = mesh.material.uniforms.uOpen.value;
    g.ecs.c.mark.get(mark)!.delay = 30;
    renderer.update(0.5, camera);
    expect(mesh.material.uniforms.uOpen.value).toBeGreaterThan(before);
    g.ecs.despawn(mark);
    renderer.update(1, camera);
    renderer.update(2.1, camera);
    expect(scene.children).toHaveLength(0);
  });
});
