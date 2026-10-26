/**
 * What the quiet blows' parts share (round 88, render only): which entities are drawn this way, each one's blow, look, size and tier, the
 * clock, the crowd's answer to "may I draw this", and the little each creature remembers of the move it is in. `foeStrike.ts` (blows at close
 * quarters) and `foeCast.ts` (casters' bolts, beams, gazes and summonings) are made on it, `foeFx.ts` wires them to the game.
 */

import type { V3 } from '../core/geom';
import { blowOf, type FoeBlow, type Matter } from '../data/foeBlows';
import { FOE_FX } from '../data/fxTuning';
import type { CreaturePalette } from '../data/schema';
import type { Game } from '../systems/components';
import { isAbsent } from '../systems/components';
import { creatureOf } from '../systems/creatures';
import type { BlowKit } from './blowKit';
import { isQuiet, lookOf, paletteOf, type AttackLook } from './attackLook';
import { createCrowd, type Crowd, type Foe, type Want } from './foeCrowd';
import type { GroundFx } from './groundFx';
import { mixRgb, type Rgb } from './palette';
import type { Particles } from './particles';

/** What a body of each hide sheds, for a creature that has no blow of its own written yet. */
const MATTER_OF: Readonly<Record<CreaturePalette, Matter>> = {
  sea: 'brine', ichor: 'ichor', rubber: 'ichor', fungus: 'spore', mold: 'spore', flesh: 'ichor',
  stone: 'dust', sand: 'dust', rust: 'dust', bone: 'ash', charcoal: 'ash', pallid: 'frost',
};

const pack = (c: Rgb): number => (Math.round(c[0] * 255) << 16) | (Math.round(c[1] * 255) << 8) | Math.round(c[2] * 255);

/** The blow of roster id `who`: the one written for it (data/foeBlows.ts), else a plain crescent in the colours of its look and the matter of its hide. */
export function blowFor(who: string): FoeBlow {
  const written = blowOf(who);
  if (written) return written;
  const look = lookOf(who);
  return { mark: 'crescent', tempo: 'snap', matter: MATTER_OF[paletteOf(who)], hues: [pack(look.line), pack(look.danger), pack(mixRgb(look.ring, look.ember, 0.5))] };
}

/** A mark's length at full for a body of `radius` metres. */
export const scaleOf = (radius: number): number => Math.min(FOE_FX.size.most, Math.max(FOE_FX.size.min, FOE_FX.size.base + FOE_FX.size.perRadius * radius));

export interface FoeStyle {
  who: string; // the roster id
  blow: FoeBlow;
  look: AttackLook;
  radius: number;
  scale: number;
}

/** What one creature remembers of the move it is in, so each moment of it is drawn once however the pictures fall against the steps. */
export interface Track {
  move: string | null;
  frame: number; // the move's frame when last drawn
  piece: number; // the last stroke laid along a sweep
  wake: number; // ...and of a charge's wake
  mote: number; // ...and of a gather's motes
  gaze: number; // ...and of a gaze's
  pulse: number; // ...and of a roar's
}

export const freshTrack = (move: string | null): Track => ({ move, frame: -1, piece: -1, wake: -1, mote: -1, gaze: -1, pulse: -1 });

export interface FoeCtx {
  g: Game;
  fx: Particles;
  ground: GroundFx;
  kit: BlowKit;
  crowd: Crowd;
  /** The style of entity `id`, or undefined if it is not drawn this way (a horror, the investigator, not a creature). */
  style(id: number): FoeStyle | undefined;
  /** How many of `n` particles of `want` entity `id` may draw now (what the crowd allows). */
  ask(id: number, want: Want, n: number): number;
  /** The game's time, in seconds of 60 Hz steps. */
  now(): number;
  /** Whether `p` is within `range` metres of the investigator. */
  near(p: V3, range?: number): boolean;
  /** A point on entity `id`'s body, `k` of the way up its aim height. */
  bodyAt(id: number, k?: number): V3 | undefined;
  /** Ranks the creatures by distance to the investigator (once for each step of the game, however often it is asked). */
  rank(): void;
}

export function createFoeCtx(g: Game, fx: Particles, ground: GroundFx, kit: BlowKit, crowd: Crowd = createCrowd(), blows: (who: string) => FoeBlow = blowFor): FoeCtx {
  const c = g.ecs.c;
  const styles = new Map<string, { blow: FoeBlow; look: AttackLook }>();
  let rankedAt = -1;
  const now = (): number => g.frame / 60;
  const ctx: FoeCtx = {
    g, fx, ground, kit, crowd, now,
    rank() {
      if (rankedAt === g.frame) return;
      rankedAt = g.frame;
      const me = c.transform.get(g.player.id)?.pos;
      const foes: Foe[] = [];
      for (const id of c.actor.keys()) {
        if (id === g.player.id || !isQuiet(g, id) || isAbsent(g, id)) continue;
        const p = c.transform.get(id)?.pos;
        if (p) foes.push({ id, d: me ? Math.hypot(p.x - me.x, p.z - me.z) : 0 });
      }
      crowd.rank(foes);
    },
    style(id) {
      const who = creatureOf(g, id)?.id;
      if (!who || !isQuiet(g, id)) return undefined;
      ctx.rank();
      let s = styles.get(who);
      if (!s) styles.set(who, (s = { blow: blows(who), look: lookOf(who) }));
      const radius = c.body.get(id)?.radius ?? 0.5;
      return { who, blow: s.blow, look: s.look, radius, scale: scaleOf(radius) };
    },
    ask: (id, want, n) => crowd.ask(id, want, n, now()),
    near(p, range = 40) {
      const me = c.transform.get(g.player.id)?.pos;
      return !me || Math.hypot(p.x - me.x, p.z - me.z) < range;
    },
    bodyAt(id, k = 0.8) {
      const p = c.transform.get(id)?.pos;
      return p && { x: p.x, y: p.y + (c.body.get(id)?.aimHeight ?? 1.2) * k, z: p.z };
    },
  };
  return ctx;
}
