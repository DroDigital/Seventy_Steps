/**
 * The people's acts, heard (round 40: a person at a book, a pipe, a knife or a bottle made no sound at all): each sound
 * of an act (data/actBeats.ts) is made on the beat the act's pose makes the motion, by the same clock (render time plus
 * 1.7 s an entity, as render/actorViews.ts), near the person and fading with the distance; whoever is not at their act
 * is silent, whoever sits down to it sounds from then on. Read-only on the simulation.
 */

import type { V3 } from '../../core/geom';
import { actCues } from '../../data/actBeats';
import { ACTS, CLASS_GAIN } from '../../data/foleySounds';
import type { Sound } from '../../data/sounds';
import { actOf } from '../../systems/npcLife';
import type { Game } from '../../systems/components';

const RANGE = 15; // metres a person's small sounds carry: a knife, a page, a nib
const HEIGHT = 1.1; // metres over their feet: the hands

export interface ActFoley {
  /** Sounds what every person at their act did since the last look, as of `seconds` of render time. */
  update(seconds: number): void;
}

export function createActFoley(g: Game, recipe: (key: string, sound: Sound, o: { at: V3; gain: number; range: number }) => boolean): ActFoley {
  let last: number | null = null;
  return {
    update(seconds) {
      const from = last;
      last = seconds;
      if (from === null || seconds - from > 0.5 || seconds <= from) return; // a pause, a jump or a first look: no catching up
      for (const [e] of g.ecs.c.npc) {
        const kind = actOf(g, e);
        const pos = g.ecs.c.transform.get(e)?.pos;
        if (!kind || !pos) continue;
        const shift = e * 1.7;
        for (const { cue } of actCues(kind, from + shift, seconds + shift, Math.random)) {
          recipe(`act:${cue.sound}`, ACTS[cue.sound], { at: { x: pos.x, y: pos.y + HEIGHT, z: pos.z }, gain: CLASS_GAIN.acts * (cue.gain ?? 1), range: RANGE });
        }
      }
    },
  };
}
