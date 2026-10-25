/**
 * Round 78, atmosphere: each realm's own air: ambient particle fields, weather skins by realm (render/weather.ts), breath in the cold, motes in the lantern's light. One of the atmosphere hub's parts (render/atmosphere.ts):
 * made once with the world's life and updated each drawn frame, outside the simulation and read-only on it.
 */

import type * as THREE from 'three';
import type { AtmContext, AtmPart } from '../atmosphere';
import { createAmbientAir } from '../ambientAir';
import { createBreath } from '../breath';
import { createLanternAir } from '../lanternAir';

export function createRealmAir(ctx: AtmContext): AtmPart {
  const field = createAmbientAir(ctx.g, ctx.parts.particles);
  const breath = createBreath(ctx.g, ctx.parts.particles);
  const lantern = createLanternAir(ctx.g, ctx.parts.particles);
  const eye = { camera: null as THREE.Camera | null, time: 0 }; // (the last frame's, for the debug hook)
  // (`?debug`: `airWarm(seconds)` fills the air as it would be some seconds on, and `airBreath()` has the next frame breathe out: for a still taken at a frame rate far below the game's)
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug')) Object.assign(globalThis, { airWarm: (seconds = 12) => void (eye.camera && field.warm(eye.camera, eye.time, seconds)), airBreath: () => breath.rush() });
  return {
    update(camera, time, enclosed) {
      [eye.camera, eye.time] = [camera, time];
      const hidden = enclosed || !ctx.g.overworld;
      field.update(camera, time, hidden);
      breath.update(camera, time, hidden);
      if (ctx.g.overworld) lantern.update(camera, time, enclosed); // (not in an arena's fight: the horror's court has its own air)
    },
  };
}
