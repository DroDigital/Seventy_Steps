/**
 * Round 80, atmosphere: each realm's own air (data/airFields.ts). The open world's air was empty between spells of weather: now the
 * specks of the realm the investigator stands in (ash, leaves, diamond dust, spores, sand, notes) are born about them on a ring, more
 * toward where the camera looks, and drift with the realm's wind rolled by the same gusts the grass bends in. The leaves fall
 * where trees stand, the mist's wisps follow its thickness and the Fog setting, rain washes the dry ones from the air, and a mind
 * far gone sees what falls rise. Under a roof, in a cutscene's close shot (nothing is born near the lens) and within a court that
 * has an air of its own, nothing. Render only: it reads the simulation and writes none of it.
 */

import type * as THREE from 'three';
import { AIR_FIELD, AIR_FIELDS, type AirLayer } from '../data/airFields';
import { FOGS } from '../data/fogs';
import { WORLD } from '../data/tuning';
import { darkOf, phaseOf } from '../systems/clock';
import type { Game } from '../systems/components';
import { madnessOf } from '../systems/sanity';
import { worldLayout } from '../world/placements';
import { gustAt, KINDS, toneOf } from './airKinds';
import { FEEL } from './feel';
import type { Rgb } from './palette';
import type { Particles } from './particles';
import { MIST, woodOf } from './volumetricFog';
import { worldUniforms } from './worldMaterial';

const CAP = 0.1; // seconds: the most a slow frame is counted for
const TRIES = 4; // places tried for each speck before it is let go

export interface AmbientAir {
  update(camera: THREE.Camera, time: number, hidden: boolean): void;
  /** Fills the air as it would be `seconds` on, at once (the debug hook, for a still taken at a slow frame rate: the pool's own clock ticks only as fast as the frames do). */
  warm(camera: THREE.Camera, time: number, seconds: number): void;
  /** Specks of ours in the air now. */
  readonly alive: number;
}

/** What a layer's rate is worth now: the hour, the mist, the gusts and the rain have their say (the wood is asked of each speck's place). */
export function rateOf(layer: AirLayer, f: { dark: number; mist: number; gust: number; rain: number; shake: number }): number {
  let k = layer.rate;
  if (layer.by === 'dark') k *= 0.25 + 0.75 * f.dark;
  else if (layer.by === 'mist') k *= Math.min(1.6, f.mist);
  else if (layer.by === 'gust') k *= 0.35 + 1.3 * f.gust;
  if (layer.dry) k *= 1 - f.rain;
  if (layer.fast && f.shake <= 0) k = 0; // (no streaks where the camera is asked to keep still)
  return k;
}

export function createAmbientAir(g: Game, particles: Particles): AmbientAir {
  const withAir = worldLayout().arenas.filter((a) => a.air);
  const deaths = new Float64Array(AIR_FIELD.alive + 8); // when each of ours leaves the air: ours are counted, the pool is shared
  let [n, last, region] = [0, -1, ''];
  let owed: number[] = [];
  let tones: Rgb[] = [];
  const ground = (x: number, z: number): number => (particles.ground ?? g.world.ground)(x, z);

  /** One step of `dt` seconds at `time`; `aged`: the specks are scattered along their lives, as a field some seconds old. */
  const step = (camera: THREE.Camera, time: number, hidden: boolean, dt: number, aged = false): void => {
    let m = 0;
    for (let i = 0; i < n; i++) if (deaths[i]! > time) deaths[m++] = deaths[i]!;
    n = m;
    const ow = g.overworld;
    const me = g.ecs.c.transform.get(g.player.id)?.pos;
    if (hidden || !ow || !me || dt <= 0) return;
    const field = AIR_FIELDS[ow.region ?? ''];
    if (!field) return;
    if (region !== ow.region) {
      region = ow.region ?? '';
      owed = field.map(() => 0);
      tones = field.map((l) => toneOf(region, l));
    }
    if (withAir.some((a) => Math.hypot(a.x - me.x, a.z - me.z) < a.radius + AIR_FIELD.stand)) return; // a court with an air of its own keeps it
    const wind = FOGS[region]?.wind ?? FOGS.hub!.wind;
    const w = ow.weather;
    const f = { dark: darkOf(phaseOf(time)), mist: MIST.thickness / 0.05, gust: gustAt(worldUniforms.uTime.value, me.x, me.z), rain: w && (w.kind === 'rain' || w.kind === 'storm') ? w.amount : 0, shake: FEEL.shake };
    const mad = madnessOf(g.mind.sanity) > AIR_FIELD.madness;
    const e = camera.matrixWorld.elements;
    const fl = Math.hypot(e[8]!, e[10]!) || 1;
    const [fx, fz] = [-e[8]! / fl, -e[10]! / fl]; // where the camera looks, along the ground
    const [r0, r1] = AIR_FIELD.ring;
    const cam = camera.position;
    const sway = 0.8 + 0.2 * worldUniforms.uWind.value; // a gale carries them harder
    for (let li = 0; li < field.length; li++) {
      const layer = field[li]!;
      let due = owed[li]! + rateOf(layer, f) * dt;
      for (; due >= 1; due--) {
        if (n >= AIR_FIELD.alive) { due = 0; break; }
        for (let t = 0; t < TRIES; t++) {
          const [a, d] = [Math.random() * Math.PI * 2, r0 + (r1 - r0) * Math.random()];
          const [sx, sz] = [Math.sin(a), Math.cos(a)];
          if (sx * fx + sz * fz < AIR_FIELD.cone && Math.random() > AIR_FIELD.behind) continue; // mostly where the camera looks
          const [x, z] = [me.x + sx * d, me.z + sz * d];
          const floor = ground(x, z);
          if (!layer.sea && floor < WORLD.seaLevel - 0.2) continue; // (not over open water)
          if (layer.by === 'wood' && Math.random() > AIR_FIELD.wood + (1 - AIR_FIELD.wood) * woodOf(region, x, z)) continue; // leaves fall where trees stand
          const gust = gustAt(worldUniforms.uTime.value, x, z);
          const k = (0.6 + 0.8 * gust) * sway;
          const b = KINDS[layer.kind](Math.random, { x: wind[0] * k, z: wind[1] * k, gust }, layer.size);
          const base = Math.max(floor, WORLD.seaLevel);
          const along = aged ? Math.random() : 0; // how far through its life a speck of an aged field is
          const y = base + (b.falls ? b.lift * (1 - 0.9 * along) : b.lift);
          if (Math.hypot(x - cam.x, y - cam.y, z - cam.z) < b.clear) continue;
          const spec = { x, y, z, color: tones[li]!, ...b.spec, glow: layer.glow ?? b.spec.glow, life: b.spec.life * (1 - 0.9 * along) };
          if (b.falls && mad) { // a failing mind sees the fall go up (the picture's; nothing is written)
            spec.vy = -(spec.vy ?? 0) + 0.2;
            spec.gravity = -(spec.gravity ?? 0);
          } else if (b.falls) Object.assign(spec, { floor: base });
          particles.spawn(spec);
          deaths[n++] = time + spec.life;
          break;
        }
      }
      owed[li] = due;
    }
  };

  return {
    get alive() {
      return n;
    },
    update(camera, time, hidden) {
      const dt = last < 0 ? 0 : Math.min(CAP, Math.max(0, time - last));
      last = time;
      step(camera, time, hidden, dt);
    },
    warm(camera, time, seconds) {
      n = 0; // (what is left of another place is far away)
      for (let s = 0; s < seconds; s += CAP) step(camera, time, false, CAP, true);
    },
  };
}
