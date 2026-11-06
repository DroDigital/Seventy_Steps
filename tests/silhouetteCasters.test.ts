/**
 * The foes' own shapes in the shadow maps (round 94; render/silhouetteCasters.ts): one more mesh for each sprite batch, sharing its buffers, told what
 * casts, and drawn into the moon's, the lantern's and the lamps' maps after their solids and in nothing the investigator's camera draws.
 */
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { CAST } from '../src/data/fxTuning';
import { loomOf } from '../src/render/castPlan';
import { createLampShadows } from '../src/render/lampShadows';
import { createLanternShadow } from '../src/render/lanternShadow';
import { createMoonShadow } from '../src/render/moonShadow';
import { createSilhouetteCasters, castSilhouettes } from '../src/render/silhouetteCasters';
import { spriteBatch } from '../src/render/sprites/batch';
import { worldUniforms } from '../src/render/worldMaterial';

const deg = (d: number): number => (d * Math.PI) / 180;
const high = (elevation: number): { x: number; y: number; z: number; point: false } => ({ x: Math.cos(deg(elevation)), y: Math.sin(deg(elevation)), z: 0, point: false });

/** A reviewed page's batch and the procedural fallback's, as the creature views make them. */
function batches(): THREE.InstancedMesh[] {
  const scene = new THREE.Scene();
  const texture = new THREE.DataTexture(new Uint8Array(16), 2, 2);
  return [spriteBatch(scene, texture, 8, false).mesh, spriteBatch(scene, texture, 8, true).mesh];
}

describe('the silhouette casters', () => {
  it('give each sprite batch a mesh of its own that shares its buffers and its places', () => {
    const source = batches();
    const casters = createSilhouetteCasters();
    casters.adopt(source);
    expect(casters.scene.children).toHaveLength(2);
    casters.scene.children.forEach((c, i) => {
      const mesh = c as THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
      expect(mesh.instanceMatrix).toBe(source[i].instanceMatrix);
      for (const name of ['position', 'uv', 'aCell', 'aInfo', 'aWeird', 'aFx']) expect(mesh.geometry.getAttribute(name), name).toBe(source[i].geometry.getAttribute(name));
      expect(mesh.geometry.getIndex()).toBe(source[i].geometry.getIndex());
      expect(mesh.geometry.getAttribute('aCast').itemSize).toBe(4);
      expect(mesh.material.side).toBe(THREE.DoubleSide);
      expect(mesh.material.colorWrite).toBe(false);
      expect(mesh.material.uniforms.uAtlas).toBe((source[i].material as THREE.ShaderMaterial).uniforms.uAtlas);
      expect(mesh.material.uniforms.uCastMin.value).toBe(i === 0 ? CAST.alpha.drawn : CAST.alpha.reviewed);
      expect(mesh.layers.test(new THREE.Layers())).toBe(true); // (until a pass says which map it is for: below)
    });
  });

  it('forget what was taken before when they take again', () => {
    const casters = createSilhouetteCasters();
    casters.adopt(batches());
    casters.adopt(batches().slice(0, 1));
    expect(casters.scene.children).toHaveLength(1);
  });

  it('free only what a cast made of its own when they forget it: the batch it shared its buffers with is drawn still', () => {
    const casters = createSilhouetteCasters();
    const source = batches();
    casters.adopt(source);
    const geo = (casters.scene.children[0] as THREE.InstancedMesh).geometry;
    const held: { attributes: string[]; index: boolean }[] = [];
    geo.addEventListener('dispose', () => held.push({ attributes: Object.keys(geo.attributes), index: geo.getIndex() !== null }));
    casters.adopt(batches());
    expect(held).toEqual([{ attributes: ['aCast'], index: false }]); // (a geometry's disposal frees every buffer it holds)
    for (const name of ['position', 'uv', 'aCell', 'aInfo', 'aWeird', 'aFx']) expect(source[0].geometry.getAttribute(name), name).toBeDefined();
    expect(source[0].geometry.getIndex()).not.toBeNull();
  });

  it('are told what casts, ignore what is far, gone or not there, and begin each frame with nothing', () => {
    const casters = createSilhouetteCasters();
    casters.adopt(batches());
    const info = (slot: number): THREE.InstancedBufferAttribute => (casters.scene.children[slot] as THREE.InstancedMesh).geometry.getAttribute('aCast') as THREE.InstancedBufferAttribute;
    const from = { x: 0, z: 0 };
    casters.begin({ x: 0, z: 2 });
    casters.put(1, 0, 3, 4, 14, 0.5, 0.5, 1, from);
    casters.put(1, 1, 3, 4, 14, 0.5, 0, 0.04, from); // (nearly gone)
    casters.put(1, 2, 300, 0, 14, 0.5, 0, 1, from); // (far)
    casters.put(1, 99, 3, 4, 14, 0.5, 0, 1, from); // (no such place)
    casters.put(7, 0, 3, 4, 14, 0.5, 0, 1, from); // (no such batch)
    casters.end();
    const want = loomOf(14, 0.5);
    expect([...info(1).array.slice(0, 4)]).toEqual([1, Math.fround(want.tall), Math.fround(want.wide), 0.5]);
    expect([...info(1).array.slice(4, 12)].every((v) => v === 0)).toBe(true);
    expect([...info(0).array].every((v) => v === 0)).toBe(true);
    casters.begin({ x: 0, z: 2 });
    expect([...info(1).array].every((v) => v === 0)).toBe(true);
    const before = info(1).version;
    casters.end();
    expect(info(1).version).toBeGreaterThan(before); // (it goes up to the GPU every frame, or the shadows freeze)
  });

  it('draw nothing when nothing casts, and otherwise draw once, after the solids: without clearing, from the light, with the camera\'s layers', () => {
    const source = batches();
    const casters = createSilhouetteCasters();
    casters.adopt(source);
    const seen: { clear: boolean; light: number[]; back: number; layers: number; counts: number[] }[] = [];
    const renderer = {
      autoClear: true,
      render: vi.fn(() => seen.push({ clear: renderer.autoClear, light: casters.scene.children.length ? ((casters.scene.children[0] as THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material.uniforms.uCastLight.value as THREE.Vector4).toArray() : [], back: ((casters.scene.children[0] as THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material.uniforms.uCastBack.value as number), layers: (casters.scene.children[0] as THREE.InstancedMesh).layers.mask, counts: casters.scene.children.map((c) => (c as THREE.InstancedMesh).count) })),
    } as unknown as THREE.WebGLRenderer & { render: ReturnType<typeof vi.fn> };
    const camera = new THREE.PerspectiveCamera();
    camera.layers.set(2);
    source[0].count = 2; // (bodies are drawn, and none casts: a frame of spectres, or of bodies out of reach)
    source[1].count = 2;
    casters.begin({ x: 1, z: 0 });
    casters.put(1, 0, 300, 0, 2, 0, 0, 1, { x: 0, z: 0 }); // (too far)
    casters.end();
    casters.draw(renderer, camera, high(40));
    expect(renderer.render).not.toHaveBeenCalled();

    source[1].count = 3;
    casters.begin({ x: 1, z: 0 });
    casters.put(1, 0, 1, 1, 2, 0, 0, 1, { x: 0, z: 0 });
    casters.end();
    casters.draw(renderer, camera, { x: 5, y: 2, z: 7, point: true });
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledWith(casters.scene, camera);
    expect(seen[0]).toEqual({ clear: false, light: [5, 2, 7, 1], back: CAST.back, layers: camera.layers.mask, counts: [2, 3] });
    expect(renderer.autoClear).toBe(true); // given back
    const moon = high(40);
    casters.draw(renderer, camera, moon);
    expect(seen[1].light[3]).toBe(0);
    expect(seen[1].back).toBe(0);
  });

  it('give back the clearing even when the draw throws', () => {
    const source = batches();
    const casters = createSilhouetteCasters();
    casters.adopt(source);
    source[0].count = 1;
    casters.begin({ x: 1, z: 0 });
    casters.put(0, 0, 1, 1, 2, 0, 0, 1, { x: 0, z: 0 });
    casters.end();
    const renderer = { autoClear: true, render: () => { throw new Error('lost context'); } } as unknown as THREE.WebGLRenderer;
    expect(() => casters.draw(renderer, new THREE.PerspectiveCamera(), high(30))).toThrow('lost context');
    expect(renderer.autoClear).toBe(true);
  });

  it('is told to the casters: a horror from far beyond 48 m casts, a man a little beyond it casts and farther does not', () => {
    const casters = createSilhouetteCasters();
    casters.adopt(batches());
    const info = (): number[] => [...((casters.scene.children[1] as THREE.InstancedMesh).geometry.getAttribute('aCast') as THREE.InstancedBufferAttribute).array].filter((_, i) => i % 4 === 0);
    const from = { x: 0, z: 0 };
    casters.begin({ x: 0, z: 1 });
    casters.put(1, 0, 90, 0, 40, 0, 0, 1, from); // a horror 40 m tall, 90 m off
    casters.put(1, 1, 52, 0, 2, 0, 0, 1, from); // a man 52 m off (his shadow could reach in: 48 + 5)
    casters.put(1, 2, 60, 0, 2, 0, 0, 1, from); // and 60 m off
    casters.put(1, 3, 260, 0, 40, 0, 0, 1, from); // and a horror 260 m off
    expect(info().slice(0, 4)).toEqual([1, 1, 0, 0]);
  });
});

describe('the shadow passes', () => {
  /** A renderer that remembers what each draw was drawn into and from which light: the map's own target must be bound for the foes as for the solids, and given back after. */
  const fake = () => {
    const log: { what: 'solids' | 'foes'; target: unknown; light: number[]; back: number }[] = [];
    let bound: unknown = null;
    const lightNow = (): number[] => ((castSilhouettes.scene.children[1] as THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material.uniforms.uCastLight.value as THREE.Vector4).toArray();
    const backNow = (): number => (castSilhouettes.scene.children[1] as THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material.uniforms.uCastBack.value as number;
    const renderer = {
      autoClear: true,
      getRenderTarget: () => bound,
      setRenderTarget: (target: unknown) => void (bound = target),
      render: (scene: THREE.Scene) => void log.push({ what: scene === castSilhouettes.scene ? 'foes' : 'solids', target: bound, light: lightNow(), back: backNow() }),
    } as unknown as THREE.WebGLRenderer;
    return { renderer, log, calls: (): string[] => log.map((l) => l.what), bound: (): unknown => bound };
  };
  /** Every foes' draw went into the target the solids went into, and none went into the screen. */
  const intoTheMap = (log: { what: string; target: unknown }[]): void => {
    const solids = log.filter((l) => l.what === 'solids');
    const foes = log.filter((l) => l.what === 'foes');
    expect(foes.length).toBeGreaterThan(0);
    foes.forEach((l, i) => {
      expect(l.target).not.toBeNull();
      expect(l.target).toBe(solids[i].target);
    });
  };
  const adopted = (): void => {
    const source = batches();
    source[1].count = 1;
    castSilhouettes.adopt(source);
    castSilhouettes.begin({ x: 1, z: 0 });
    castSilhouettes.put(1, 0, 1, 1, 2, 0, 0, 1, { x: 0, z: 0 });
    castSilhouettes.end();
  };

  it('draw the foes after the solids into the moon\'s map, from the moon, and give the screen back', () => {
    const { renderer, log, calls, bound } = fake();
    adopted();
    const moon = createMoonShadow();
    moon.enabled = true;
    worldUniforms.uLightDir.value.set(0.3, 0.8, 0.2).normalize();
    moon.render(renderer, new THREE.Scene());
    expect(calls()).toEqual(['solids', 'foes']);
    intoTheMap(log);
    const to = worldUniforms.uLightDir.value.clone().normalize();
    expect(log[1].light.map((n) => +n.toFixed(5))).toEqual([to.x, to.y, to.z, 0].map((n) => +n.toFixed(5))); // toward the moon, not a place
    expect(log[1].back).toBe(0); // and stood at the body
    expect(bound()).toBeNull(); // the target the pass found is bound again
  });

  it('and into none when the moon casts none', () => {
    const { renderer, calls } = fake();
    adopted();
    const moon = createMoonShadow();
    moon.enabled = false;
    moon.render(renderer, new THREE.Scene());
    expect(calls()).toEqual([]);
  });

  it('draw them into the lantern\'s map, from the lens, after the solids', () => {
    const { renderer, log, calls, bound } = fake();
    adopted();
    const lantern = createLanternShadow();
    lantern.enabled = true;
    lantern.render(renderer, new THREE.Scene(), new THREE.PerspectiveCamera(), { x: 1, y: 0, z: 2 });
    expect(calls()).toEqual(['solids', 'foes']);
    intoTheMap(log);
    expect(log[1].light[3]).toBe(1); // from a place
    expect(log[1].back).toBe(CAST.back); // and stood behind the body
    expect(bound()).toBeNull();
  });

  it('and into each lamp\'s, from the flame, each from its own', () => {
    const { renderer, log, calls, bound } = fake();
    adopted();
    const lamps = createLampShadows();
    lamps.enabled = true;
    lamps.update([{ slot: 0, x: 3, y: 2, z: 3, key: 'a' }, { slot: 1, x: -3, y: 2, z: 3, key: 'b' }], 1);
    lamps.render(renderer, new THREE.Scene(), { x: 0, y: 0, z: 0 });
    expect(calls()).toEqual(['solids', 'foes', 'solids', 'foes']);
    intoTheMap(log);
    expect(log.filter((l) => l.what === 'foes').map((l) => l.light)).toEqual([[3, 2, 3, 1], [-3, 2, 3, 1]]); // each lamp's own, in turn
    expect(log.filter((l) => l.what === 'foes').map((l) => l.back)).toEqual([CAST.back, CAST.back]);
    expect(log[1].target).not.toBe(log[3].target); // each into its own map
    expect(bound()).toBeNull();
  });
});
