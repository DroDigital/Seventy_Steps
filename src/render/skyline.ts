/**
 * The realms' far silhouettes (playtest round 12; data/skylines.ts): Kadath's crowned peak, the Mountains of Madness, R'lyeh's city,
 * Yuggoth's towers, the Round Hills, the great horrors that stand on the horizon (round 26: they breathe, their halos and eyes in
 * titanGlow.ts), and (round 31) the neighbouring towns of the waking world, Devil Reef and the rest. The camera's far plane is 140 m, so each
 * is drawn just inside it, after the sky and behind everything else, at the bearing of where it truly stands, sized to the angle it would
 * fill from there (so it drifts as the investigator walks, no more than a far thing would), up to SKY.farAngle. Each realm's fade in as it
 * is entered; a dungeon's walls hide them, and the real world covers them where it stands (round 49: a town walked up to is seen as itself,
 * not cut off inside 1.5 of its distance). A failing mind sees a city of towers where there is none (`wrong`). Round 80: the far horizon
 * lives (horizonGlow.ts): a town's windows follow the night and wink, a glow lies over its roofs while they are lit, and a lamp turns on
 * Devil Reef and on Kingsport's head. Round 117: each is a form in the night's light and in the air of its realm, a paler land behind it
 * and a bank of mist at its foot (data/farLooks.ts, skylineMesh.ts, shaders/skylineFar.ts): it reads the sky's own uniforms, so the air laid
 * over it is the light of the sky behind it, and the world's moon, so its flanks are lit as the land's are. And it stands where it truly is
 * (shaders/farPlace.ts): at its true size, facing its realm, drawn in true perspective, so each part of it moves as far as it truly is and
 * its back layer stands behind it; a far town gives way, column by column, to the real one nearer than the far plane. Render only.
 */

import * as THREE from 'three';
import { FAR, farLookOf } from '../data/farLooks';
import { FOGS } from '../data/fogs';
import { BEAM, DOME, WINK, type LampDef } from '../data/horizonLife';
import { getRegion } from '../data/regions';
import { SKYLINES, type Silhouette } from '../data/skylines';
import { LIGHT, RENDER, SKY } from '../data/tuning';
import { phaseOf } from '../systems/clock';
import { regionRect } from '../world/worldMap';
import { beamAt, domeStrength, glowGeometry, glows, lampFor, lampPlace } from './horizonGlow';
import { ANOMALY } from './palette';
import { night, type RealmLook } from './realmLook';
import { SKYLINE_FRAG, SKYLINE_VERT } from './skylineShader';
import { layersOf, stripGeometry, veilsOf } from './skylineMesh';
import { titanGlow, type TitanGlow } from './titanGlow';
import { worldUniforms } from './worldMaterial';

const R = RENDER.far * 0.7; // metres from the camera they were drawn at (a lamp keeps the size on the sky it had there)
const OBLIQUE = (FAR.oblique * Math.PI) / 180;
const GLOWS = { amber: [1, 0.78, 0.46], cyan: [0.5, 0.95, 1], gold: [1, 0.86, 0.5] } as const;
/** The sky's uniforms a silhouette reads (sky.ts), so the air laid over it is the light of the sky behind it. */
const SKY_KEYS = ['uHorizon', 'uZenith', 'uMoonColor', 'uMoonDir', 'uHaze', 'uFogColor', 'uHour', 'uHourGlow', 'uHourDawn', 'uFlash', 'uOver'] as const;
type SkyUniforms = Record<(typeof SKY_KEYS)[number], THREE.IUniform>;

/** A silhouette's geometry, once for every skyline made (it never changes): its layers, veils, glow and lamp (round 80, 117). */
const built = new Map<string, { geometry: THREE.BufferGeometry; lampAt: { x: number; y: number } | null }>();
function shape(region: string, def: Silhouette, lamp?: LampDef): { geometry: THREE.BufferGeometry; lampAt: { x: number; y: number } | null } {
  const key = `${region}:${def.kind}:${def.seed}:${def.width}:${def.height}:${lamp ? 1 : 0}`;
  const had = built.get(key);
  if (had) return had;
  const look = farLookOf(region, def.kind);
  const { main, layers } = layersOf(def, look);
  const lampAt = lamp ? lampPlace(main, lamp) : null;
  const made = { geometry: glowGeometry(stripGeometry(layers), glows(def), lampAt, veilsOf(def.width, def.height, look)), lampAt };
  built.set(key, made);
  return made;
}

interface Far {
  mesh: THREE.Mesh;
  region: string;
  x: number;
  z: number;
  base: number;
  def: Silhouette;
  glow?: TitanGlow; // a titan's halo and eyes
  lit: boolean; // a town of lit windows: its glow over the sky (round 80)
  lamp?: LampDef; // and a lamp that turns on it
  face: readonly [number, number]; // the way it faces (round 117): toward the middle of its realm
}

export interface Skyline {
  update(camera: THREE.Camera, time: number, region: string | null, enclosed: boolean): void;
  /** How wrong the mind is, 0..1 (round 26): past 0.6, now and then, something stands on the horizon where nothing does, and is gone when looked for. */
  wrong(amount: number): void;
  /** What the air does to the far land (round 80): how closed in the sky is, 0..1 (the glow lies on the cloud; round 117: the far air thickens), and how far the mind has gone, 0..1 (the windows flicker). Set before `update`. */
  air(overcast: number, nerves: number): void;
}

/**
 * The way a far shape faces when seen from the way `to` (round 117): its own way `face` (toward its realm), turned toward the eye only as far
 * as it must be to stand within `most` radians of it, so it is never seen edge on. Both unit vectors across the ground (x, z).
 */
export function facing(face: readonly [number, number], to: readonly [number, number], most: number): [number, number] {
  const a = Math.atan2(face[0] * to[1] - face[1] * to[0], face[0] * to[0] + face[1] * to[1]);
  if (Math.abs(a) <= most) return [face[0], face[1]];
  const turn = a - Math.sign(a) * most;
  const [c, s] = [Math.cos(turn), Math.sin(turn)];
  return [face[0] * c - face[1] * s, face[0] * s + face[1] * c];
}

/** How much of the false landmark shows at `amount` of madness `since` seconds into its turn (it comes up slowly and goes at once). */
export const falseShown = (amount: number, since: number): number => Math.max(0, Math.min(1, (amount - 0.55) / 0.3)) * (since < 0 ? 0 : since < 6 ? since / 6 : since < 14 ? 1 : 0);

/** What every silhouette reads: the game's seconds, how far the mind has gone (round 80), the sky's light and the moon's (round 117). */
interface Shared {
  wink: { value: number };
  nerves: { value: number };
  sky: SkyUniforms;
}

/** The sky's uniforms for a skyline made without a sky (the tests): its own, set from the realm's look each frame. */
function ownSky(look: RealmLook): SkyUniforms {
  const v3 = (c: readonly number[]): { value: THREE.Vector3 } => ({ value: new THREE.Vector3(c[0], c[1], c[2]) });
  return { uHorizon: v3(look.now.horizon), uZenith: v3(look.now.zenith), uMoonColor: v3(look.now.moonColor), uMoonDir: { value: new THREE.Vector3(...LIGHT.nightMoonDir).normalize() }, uHaze: { value: 1 }, uFogColor: v3(look.now.haze), uHour: { value: new THREE.Vector4() }, uHourGlow: v3([0, 0, 0]), uHourDawn: v3([0, 0, 0]), uFlash: { value: 0 }, uOver: { value: 0 } };
}

/** The shader material a silhouette of `region` is drawn with: its realm's far colour in the night's light, melted into the sky behind it (round 117); its windows aglow in `glow`, its glow over the sky and its lamp's light (round 80). */
function silhouetteMaterial(tone: THREE.Vector3, region: string, alpha: { value: number }, def: Silhouette, shared: Shared, lamp?: LampDef): THREE.ShaderMaterial {
  const look = farLookOf(region, def.kind);
  return new THREE.ShaderMaterial({
    uniforms: {
      ...shared.sky,
      uColor: { value: tone }, uGlow: { value: new THREE.Vector3(...GLOWS[def.glow ?? 'amber']) }, uFade: { value: def.fade ?? 0 }, uLit: { value: def.lit ?? 0 }, uAlpha: alpha,
      uWink: shared.wink, uNerves: shared.nerves, uHurried: worldUniforms.uHurried,
      uDome: { value: new THREE.Vector3(0, DOME.across, DOME.up) }, // its strength (set each frame), how far it spreads across and up
      uLamp: { value: new THREE.Vector4() }, uLampCol: { value: new THREE.Vector3(...(lamp?.colour ?? [1, 1, 1])) }, uLampBox: { value: new THREE.Vector2(...BEAM.box).multiplyScalar(lamp?.size ?? 1) }, uPer: { value: new THREE.Vector2(1, 1) },
      uLightDir: worldUniforms.uLightDir, uLightColor: worldUniforms.uLightColor, uAmbient: worldUniforms.uAmbient, uMoonRef: { value: night.moon },
      uFogFar: worldUniforms.uFogFar, uFogAmount: worldUniforms.uFogAmount, // the world's fog: as it closes in, the far land recedes into the air (2026-11-25)
      uSize: { value: new THREE.Vector2(def.width, def.height) }, uHandoff: { value: new THREE.Vector2(...(def.kind === 'town' ? FAR.handoff : [0, 0])) }, uBand: { value: new THREE.Vector2(...(def.kind === 'peak' ? [2, 3] : [0.3, 0.85])) }, uWallFoot: { value: def.kind === 'peak' ? 0.7 : -1 },
      uAir: { value: new THREE.Vector4((FOGS[region]?.haze ?? 0.0035) * FAR.air, FAR.ground, FAR.groundRise, 0) },
      uLook: { value: new THREE.Vector4(look.grain, look.snow, look.snowline, look.wet) },
      uMist: { value: new THREE.Vector4(look.mist, look.mistRise + FAR.mistShare * def.height, look.cloud, look.cloudAt) },
      uWind: { value: 0 }, uSeed: { value: def.seed % 97 },
    },
    vertexShader: SKYLINE_VERT,
    fragmentShader: SKYLINE_FRAG,
    // Drawn with the opaque, so its render order puts it after the sky and before the world (round 19: as a transparent it came after the
    // world and, testing no depth, was painted over it, the investigator and all, the mist ghosting what it hid): blended over the sky by
    // hand, the sky's alpha kept. Round 80: the blend is premultiplied (the outline outputs its colour already scaled by its alpha, the glow
    // and the lamp a light with no alpha at all, which adds): the same blend for the outline, and one draw for a town, its glow and its lamp.
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

export function createSkyline(scene: THREE.Scene, look: RealmLook, skyUniforms?: Record<string, THREE.IUniform>): Skyline {
  const tone = new THREE.Vector3(...look.now.far);
  const alpha = new Map<string, { value: number }>();
  const fars: Far[] = [];
  const own = skyUniforms ? null : ownSky(look);
  const sky = (own ?? Object.fromEntries(SKY_KEYS.map((k) => [k, skyUniforms![k]]))) as SkyUniforms;
  const shared: Shared = { wink: { value: 0 }, nerves: { value: 0 }, sky };
  const mood = { overcast: 0 }; // what the air is doing to the far land (round 80: `air`)
  for (const [id, list] of Object.entries(SKYLINES)) {
    const region = getRegion(id);
    if (!region) continue;
    const a = { value: 0 };
    alpha.set(id, a);
    const rc = regionRect(region);
    const [cx, cz] = [(rc.x0 + rc.x1) / 2, (rc.z0 + rc.z1) / 2];
    for (const [index, def] of list.entries()) {
      const lamp = lampFor(id, index);
      const outline = shape(id, def, lamp);
      const material = silhouetteMaterial(tone, id, a, def, shared, outline.lampAt ? lamp : undefined);
      const mesh = new THREE.Mesh(outline.geometry, material);
      mesh.renderOrder = -999; // after the sky, before the world
      mesh.frustumCulled = false;
      mesh.visible = false;
      scene.add(mesh);
      const glow = def.kind === 'titan' ? titanGlow(a, [...[ANOMALY.green, ANOMALY.purple, ANOMALY.magenta][def.seed % 3]] as [number, number, number], def.seed) : undefined;
      if (glow) mesh.add(glow.halo, glow.eyes);
      const [x, z] = [rc.x0 + def.at[0], rc.z0 + def.at[1]];
      const away = Math.max(1e-6, Math.hypot(cx - x, cz - z));
      fars.push({ mesh, region: id, x, z, base: region.biome.base - 2, def, glow, lit: glows(def), lamp: outline.lampAt ? lamp : undefined, face: [(cx - x) / away, (cz - z) / away] });
    }
  }
  const cam = new THREE.Vector3();
  let last = -1;
  // The false landmark: a city of towers where there is none, risen for a while at a bearing of its own.
  const fake = { value: 0 };
  const fakeDef: Silhouette = { kind: 'towers', at: [0, 0], width: 700, height: 240, seed: 97 };
  const fakeMesh = new THREE.Mesh(shape('beyond', fakeDef).geometry, silhouetteMaterial(tone, 'beyond', fake, fakeDef, shared));
  (fakeMesh.material as THREE.ShaderMaterial).uniforms.uFogAmount = { value: 0 }; // the fog a failing mind closes in does not hide what that mind sees
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
      if (own) {
        own.uHorizon.value.set(...look.now.horizon);
        own.uZenith.value.set(...look.now.zenith);
        own.uFogColor.value.set(...look.now.haze);
      }
      camera.getWorldPosition(cam);
      if (madness < 0.55 || enclosed) fake.value = 0;
      else {
        if (time - turnAt > 14 + 10 * Math.random() && time - turnAt > 14) [turnAt, bearing] = [time, Math.random() * Math.PI * 2]; // a new one, somewhere else
        fake.value = falseShown(madness, time - turnAt);
      }
      fakeMesh.visible = fake.value > 0.01;
      if (fakeMesh.visible) { // far off, vast, and keeping its bearing as the investigator walks: it is not anywhere
        const far = 2500;
        fakeMesh.position.set(cam.x + Math.sin(bearing) * far, cam.y - (far * 6) / R, cam.z + Math.cos(bearing) * far);
        fakeMesh.scale.set(fakeDef.width * 6, fakeDef.height * 6, 1);
        fakeMesh.rotation.set(0, Math.atan2(-Math.sin(bearing), -Math.cos(bearing)), 0);
        (fakeMesh.material as THREE.ShaderMaterial).uniforms.uAir.value.w = mood.overcast;
      }
      const shown: { f: Far; d: number }[] = [];
      for (const f of fars) {
        const [dx, dz] = [f.x - cam.x, f.z - cam.z];
        const d = Math.hypot(dx, dz);
        // Never hidden for being near: the silhouettes are drawn first, so what stands where it stands (the sea, the world, a nearer town) draws over it (round 49: it vanished inside 1.5 R).
        f.mesh.visible = alpha.get(f.region)!.value > 0.01 && d > 1; // (a bearing needs a distance)
        if (!f.mesh.visible) continue;
        shown.push({ f, d });
        const [ux, uz] = [dx / d, dz / d];
        // Round 117: where it truly stands, at its true size, facing its realm (turned toward the eye no more than it must be): drawn in true perspective (shaders/farPlace.ts), each part of it moves as far as it is
        const [fx, fz] = facing(f.face, [-ux, -uz], OBLIQUE);
        f.mesh.position.set(f.x, f.base, f.z);
        f.mesh.rotation.set(0, Math.atan2(fx, fz), 0);
        f.glow?.blink(time);
        const breath = f.def.kind === 'titan' ? 1 + 0.012 * Math.sin(time * 0.35 + f.def.seed) : 1; // the great ones breathe: slowly, and not quite as a thing should
        f.mesh.scale.set(f.def.width * (2 - breath), f.def.height * breath, 1);
        const u = (f.mesh.material as THREE.ShaderMaterial).uniforms;
        u.uAir.value.w = mood.overcast; // the far air thickens as the weather closes the sky (shaders/skylineFar.ts)
        const wind = FOGS[f.region]?.wind ?? [0, 0];
        u.uWind.value = (wind[0] * -uz + wind[1] * ux) * FAR.mistWind; // the realm's wind across it, to its right
        if (f.lit) u.uDome.value.x = domeStrength(f.def, d, phaseOf(time), mood.overcast, time) * alpha.get(f.region)!.value; // the glow over its roofs, as many of its windows as are lit (round 80)
        if (f.lamp) {
          const b = beamAt(f.lamp, time);
          u.uLamp.value.set(b.flash, b.sweep, b.shaft, 0);
          u.uPer.value.set(d / R / f.mesh.scale.x, d / R / f.mesh.scale.y); // its quad is a size in metres at the distance the far land was drawn at, as large on the sky as ever
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
