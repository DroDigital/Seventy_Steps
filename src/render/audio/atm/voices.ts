/**
 * Round 78, atmosphere: the night's own voices: far sounds by the hour and by the realm, the sea heard where the sea is, the wind where
 * it blows. One of the atmosphere audio hub's parts (render/audio/atmosphereAudio.ts): made once with the game's audio and updated each
 * frame, read-only on the simulation. The beds' own shaping (the hour, the shore, the exposure) is render/audio/ambience.ts's, from what
 * this part tells it (`PLACED`, render/audio/exposure.ts, and the clock); the far voices are placeVoices.ts's.
 */

import { getRegion } from '../../../data/regions';
import { phaseOf } from '../../../systems/clock';
import { engagedFights } from '../../../systems/bossFight';
import { roofedAt } from '../../../world/terrain';
import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';
import { PLACED, createExposure } from '../exposure';
import { createPlaceVoices, type Scene } from '../placeVoices';

const LOOK = 0.25; // seconds between looks at the ground and at the fights (the picture is not asked every frame)

export function createNightVoices(ctx: AtmAudioContext): AtmAudioPart {
  const { g } = ctx;
  const exposure = createExposure();
  const voices = createPlaceVoices(ctx, (at) => exposure.seaward(at));
  let last = -Infinity;
  let roofed = false;
  let fighting = false;
  let [realm, sea] = ['', false]; // whether the realm the investigator is in has a sea (the rest are islands in a void)
  return {
    update(_fx, seconds, _camera, paused) {
      const ow = g.overworld;
      const at = ow ? g.ecs.c.transform.get(g.player.id)?.pos : undefined;
      if (!ow || !at) {
        PLACED.on = false;
        return;
      }
      if (seconds - last >= LOOK || seconds < last) {
        last = seconds;
        roofed = roofedAt(at.x, at.z);
        fighting = engagedFights(g).length > 0;
      }
      const outdoors = !roofed;
      PLACED.on = outdoors;
      if ((ow.region ?? '') !== realm) [realm, sea] = [ow.region ?? '', getRegion(ow.region ?? '')?.biome.sea ?? false];
      if (!paused && outdoors) exposure.update(seconds, at, ctx.right, { sea, wind: !g.player.mount.active || g.player.mount.speed < 4 });
      const scene: Scene = { region: ow.region ?? null, phase: phaseOf(seconds), outdoors, held: paused || g.cutscene || fighting, weather: ow.weather.amount > 0.3 ? ow.weather.kind : 'clear', hushed: ctx.e.hushed };
      voices.update(seconds, scene);
    },
  };
}
