/**
 * The foes' own shapes in the shadow maps (round 93; render/silhouetteCasters.ts, castPlan.ts, shaders/castSprite.ts): a picture's
 * cut-out stands across the light and leans back from it until its shadow is as long as the body is tall, is larger for a horror,
 * shares the sprite batch's buffers, is told by the creature views, and is drawn into the moon's, the lantern's and the lamps' maps
 * after their solids and in nothing the investigator's camera draws.
 */
import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { CAST } from '../src/data/fxTuning';
import { castCorner, leanOf, loomOf, shadowReach, turnOf } from '../src/render/castPlan';
import { LANTERN_CASTER } from '../src/render/colliderShadow';
import { createCreatureViews } from '../src/render/creatureViews';
import { createLampShadows } from '../src/render/lampShadows';
import { createLanternShadow } from '../src/render/lanternShadow';
import { CASTER, createMoonShadow } from '../src/render/moonShadow';
import { createSilhouetteCasters, castSilhouettes } from '../src/render/silhouetteCasters';
import { CAST_FRAG, CAST_VERT } from '../src/render/shaders/castSprite';
import { spriteBatch } from '../src/render/sprites/batch';
import type { SpriteAtlas } from '../src/render/sprites/atlas';
import type { ReviewedEntity, ReviewedManifest } from '../src/render/sprites/reviewed';
import { worldUniforms } from '../src/render/worldMaterial';
import { spawnCreature } from '../src/systems/creatures';
import { createGame } from '../src/systems/game';

const deg = (d: number): number => (d * Math.PI) / 180;
const high = (elevation: number): { x: number; y: number; z: number; point: false } => ({ x: Math.cos(deg(elevation)), y: Math.sin(deg(elevation)), z: 0, point: false });

describe('how a cut-out leans', () => {
  it('stands upright for a low light and leans back, but never past its limit, as the light climbs', () => {
    expect(leanOf(0)).toBe(0);
    expect(leanOf(Math.sin(deg(20)))).toBe(0);
    expect(leanOf(Math.sin(deg(35)))).toBeLessThan(deg(1));
    let last = 0;
    for (let e = 20; e <= 89; e += 1) {
      const lean = leanOf(Math.sin(deg(e)));
      expect(lean).toBeGreaterThanOrEqual(last - 1e-12);
      expect(lean).toBeLessThanOrEqual(CAST.lean + 1e-12);
      last = lean;
    }
    expect(leanOf(Math.sin(deg(60)))).toBeGreaterThan(deg(20));
  });

  it('makes a shadow as long as the body is tall under every moon the night has (a height of 21 to 63 degrees), and the true length under a lower light', () => {
    for (let e = 8; e <= 63; e += 1) {
      const reach = shadowReach(Math.sin(deg(e)));
      expect(reach).toBeGreaterThanOrEqual(Math.min(1 / Math.tan(deg(e)), CAST.stretch) - 0.12);
    }
    expect(shadowReach(Math.sin(deg(10)))).toBeCloseTo(1 / Math.tan(deg(10)), 6);
    expect(shadowReach(Math.sin(deg(63)))).toBeGreaterThan(1);
  });

  it('is what the corners of the cut-out do: across the light, away from it, leaning back, standing behind the body by `back`', () => {
    const right = { x: 1, z: 0 };
    const moon = high(50); // the moon is toward +x
    const origin = { x: 4, y: 1, z: 2 };
    const loom = { tall: 1, wide: 1 };
    const [tl, tr, bl] = [castCorner(origin, 0.2, 2, 3, loom, moon, 0, right, -0.5, 1), castCorner(origin, 0.2, 2, 3, loom, moon, 0, right, 0.5, 1), castCorner(origin, 0.2, 2, 3, loom, moon, 0, right, -0.5, 0)];
    expect(Math.hypot(tr.x - tl.x, tr.y - tl.y, tr.z - tl.z)).toBeCloseTo(2, 6); // as broad as the picture
    expect((tr.x - tl.x) * moon.x + (tr.z - tl.z) * moon.z).toBeCloseTo(0, 6); // across the light
    expect(tr.y).toBeCloseTo(tl.y, 6); // level
    expect(tl.y - bl.y).toBeLessThan(3); // leaned back (it is not the picture's whole height above its bottom)
    expect((tl.x - bl.x) * moon.x + (tl.z - bl.z) * moon.z).toBeLessThan(0); // its top lies away from the moon
    const stood = castCorner(origin, 0.2, 2, 3, loom, { x: 20, y: 1.25, z: 2, point: true }, 0.25, right, 0, 0.2 / 3);
    expect(stood.x).toBeCloseTo(4 - 0.25, 3); // a lamp's cut-out stands behind the body's feet, away from the lamp (at +x)
    expect(stood.y).toBeCloseTo(1.2, 3); // and its feet are the picture's, 0.2 above its bottom
  });

  it('casts the shadow on the ground a taller body casts: longer as the body is taller, and as the loom is', () => {
    const ground = (h: number, loom: { tall: number; wide: number }): number => {
      const moon = high(30);
      const top = castCorner({ x: 0, y: 0, z: 0 }, 0, 1, h, loom, moon, 0, { x: 0, z: 1 }, 0, 1);
      return -(top.x - (top.y * moon.x) / moon.y) * Math.sign(moon.x); // where the moon's ray through the top meets the ground, behind the foot
    };
    expect(ground(4, { tall: 1, wide: 1 })).toBeGreaterThan(ground(2, { tall: 1, wide: 1 }) * 1.9);
    expect(ground(2, { tall: 1.5, wide: 1.25 })).toBeCloseTo(ground(3, { tall: 1, wide: 1 }), 6);
    expect(ground(2, { tall: 1, wide: 1 })).toBeCloseTo(2 / Math.tan(deg(30)), 5);
  });

  it('is turned about through the shape the two share, not all at once', () => {
    expect(turnOf(1)).toBe(1);
    expect(turnOf(CAST.turn)).toBe(1);
    expect(turnOf(0)).toBeCloseTo(0.5, 6);
    expect(turnOf(-CAST.turn)).toBe(0);
    expect(turnOf(-1)).toBe(0);
    expect(turnOf(0.1)).toBeGreaterThan(turnOf(-0.1));
  });
});

describe('how large a shadow is', () => {
  it('is larger than the body for every foe, larger for a taller one, and larger again deep in a horror\'s fight', () => {
    const [small, big, horror] = [loomOf(2), loomOf(14), loomOf(14, 1)];
    expect(small.tall).toBeCloseTo(1 + CAST.loom.base + CAST.loom.size * 0, 6);
    expect(big.tall).toBeGreaterThan(small.tall);
    expect(horror.tall).toBeCloseTo(big.tall + CAST.loom.deep, 6);
    expect(loomOf(14, 5).tall).toBe(horror.tall); // (deep is a share)
    expect(loomOf(14, -1).tall).toBe(big.tall);
    for (const l of [small, big, horror]) expect(l.wide).toBeCloseTo(1 + (l.tall - 1) * CAST.loom.wide, 6);
  });
});

describe('the shadow shaders', () => {
  const varyings = (src: string): Map<string, string> => new Map([...src.matchAll(/^\s*varying\s+(\w+)\s+(\w+)\s*;/gm)].map(([, type, name]) => [name, type]));

  it('hand over every varying the fragment reads, of the type it reads it as', () => {
    const [vert, frag] = [varyings(CAST_VERT), varyings(CAST_FRAG)];
    expect(frag.size).toBeGreaterThan(5);
    for (const [name, type] of frag) expect(vert.get(name), name).toBe(type);
  });

  it('say what castPlan says: the stretch, the lean and the turn, and the alpha the picture is cut at', () => {
    expect(CAST_VERT).toContain(`${CAST.stretch.toFixed(4)} * sy`);
    expect(CAST_VERT).toContain(`0.0, ${CAST.lean.toFixed(4)})`);
    expect(CAST_VERT).toContain(`smoothstep(${(-CAST.turn).toFixed(4)}, ${CAST.turn.toFixed(4)}, dot(side, uCastRight))`);
    expect(CAST_FRAG).toContain('uCastMin');
    expect(CAST_FRAG).toContain('fxKeep(src.xy'); // a body that crumbles crumbles in its shadow
    expect(CAST_FRAG).toContain('slip(uv)'); // and one whose rows slip slips
    expect(CAST_FRAG).toMatch(/discard;/);
  });

  it('write nothing but depth', () => {
    expect(CAST_FRAG).toContain('gl_FragColor = vec4(1.0)');
  });
});

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
    casters.begin({ x: 1, z: 0 });
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
    expect(seen[0]).toEqual({ clear: false, light: [5, 2, 7, 1], back: CAST.back, layers: camera.layers.mask, counts: [0, 3] });
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
});

describe('the shadow passes', () => {
  const fake = () => {
    const calls: string[] = [];
    const renderer = {
      autoClear: true,
      getRenderTarget: () => null,
      setRenderTarget: () => undefined,
      render: (scene: THREE.Scene) => void calls.push(scene === castSilhouettes.scene ? 'foes' : 'solids'),
    } as unknown as THREE.WebGLRenderer;
    return { renderer, calls };
  };
  const adopted = (): void => {
    const source = batches();
    source[1].count = 1;
    castSilhouettes.adopt(source);
    castSilhouettes.begin({ x: 1, z: 0 });
    castSilhouettes.put(1, 0, 1, 1, 2, 0, 0, 1, { x: 0, z: 0 });
    castSilhouettes.end();
  };

  it('draw the foes after the solids into the moon\'s map', () => {
    const { renderer, calls } = fake();
    adopted();
    const moon = createMoonShadow();
    moon.enabled = true;
    worldUniforms.uLightDir.value.set(0.3, 0.8, 0.2).normalize();
    moon.render(renderer, new THREE.Scene());
    expect(calls).toEqual(['solids', 'foes']);
  });

  it('and into none when the moon casts none', () => {
    const { renderer, calls } = fake();
    adopted();
    const moon = createMoonShadow();
    moon.enabled = false;
    moon.render(renderer, new THREE.Scene());
    expect(calls).toEqual([]);
  });

  it('draw them into the lantern\'s map, from the lens, after the solids', () => {
    const { renderer, calls } = fake();
    adopted();
    const lantern = createLanternShadow();
    lantern.enabled = true;
    lantern.render(renderer, new THREE.Scene(), new THREE.PerspectiveCamera(), { x: 1, y: 0, z: 2 });
    expect(calls).toEqual(['solids', 'foes']);
  });

  it('and into each lamp\'s, from the flame', () => {
    const { renderer, calls } = fake();
    adopted();
    const lamps = createLampShadows();
    lamps.enabled = true;
    lamps.update([{ slot: 0, x: 3, y: 2, z: 3, key: 'a' }, { slot: 1, x: -3, y: 2, z: 3, key: 'b' }], 1);
    lamps.render(renderer, new THREE.Scene(), { x: 0, y: 0, z: 0 });
    expect(calls).toEqual(['solids', 'foes', 'solids', 'foes']);
    const light = ((castSilhouettes.scene.children[1] as THREE.InstancedMesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material.uniforms.uCastLight.value as THREE.Vector4).toArray();
    expect(light).toEqual([-3, 2, 3, 1]);
  });
});

/** One frame for every view and action: enough for the views to draw whatever it is shown. */
function entity(id: string, assetGroup: ReviewedEntity['assetGroup'], scale: number): ReviewedEntity {
  const view = (): ReviewedEntity['directions']['front'] => ({ sourceDirection: 'front', mirror: false, actions: { idle: [0], move: [0], attack: [0], hurt: [0] } });
  return { id, name: id, assetGroup, scale, scaleUnit: 'metres', page: 0, directions: { front: view(), back: view(), left: view(), right: view() } };
}

const HEIGHT: Record<string, number> = { azathoth: 14, shub_niggurath: 18 }; // the painted horrors of the library, by their height in metres (the others are sprites, drawn by the side)

function viewsOver(ids: string[]) {
  const g = createGame();
  const manifest: ReviewedManifest = {
    format: 'seventy-steps-reviewed-atlas-v1', entityCount: ids.length, frameCount: 1,
    pages: [{ file: 'page.png', width: 128, height: 128, sha256: '' }],
    frames: [{ source: 'f.png', sourceSha256: '', pixelSha256: '', width: 64, height: 64, bounds: [8, 4, 56, 62], page: 0, x: 0, y: 0 }],
    entities: Object.fromEntries(ids.map((id) => [id, entity(id, id in HEIGHT ? 'bosses' : 'sprites', HEIGHT[id] ?? 2)])),
  };
  const atlas: SpriteAtlas = {
    width: 64, height: 64, data: new Uint8Array(64 * 64 * 4), frames: new Map(), eyes: new Float32Array(4), eyeColors: new Float32Array(3),
    reviewed: { manifest, pages: [{} as HTMLImageElement] },
  };
  const scene = new THREE.Scene();
  const views = createCreatureViews(scene, g, atlas);
  const info = (): Float32Array => ((castSilhouettes.scene.children[1] as THREE.InstancedMesh).geometry.getAttribute('aCast') as THREE.InstancedBufferAttribute).array as Float32Array;
  return { g, views, info, scene };
}

describe('the creatures\' own shapes, told by the creature views', () => {
  it('cast for a body that stands in the world, larger for a horror, and not for a spectre', () => {
    const { g, views, info } = viewsOver(['deep_one', 'azathoth', 'moon_bog_wraith']);
    spawnCreature(g, 'deep_one', { x: 0, z: 6, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(castSilhouettes.scene.children).toHaveLength(2); // the fallback batch and one reviewed page
    expect(info()[0]).toBe(1);
    const small = info()[1];
    expect(small).toBeGreaterThan(1);
    expect(info()[3]).toBeGreaterThanOrEqual(0); // its feet's height over its picture's bottom

    spawnCreature(g, 'azathoth', { x: 0, z: -9, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    const casting = [0, 1, 2, 3].map((i) => ({ on: info()[i * 4], tall: info()[i * 4 + 1] })).filter((c) => c.on === 1);
    expect(casting.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...casting.map((c) => c.tall))).toBeGreaterThan(small + 0.1);
    // (its echoes, drawn beside it, cast none: only the body does)
    expect(casting.length).toBe(2);

    const none = viewsOver(['moon_bog_wraith']);
    spawnCreature(none.g, 'moon_bog_wraith', { x: 0, z: 6, yaw: 0 });
    none.views.update(1, 1, new THREE.PerspectiveCamera());
    expect(none.info()[0]).toBe(0);
  });

  it('cast for every creature that has a picture in the library, the three horrors whose pictures are being drawn again (Shub-Niggurath, Nug, Yeb) among them: a new picture of the same name casts with no change here', () => {
    for (const id of ['shub_niggurath', 'nug', 'yeb']) {
      const { g, views, info } = viewsOver([id]);
      spawnCreature(g, id, { x: 0, z: 8, yaw: 0 });
      views.update(1, 1, new THREE.PerspectiveCamera());
      expect(info()[0], id).toBe(1);
      expect(info()[1], id).toBeGreaterThan(1);
    }
  });

  it('are all a creature stands in the shadow passes as: no rounded stand-in body is put in the world\'s scene any more', () => {
    const { g, views, scene } = viewsOver(['deep_one']);
    spawnCreature(g, 'deep_one', { x: 0, z: 6, yaw: 0 });
    views.update(1, 1, new THREE.PerspectiveCamera());
    const moon = new THREE.Layers();
    moon.set(CASTER);
    const lantern = new THREE.Layers();
    lantern.set(LANTERN_CASTER);
    scene.traverse((o) => {
      expect(o.layers.test(moon)).toBe(false);
      expect(o.layers.test(lantern)).toBe(false);
    });
  });

  it('are collected every frame, and forgotten when no creature is drawn', () => {
    const { g, views, info } = viewsOver(['deep_one']);
    const id = spawnCreature(g, 'deep_one', { x: 0, z: 6, yaw: 0 })!;
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(info()[0]).toBe(1);
    g.ecs.c.model.delete(id);
    views.update(1, 1, new THREE.PerspectiveCamera());
    expect(info()[0]).toBe(0);
  });
});
