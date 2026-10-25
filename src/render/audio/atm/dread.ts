/**
 * Round 78, atmosphere: the failing mind heard: ringing ears, a step behind that is not the investigator's, the lantern guttering
 * out; and the breath of a colossus that sleeps. One of the atmosphere audio hub's parts (render/audio/atmosphereAudio.ts): made once
 * with the game's audio and updated each frame, read-only on the simulation. The ringing and the lantern are audio/mindEars.ts, the
 * tide of the high end audio/mindTide.ts (read by gameAudio's muffle), the tread audio/follower.ts, the breath audio/breathBed.ts (its
 * picture, render/sleeperBreath.ts). Every one follows `fx.stress` or the sleeper's reach, and is silent in a menu and a cutscene.
 */

import { nearestSleeper } from '../../sleepers';
import type { AtmAudioContext, AtmAudioPart } from '../atmosphereAudio';
import { createBreathBed } from '../breathBed';
import { createFollower } from '../follower';
import { createMindEars as createEars } from '../mindEars';
import { MIND_TIDE, tideOf } from '../mindTide';

export function createMindEars(ctx: AtmAudioContext): AtmAudioPart {
  const { g } = ctx;
  const ears = createEars(ctx);
  const tread = createFollower(ctx);
  const breath = createBreathBed(ctx.e);
  return {
    update(fx, seconds, _camera, paused) {
      const quiet = paused || g.cutscene;
      ears.update(fx.stress, quiet);
      MIND_TIDE.muffle = quiet ? 0 : tideOf(seconds, fx.stress);
      tread.update(fx.stress, seconds, quiet);
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      breath.update(seconds, !quiet && me ? nearestSleeper(g, me) : null, quiet);
    },
  };
}
