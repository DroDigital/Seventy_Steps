import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { DUNGEON_FOG, dungeonFogOf, FOGS } from '../src/data/fogs';
import { LOOKS, lookOf } from '../src/data/looks';
import { REGIONS } from '../src/data/regions';
import { NIGHT_DARK } from '../src/data/lifeTuning';
import { FOG } from '../src/data/tuning';
import type { PostPass } from '../src/render/postPass';
import { createVolumetricFog, easeFog, fogOf } from '../src/render/volumetricFog';

const EYE = 3.5; // metres above the ground: about where the follow camera stands

describe('volumetric fog (playtest rounds 16 and 23)', () => {
  it('every region has a mist, and every mist is a sane one', () => {
    for (const r of REGIONS) expect(FOGS[r.id], r.id).toBeDefined();
    for (const [id, f] of [...Object.entries(FOGS), ['dungeon', DUNGEON_FOG] as const]) {
      expect(f.density, id).toBeGreaterThan(0);
      expect(f.density * 20, id).toBeLessThan(3.2); // never a wall along the ground: 20 m of the thickest still lets a twentieth through
      expect(f.height, id).toBeGreaterThan(0.5);
      expect(f.height, id).toBeLessThanOrEqual(3); // a low mist: roofs, trees and the sky stand clear of it
      expect(f.haze, id).toBeGreaterThanOrEqual(0);
      expect(f.haze, id).toBeLessThan(0.01);
      expect(f.moon, id).toBeGreaterThanOrEqual(0);
      expect(f.moon, id).toBeLessThanOrEqual(1);
      expect(f.patchy, id).toBeGreaterThanOrEqual(0);
      expect(f.patchy, id).toBeLessThanOrEqual(1);
      for (const c of f.color) expect(c, id).toBeGreaterThanOrEqual(0);
      for (const c of f.color) expect(c, id).toBeLessThan(0.95); // a mist of the moon's light, or of snow: never white
    }
  });

  it("is its realm's own colour, light enough to see the land through (round 32: it was a dark grey blanket)", () => {
    for (const r of REGIONS) {
      expect(FOGS[r.id].color, r.id).toEqual(LOOKS[r.id].mist);
      expect(Math.max(...FOGS[r.id].color), r.id).toBeGreaterThan(0.3);
      expect(FOGS[r.id].density, r.id).toBeLessThanOrEqual(0.075); // a third of what it was
    }
    const dark = dungeonFogOf('hub').color;
    expect(Math.max(...dark)).toBeLessThan(0.3); // a crypt's is dark
  });

  it('at the height of the camera, the whole reach of the march still lets a sixth of the light through', () => {
    // (the picture was washed all over in a haze, round 23: a mist the camera stands in is a wall)
    for (const [id, f] of [...Object.entries(FOGS), ['dungeon', DUNGEON_FOG] as const]) {
      const along = (f.density * Math.exp(-EYE / f.height) + f.haze * Math.exp(-EYE / FOG.hazeHeight)) * FOG.far;
      expect(Math.exp(-along), id).toBeGreaterThan(1 / 6);
    }
  });

  it("the lantern's glow is the smaller, and the mist begins beyond a fight's reach", () => {
    expect(FOG.lantern).toBeLessThan(FOG.glow);
    expect(FOG.start).toBeGreaterThanOrEqual(4);
    expect(FOG.full).toBeGreaterThan(FOG.start);
    expect(FOG.full).toBeLessThan(FOG.far);
  });

  it("a roofed dungeon room takes the crypt-mist; out of doors, the region's (the hub's where there is none)", () => {
    expect(fogOf('arkham', true)).toEqual(dungeonFogOf('arkham'));
    expect(dungeonFogOf('arkham')).toMatchObject({ density: DUNGEON_FOG.density, height: DUNGEON_FOG.height, haze: DUNGEON_FOG.haze });
    expect(fogOf('innsmouth', false)).toEqual(FOGS.innsmouth);
    expect(fogOf(null, false)).toEqual(FOGS.hub);
  });

  it('turns from one mist to the next by the share asked', () => {
    const half = easeFog(FOGS.hub, FOGS.innsmouth, 0.5);
    expect(half.density).toBeCloseTo((FOGS.hub.density + FOGS.innsmouth.density) / 2, 6);
    expect(half.height).toBeCloseTo((FOGS.hub.height + FOGS.innsmouth.height) / 2, 6);
    expect(half.haze).toBeCloseTo((FOGS.hub.haze + FOGS.innsmouth.haze) / 2, 6);
    expect(half.color[1]).toBeCloseTo((FOGS.hub.color[1] + FOGS.innsmouth.color[1]) / 2, 6);
    expect(easeFog(FOGS.hub, FOGS.innsmouth, 1)).toEqual({ ...FOGS.innsmouth, color: [...FOGS.innsmouth.color], wind: [...FOGS.innsmouth.wind] });
  });

  it("carries the mist's night tone over a dungeon's threshold as it carries its density: eased, never in one frame (round 58)", () => {
    const v3 = () => ({ value: new THREE.Vector3() }), v4 = () => ({ value: new THREE.Vector4() });
    const uniforms = { uProjInv: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: v3(), uFog: v4(), uFogAir: v4(), uFogColor: v3(), uFogDrift: v3() };
    const fog = createVolumetricFog({ uniforms } as unknown as PostPass);
    const camera = new THREE.PerspectiveCamera();
    const frame = (enclosed: boolean) => ({ region: 'hub', enclosed, ground: 0, stress: 0, setting: 1, dark: 1 });
    const colour = () => uniforms.uFogColor.value.clone();
    fog.update(camera, 10, frame(false));
    const open = colour();
    expect(open.length()).toBeGreaterThan(0);
    const dt = 1 / 60, k = Math.min(1, dt * FOG.ease);
    fog.update(camera, 10 + dt, frame(true)); // the step through the door
    const into = colour(), room = new THREE.Vector3(...dungeonFogOf('hub').color).multiplyScalar(NIGHT_DARK.fog); // (the deepest night: the tone is the mist's share, k of the way from the open air's to the room's)
    const want = new THREE.Vector3(...easeFog({ ...FOGS.hub, color: lookOf('hub').mist }, dungeonFogOf('hub'), k).color).multiplyScalar(NIGHT_DARK.openFog + (NIGHT_DARK.fog - NIGHT_DARK.openFog) * k);
    expect(into.distanceTo(want)).toBeLessThan(1e-9); // one frame in: the tone is k of the way, as the density is
    expect(into.length()).toBeGreaterThan(room.length() * 1.5); // not the room's dim tone at once
    for (let i = 2; i < 4000; i++) fog.update(camera, 10 + i * dt, frame(true));
    expect(colour().distanceTo(room)).toBeLessThan(1e-6); // and it arrives
    expect(NIGHT_DARK.fog).toBeLessThan(1);
  });
});
