/**
 * The quiet blows (round 88, render only; asked: "many of the lower-tier creatures' attack animations and telegraphs appear acceptable but
 * overly elaborate; in high-density combat scenarios, this detracts from the intended eerie atmosphere ... each creature should instead feature a
 * distinct, high-fidelity, subtle animation with optional graphic accents"). Every creature that is not one of the horrors (`isQuiet`: lesser,
 * greater, ally and the plain named) draws its blow as ONE graphic mark of its own (data/foeBlows.ts, `blowKit.ts`) and at most a few specks of
 * its matter, in three hues that drift as the mark fades. The horrors keep the machinery of `meleeFx.ts` and `attackFx.ts`, which return early for
 * these. Here the game's events and each creature's move are read (`foeStrike.ts` for blows at close quarters, `foeCast.ts` for casters) and a
 * crowd is thinned (`foeCrowd.ts`: the nearest few draw all, the next few marks, the rest little, and one rolling budget is shared by all).
 * Read-only on the simulation. A foe's blow calls no `flashLight`.
 */

import { moveDef } from '../systems/actions';
import { isAbsent, type Game } from '../systems/components';
import { TELL } from './meleeFx';
import { LANDS } from './audio/impact';
import { isQuiet } from './attackLook';
import { createBlowKit } from './blowKit';
import { createCasts } from './foeCast';
import { blowFor, createFoeCtx, freshTrack, type Track } from './foeCtx';
import { createCrowd, type Crowd } from './foeCrowd';
import { createStrikes } from './foeStrike';
import type { FoeBlow } from '../data/foeBlows';
import type { GroundFx } from './groundFx';
import type { Particles } from './particles';

export interface FoeFx {
  update(alpha: number): void;
  crowd: Crowd;
}

/** What a test may stand in: the blow each creature draws, the dice, the crowd. */
export interface FoeFxOptions {
  blows?: (who: string) => FoeBlow;
  rng?: () => number;
  crowd?: Crowd;
}

const FAR = 80; // metres beyond which a blow is not read at all

export function createFoeFx(g: Game, fx: Particles, ground: GroundFx, o: FoeFxOptions = {}): FoeFx {
  const c = g.ecs.c;
  const kit = createBlowKit(fx, ground, { now: () => g.frame / 60, rng: o.rng });
  const crowd = o.crowd ?? createCrowd();
  const ctx = createFoeCtx(g, fx, ground, kit, crowd, o.blows ?? blowFor);
  const strikes = createStrikes(ctx);
  const casts = createCasts(ctx);
  const enemy = (id: number): boolean => id !== g.player.id && c.combatant.get(id)?.faction === 'enemy';
  const tracks = new Map<number, Track>();

  g.events.on('Swung', ({ entity, at, yaw }) => {
    const a = c.actor.get(entity);
    const def = a && moveDef(a);
    if (!def?.hit || !enemy(entity) || !isQuiet(g, entity) || isAbsent(g, entity) || !ctx.near(at, FAR)) return;
    strikes.swung(entity, def, { x: at.x, y: g.world.ground(at.x, at.z), z: at.z }, yaw);
  });
  g.events.on('Hit', (e) => {
    if (e.lingering || !enemy(e.attacker) || !isQuiet(g, e.attacker) || !LANDS.includes(e.outcome)) return;
    strikes.wound(e.attacker, e.target, e.damage);
  });
  g.events.on('BoltLoosed', (e) => casts.loosed(e));
  g.events.on('BoltLanded', (e) => casts.landed(e));
  g.events.on('Shot', (e) => casts.shot(e));
  g.events.on('Summoned', (e) => casts.summoned(e));
  g.events.on('Teleported', (e) => casts.teleported(e));
  g.events.on('GazeBurst', (e) => casts.gazed(e));

  return {
    crowd,
    update(alpha) {
      ctx.rank();
      kit.drain();
      const me = c.transform.get(g.player.id)?.pos;
      if (tracks.size > 64) for (const id of tracks.keys()) if (!c.actor.has(id)) tracks.delete(id);
      for (const [id, a] of c.actor) {
        if (id === g.player.id || !isQuiet(g, id) || isAbsent(g, id)) continue;
        const def = moveDef(a);
        const tr = c.transform.get(id);
        if (!def || !tr || (me && Math.hypot(tr.pos.x - me.x, tr.pos.z - me.z) > FAR)) continue;
        const was = tracks.get(id);
        const same = !!was && was.move === a.move && was.frame <= a.frame; // (the same move, the frame no earlier than it was)
        const st = same ? was : freshTrack(a.move);
        const before = same ? was.frame : -1;
        st.frame = a.frame;
        tracks.set(id, st);
        casts.winding(id, a, def, st);
        const h = def.hit;
        if (!h || !enemy(id)) continue;
        const p = { x: tr.pos.x, y: g.world.ground(tr.pos.x, tr.pos.z), z: tr.pos.z };
        const told = h.window[0] >= TELL.windup && h.poise >= TELL.poise ? h.window[0] - TELL.lead : -1; // only a blow that winds up long and lands heavy
        if (told >= 0 && before < told && a.frame >= told && a.frame < h.window[0]) strikes.tell(id, def, p, tr.yaw); // (once, and only before the blow: a picture late after a hitch, or a foe come into sight mid-swing, does not glint at it)
        strikes.sweep(id, def, p, tr.yaw, a.frame, st);
        strikes.wake(id, def, p, tr.yaw, a.frame, st);
      }
      casts.trails(alpha);
    },
  };
}
