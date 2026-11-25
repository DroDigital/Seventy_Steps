/**
 * The night sky (playtest round 4): a sphere about the camera, drawn first and behind everything
 * (shaders/sky.ts). Each realm has its own (SKY: the Dreamlands' near moon, none under K'n-yan);
 * walking into another eases from one to the next (a journey under the veil arrives to it at
 * once), and a dungeon's walls close it off. Round 32: its colours are the realm's (data/looks.ts,
 * render/realmLook.ts). Round 22: as the mind fails the stars go wrong (`strange`):
 * they crowd in and flicker; and they spin about the zenith (2026-11-25: `spin`, wild only at the last, a fast star streaked behind),
 * the turn summed here at a pace the mind sets, so a change in it changes the pace and never leaps the sky round.
 */

import * as THREE from 'three';
import { cosmosOf } from '../data/cosmos';
import { OMEN, WRONG_STARS } from '../data/skyAir';
import { FX, LIGHT, RENDER, SKY, type SkyDef } from '../data/tuning';
import type { RealmLook } from './realmLook';
import { SKY_FRAG, SKY_VERT } from './shaders/sky';
import { driftAt } from './warpWaves';

export interface Sky {
  readonly mesh: THREE.Mesh;
  /** Follows the camera; `region` picks the realm's sky (null: the plain night), `enclosed` closes it off. */
  update(camera: THREE.Camera, time: number, region: string | null, enclosed: boolean): void;
  /** How wrong the stars are, 0..1, and how fast they spin, radians a second (fx.ts `strange`, `spin`): a failing mind's. */
  strange(amount: number, spin: number): void;
}

const skyOf = (region: string | null): SkyDef => ({ ...SKY.base, ...(region ? SKY.regions[region] : undefined) });

export function createSky(look: RealmLook): Sky {
  const start = skyOf(null);
  const u = {
    uTime: { value: 0 },
    uFogColor: { value: new THREE.Vector3(...FX.fogColor) },
    uHorizon: { value: new THREE.Vector3(...look.now.horizon) },
    uZenith: { value: new THREE.Vector3(...look.now.zenith) },
    uMoonColor: { value: new THREE.Vector3(...look.now.moonColor) },
    uMoonDir: { value: new THREE.Vector3(...LIGHT.nightMoonDir).normalize() },
    uMoon: { value: start.moon },
    uStars: { value: start.stars },
    uClouds: { value: start.clouds },
    uHaze: { value: start.haze },
    uMilky: { value: start.milky },
    uAurora: { value: start.aurora },
    uMeteors: { value: start.meteors },
    uNebula: { value: 0 },
    uNebA: { value: new THREE.Vector3() },
    uNebB: { value: new THREE.Vector3() },
    uStorm: { value: 0 },
    uCanopy: { value: 0 },
    uLattice: { value: 0 },
    uStaff: { value: 0 },
    uOrbs: { value: 0 },
    uHole: { value: 0 },
    uAuroraTint: { value: new THREE.Vector3(1, 1, 1) },
    uOpen: { value: 1 },
    uWrong: { value: 0 },
    uCrawl: { value: 0 },
    uTrail: { value: 0 },
    uFlicker: { value: 0 },
    uFlash: { value: 0 },
    // round 80 (render/atm/sky.ts writes these each frame; at rest they change nothing)
    uOver: { value: 0 },
    uVeil: { value: 0 },
    uHour: { value: new THREE.Vector4() },
    uHourGlow: { value: new THREE.Vector3() },
    uHourDawn: { value: new THREE.Vector3() },
    uTurn: { value: 0 },
    uHeat: { value: new THREE.Vector4() },
    uMoonSwell: { value: 0 },
    uMoonSour: { value: 0 },
    uOmen: { value: 0 },
    uOmenAt: { value: new THREE.Vector3(0, 1, 0) },
    uOmenSize: { value: OMEN.size },
  };
  const material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(RENDER.far * 0.8, 32, 16), material);
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  let last = 0;
  let clock = 0; // the sky's own time: it runs slower where time is stopped (the Pale Lattice), and does not jump when it does
  let still = 0;
  let spin = 0; // what the mind asks of the stars' spin (fx.ts spinOf)...
  let pace = 0; // ...and how fast they spin now, easing toward it
  const was = new THREE.Vector3();
  const ease = (x: { value: number }, to: number, k: number): void => void (x.value += (to - x.value) * k);
  const easeVec = (x: { value: THREE.Vector3 }, to: readonly [number, number, number], k: number): void => void x.value.set(x.value.x + (to[0] - x.value.x) * k, x.value.y + (to[1] - x.value.y) * k, x.value.z + (to[2] - x.value.z) * k);
  return {
    mesh,
    strange(amount, rate) {
      u.uWrong.value = amount;
      spin = Math.max(0, rate);
    },
    update(camera, time, region, enclosed) {
      camera.getWorldPosition(mesh.position);
      const jumped = was.distanceToSquared(mesh.position) > SKY.jump * SKY.jump;
      was.copy(mesh.position);
      const dt = Math.min(0.1, Math.max(0, time - last));
      last = time;
      const want = skyOf(region);
      const k = jumped ? 1 : Math.min(1, dt / SKY.fade);
      ease(u.uMoon, want.moon, k);
      const clear = (mesh.userData.clear as number | undefined) ?? 0; // where the horrors are gone the stars come up (omenFx.ts; round 26)
      ease(u.uStars, want.stars * (1 + clear * 0.9), k);
      ease(u.uClouds, want.clouds, k);
      ease(u.uHaze, want.haze * look.now.glow, k);
      ease(u.uMilky, want.milky, k);
      ease(u.uAurora, want.aurora, k);
      ease(u.uMeteors, want.meteors, k);
      const cosmos = cosmosOf(region);
      ease(u.uNebula, cosmos.nebula, k);
      easeVec(u.uNebA, cosmos.nebA, k);
      easeVec(u.uNebB, cosmos.nebB, k);
      ease(u.uStorm, cosmos.storm, k);
      ease(u.uCanopy, cosmos.canopy, k);
      ease(u.uLattice, cosmos.lattice, k);
      ease(u.uStaff, cosmos.staff, k);
      ease(u.uOrbs, cosmos.orbs, k);
      ease(u.uHole, cosmos.hole, k);
      easeVec(u.uAuroraTint, cosmos.aurora, k);
      still += (cosmos.still - still) * k;
      ease(u.uOpen, enclosed ? 0 : 1, Math.min(1, dt / SKY.close));
      u.uFogColor.value.set(...look.now.haze); // the realm's, already eased (render/realmLook.ts)
      u.uHorizon.value.set(...look.now.horizon);
      u.uZenith.value.set(...look.now.zenith);
      u.uMoonColor.value.set(...look.now.moonColor);
      clock += dt * (1 - still);
      u.uTime.value = clock;
      const run = dt * (1 - still); // the sky's own time
      const wild = Math.min(1, spin / WRONG_STARS.most); // the lurches come with the wildness: none in a slow sky, never backward
      const aim = spin * (1 + WRONG_STARS.lurch * wild * driftAt(clock * WRONG_STARS.lurchPace, 2.7));
      pace += (aim - pace) * (1 - Math.exp(-run / WRONG_STARS.ease));
      u.uCrawl.value = (u.uCrawl.value + pace * run) % (Math.PI * 2); // summed, never time × wrongness: that leapt the whole sky round, and set every star flickering, whenever the mind moved
      u.uTrail.value = Math.min(WRONG_STARS.streak, pace * WRONG_STARS.shutter);
      u.uFlicker.value = (u.uFlicker.value + run * u.uWrong.value * WRONG_STARS.flicker) % (Math.PI * 2);
    },
  };
}
