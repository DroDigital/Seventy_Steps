import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { REGIONS } from '../src/data/regions';
import { SKYLINES } from '../src/data/skylines';
import { RENDER, SKY } from '../src/data/tuning';
import { createPostPass } from '../src/render/postPass';
import { createRealmLook } from '../src/render/realmLook';
import { createSky } from '../src/render/sky';
import { createSkyline, facing, falseShown } from '../src/render/skyline';
import { shownElevation } from '../src/render/shaders/farPlace';
import { FAR } from '../src/data/farLooks';
import { profile } from '../src/render/skylineShapes';
import { createRng } from '../src/core/rng';
import { regionRect } from '../src/world/worldMap';

const realmLook = () => createRealmLook(createPostPass(new THREE.Texture()));

/** The skyline's meshes, and a camera at (x, z) that has looked from there once. */
function lookFrom(region: string, x: number, z: number): THREE.Mesh[] {
  const scene = new THREE.Scene();
  const skyline = createSkyline(scene, realmLook());
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(x, 20, z);
  camera.updateMatrixWorld();
  skyline.update(camera, 0, region, false);
  return scene.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);
}

describe('the far silhouettes (round 19: render/skyline.ts)', () => {
  it('are drawn with the opaque, after the sky and before the world, so the world always stands in front of them', () => {
    const sky = createSky(realmLook()).mesh;
    const meshes = lookFrom('dreamlands', 0, 4000);
    expect(meshes.length).toBe(Object.values(SKYLINES).flat().length + 1); // and the false one a failing mind sees (round 26)
    for (const m of meshes) {
      const mat = m.material as THREE.ShaderMaterial;
      expect(mat.transparent).toBe(false); // a transparent is drawn after the whole world: it was painted over it
      expect(mat.blending).toBe(THREE.CustomBlending); // it still fades in, over the sky
      expect(m.renderOrder).toBeGreaterThan(sky.renderOrder);
      expect(m.renderOrder).toBeLessThan(0);
      expect(mat.depthWrite).toBe(false);
    }
  });

  it('stand where they truly are, at their true size, and are drawn no higher than SKY.farAngle however near they are come (round 117)', () => {
    const r = regionRect(REGIONS.find((x) => x.id === 'dreamlands')!);
    const [kadath] = SKYLINES.dreamlands;
    const at = { x: r.x0 + kadath.at[0], z: r.z0 + kadath.at[1] };
    for (const d of [60, 400, 800, 3000]) {
      const m = lookFrom('dreamlands', at.x, at.z - d).find((x) => x.visible && Math.hypot(x.position.x - at.x, x.position.z - at.z) < 1e-6)!;
      expect(m, `${d} m`).toBeDefined(); // where it stands, wherever it is seen from (it was a card turned to the eye, 98 m off)
      expect(m.scale.x).toBeCloseTo(kadath.width);
      expect(m.scale.y).toBeCloseTo(kadath.height);
    }
    const deg = (e: number): number => (e * 180) / Math.PI;
    expect(shownElevation(Math.atan(kadath.height / 3000))).toBeCloseTo(Math.atan(kadath.height / 3000), 6); // far off: its true size
    let was = -1;
    for (let e = -0.3; e < Math.PI / 2; e += 0.01) {
      const shown = shownElevation(e);
      expect(deg(shown)).toBeLessThanOrEqual(SKY.farAngle + 1e-9); // never a wall over the sky...
      expect(shown).toBeGreaterThan(was); // ...but it grows as it is neared
      if (deg(e) <= SKY.farKnee) expect(shown).toBeCloseTo(e, 9);
      was = shown;
    }
    expect(deg(shownElevation(Math.atan(kadath.height / 476)))).toBeGreaterThan(deg(shownElevation(Math.atan(kadath.height / 800))) + 4); // from the realm's north edge it towers higher than from its middle
  });

  it('face their realm, turned toward the eye no further than they must be, so none is seen edge on (round 117)', () => {
    const most = (FAR.oblique * Math.PI) / 180;
    const angle = (a: readonly [number, number], b: readonly [number, number]): number => Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1])));
    for (let i = 0; i < 64; i++) {
      const [p, q] = [i * 0.71, i * 1.93 + 0.4];
      const face = [Math.cos(p), Math.sin(p)] as const;
      const to = [Math.cos(q), Math.sin(q)] as const;
      const f = facing(face, to, most);
      expect(Math.hypot(f[0], f[1])).toBeCloseTo(1, 9);
      expect(angle(f, to)).toBeLessThanOrEqual(most + 1e-9);
      if (angle(face, to) <= most) expect(f).toEqual([face[0], face[1]]); // within reach it holds still: walking past it, each part of it moves as far as it is
      else expect(angle(f, to)).toBeCloseTo(most, 9); // beyond, it turns as little as it must
    }
  });

  it('stand their back layer truly behind them and their mist before them, and a far town gives way to the real one near (round 117)', () => {
    const scene = new THREE.Scene();
    createSkyline(scene, realmLook());
    const meshes = scene.children.filter((o): o is THREE.Mesh => o instanceof THREE.Mesh);
    const zs = (m: THREE.Mesh, kind: number, haze: (h: number) => boolean): number[] => {
      const [pos, fx, shape] = ['position', 'aFx', 'aShape'].map((n) => m.geometry.getAttribute(n));
      return Array.from({ length: pos.count }, (_, i) => i).filter((i) => fx.getX(i) === kind && haze(shape.getW(i))).map((i) => pos.getZ(i));
    };
    let backs = 0;
    for (const m of meshes) {
      const back = zs(m, 0, (h) => h > 0);
      if (back.length) backs++;
      for (const z of back) expect(z).toBeLessThan(0);
      for (const z of zs(m, 0, (h) => h === 0)) expect(z).toBe(0);
      const uniforms = (m.material as THREE.ShaderMaterial).uniforms;
      expect(uniforms.uHandoff.value.y > 0).toBe(meshes.indexOf(m) < meshes.length - 1 && Object.values(SKYLINES).flat()[meshes.indexOf(m)].kind === 'town');
    }
    expect(backs).toBeGreaterThan(20);
  });

  it("stay drawn as the investigator walks up to them, in every realm (round 49: a town vanished inside 1.5 of its drawing distance, the Dreamlands' city by the sea among them)", () => {
    for (const [id, list] of Object.entries(SKYLINES)) {
      const region = REGIONS.find((x) => x.id === id);
      if (!region) continue;
      const r = regionRect(region);
      for (const def of list) {
        for (const d of [20, 60, 140, 400]) {
          const meshes = lookFrom(id, r.x0 + def.at[0], r.z0 + def.at[1] - d);
          expect(meshes.filter((m) => m.visible).length).toBe(list.length); // all of the realm's, from every place it is looked at
        }
      }
    }
  });

  it('a false one rises on the horizon only for a failing mind, slowly, and goes at once (round 26)', () => {
    expect(falseShown(0.3, 8)).toBe(0); // a steady mind sees none
    expect(falseShown(0.9, -1)).toBe(0);
    expect(falseShown(0.9, 3)).toBeCloseTo(0.5);
    expect(falseShown(0.9, 8)).toBe(1);
    expect(falseShown(0.9, 15)).toBe(0);
    expect(falseShown(0.7, 8)).toBeLessThan(falseShown(0.9, 8));
  });
});

describe("the silhouettes' outlines and windows (round 32: the towns, hills and towers never showed)", () => {
  const all = Object.values(SKYLINES).flat();
  const kinds = [...new Set(all.map((s) => s.kind))];

  it.each(kinds)('%s stands within its box, and is more than a flat line', (kind) => {
    const f = profile(kind, createRng(7));
    const ys = Array.from({ length: 240 }, (_, i) => f(-0.5 + i / 239));
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1.3);
    }
    expect(Math.max(...ys)).toBeGreaterThan(0.3);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.2);
  });

  it('a town is a close run of roofs with a few steeples standing over them', () => {
    const f = profile('town', createRng(21));
    const ys = Array.from({ length: 400 }, (_, i) => f(-0.45 + (0.9 * i) / 399));
    const roofs = ys.filter((y) => y > 0.1 && y < 0.5).length;
    expect(roofs / ys.length).toBeGreaterThan(0.5); // mostly roofs...
    expect(Math.max(...ys)).toBeGreaterThan(0.5); // ...and a steeple over them
  });

  it("every realm of the waking world sees its neighbours' towns on the horizon, with some windows lit", () => {
    for (const id of ['hub', 'arkham', 'dunwich', 'innsmouth', 'providence', 'vermont']) {
      expect(SKYLINES[id]?.some((s) => s.kind === 'town' && (s.lit ?? 0) > 0), id).toBe(true);
    }
    for (const s of all) if (s.lit !== undefined) expect(s.lit > 0 && s.lit <= 0.5, `${s.kind} ${s.seed}`).toBe(true);
  });

  it('puts every silhouette beyond the reach of the streamed chunks from somewhere in its realm, so there is always something to walk toward', () => {
    for (const [id, list] of Object.entries(SKYLINES)) {
      const r = regionRect(REGIONS.find((x) => x.id === id)!);
      const [cx, cz] = [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2];
      for (const s of list) expect(Math.hypot(r.x0 + s.at[0] - cx, r.z0 + s.at[1] - cz), `${id} ${s.kind}`).toBeGreaterThan(RENDER.far * 0.7 * 1.5);
    }
  });
});
