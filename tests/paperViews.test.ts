import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { isPaper, PAPER, PAPER_MODELS } from '../src/data/paperTuning';
import type { GameAudio } from '../src/render/audio/gameAudio';
import { createPaperViews } from '../src/render/paperViews';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { createGame } from '../src/systems/game';
import { spawnTome } from '../src/systems/insight';
import { place, steps } from './helpers';

function rig() {
  const spawned: ParticleSpec[] = [];
  const sounds: string[] = [];
  const audio = { recipe: (key: string) => (sounds.push(key), true), recordedFor: () => false, sampleAt: (set: string) => (sounds.push(set), true) } as unknown as GameAudio;
  const particles = { spawn: (p: ParticleSpec) => void spawned.push(p), update() {} } as unknown as Particles;
  const g = createGame();
  for (const id of [...g.ecs.c.tome.keys()]) g.ecs.despawn(id); // (the arena has a tome of its own)
  const scene = new THREE.Scene();
  const views = createPaperViews(scene, g, { audio, particles });
  const baseline = scene.children.length; // the halos, the flames and the leaf kept below the world for the shader's compile
  const own = new Set<THREE.Object3D>();
  scene.traverse((o) => own.add(o));
  let time = 0;
  const me = (): { x: number; z: number } => g.ecs.c.transform.get(g.player.id)!.pos;
  const tick = (seconds: number, reading: boolean): void => {
    for (let i = 0; i < Math.round(seconds * 60); i++) views.update((time += 1 / 60), reading, me());
  };
  /** Every material and geometry the scene draws now (but the views' own), and a record of those that have been disposed. */
  const disposed = new Set<unknown>();
  const made = new Set<THREE.Material | THREE.BufferGeometry>();
  const watch = (): void => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (own.has(o) || !mesh.isMesh) return;
      for (const x of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) made.add(x);
      made.add(mesh.geometry);
    });
    for (const x of made) x.addEventListener('dispose', () => disposed.add(x));
  };
  return { g, scene, views, baseline, spawned, sounds, tick, me, watch, disposed, made };
}

const note = { x: 6, z: 6, yaw: 1.1, name: 'Arkham Advertiser, October 2nd', insight: 0, note: true };
const tome = { x: -6, z: 6, yaw: 0.4, name: 'Necronomicon', insight: 1 };

/** Puts the investigator beside a spot, so that what lies there is picked up at the next step. */
function pickUp(r: ReturnType<typeof rig>, spot: { x: number; z: number }): void {
  place(r.g, r.g.player.id, spot.x, spot.z - 0.8, 0);
  steps(r.g, 3);
}

describe('what the game gives a note', () => {
  it('is a model of its own, which a tome, a vial, a cache and a weapon are not', () => {
    const { g } = rig();
    const model = (spec: Parameters<typeof spawnTome>[1]): string => g.ecs.c.model.get(spawnTome(g, spec))!;
    expect(PAPER_MODELS.has(model(note))).toBe(true);
    for (const other of [tome, { ...tome, vial: true }, { ...tome, echoes: 40 }, { ...tome, rounds: 6 }, { ...tome, weapon: 'sabre' }]) {
      expect(PAPER_MODELS.has(model({ ...other, name: 'Else' })), JSON.stringify(other)).toBe(false);
    }
  });

  it('is told from the rest by the flag the world gave it', () => {
    expect(isPaper({ note: true })).toBe(true);
    expect(isPaper({})).toBe(false);
    for (const other of [{ vial: true }, { echoes: 1 }, { rounds: 1 }, { weapon: 'a' }]) expect(isPaper({ ...other, note: true }), JSON.stringify(other)).toBe(false);
  });
});

describe('the leaf of paper that hangs where a note lies', () => {
  it('is built for a note and for nothing else: a tome keeps its lectern, and a vial, a cache and a weapon theirs', () => {
    const r = rig();
    spawnTome(r.g, note);
    spawnTome(r.g, tome);
    spawnTome(r.g, { ...tome, z: -6, name: 'Vial', vial: true });
    spawnTome(r.g, { ...tome, x: -6, z: -6, name: 'Cache', echoes: 5 });
    r.tick(0.1, false);
    expect(r.views.counts).toEqual({ standing: 1, held: 0, burning: 0 });
    expect(r.scene.children.length).toBe(r.baseline + 1);
    expect(r.scene.children[r.baseline].userData.note).toBe(note.name);
  });

  it('keeps one leaf far below the world, never drawn, so that its shader is compiled with the scene and not as the first note is met', () => {
    const r = rig();
    const warm = r.scene.children.find((c) => c.userData.warm);
    expect(warm).toBeDefined();
    expect(warm!.position.y).toBeLessThan(-1000);
    const mesh = warm!.children[0] as THREE.Mesh;
    expect((mesh.material as THREE.ShaderMaterial).side).toBe(THREE.DoubleSide);
    expect(r.views.counts).toEqual({ standing: 0, held: 0, burning: 0 });
    r.tick(1, false);
    expect(warm!.position.y).toBeLessThan(-1000); // (nothing moves it)
    expect(r.scene.children).toContain(warm);
  });

  it('is built from within reach and not from beyond it', () => {
    const r = rig();
    spawnTome(r.g, { ...note, x: PAPER.reach + 40, z: 0 });
    r.tick(0.1, false);
    expect(r.views.counts.standing).toBe(0);
    place(r.g, r.g.player.id, PAPER.reach + 30, 0, 0);
    r.tick(0.1, false);
    expect(r.views.counts.standing).toBe(1);
  });

  it('is dropped at once, and what was made for it disposed, if it leaves the world without being read', () => {
    const r = rig();
    const id = spawnTome(r.g, note);
    r.tick(0.1, false);
    r.watch();
    expect(r.made.size).toBeGreaterThan(1);
    r.g.ecs.despawn(id);
    r.tick(0.1, false);
    expect(r.views.counts).toEqual({ standing: 0, held: 0, burning: 0 });
    expect(r.scene.children.length).toBe(r.baseline);
    for (const x of r.made) expect(r.disposed.has(x)).toBe(true);
  });

  it('puts its flames in the batch while it hangs, and sheds sparks near and not far', () => {
    const r = rig();
    spawnTome(r.g, note);
    r.tick(1, false);
    const flames = r.scene.children[1] as THREE.Mesh;
    expect((flames.geometry as THREE.InstancedBufferGeometry).instanceCount).toBeGreaterThan(8);
    expect(r.spawned.length).toBeGreaterThan(5);
    const far = rig();
    spawnTome(far.g, { ...note, x: 0, z: 40 });
    place(far.g, far.g.player.id, 0, 40 - PAPER.burnReach - 8, 0);
    far.tick(1, false);
    expect(far.views.counts.standing).toBe(1);
    expect(far.spawned).toHaveLength(0);
  });

  it('is held while its page is read, waits a moment after it is put away, burns away, and is gone with all it was made of disposed', () => {
    const r = rig();
    spawnTome(r.g, note);
    r.tick(0.5, false);
    expect(r.views.counts.standing).toBe(1);
    r.watch();
    pickUp(r, note);
    r.tick(0.1, true);
    expect(r.views.counts).toEqual({ standing: 0, held: 1, burning: 0 });
    const flames = r.scene.children[1] as THREE.Mesh;
    expect((flames.geometry as THREE.InstancedBufferGeometry).instanceCount).toBeGreaterThan(8); // (it burns on while it is read)
    r.tick(5, true); // as long as the page is open, it hangs
    expect(r.views.counts).toEqual({ standing: 0, held: 1, burning: 0 });
    expect(r.scene.children.length).toBe(r.baseline + 1);
    r.tick(PAPER.burn.hold - 0.1, false); // put away: it waits while the page leaves the picture
    expect(r.views.counts).toEqual({ standing: 0, held: 1, burning: 0 });
    r.tick(0.2, false);
    expect(r.views.counts).toEqual({ standing: 0, held: 0, burning: 1 });
    expect(r.sounds).toContain('paper:burn');
    r.tick(0.5, false);
    expect(r.views.counts.burning).toBe(1);
    expect(r.spawned.length).toBeGreaterThan(50); // embers, ash and flames
    r.tick(PAPER.burn.total + 0.5, false);
    expect(r.views.counts).toEqual({ standing: 0, held: 0, burning: 0 });
    expect(r.scene.children.length).toBe(r.baseline);
    for (const x of r.made) expect(r.disposed.has(x), 'something made for it is left undisposed').toBe(true);
  });

  it('dithers away as it burns: nothing is left of it but ash, and then not that', () => {
    const r = rig();
    spawnTome(r.g, note);
    r.tick(0.3, false);
    r.watch();
    pickUp(r, note);
    r.tick(0.1, true);
    const mat = [...r.made].find((x): x is THREE.ShaderMaterial => (x as THREE.ShaderMaterial).isShaderMaterial)!;
    expect(mat.uniforms.uGhost.value).toBe(0);
    r.tick(PAPER.burn.hold + PAPER.burn.lag * 0.5, false);
    expect(mat.uniforms.uGhost.value).toBe(0); // (not before it has burnt)
    r.tick(PAPER.burn.lag * 0.5 + PAPER.burn.dither * 0.5 + 0.1, false);
    expect(mat.uniforms.uGhost.value).toBeGreaterThan(0.2);
    expect(mat.uniforms.uGhost.value).toBeLessThan(1);
  });

  it('does not begin to burn away while another page is read, and begins its wait again', () => {
    const r = rig();
    spawnTome(r.g, note);
    r.tick(0.3, false);
    pickUp(r, note);
    r.tick(0.1, true);
    r.tick(PAPER.burn.hold - 0.1, false);
    r.tick(0.5, true); // another page opens
    r.tick(PAPER.burn.hold - 0.1, false);
    expect(r.views.counts).toEqual({ standing: 0, held: 1, burning: 0 });
    r.tick(0.2, false);
    expect(r.views.counts).toEqual({ standing: 0, held: 0, burning: 1 });
  });

  it('is not blown across the world, nor finished at once, by a long frame', () => {
    const r = rig();
    spawnTome(r.g, note);
    r.tick(0.3, false);
    pickUp(r, note);
    r.tick(0.1, true);
    r.tick(PAPER.burn.hold + 0.1, false);
    expect(r.views.counts.burning).toBe(1);
    r.views.update(1000, false, r.me()); // a frame that took a thousand seconds
    expect(r.views.counts.burning).toBe(1);
    r.scene.traverse((o) => {
      expect(Number.isFinite(o.position.x + o.position.y + o.position.z)).toBe(true);
      expect(Math.abs(o.position.x) + Math.abs(o.position.z)).toBeLessThan(200);
    });
  });

  it('holds two notes picked up in the same page, and burns both away', () => {
    const r = rig();
    spawnTome(r.g, note);
    spawnTome(r.g, { ...note, x: 6.5, z: 6.5, name: "Frank's Letter Home" });
    r.tick(0.3, false);
    place(r.g, r.g.player.id, 6.2, 5.8, 0);
    steps(r.g, 3);
    r.tick(0.1, true);
    expect(r.views.counts).toEqual({ standing: 0, held: 2, burning: 0 });
    r.tick(PAPER.burn.hold + 0.1, false);
    expect(r.views.counts).toEqual({ standing: 0, held: 0, burning: 2 });
    r.tick(PAPER.burn.total + 1, false);
    expect(r.views.counts).toEqual({ standing: 0, held: 0, burning: 0 });
    expect(r.scene.children.length).toBe(r.baseline);
  });
});
