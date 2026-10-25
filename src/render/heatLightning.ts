/**
 * Heat lightning (round 80; The Dunwich Horror: flashes on the hilltops with no storm): on a clear night, in the regions that know thunderstorms,
 * now and then a bank of cloud low on the far horizon flickers silently with a sheet of light, two to four pulses, and is dark again. Never twice
 * within forty-five seconds, never in a thunderstorm's weather (lightning.ts has that), never when the Flashes setting is off (its dimmer settings
 * melt the pulses into one soft swell, as lightning's do), and never in the eye's line: at least some thirty degrees off where the camera looks.
 * Silent, as heat lightning is: too far for thunder. The sky's own glow only; nothing near is lit. Render only.
 */

import * as THREE from 'three';
import { HEAT } from '../data/skyAir';
import { WEATHER } from '../data/tuning';
import type { Game } from '../systems/components';
import { FEEL } from './feel';
import { flicker } from './lightning';
import type { SkyAtm } from './skyForce';

const between = ([lo, hi]: readonly [number, number], r: number): number => lo + (hi - lo) * r;

/** Whether the sky is one that heat lightning plays in: a region that knows thunderstorms, clear weather, no ceiling of cloud, outside, a mind at rest from cutscenes, and the Flashes setting not off. */
export function heatWeather(region: string | null, weather: { kind: string; amount: number } | undefined, over: number, flashes: number): boolean {
  if (!region || !WEATHER.regions[region]?.storm || flashes <= 0 || over >= 0.05) return false;
  return !weather || weather.kind === 'clear' || weather.amount < HEAT.clear;
}

/** A burst: when each pulse begins (seconds from the burst's start) and how bright it is. */
export function burstOf(rnd: () => number): { at: number; level: number }[] {
  const n = Math.round(between(HEAT.pulses, rnd()));
  const level = between(HEAT.strength, rnd());
  let at = 0;
  return Array.from({ length: n }, () => {
    const p = { at, level: level * (0.7 + 0.3 * rnd()) };
    at += between(HEAT.gap, rnd());
    return p;
  });
}

/** The light of a burst begun at `start`, `t` seconds in: the pulses' flickers added, held under 1. */
export const burstLight = (pulses: readonly { at: number; level: number }[], t: number, flashes: number): number => Math.min(1, pulses.reduce((sum, p) => sum + p.level * flicker(t - p.at, flashes), 0));

export interface HeatLightning {
  update(camera: THREE.Camera, time: number, region: string | null, enclosed: boolean): void;
}

export function createHeatLightning(g: Game, sky: THREE.Mesh, atm: SkyAtm, rnd: () => number = Math.random): HeatLightning {
  const heat = (sky.material as THREE.ShaderMaterial).uniforms.uHeat.value as THREE.Vector4;
  let [next, start, az, place] = [NaN, -Infinity, 0, null as string | null];
  let pulses: { at: number; level: number }[] = [];
  const dir = new THREE.Vector3();
  return {
    update(camera, time, region, enclosed) {
      const f = atm.force.heat;
      if (f) {
        atm.heat = f.level;
        heat.set(f.az, f.level, HEAT.width, 0);
        return;
      }
      if (region !== place) [place, next] = [region, NaN]; // a journey starts the wait afresh
      const w = g.overworld?.weather;
      const ok = !enclosed && !!g.overworld && !g.cutscene && heatWeather(region, w, atm.over, FEEL.flashes);
      if (!ok) {
        next = NaN; // the weather turned, or the roof closed: the next burst is waited for anew
        atm.heat = 0;
        heat.y = 0;
        return;
      }
      if (Number.isNaN(next)) next = time + between(HEAT.first, rnd());
      else if (time >= next) {
        next = time + between(HEAT.every, rnd());
        pulses = burstOf(rnd);
        start = time;
        camera.getWorldDirection(dir);
        const eye = Math.atan2(dir.x, dir.z);
        const off = HEAT.away + (Math.PI - HEAT.away) * rnd(); // at least this far from where the eye looks, to either side
        az = eye + (rnd() < 0.5 ? -off : off);
      }
      const level = burstLight(pulses, time - start, FEEL.flashes);
      atm.heat = level;
      heat.set(az, level, HEAT.width, 0);
    },
  };
}
