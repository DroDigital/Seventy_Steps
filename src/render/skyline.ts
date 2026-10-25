/**
 * The realms' far silhouettes (playtest round 12; data/skylines.ts): Kadath's crowned peak, the
 * Mountains of Madness, R'lyeh's city, Yuggoth's towers, the Round Hills, the great horrors that stand on the
 * horizon (round 26: they breathe, their halos and eyes in titanGlow.ts), and (round 31) the
 * neighbouring towns of the waking world, Devil Reef and the rest. The camera's far plane is 140 m,
 * so each is drawn just inside it, after the sky and behind everything else: a flat shape in its
 * realm's colour (data/looks.ts), darker than the haze, its foot fading into it, at the bearing of
 * where it truly stands, sized to the angle it would fill from there (so it drifts as the investigator
 * walks, no more than a far thing would), up to SKY.farAngle; a town has a few windows lit. Each
 * realm's fade in as it is entered; a dungeon's walls hide them, and the real world covers them where it stands (round 49: a
 * town walked up to is seen as itself, not cut off inside 1.5 of its distance). A failing mind sees a city of towers
 * where there is none (`wrong`). Round 78: and the far horizon lives (horizonGlow.ts, skylineShader.ts): a town's windows follow the
 * night and wink, a glow lies over its roofs while they are lit, and a lamp turns on Devil Reef and on Kingsport's head. Render only.
 */

import * as THREE from 'three';
import { createRng } from '../core/rng';
import { BEAM, DOME, WINK, type LampDef } from '../data/horizonLife';
import { getRegion } from '../data/regions';
import { SKYLINES, type Silhouette } from '../data/skylines';
import { RENDER, SKY } from '../data/tuning';
import { phaseOf } from '../systems/clock';
import { regionRect } from '../world/worldMap';
import { beamAt, domeStrength, glowGeometry, glows, lampFor, lampPlace } from './horizonGlow';
import { ANOMALY } from './palette';
import type { RealmLook } from './realmLook';
import { SKYLINE_FRAG, SKYLINE_VERT } from './skylineShader';
import { profile, type Profile } from './skylineShapes';
import { titanGlow, type TitanGlow } from './titanGlow';
import { worldUniforms } from './worldMaterial';

const R = RENDER.far * 0.7; // metres from the camera they are drawn at
const SAMPLES = 300;
const TALLEST = Math.tan((SKY.farAngle * Math.PI) / 180); // height over distance at the most
const GLOWS = { amber: [1, 0.78, 0.46], cyan: [0.5, 0.95, 1], gold: [1, 0.86, 0.5] } as const;

/** The silhouette's outline, a unit wide and a unit tall at most, its foot at the origin, and the geometry it is drawn with (its glow and lamp, round 78). */
function shape(s: Silhouette, lamp?: LampDef): { f: Profile; geometry: THREE.BufferGeometry; lampAt: { x: number; y: number } | null } {
  const f = profile(s.kind, createRng(s.seed));
  const outline = new THREE.Shape();
  outline.moveTo(-0.5, -0.05);
  for (let i = 0; i <= SAMPLES; i++) {
    const x = -0.5 + i / SAMPLES;
    outline.lineTo(x, Math.max(0, Math.min(1.1, f(x))));
  }
  outline.lineTo(0.5, -0.05);
  const lampAt = lamp ? lampPlace(f, lamp) : null;
  return { f, geometry: glowGeometry(new THREE.ShapeGeometry(outline), glows(s), lampAt), lampAt };
}

interface Far {
  mesh: THREE.Mesh;
  region: string;
  x: number;
  z: number;
  base: number;
  def: Silhouette;
  glow?: TitanGlow; // a titan's halo and eyes
  lit: boolean; // a town of lit windows: its glow over the sky (round 78)
  lamp?: LampDef; // and a lamp that turns on it
}

export interface Skyline {
  update(camera: THREE.Camera, time: number, region: string | null, enclosed: boolean): void;
  /** How wrong the mind is, 0..1 (round 26): past 0.6, now and then, something stands on the horizon where nothing does, and is gone when looked for. */
  wrong(amount: number): void;
  /** What the air does to the far lights (round 78): how closed in the sky is, 0..1 (the glow lies on the cloud), and how far the mind has gone, 0..1 (the windows flicker). Set before `update`. */
  air(overcast: number, nerves: number): void;
}

/** How much of the false landmark shows at `amount` of madness `since` seconds into its turn (it comes up slowly and goes at once). */
export const falseShown = (amount: number, since: number): number => Math.max(0, Math.min(1, (amount - 0.55) / 0.3)) * (since < 0 ? 0 : since < 6 ? since / 6 : since < 14 ? 1 : 0);

/** What every silhouette's windows read: the game's seconds, and how far the mind has gone (round 78). */
interface Shared {
  wink: { value: number };
  nerves: { value: number };
}

/** The shader material every silhouette is drawn with: its realm's colour, melted `fade` toward the horizon's, `lit` of its windows aglow in `glow`; its glow over the sky and its lamp's light (round 78). */
function silhouetteMaterial(tone: THREE.Vector3, horizon: THREE.Vector3, alpha: { value: number }, def: Pick<Silhouette, 'glow' | 'fade' | 'lit'>, shared: Shared, lamp?: LampDef): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: tone }, uHorizon: { value: horizon }, uGlow: { value: new THREE.Vector3(...GLOWS[def.glow ?? 'amber']) }, uFade: { value: def.fade ?? 0 }, uLit: { value: def.lit ?? 0 }, uAlpha: alpha,
      uWink: shared.wink, uNerves: shared.nerves, uHurried: worldUniforms.uHurried,
      uDome: { value: new THREE.Vector3(0, DOME.across, DOME.up) }, // its strength (set each frame), how far it spreads across and up
      uLamp: { value: new THREE.Vector4() }, uLampCol: { value: new THREE.Vector3(...(lamp?.colour ?? [1, 1, 1])) }, uLampBox: { value: new THREE.Vector2(...BEAM.box).multiplyScalar(lamp?.size ?? 1) }, uPer: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: SKYLINE_VERT,
    fragmentShader: SKYLINE_FRAG,
    // Drawn with the opaque, so its render order puts it after the sky and before the world (round
    // 19: as a transparent it came after the world and, testing no depth, was painted over it, the
    // investigator and all, the mist ghosting what it hid): blended over the sky by hand, the sky's
    // alpha kept. Round 78: the blend is premultiplied (the outline outputs its colour already scaled by its alpha, the glow and the lamp
    // a light with no alpha at all, which adds): the same blend for the outline, and one draw for a town, its glow and its lamp.
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

export function createSkyline(scene: THREE.Scene, look: RealmLook): Skyline {
  const tone = new THREE.Vector3(...look.now.far);
  const horizon = new THREE.Vector3(...look.now.horizon);
  const alpha = new Map<string, { value: number }>();
  const fars: Far[] = [];
  const shared: Shared = { wink: { value: 0 }, nerves: { value: 0 } };
  const mood = { overcast: 0 }; // what the air is doing to the far lights (round 78: `air`)
  for (const [id, list] of Object.entries(SKYLINES)) {
    const region = getRegion(id);
    if (!region) continue;
    const a = { value: 0 };
    alpha.set(id, a);
    const rc = regionRect(region);
    for (const [index, def] of list.entries()) {
      const lamp = lampFor(id, index);
      const outline = shape(def, lamp);
      const material = silhouetteMaterial(tone, horizon, a, def, shared, outline.lampAt ? lamp : undefined);
      const mesh = new THREE.Mesh(outline.geometry, material);
      mesh.renderOrder = -999; // after the sky, before the world
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);
      const glow = def.kind === 'titan' ? titanGlow(a, [...[ANOMALY.green, ANOMALY.purple, ANOMALY.magenta][def.seed % 3]] as [number, number, number], def.seed) : undefined;
      if (glow) mesh.add(glow.halo, glow.eyes);
      fars.push({ mesh, region: id, x: rc.x0 + def.at[0], z: rc.z0 + def.at[1], base: region.biome.base - 2, def, glow, lit: glows(def), lamp: outline.lampAt ? lamp : undefined });
    }
  }
  const cam = new THREE.Vector3();
  let last = -1;
  // The false landmark: a city of towers where there is none, risen for a while at a bearing of its own.
  const fake = { value: 0 };
  const fakeDef: Silhouette = { kind: 'towers', at: [0, 0], width: 700, height: 240, seed: 97 };
  const fakeMesh = new THREE.Mesh(shape(fakeDef).geometry, silhouetteMaterial(tone, horizon, fake, {}, shared));
  fakeMesh.renderOrder = -999;
  fakeMesh.frustumCulled = false;
  fakeMesh.visible = false;
  scene.add(fakeMesh);
  let [madness, turnAt, bearing] = [0, -Infinity, 0];
  return {
    wrong(amount) {
      madness = amount;
    },
    air(overcast, nerves) {
      mood.overcast = overcast;
      shared.nerves.value = nerves * WINK.nerves;
    },
    update(camera, time, region, enclosed) {
      shared.wink.value = time;
      const dt = last < 0 ? 1 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const k = Math.min(1, dt / SKY.fade);
      for (const [id, a] of alpha) a.value += ((!enclosed && id === region ? 1 : 0) - a.value) * k;
      tone.set(...look.now.far); // the realm's, already eased (render/realmLook.ts)
      horizon.set(...look.now.horizon);
      camera.getWorldPosition(cam);
      if (madness < 0.55 || enclosed) fake.value = 0;
      else {
        if (time - turnAt > 14 + 10 * Math.random() && time - turnAt > 14) [turnAt, bearing] = [time, Math.random() * Math.PI * 2]; // a new one, somewhere else
        fake.value = falseShown(madness, time - turnAt);
      }
      fakeMesh.visible = fake.value > 0.01;
      if (fakeMesh.visible) {
        const s = R / 2500;
        fakeMesh.position.set(cam.x + Math.sin(bearing) * R, cam.y - 6, cam.z + Math.cos(bearing) * R);
        fakeMesh.scale.set(fakeDef.width * s * 6, fakeDef.height * s * 6, 1);
        fakeMesh.rotation.set(0, Math.atan2(-Math.sin(bearing), -Math.cos(bearing)), 0);
      }
      const shown: { f: Far; d: number }[] = [];
      for (const f of fars) {
        const [dx, dz] = [f.x - cam.x, f.z - cam.z];
        const d = Math.hypot(dx, dz);
        // Never hidden for being near: the silhouettes are drawn first, so what stands where it stands (the sea, the world, a nearer town) draws over it (round 49: it vanished inside 1.5 R).
        f.mesh.visible = alpha.get(f.region)!.value > 0.01 && d > 1; // (a bearing needs a distance)
        if (!f.mesh.visible) continue;
        shown.push({ f, d });
        // Farther things are paler (the air between), so a far castle behind a nearer hill is the lighter of the two.
        (f.mesh.material as THREE.ShaderMaterial).uniforms.uFade.value = (f.def.fade ?? 0) + (1 - (f.def.fade ?? 0)) * Math.min(0.55, d / 9000);
        const [ux, uz, s] = [dx / d, dz / d, R / Math.max(d, f.def.height / TALLEST)];
        f.mesh.position.set(cam.x + ux * R, cam.y + (f.base - cam.y) * s, cam.z + uz * R);
        f.glow?.blink(time);
        const breath = f.def.kind === 'titan' ? 1 + 0.012 * Math.sin(time * 0.35 + f.def.seed) : 1; // the great ones breathe: slowly, and not quite as a thing should
        f.mesh.scale.set(f.def.width * s * (2 - breath), f.def.height * s * breath, 1);
        f.mesh.rotation.set(0, Math.atan2(-ux, -uz), 0);
        const u = (f.mesh.material as THREE.ShaderMaterial).uniforms;
        if (f.lit) u.uDome.value.x = domeStrength(f.def, d, phaseOf(time), mood.overcast, time) * alpha.get(f.region)!.value; // the glow over its roofs, as many of its windows as are lit (round 78)
        if (f.lamp) {
          const b = beamAt(f.lamp, time);
          u.uLamp.value.set(b.flash, b.sweep, b.shaft, 0);
          u.uPer.value.set(1 / f.mesh.scale.x, 1 / f.mesh.scale.y); // its quad is a size in metres, not in the town's own units
        }
      }
      // All are drawn at one distance with no depth test, so which lies over which is the order they are drawn in: the farthest first (round 33: a far castle was drawn over a near hill).
      shown.sort((a, b) => b.d - a.d).forEach(({ f }, i) => {
        f.mesh.renderOrder = -999 + i * 0.5;
        if (f.glow) [f.glow.halo.renderOrder, f.glow.eyes.renderOrder] = [f.mesh.renderOrder - 0.25, f.mesh.renderOrder + 0.1]; // its halo behind it, its eyes over it
      });
    },
  };
}
