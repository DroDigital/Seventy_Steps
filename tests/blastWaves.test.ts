/**
 * Round 116, a blast moves the world about it (render/blastWaves.ts, shaders/blast.ts): its wave runs out over the land and, as its front
 * passes, bends what sways away from its heart, throws the mist out of the ring behind it, gutters a flame and carries the air's motes off.
 */
import * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { BLAST } from '../src/data/groundSkin';
import { addWave, blastAt, BLASTS, createBlastWaves, gutterAt, waveAt, waveLife, writeWaves, type Wave } from '../src/render/blastWaves';
import { AIR_PUSH, createParticles } from '../src/render/particles';
import { BLAST_BEND_GLSL, BLAST_GLSL } from '../src/render/shaders/blast';
import { FOG_GLSL } from '../src/render/shaders/fog';
import { WORLD_VERT } from '../src/render/shaders/world';
import { trample } from '../src/render/trample';
import { worldUniforms } from '../src/render/worldMaterial';
import { createWorldGame } from '../src/systems/game';

const at = (w: Wave, r: number, t: number): number => waveAt(w, w.x + r, w.z, w.t0 + t);

beforeEach(() => {
  BLASTS.waves = [];
  trample.clear();
});

describe("a blast's wave (render/blastWaves.ts)", () => {
  const w: Wave = { x: 10, z: -4, t0: 2, s: 1 };

  it('comes with its front, at its speed, and has gone by once it has passed', () => {
    const r = 8;
    const when = r / BLAST.speed;
    expect(at(w, r, -0.1)).toBe(0); // (not yet gone off)
    expect(at(w, r, when * 0.3)).toBeLessThan(0.05 * at(w, r, when)); // the front not yet come
    expect(at(w, r, when)).toBeGreaterThan(0.3); // at the front
    expect(at(w, r, when + 3 * BLAST.width / BLAST.speed)).toBeLessThan(0.01); // passed by
  });

  it('is strongest near its heart, spent by its reach, and pushes away from where it went off', () => {
    expect(at(w, 2, 2 / BLAST.speed)).toBeGreaterThan(at(w, 12, 12 / BLAST.speed));
    expect(at(w, BLAST.reach, BLAST.reach / BLAST.speed)).toBeLessThan(0.02);
    const out = { x: 0, z: 0 };
    waveAt(w, w.x - 5, w.z + 5, w.t0 + Math.SQRT2 * 5 / BLAST.speed, out);
    expect(out.x).toBeLessThan(0);
    expect(out.z).toBeGreaterThan(0);
    expect(Math.abs(Math.abs(out.x) - Math.abs(out.z))).toBeLessThan(1e-9);
  });

  it('keeps four at most, a new one taking the place of the one with least left in it, and none once spent', () => {
    for (let i = 0; i < 4; i++) addWave({ x: i, z: 0 }, 0.3 + 0.1 * i, i * 0.5);
    addWave({ x: 99, z: 0 }, 0.9, 2);
    expect(BLASTS.waves).toHaveLength(BLAST.slots);
    expect(BLASTS.waves.some((v) => v.x === 99)).toBe(true);
    expect(BLASTS.waves.some((v) => v.x === 0)).toBe(false); // the weakest, the oldest
    addWave({ x: 50, z: 0 }, 0.01, 2.1); // too slight to be a wave
    expect(BLASTS.waves.some((v) => v.x === 50)).toBe(false);
    writeWaves(2 + waveLife() + 2);
    expect(BLASTS.waves).toHaveLength(0);
  });

  it('is written where the shaders read it, an empty slot with no strength', () => {
    addWave({ x: 3, z: 4 }, 0.6, 7);
    writeWaves(7.2);
    const u = worldUniforms.uBlasts.value;
    expect(u[0].toArray()).toEqual([3, 4, 7, 0.6]);
    for (let i = 1; i < BLAST.slots; i++) expect(u[i].w).toBe(0);
  });

  it('a strong one lays the grass at its heart down; a slight one does not', () => {
    trample.recentre(0, 0);
    addWave({ x: 2, z: 1 }, 0.4, 0);
    expect(trample.at(2, 1)).toBe(0);
    addWave({ x: 2, z: 1 }, 1, 0);
    expect(trample.at(2, 1)).toBeGreaterThan(0.5);
  });

  it('gutters a flame as its front passes, and leaves it whole before and after', () => {
    addWave({ x: 0, z: 0 }, 1, 0);
    const r = 5;
    expect(gutterAt(r, 0, 0)).toBeGreaterThan(0.99);
    expect(gutterAt(r, 0, r / BLAST.speed)).toBeLessThan(0.75);
    expect(gutterAt(r, 0, r / BLAST.speed + 1)).toBeGreaterThan(0.99);
    expect(blastAt(r, 0, r / BLAST.speed)).toBeLessThanOrEqual(1.5);
  });
});

describe('what sends a wave out', () => {
  it('a quake, a strike, a burst of marked ground and a horror turning into its next phase do; a muted way, a spent bolt and a small one do not', () => {
    const g = createWorldGame();
    const blasts = createBlastWaves(g);
    const p = { x: 4, y: 0, z: 9 };
    g.events.emit('Quaked', { at: p, by: g.player.id });
    g.events.emit('StrikeLanded', { at: p, radius: 3 });
    g.events.emit('Erupted', { at: p, radius: 2, by: g.player.id });
    blasts.update(10);
    expect(BLASTS.waves.map((w) => w.s)).toEqual([BLAST.of.quake, BLAST.of.strike, BLAST.of.erupt[0] + 2 * BLAST.of.erupt[1]]);
    BLASTS.waves = [];
    g.events.emit('WardLanded', { at: p, radius: 2, look: 'x', mute: true });
    g.events.emit('BoltLanded', { owner: g.player.id, faction: 'enemy', at: p, vel: p, on: 'spent', radius: 3, lob: false, fire: false, conjured: false });
    g.events.emit('BoltLanded', { owner: g.player.id, faction: 'enemy', at: p, vel: p, on: 'ground', radius: 0.3, lob: false, fire: false, conjured: false });
    blasts.update(11);
    expect(BLASTS.waves).toHaveLength(0);
    g.events.emit('BoltLanded', { owner: g.player.id, faction: 'enemy', at: p, vel: p, on: 'ground', radius: 2, lob: true, fire: true, conjured: false });
    g.events.emit('BossPhase', { entity: g.player.id, phase: 1 });
    blasts.update(12);
    expect(BLASTS.waves).toHaveLength(2);
    expect(BLASTS.waves[1].x).toBe(g.ecs.c.transform.get(g.player.id)!.pos.x);
  });
});

describe('the air, the grass and the mist answer it', () => {
  it("carries off a mote of the air, and leaves a blow's mark where it lies", () => {
    const g = createWorldGame();
    createBlastWaves(g);
    addWave({ x: 0, z: 0 }, 1, 0);
    writeWaves(4 / BLAST.speed);
    const out = { x: 0, z: 0 };
    AIR_PUSH.push!(4, 0, out);
    expect(out.x).toBeGreaterThan(BLAST.air * 0.3);
    const scene = new THREE.Scene();
    const particles = createParticles(scene);
    particles.spawn({ x: 4, y: 1, z: 0, color: [1, 1, 1], life: 5, size: 0.1, drift: 1 });
    particles.spawn({ x: 4, y: 1, z: 0.01, color: [1, 1, 1], life: 5, size: 0.1 });
    particles.update(0, new THREE.PerspectiveCamera());
    particles.update(0.1, new THREE.PerspectiveCamera());
    const mesh = scene.children[0] as THREE.InstancedMesh;
    const xs = [0, 1].map((i) => new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().fromArray(mesh.instanceMatrix.array, i * 16)).x);
    expect(xs[0]).toBeGreaterThan(4.05); // the mote is carried off
    expect(xs[1]).toBeCloseTo(4, 6); // the mark stays
  });

  it('the world shader bends what sways by it, after the wind and the bodies; the mist is thrown by it', () => {
    expect(BLAST_GLSL).toContain(`uniform vec4 uBlasts[${BLAST.slots}]`);
    const sway = WORLD_VERT.slice(WORLD_VERT.indexOf('#ifdef SWAY\n  float gust'), WORLD_VERT.indexOf('wp.xyz = displace(wp.xyz);'));
    expect(sway).toContain(BLAST_BEND_GLSL.trim().split('\n')[0]);
    expect(sway.indexOf('blastAt(wp.xz, uTime)')).toBeGreaterThan(sway.indexOf('uTrampleBox.w'));
    expect(FOG_GLSL).toContain('blastMist(p.xz, uFogDrift.z)');
  });
});
