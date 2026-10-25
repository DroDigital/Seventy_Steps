/**
 * The volumetric fog's frame (playtest round 16; the march is shaders/fog.ts, in the post pass): the
 * lens, so each pixel's ray can be rebuilt from the scene's depth; where the investigator's ground
 * lies (the low mist pools there, eased as they climb or descend); and the mist of the place, the
 * region's or a dungeon room's (data/fogs.ts), turning from one to the next over a few seconds. A
 * failing mind thickens it, as it closes the far fog in; the Fog setting scales it (0: none).
 */

import * as THREE from 'three';
import { getRegion } from '../data/regions';
import { strewn } from '../world/planFill';
import { ARENA_MISTS } from '../data/arenaMists';
import { dungeonFogOf, FOGS, type FogDef } from '../data/fogs';
import { lookOf } from '../data/looks';
import { FOG } from '../data/tuning';
import { NIGHT_DARK } from '../data/lifeTuning';
import type { Court } from './courtMist';
import type { PostPass } from './postPass';

export interface FogFrame {
  region: string | null; // the overworld's region (null: the arena)
  enclosed: boolean; // under a dungeon's roof
  ground: number; // the investigator's feet
  stress: number; // 0–1: the sanity effects' stress (capped by the FX setting)
  setting: number; // the Fog setting, 0–1
  wood?: number; // 0–1: how wooded the land underfoot is (world/planFill.ts `strewn`): the mist gathers among the trees (round 35)
  court?: Court | null; // round 78: the open arena's court the camera is in, and how far: its mist is the realm's thickened (data/arenaMists.ts)
  dark?: number; // 0–1: how deep the night is laid (render/realmLook.ts): under a roof, the mist has no light of its own to speak of in the deep of it (round 58)
}

export interface VolumetricFog {
  update(camera: THREE.Camera, time: number, f: FogFrame): void;
  /** The next frame takes the place's own mist at once (the debug panel). */
  snap(): void;
}

const mix = (a: number, b: number, k: number): number => a + (b - a) * k;

/** The mist wanted where the investigator stands, in its realm's colour as it is now (data/looks.ts); in an open arena's court, the realm's thickened toward the court's own. */
export function fogOf(region: string | null, enclosed: boolean, court?: Court | null): FogDef {
  if (enclosed) return dungeonFogOf(region);
  const base: FogDef = { ...(FOGS[region ?? ''] ?? FOGS.hub), color: lookOf(region).mist };
  const m = court && court.share > 0 ? ARENA_MISTS[court.boss] : undefined;
  if (!m || !court) return base;
  return easeFog(base, { ...base, density: base.density * m.density, height: base.height * m.height, haze: base.haze * (m.haze ?? 1), patchy: m.patchy ?? base.patchy }, court.share);
}

/** `from` turned toward `to` by share `k` (0–1). */
export function easeFog(from: FogDef, to: FogDef, k: number): FogDef {
  return {
    density: mix(from.density, to.density, k),
    height: mix(from.height, to.height, k),
    haze: mix(from.haze, to.haze, k),
    moon: mix(from.moon, to.moon, k),
    color: [mix(from.color[0], to.color[0], k), mix(from.color[1], to.color[1], k), mix(from.color[2], to.color[2], k)],
    patchy: mix(from.patchy, to.patchy, k),
    wind: [mix(from.wind[0], to.wind[0], k), mix(from.wind[1], to.wind[1], k)],
  };
}

export function createVolumetricFog(post: PostPass): VolumetricFog {
  let now: FogDef | null = null;
  let ground = 0;
  let roof = 0; // how far under a roof the mist is (0 in the open air, 1 enclosed): eased like the mist itself, so its tone crosses a threshold as its density does
  let last = -1;
  let [dx, dz] = [0, 0]; // how far the wind has carried the mist
  return {
    snap() {
      now = null;
    },
    update(camera, time, f) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const want = fogOf(f.region, f.enclosed, f.court);
      roof = now ? mix(roof, f.enclosed ? 1 : 0, Math.min(1, dt * FOG.ease)) : f.enclosed ? 1 : 0;
      now = now ? easeFog(now, want, Math.min(1, dt * FOG.ease)) : want; // the first frame takes the place's own at once
      ground = dt === 0 ? f.ground : mix(ground, f.ground, Math.min(1, dt * 2));
      [dx, dz] = [dx + now.wind[0] * dt, dz + now.wind[1] * dt];
      const u = post.uniforms;
      camera.updateMatrixWorld();
      u.uProjInv.value.copy(camera.projectionMatrixInverse);
      u.uCamWorld.value.copy(camera.matrixWorld);
      u.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
      const thick = f.setting * (1 + FOG.madness * f.stress) * (1 + 1.1 * (f.wood ?? 0)); // a failing mind thickens it, and a wood
      u.uFog.value.set(now.density * thick, now.height, ground - 0.3, now.patchy);
      MIST.thickness = f.enclosed ? 0 : now.density * thick;
      u.uFogAir.value.set(now.haze * thick, FOG.hazeHeight, now.moon, 0);
      u.uFogColor.value.set(...now.color).multiplyScalar(mistTone(f.dark ?? 0, roof)); // (round 58: under a roof the mist is no longer the realm's own at every hour; in the open air it is, as before)
      u.uFogDrift.value.set(dx, dz, time);
    },
  };
}

/** The share of the mist's own light that survives a night laid `dark` deep (0: all of it): down to NIGHT_DARK.fog of it in the deepest, under a roof, and NIGHT_DARK.openFog (all of it) in the open air; `roof`, how far under a roof the mist is (a share, eased as the mist is, so a threshold is crossed over a moment, not a frame). */
export const mistTone = (dark: number, roof: number | boolean = 0): number => 1 - Math.min(1, Math.max(0, dark)) * (1 - mix(NIGHT_DARK.openFog, NIGHT_DARK.fog, Math.min(1, Math.max(0, Number(roof)))));

/** How thick the mist is about the investigator now (the density at the ground, as drawn: round 35, for what looks out of it). */
export const MIST = { thickness: 0 };

/** How wooded the land is where the camera stands (0 in a clearing, and on any ground but grass and leaves), for the mist that gathers among trees (round 35). */
export function woodOf(region: string | null, x: number, z: number): number {
  const t = getRegion(region ?? '')?.biome.texture;
  return t === 'grass' || t === 'leaves' ? strewn(x, z) : 0;
}
