import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SHADE } from '../src/data/dreadPicture';
import { CASTER } from '../src/render/moonShadow';
import { createUnseenShade } from '../src/render/unseenShade';
import { facing, grown, heightFor, mayLie, mayMove, placeOf, shadeEvery, shadeLasts, slideEvery, tooNear } from '../src/render/unseenShadeRules';
import { worldUniforms } from '../src/render/worldMaterial';
import { createWorldGame } from '../src/systems/game';
import { setSanity } from '../src/systems/sanity';

afterEach(() => {
  vi.restoreAllMocks();
  worldUniforms.uShadow.value.x = 0;
});

const ground = { shadows: true, hidden: false, mind: true, cap: 1, calm: true };

describe('the shade with no one: the rules (pure)', () => {
  it('lies only in the open, with the moon\'s shadows on, for a failing mind, at some FX intensity, in a calm moment', () => {
    expect(mayLie(ground)).toBe(true);
    for (const off of [{ shadows: false }, { hidden: true }, { mind: false }, { cap: 0 }, { calm: false }]) expect(mayLie({ ...ground, ...off }), JSON.stringify(off)).toBe(false);
  });

  it('keeps to the periphery: 11 to 22 m, 70 to 110 degrees off the heading, on either side', () => {
    for (const r of [0, 0.5, 1]) {
      for (const left of [true, false]) {
        const p = placeOf(r, r, left);
        expect(p.distance).toBeGreaterThanOrEqual(SHADE.near[0]);
        expect(p.distance).toBeLessThanOrEqual(SHADE.near[1]);
        const degrees = (Math.abs(p.angle) * 180) / Math.PI;
        expect(degrees).toBeGreaterThanOrEqual(69.5);
        expect(degrees).toBeLessThanOrEqual(110.5);
        expect(Math.sign(p.angle)).toBe(left ? -1 : 1);
      }
    }
  });

  it('is gone within 8 m, and moves only while the lens is turned more than 60 degrees from it', () => {
    expect(tooNear(SHADE.gone - 0.1)).toBe(true);
    expect(tooNear(SHADE.gone + 0.1)).toBe(false);
    expect(mayMove(0.3)).toBe(false);
    expect(mayMove(-0.9)).toBe(false);
    expect(mayMove(1.2)).toBe(true);
    expect(mayMove(-2.5)).toBe(true);
  });

  it('shows its broad side to the moon and as much of its front to the investigator as that allows', () => {
    for (const [mx, mz, cx, cz] of [[-0.55, 0.4, 10, 3], [0.8, -0.2, -4, 9], [0, 1, 5, 5], [-1, -1, -7, 2]] as const) {
      const yaw = facing(mx, mz, cx, cz);
      const front = [Math.sin(yaw), Math.cos(yaw)];
      expect(front[0] * mx + front[1] * mz).toBeCloseTo(0, 6); // across the light
      expect(front[0] * cx + front[1] * cz).toBeGreaterThanOrEqual(-1e-9); // and not turning its back
    }
  });

  it('rises over SHADE.grow seconds and goes over SHADE.fade, and keeps the episode and slide intervals within their ranges', () => {
    expect(grown(0, 1, SHADE.grow / 2)).toBeCloseTo(0.5, 9);
    expect(grown(1, 0, SHADE.fade / 2)).toBeCloseTo(0.5, 9);
    expect(grown(0.99, 1, 5)).toBe(1);
    expect([shadeEvery(0), shadeEvery(1)]).toEqual([...SHADE.every]);
    expect([shadeLasts(0), shadeLasts(1)]).toEqual([...SHADE.lasts]);
    expect([slideEvery(0), slideEvery(1)]).toEqual([...SHADE.slideEvery]);
  });

  it('is made taller for a high moon so that its shadow is long, and never taller than the most', () => {
    expect(heightFor(0.05)).toBe(SHADE.height); // a low moon: its own height already throws a long shadow
    const [low, mid, high] = [heightFor(0.3), heightFor(0.6), heightFor(0.9)];
    expect(low).toBeGreaterThanOrEqual(SHADE.height);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBe(SHADE.mostHeight);
    expect((heightFor(0.6) * Math.sqrt(1 - 0.36)) / 0.6).toBeCloseTo(SHADE.reach, 5); // the shadow it throws, where it is not held to either end
    expect(heightFor(2)).toBe(SHADE.mostHeight);
    expect(heightFor(-1)).toBe(SHADE.height);
  });
});

describe('the shade with no one: in the world', () => {
  const setup = (): { g: ReturnType<typeof createWorldGame>; scene: THREE.Scene; shade: ReturnType<typeof createUnseenShade>; camera: THREE.PerspectiveCamera } => {
    const g = createWorldGame();
    const scene = new THREE.Scene();
    const shade = createUnseenShade(scene, g);
    const camera = new THREE.PerspectiveCamera(60, 16 / 9);
    const me = g.ecs.c.transform.get(g.player.id)!.pos;
    camera.position.set(me.x, me.y + 1.6, me.z);
    camera.updateMatrixWorld();
    worldUniforms.uShadow.value.x = 0.94;
    setSanity(g, 20);
    let n = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => (((n = (n * 7 + 3) % 97) + 0.5) / 97) * 0.9);
    return { g, scene, shade, camera };
  };
  const run = (shade: ReturnType<typeof createUnseenShade>, camera: THREE.Camera, from: number, seconds: number, hidden = false): number => {
    let most = 0;
    for (let t = 0; t < seconds; t += 0.1) {
      shade.update(camera, from + t, hidden);
      most = Math.max(most, shade.size);
    }
    return most;
  };

  it('is a figure on the moon\'s caster layer alone, so the lens never draws it', () => {
    const { scene } = setup();
    const mesh = scene.children[0] as THREE.Mesh;
    expect(mesh.layers.isEnabled(CASTER)).toBe(true);
    expect(mesh.layers.isEnabled(0)).toBe(false);
  });

  it('comes to a failing mind in the open after a while, in the periphery, and is gone as the investigator nears', () => {
    const { scene, shade, camera } = setup();
    expect(run(shade, camera, 100, SHADE.every[0] - 5)).toBe(0); // not at once
    expect(run(shade, camera, 200, 400)).toBeGreaterThan(0.9);
    const mesh = scene.children[0] as THREE.Mesh;
    const me = camera.position;
    shade.force(14, true);
    run(shade, camera, 700, 3);
    const d = Math.hypot(mesh.position.x - me.x, mesh.position.z - me.z);
    expect(d).toBeGreaterThan(SHADE.gone);
    camera.position.set(mesh.position.x + 4, me.y, mesh.position.z); // within a few metres
    camera.updateMatrixWorld();
    run(shade, camera, 703, 2);
    expect(shade.size).toBe(0);
    expect(mesh.visible).toBe(false);
  });

  it('never lies with the moon\'s shadows off, in a dungeon, at a steady mind, or when the FX intensity is nothing', () => {
    const a = setup();
    worldUniforms.uShadow.value.x = 0;
    expect(run(a.shade, a.camera, 100, 400)).toBe(0);
    const b = setup();
    expect(run(b.shade, b.camera, 100, 400, true)).toBe(0);
    const c = setup();
    setSanity(c.g, 100);
    expect(run(c.shade, c.camera, 100, 400)).toBe(0);
  });

  it('stands still while the lens is on it, and the mind steadying takes it away', () => {
    const { g, scene, shade, camera } = setup();
    shade.force(14, true);
    run(shade, camera, 100, 1);
    const mesh = scene.children[0] as THREE.Mesh;
    const at = mesh.position.clone();
    const bearing = Math.atan2(at.x - camera.position.x, at.z - camera.position.z);
    camera.rotation.set(0, bearing + 0.3 + Math.PI, 0); // the shade a quarter of a radian off the middle of the picture
    camera.updateMatrixWorld(true);
    run(shade, camera, 101, 30);
    expect(mesh.position.distanceTo(at)).toBeLessThan(1e-9);
    setSanity(g, 100);
    shade.force(14, true); // (by hand it stays whatever the mind...)
    run(shade, camera, 140, 2);
    expect(shade.size).toBeGreaterThan(0.9);
  });

  it('lifts the moon\'s light a little while it lies, and only then', () => {
    const { shade, camera } = setup();
    const before = worldUniforms.uLightColor.value.x;
    shade.update(camera, 100, false);
    expect(worldUniforms.uLightColor.value.x).toBe(before);
    shade.force(14, true);
    for (let t = 0; t < 2; t += 0.1) shade.update(camera, 101 + t, false);
    expect(worldUniforms.uLightColor.value.x).toBeGreaterThan(before);
    worldUniforms.uLightColor.value.x = before;
  });
});
