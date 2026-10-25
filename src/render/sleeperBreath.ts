/**
 * The Sleeper's breath, seen (round 80, atmosphere): about a colossus that has not yet woken the dream draws breath. Every ten seconds or
 * so, slowly in and quicker out, the low mist thickens and goes a shade paler, the haze above it rises, and the lantern's light is drawn
 * down and given back, all the more the nearer one stands to its ring (`render/sleepers.ts`; the sound beneath is audio/breathBed.ts). The
 * ground has a pulse before the horror is seen, and when the fog is crossed, the fight begins, a scene plays or one steps under a roof, it
 * stops. Done after the mist and the lantern have been set for the frame, as omenFx.ts does it, so nothing accumulates: it multiplies what
 * is there. The Fog setting (0: no mist) leaves it only the lantern. No shake: render/presence.ts owns that. Render only.
 */

import { BREATH } from '../data/sleeperBreath';
import type { Game } from '../systems/components';
import { breathAt, nearestSleeper } from './sleepers';
import type { PostPass } from './postPass';
import { worldUniforms } from './worldMaterial';

/** The hook for looking at it (`?debug`): a breath held where it is asked (`phase`, 0 to 1) and a reach it is given (`reach`, 0 to 1), whatever the sleeper's. */
export const BREATH_DEBUG: { phase: number | null; reach: number | null } = { phase: null, reach: null };

export interface SleeperBreath {
  /** Each drawn frame, after the mist and the lantern are set; `enclosed`: under a dungeon's roof (the breath is of the open air). */
  update(time: number, enclosed: boolean): void;
  /** How far the picture follows the breath now (0..1: the reach, eased, times the breath). */
  readonly swell: number;
}

export function createSleeperBreath(g: Game, post: PostPass): SleeperBreath {
  const vignette = post.uniforms.uVig.value as number; // the corners as the picture has them: given back as the breath lets go
  let [reach, period, last, swell] = [0, 12, -1, 0];
  return {
    get swell() {
      return swell;
    },
    update(time, enclosed) {
      const dt = last < 0 ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      const me = g.ecs.c.transform.get(g.player.id)?.pos;
      const s = !enclosed && !g.cutscene && me ? nearestSleeper(g, me) : null;
      if (s) period = s.period;
      const want = BREATH_DEBUG.reach ?? s?.k ?? 0;
      reach += (want - reach) * Math.min(1, dt / (want > reach ? BREATH.ease.up : BREATH.ease.down));
      if (reach < 1e-3 && want === 0) {
        if (swell !== 0) post.uniforms.uVig.value = vignette;
        return void (swell = 0);
      }
      swell = reach * (BREATH_DEBUG.phase ?? breathAt(time, period));
      const u = post.uniforms;
      u.uFog.value.x *= 1 + BREATH.swell.mist * swell; // the mist, after this frame's was set
      u.uFogAir.value.x *= 1 + BREATH.swell.haze * swell;
      u.uFogColor.value.multiplyScalar(1 + BREATH.swell.glow * swell);
      u.uVig.value = vignette * (1 + BREATH.swell.vignette * swell);
      worldUniforms.uLanternColor.value.multiplyScalar(1 - BREATH.swell.lantern * swell); // (placeLantern sets it again each frame)
    },
  };
}
