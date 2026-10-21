/**
 * Which clip of its model a creature shows, and at which of the clip's frames (docs/MODELS.md). An
 * attack's clip is laid on the move frame by frame, its strike on the move's (the hit, the bolt, the
 * spell), so what is seen lands when the blow does even where the two are not the same length; a
 * reaction is stretched over its move; the walk is moved on by the ground covered, so the feet do not
 * slide. Pure: no Three.js (render/models/modelViews.ts plays it).
 */

import type { Entity } from '../../core/ecs';
import type { ModelFacts } from '../../data/models';
import { moveDef } from '../../systems/actions';
import type { Game } from '../../systems/components';
import { stooped } from '../../systems/hurt';
import { strikeFrame } from '../../systems/realityTricks';

export interface ModelPose {
  clip: string;
  frame: number; // the clip's own, at 60 a second
}

const REEL = new Set(['guardBreak', 'parried']);

/** Frame `f` of a move `total` frames long whose blow lands on `strike`, on a clip `clipTotal` long whose blow lands on `clipStrike`. */
export function clipFrame(f: number, strike: number, total: number, clipStrike: number, clipTotal: number): number {
  if (f <= strike) return strike > 0 ? (f * clipStrike) / strike : 0;
  return Math.min(clipTotal, clipStrike + ((f - strike) * (clipTotal - clipStrike)) / Math.max(1, total - strike));
}

/** The attack clip a move is drawn with, if the model has one. */
export const attackClip = (facts: ModelFacts, move: string): string | undefined => (`atk.${move}` in facts.clips ? `atk.${move}` : undefined);

/**
 * The pose of creature `id`: `walked` the walk cycles it has covered (metres over the move clip's
 * stride), `seconds` a clock for its idle, `moving` whether it is under way.
 */
export function modelPose(g: Game, id: Entity, facts: ModelFacts, walked: number, seconds: number, moving: boolean): ModelPose {
  const a = g.ecs.c.actor.get(id);
  const def = a && moveDef(a);
  const clips = facts.clips;
  const stretch = (clip: string): ModelPose => ({ clip, frame: (a!.frame * clips[clip].frames) / Math.max(1, def!.frames) });
  const loop = (clip: string, t: number): ModelPose => ({ clip, frame: (((t % 1) + 1) % 1) * clips[clip].frames });
  if (a && def) {
    if (a.move === 'death') return { clip: 'death', frame: Math.min(a.frame, clips.death.frames) };
    if (REEL.has(a.move!)) return stretch(clips.reel ? 'reel' : 'hurt');
    if (a.move === 'stagger') return stretch('hurt');
    if (a.move === 'evade') return clips.evade ? stretch('evade') : loop('move', walked);
    const atk = attackClip(facts, a.move!);
    if (atk) {
      const c = clips[atk];
      const strike = strikeFrame(def) ?? Math.floor(def.frames / 3);
      return { clip: atk, frame: clipFrame(a.frame, strike, def.frames, c.strike ?? strike, c.frames) };
    }
  }
  if (clips.stoop && stooped(g, id)) return loop('stoop', seconds / (clips.stoop.frames / 60));
  if (moving) return loop('move', walked);
  return loop('idle', seconds / (clips.idle.frames / 60));
}
