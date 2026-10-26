import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { FLAME_ATLAS, FLAME_CELLS, PUFF_CELLS } from '../src/data/flameAtlas';
import { LIGHTS } from '../src/data/tuning';
import { createFireLife } from '../src/render/fireLife';
import { createFlames, flameAtlasTexture, FLAME_HUES } from '../src/render/flames';
import type { ParticleSpec, Particles } from '../src/render/particles';
import { PARTICLE_SHAPES } from '../src/render/particles';
import { createWorldLights, type LightSpot } from '../src/render/worldLights';

const atlas = (): Uint8Array => Uint8Array.from(atob(FLAME_ATLAS.data), (c) => c.charCodeAt(0));
const cover = (x0: number, y0: number, w: number, h: number): number => {
  const px = atlas();
  let n = 0;
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) n += px[(y * FLAME_ATLAS.width + x) * 2 + 1] > 127 ? 1 : 0;
  return n;
};

describe('the flame flipbook (round 79: a free pixel animation, baked by tools/flames/bake_flames.py)', () => {
  it('is two bytes a texel, and its four flames and four puffs each have a body of their own', () => {
    expect(atlas().length).toBe(FLAME_ATLAS.width * FLAME_ATLAS.height * 2);
    expect(FLAME_CELLS.at).toHaveLength(4);
    expect(PUFF_CELLS.at).toHaveLength(4);
    for (const [x, y] of FLAME_CELLS.at) {
      const n = cover(x, y, FLAME_CELLS.w, FLAME_CELLS.h);
      expect(n).toBeGreaterThan(60); // a flame of some forty texels' breadth and height...
      expect(n).toBeLessThan(FLAME_CELLS.w * FLAME_CELLS.h * 0.6); // ...in a cell with room about it
    }
    for (const [x, y] of PUFF_CELLS.at) expect(cover(x, y, PUFF_CELLS.w, PUFF_CELLS.h)).toBeGreaterThan(PUFF_CELLS.w * PUFF_CELLS.h * 0.2);
  });

  it('is heat, brightest at the core: a flame is hotter at its middle than at its rim', () => {
    const px = atlas();
    const [x, y] = FLAME_CELLS.at[0];
    let rim = 0, core = 0, rn = 0, cn = 0;
    for (let j = 0; j < FLAME_CELLS.h; j++) {
      for (let i = 0; i < FLAME_CELLS.w; i++) {
        const k = ((y + j) * FLAME_ATLAS.width + x + i) * 2;
        if (px[k + 1] < 128) continue;
        const edge = [0, 1].some((d) => px[(((y + j + (d ? 1 : -1)) * FLAME_ATLAS.width) + x + i) * 2 + 1] < 128 || px[((y + j) * FLAME_ATLAS.width + x + i + (d ? 1 : -1)) * 2 + 1] < 128);
        if (edge) { rim += px[k]; rn++; } else { core += px[k]; cn++; }
      }
    }
    expect(core / cn).toBeGreaterThan(rim / rn);
  });

  it('is a texture the shaders can read, once', () => {
    const tex = flameAtlasTexture();
    expect(tex.image.width).toBe(FLAME_ATLAS.width);
    expect(flameAtlasTexture()).toBe(tex);
    expect(tex.magFilter).toBe(THREE.NearestFilter);
  });

  it('colours a flame by its ramp: each hue runs from a darker rim through its body to a paler core, and a cold one is blue', () => {
    for (const ramp of Object.values(FLAME_HUES)) {
      const luma = ramp.map((c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]);
      expect(luma[0]).toBeLessThan(luma[1]);
      expect(luma[1]).toBeLessThan(luma[2]);
    }
    expect(FLAME_HUES.cold[1][2]).toBeGreaterThan(FLAME_HUES.cold[1][0]);
    expect(FLAME_HUES.warm[1][0]).toBeGreaterThan(FLAME_HUES.warm[1][2]);
  });
});

describe('a batch of flames', () => {
  it('fills between begin and end, and says when it is full', () => {
    const f = createFlames(3);
    f.begin();
    expect(f.put(1, 2, 3, 0.5, 0, 1, 'warm', 1)).toBe(true);
    expect(f.put(1, 2, 3, 0.5, 0.5, -1, 'cold', 1)).toBe(true);
    expect(f.put(1, 2, 3, 0.5, 0.2, 1, 'violet', 1)).toBe(true);
    expect(f.put(1, 2, 3, 0.5, 0.2, 1, 'warm', 1)).toBe(false);
    f.end();
    expect((f.mesh.geometry as THREE.InstancedBufferGeometry).instanceCount).toBe(3);
    f.begin();
    f.end();
    expect((f.mesh.geometry as THREE.InstancedBufferGeometry).instanceCount).toBe(0);
  });
});

describe('the flames of the world lights', () => {
  const spot = (kind: LightSpot['kind'], x: number): LightSpot => ({ x, y: 1.5, z: 0, kind });
  const flamesOf = (spots: LightSpot[], eye = new THREE.Vector3(3, 1.5, 3)): number => {
    const lights = createWorldLights();
    lights.add(1, spots);
    lights.update(eye, 0, null);
    return (lights.flames.geometry as THREE.InstancedBufferGeometry).instanceCount;
  };

  it('stands one flame at a torch and a lamp, a fire of several at a fire, and none at a window or a sign', () => {
    expect(flamesOf([spot('torch', 0)])).toBe(LIGHTS.flames.torch!.count);
    expect(flamesOf([spot('lamp', 0)])).toBe(1);
    expect(flamesOf([spot('fire', 0)])).toBe(LIGHTS.flames.fire!.count);
    expect(LIGHTS.flames.fire!.count).toBeGreaterThan(1);
    expect(flamesOf([spot('window', 0), spot('sigil', 2)])).toBe(0);
  });

  it('draws none beyond its reach, where only the halo of a fire is seen', () => {
    expect(flamesOf([spot('torch', LIGHTS.flameReach + 5)], new THREE.Vector3(0, 1.5, 0))).toBe(0);
    expect(flamesOf([spot('torch', LIGHTS.flameReach - 5)], new THREE.Vector3(0, 1.5, 0))).toBe(1);
  });

  it('tells what fires and torches stand within reach, and not the lamps and windows', () => {
    const lights = createWorldLights();
    lights.add(1, [spot('fire', 1), spot('torch', 2), spot('lamp', 3), spot('window', 4), spot('fire', 80)]);
    const seen: string[] = [];
    lights.fires({ x: 0, y: 1.5, z: 0 }, 20, (s) => seen.push(s.kind));
    expect(seen.sort()).toEqual(['fire', 'torch']);
  });
});

describe('what a fire gives off', () => {
  const run = (kinds: LightSpot['kind'][], seconds: number, eye = { x: 0, y: 1.5, z: 0 }): ParticleSpec[] => {
    const spawned: ParticleSpec[] = [];
    const particles: Particles = { spawn: (p) => spawned.push(p), update: () => undefined };
    const lights = createWorldLights();
    lights.add(1, kinds.map((kind, i) => ({ x: 2 + i, y: 1, z: 0, kind })));
    const life = createFireLife(particles, lights);
    const e = new THREE.Vector3(eye.x, eye.y, eye.z);
    for (let t = 0; t <= seconds; t += 1 / 30) life.update(e, t);
    return spawned;
  };

  it('is a puff of smoke from a free sprite and an ember, from a fire', () => {
    const got = run(['fire'], 30);
    const puffs = got.filter((p) => p.shape === 'puff');
    const embers = got.filter((p) => p.glow);
    expect(puffs.length).toBeGreaterThan(10);
    expect(embers.length).toBeGreaterThan(20);
    for (const p of puffs) { expect(p.thick).toBeGreaterThanOrEqual(0); expect(p.thick).toBeLessThan(1); }
    for (const e of embers) expect(e.colorEnd).toBeDefined(); // cooling as it rises
  });

  it('is only a rare wisp from a torch beside the eye, and nothing from a lamp or a torch across the room', () => {
    expect(run(['torch'], 60).every((p) => !p.glow)).toBe(true);
    expect(run(['lamp'], 30)).toHaveLength(0);
    expect(run(['torch'], 30, { x: 40, y: 1.5, z: 0 })).toHaveLength(0);
  });

  it('adds the puff to the particle shapes, after the first fourteen (round 87 added seven after it)', () => {
    expect(PARTICLE_SHAPES[14]).toBe('puff');
    expect(PARTICLE_SHAPES.indexOf('puff')).toBe(14);
    expect(PARTICLE_SHAPES.slice(15)).toEqual(['crescent', 'lash', 'cross', 'dash', 'arc', 'mark', 'trace']);
  });
});
