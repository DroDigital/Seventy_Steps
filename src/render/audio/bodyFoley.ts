/**
 * The body, heard (round 80): the character of the ground laid over each recorded footfall (snow's crust, sand's hush, gravel, leaves, grass,
 * mud, boards that creak now and then, flesh), the coat swinging as a stride begins and now and then at a run, the pack's leather shifting at a
 * run (round 83: no buckle, no lantern's bail; nothing metal rings as he walks), the breath (panting after a sprint, a gasp when the bar empties, ragged and wet near death, a slow exhale in the cold), and, in a failing mind,
 * a second step that follows a moment after one's own. It keeps the foley's stride (render/footfalls.ts) so the recipe falls on the recording.
 * Read-only on the simulation; nothing here is heard by the creatures.
 */

import { BODY, BREATH, BOARD_CREAK, FOOT_GAIN, GEAR, STEP_LAYERS, STEP_VOICE } from '../../data/footSounds';
import { SAMPLE_SETS } from '../../data/samples';
import type { Sound } from '../../data/sounds';
import { darkOf, phaseOf } from '../../systems/clock';
import type { Game } from '../../systems/components';
import { fighting } from '../../systems/sanity';
import { roofedAt } from '../../world/terrain';
import { HEART } from '../feel';
import { createStrideClock, followed, type Footfall } from '../footfalls';
import { surfaceAt } from './foley';
import { coldAt, indoorLift, stepLevel, stepSetOf } from './footing';
import type { Sampler } from './sampler';

type Recipe = (key: string, sound: Sound, o?: { at?: null; gain?: number; vary?: number; pan?: number }) => boolean;

export interface BodyFoley {
  /** Sounds what the body did since the last look, at `seconds` of render time; `stress` is the mind's, as the FX setting lets it be felt. */
  update(seconds: number, stress: number): void;
}

const between = (r: readonly [number, number], u: number): number => r[0] + (r[1] - r[0]) * u;

export function createBodyFoley(g: Game, recipe: Recipe, sampler: Pick<Sampler, 'play'>, rand: () => number = Math.random): BodyFoley {
  const clock = createStrideClock(g);
  let [strides, wasMoving, stoppedAt, sprintFor, longestWalk] = [0, false, -1e9, 0, 0];
  let underfoot: Footfall['ground'] = 'dirt';
  let lifted = 1; // the lift of the room underfoot (round 86)
  let [lastSeconds, ragged, cold, coldCheck, coldNext, gasped] = [-1, 0, 0, -1e9, 0, false];
  const soft = (key: string, sound: Sound, gain: number, vary = 1): boolean => recipe(key, sound, { at: null, gain, vary });
  /** The step of a mind that is followed: duller, to one side, a moment late. */
  const phantom = (ground: Footfall['ground'], delay: number, lift: number): void => void sampler.play(SAMPLE_SETS[stepSetOf(ground)], { gain: FOOT_GAIN.phantom * lift, pan: (rand() < 0.5 ? -1 : 1) * BODY.phantom.pan, pitch: BODY.phantom.pitch, lowpass: BODY.phantom.lowpass, delay });

  function stride(f: Footfall, stress: number): void {
    strides++;
    underfoot = f.ground;
    lifted = indoorLift(surfaceAt(g, f.body.x, f.y, f.body.z));
    const layer = STEP_LAYERS[f.ground];
    const pace = stepLevel(f.speed) * (f.foot === 1 ? 1 : STEP_VOICE.offFoot) * lifted; // (the recording's level, so the recipe keeps under it; in a dungeon's room lifted with it, round 86)
    if (layer) soft(`foot:${f.ground}`, layer, FOOT_GAIN.steps * pace, 0.9);
    if (f.ground === 'boards' && strides % BODY.creakEvery === 0) soft('foot:creak', BOARD_CREAK, FOOT_GAIN.steps * pace);
    const sprint = clock.walking.sprint;
    if (sprint && strides % BODY.coatEvery === 0) soft('gear:coat', GEAR.coat, FOOT_GAIN.gear * 0.8);
    if (sprint && strides % BODY.satchelEvery === 0) soft('gear:satchel', GEAR.satchel, FOOT_GAIN.gear * 0.8);
    const p = g.mind.band === 'unmoored' ? BODY.phantom.unmoored : BODY.phantom.fractured;
    if (followed(g.mind.band, stress) && !fighting(g) && rand() < p) phantom(f.ground, between(BODY.phantom.delay, rand()), lifted);
  }

  /** The breath: what the body does of itself, never in a scene, a rest or a talk. */
  function breathe(seconds: number, dt: number): void {
    const me = g.ecs.c.transform.get(g.player.id)?.pos;
    const stamina = g.ecs.c.stamina.get(g.player.id);
    if (!me || g.cutscene || g.player.kneeling || g.player.listening !== null || g.player.mount.active || g.ecs.c.dead.has(g.player.id)) return;
    const share = stamina ? stamina.value / Math.max(1, stamina.max) : 1;
    if (share < BODY.panting.from && !gasped) {
      soft('body:gasp', BREATH.gasp, FOOT_GAIN.breath);
      gasped = true;
    } else if (share > BODY.panting.again) gasped = false;
    if (HEART.need > BODY.nearDeath) {
      ragged -= dt;
      if (ragged <= 0) {
        ragged = 2.8 - 1.7 * HEART.need + 0.3 * rand();
        soft('body:ragged', BREATH.ragged, FOOT_GAIN.breath * (0.55 + 0.45 * HEART.need));
      }
    } else ragged = 0.6;
    if (seconds - coldCheck > 1) { // the air: the realm's cold, the hour's dark, rain, a roof (looked at once a second)
      coldCheck = seconds;
      const ow = g.overworld;
      cold = ow ? coldAt(ow.region ?? null, darkOf(phaseOf(seconds)), ow.weather.kind === 'rain' || ow.weather.kind === 'storm', roofedAt(me.x, me.z)) : 0;
    }
    if (cold >= BODY.coldFrom && !fighting(g) && !(clock.walking.moving && clock.walking.sprint)) {
      if (coldNext === 0) coldNext = seconds + between(BODY.coldEvery, rand());
      if (seconds >= coldNext) {
        coldNext = seconds + between(BODY.coldEvery, rand()) * (g.mind.band === 'unmoored' ? 0.5 + rand() : 1);
        soft('body:exhale', BREATH.exhale, FOOT_GAIN.breath * (0.45 + 0.4 * cold));
      }
    } else coldNext = 0;
  }

  return {
    update(seconds, stress) {
      const dt = lastSeconds < 0 ? 0 : Math.min(0.25, Math.max(0, seconds - lastSeconds));
      lastSeconds = seconds;
      const f = clock.step(seconds);
      const w = clock.walking;
      if (w.moving && !wasMoving && seconds - stoppedAt > BODY.coatAfter) soft('gear:coat', GEAR.coat, FOOT_GAIN.gear * 0.8); // setting off
      if (w.moving) {
        sprintFor = w.sprint ? sprintFor + dt : 0;
        longestWalk = Math.max(longestWalk, w.for);
      } else if (wasMoving) { // pulled up (a scene, a ride, a death, a roll or a blow ends the clock's walk too, and that is not the walker stopping: no breath, no step)
        stoppedAt = seconds;
        const interrupted = g.cutscene || g.player.mount.active || g.ecs.c.dead.has(g.player.id) || g.ecs.c.actor.get(g.player.id)?.move != null;
        if (!interrupted && sprintFor >= BODY.sprintBreath) soft('body:pant', BREATH.pant, FOOT_GAIN.breath * Math.min(1, 0.5 + sprintFor / 8));
        if (!interrupted && longestWalk >= BODY.phantom.stopAfter && followed(g.mind.band, stress) && !fighting(g) && rand() < BODY.phantom.stopChance) phantom(underfoot, BODY.phantom.stopDelay, lifted); // one more, when no one walks
        sprintFor = longestWalk = 0;
      }
      wasMoving = w.moving;
      if (f) stride(f, stress);
      breathe(seconds, dt);
    },
  };
}
