/**
 * What a creature's sprite shows this frame (split from creatureViews.ts, round 78): the state and
 * frame of its clip from its move and speed, how opaque, how far it has sunk, how hard it is lashing.
 * Pure but for reading the simulation.
 */

import type { Entity } from '../core/ecs';
import { FEEDBACK, SIM } from '../data/tuning';
import { moveDef } from '../systems/actions';
import { isAbsent, isUnseen, type Game } from '../systems/components';
import { stooped } from '../systems/hurt';
import { strikeFrame } from '../systems/realityTricks';
import type { Arrival } from './bossArrival';
import { attackFrame, lastFrame, loopFrame, reactionFrame, type SpriteAction } from './sprites/directional';

const REACTIONS = new Set(['stagger', 'guardBreak', 'parried']);
export interface Look {
  state: SpriteAction;
  frame: number;
  opacity: number;
  sink: number; // 0..1 through the death move
  lash: number; // 0..1 around an attack's strike
  appear?: number; // 0..1 how far a horror just roused has come into view (render/bossArrival.ts); absent: wholly
  dissolve?: number; // 0..1 through its death: its picture goes texel by texel (render/creatureFx.ts, shaders/spriteFx.ts); absent: not dying
}

/** Where in its cycle each creature is, in seconds (round 78): a pack's breathing and walking were all one clock, so every Deep One stepped together. Golden-ratio steps of the entity id spread them evenly over the longest cycle (2.5 s), the same for all four views of one creature. */
export const phaseOf = (id: Entity): number => ((id * 0.6180339887) % 1) * 2.5;

/** Which frame of which state a creature shows, from its move and speed; `counts` the frames of each state it has (a colossus's `stoop` only if it has the art), `stoopAge` the seconds since its stoop began, `riseAge` since it ended (while it comes up through its in-between pose). */
export function lookOf(g: Game, id: Entity, time: number, counts: Partial<Record<SpriteAction, number>> = {}, stoopAge = 0, riseAge?: number, arrive?: Arrival): Look | null {
  const c = g.ecs.c;
  const br = c.brain.get(id);
  if (isAbsent(g, id) || br?.state === 'hidden' || isUnseen(g, id)) return null;
  const a = c.actor.get(id)!;
  const def = moveDef(a);
  const tr = c.transform.get(id)!;
  const invisible = br?.def.params.hide === 'invisible';
  let look: Look;
  if (a.move === 'death' && def) {
    const t = a.frame / def.frames;
    look = { state: 'hurt', frame: lastFrame(counts.hurt ?? 2), opacity: 1, sink: t * 0.4, lash: 0, dissolve: t }; // (round 78: its texels go, in the style of its matter; it faded whole and sank a third of its height)
  } else if ((counts.stoop ?? 0) > 0 && stooped(g, id)) { // a colossus after a blow of its own, or reeling: its head is down within reach (hurt.ts), and the picture bows to match; once, then held
    const down = (counts.stoop_mid ?? 0) > 0 ? FEEDBACK.midSeconds : 0; // the head comes down through its halfway pose, where it has one
    look = stoopAge < down ? { state: 'stoop_mid', frame: 0, opacity: 1, sink: 0, lash: 0 } : { state: 'stoop', frame: stoopAge < down + FEEDBACK.bowSeconds ? 0 : counts.stoop! - 1, opacity: 1, sink: 0, lash: 0 };
  } else if ((counts.stoop_mid ?? 0) > 0 && riseAge !== undefined && riseAge < FEEDBACK.riseSeconds && a.move === null) { // and comes up through it
    look = { state: 'stoop_mid', frame: 0, opacity: 1, sink: 0, lash: 0 };
  } else if (a.move === 'evade') {
    look = { state: 'move', frame: loopFrame(time, counts.move ?? 2, 0.5), opacity: 1, sink: 0, lash: 0 };
  } else if (a.move !== null && REACTIONS.has(a.move)) {
    look = { state: 'hurt', frame: reactionFrame(a.frame, def?.frames ?? 16, counts.hurt ?? 2), opacity: 1, sink: 0, lash: 0 };
  } else if (a.move !== null && def) {
    const strike = strikeFrame(def) ?? Math.floor(def.frames / 3);
    const end = def.hit?.window[1] ?? strike + 6;
    const frame = attackFrame(a.frame, def.frames, strike, end, counts.attack ?? 3);
    look = { state: 'attack', frame, opacity: 1, sink: 0, lash: a.frame < strike ? a.frame / Math.max(1, strike) * 0.3 : a.frame < end ? 1 : 0.3 };
  } else {
    const moving = Math.hypot(tr.pos.x - tr.prev.x, tr.pos.z - tr.prev.z) * SIM.hz > 0.3;
    // a creature with its own flight cycle flies it (the Shantak's wing-beat, round 48); the others walk or stand as before
    if (moving && counts.flight) look = { state: 'flight', frame: loopFrame(time, counts.flight, 1), opacity: 1, sink: 0, lash: 0 };
    else look = moving ? { state: 'move', frame: loopFrame(time, counts.move ?? 2), opacity: 1, sink: 0, lash: 0 } : { state: 'idle', frame: loopFrame(time, counts.idle ?? 2, 1.25), opacity: 1, sink: 0, lash: 0 };
  }
  if (invisible && look.state !== 'attack' && look.state !== 'hurt') look.opacity = Math.min(look.opacity, 0.2); // a shimmer in the air: unseen it was not (round 45), but it can be caught moving
  if (arrive && arrive.appear < 1) [look.appear, look.sink] = [arrive.appear, Math.max(look.sink, arrive.sink)]; // a horror just roused comes into view, the great ones up out of the ground
  return look;
}
