/**
 * The open world's own life (playtest round 18: nothing in it moved of itself), drawn over the
 * simulation: its small creatures (fauna.ts), what crosses its sky (skyLife.ts), the lightning where
 * storms roll (lightning.ts), and the glimmer of things worth finding (glints.ts). Made and updated
 * in one place, so the frame loop (main.ts) holds a line for it. Read-only on the simulation.
 */

import type * as THREE from 'three';
import type { Game } from '../systems/components';
import { madnessOf } from '../systems/sanity';
import { seaChopNow } from '../systems/seaChop';
import type { GameAudio } from './audio/gameAudio';
import { createArenaAir } from './arenaAir';
import { createBeacons } from './beacons';
import { createPoiFx } from './poiFx';
import { createRodFx } from './rodFx';
import type { Beams } from './beams';
import type { GroundFx } from './groundFx';
import { createSkyStrikeFx, type SkyStrikeFx } from './skyStrikeFx';
import { SEA } from './sea';
import { createBossFog } from './bossFog';
import { createDemoMist } from './demoMist';
import { createChimneys } from './chimneys';
import { createDoors } from './doorViews';
import { createFauna, type Fauna } from './fauna';
import { createCandleViews } from './candleViews';
import { createGlints } from './glints';
import { LIGHT_NERVES } from './worldLights';
import { createLightning } from './lightning';
import type { Particles } from './particles';
import { createNightFx } from './nightFx';
import { createOmenFx } from './omenFx';
import { createPresence } from './presence';
import type { PostPass } from './postPass';
import { createSkyLife } from './skyLife';
import { createWatchers } from './watchers';
import { createDragTentacle } from './dragTentacle';
import { createSplashFx } from './splashFx';
import { createTentacles } from './tentacles';
import { createWayFx } from './wayFx';
import { createVigilMarks } from './vigilMarks';
import { createWayViews } from './wayViews';
import { createWeatherFx } from './weather';
import type { Skyline } from './skyline';
import type { SpriteAtlas } from './sprites/atlas';

export interface WorldLife {
  /** Each drawn frame, once the night's light is set; `enclosed`: under a dungeon's roof; `alpha`: how far the picture is from the last step to the next, as the bodies are drawn at it. */
  update(camera: THREE.Camera, time: number, enclosed: boolean, alpha: number, gloom?: number): void;
  readonly fauna: Fauna;
}

export interface LifeParts {
  sky: THREE.Mesh; // the sky dome, whose haze the lightning brightens
  post: PostPass; // the post pass, whose mist it lights
  sheet: { atlas: SpriteAtlas; texture: THREE.Texture }; // the creatures' sprites, for the great winged things
  skyline: Skyline; // the far silhouettes, given a false one by a failing mind (round 26)
  particles: Particles; // dust and grit (round 26: what a colossus throws up)
  ground: GroundFx; // the marks on the ground, where a bolt of lightning leaves its scar and a ring of light warns of it (round 52)
  beams: Beams; // whose ribbons draw a bolt of lightning
}

export function createWorldLife(scene: THREE.Scene, g: Game, audio: GameAudio, parts: LifeParts): WorldLife {
  const fauna = createFauna(scene, g, (voice, at) => audio.cry(voice, at));
  const sky = createSkyLife(scene, g, fauna, parts.sheet, (voice, at) => audio.cry(voice, at, 1.4));
  let eye: THREE.Camera | null = null; // the camera of the last frame, for the bolts drawn on the far ground
  let strikes: SkyStrikeFx | null = null;
  const lightning = createLightning(parts.sky, parts.post, (gain) => audio.thunder(gain), (far) => void (eye && strikes?.distant(far, eye)));
  strikes = createSkyStrikeFx(g, parts.particles, parts.ground, parts.beams, lightning); // round 52: a thunderstorm's bolts on the ground, a ring of light before them
  const glints = createGlints(scene, g);
  const candles = createCandleViews(scene, g); // the candles before the horrors' fog (round 45)
  const watchers = createWatchers(scene, g);
  const omens = createOmenFx(g, parts.sky, parts.post, audio);
  const presence = createPresence(g, parts.particles, audio); // round 26: what a colossus does to the ground and the air
  const beacons = createBeacons(scene, g); // round 26: pale columns over the Elder Signs not yet found
  const poiFx = createPoiFx(scene, g); // round 61: a place's wrongness, drawn where it stands
  const night = createNightFx(g, parts.sky, parts.post); // round 26: the moon's course, and the grey of the last hour
  const weather = createWeatherFx(scene, g, parts.particles); // round 26: rain, gale and motes
  const deep = createTentacles(scene, g, parts.particles, audio); // round 30: now and then, far out, a tentacle in the water
  const drag = createDragTentacle(scene, g, parts.particles); // round 55: the one that takes hold of the investigator in the water...
  const splash = createSplashFx(g, parts.particles); // ...and what the water throws up as they go in
  const doors = createDoors(scene, g, audio); // round 27: a door in each doorway that has one
  const fog = createBossFog(scene, g, parts.particles, audio); // round 27: a wall of mist before each horror
  const demoMist = g.demo ? createDemoMist(scene) : null; // round 56: the demo's edge, a bank of mist
  const chimneys = createChimneys(parts.particles); // round 34: smoke from the chimneys of the houses that stand
  const air = createArenaAir(g, parts.particles); // round 61: what drifts in an arena's air
  const ways = createWayViews(scene, g); // round 62: the plates, tablets and lights of the trails to the open arenas
  const wayFx = createWayFx(g, parts.particles, parts.ground); // ...and their rings, bursts and blight
  createVigilMarks(g, parts.ground); // round 64: a vigil's ring, and how far it is kept
  const rods = createRodFx(g, parts.particles, parts.beams, lightning); // round 67: the bolts that leap to a walled court's lightning rods
  return {
    fauna,
    update(camera, time, enclosed, alpha, gloom) {
      eye = camera;
      SEA.chop.value = seaChopNow(g); // the wind raises the sea, slowly (round 30; the simulation eases it, round 55: a body in the water floats on what is drawn). Before anything is set on the water: the tentacles are placed on the surface the sea is drawn at
      strikes?.update(time);
      const outside = !enclosed && !!g.overworld;
      fauna.update(camera, time, !outside);
      sky.update(camera, time, !outside);
      lightning.update(time, g.overworld?.region ?? null, !outside, g.overworld?.weather);
      beacons.update(camera, time, !outside);
      poiFx.update(camera, time, !outside);
      night.update(time, enclosed, gloom);
      LIGHT_NERVES.madness = madnessOf(g.mind.sanity); // the flames waver harder in a failing mind's world
      weather.update(camera, time, !outside);
      chimneys.update(camera, time, !outside);
      air.update(camera, time, !outside);
      ways.update(camera.position, time, !outside);
      wayFx.update(time, camera.position);
      rods.update(camera.position, time, !outside);
      deep.update(camera, time, !outside);
      drag.update(time, alpha);
      splash.update(time);
      fog.update(camera, time, !g.overworld);
      demoMist?.update(camera, time, !outside);
      doors.update(camera, time, !g.overworld);
      glints.update(camera.position, time, !g.overworld);
      candles.update(camera.position, time, !g.overworld);
      presence.update(camera, time);
      omens.update(time);
      parts.skyline.wrong(Math.min(1, Math.max(0, 1 - g.mind.sanity / 100)));
      watchers.update(camera, time, !outside, () => audio.sample('whisper', { gain: 0.5, pitch: 0.8 })); // round 26: what a failing mind makes of the dark
    },
  };
}
