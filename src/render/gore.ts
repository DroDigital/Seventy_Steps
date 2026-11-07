/**
 * Dismemberment (round 113; render only, read-only on the simulation). A creature killed by a blade's cut (not a thrust, not a shot)
 * comes apart as its body is made (data/gore.ts): its picture is parted along the blow's line (render/goreCut.ts plans it, the sprite
 * shader cuts it), the piece beyond the line is drawn as a billboard of its own that is thrown, turns and comes to rest on the ground,
 * the body spurts and slumps, and both lie a while before they go as the body's matter goes. A body that bleeds leaves a pool under it as
 * it dies, cut or not. The Gore setting (GORE_SETTING) turns all of it off.
 */

import type { Entity } from '../core/ecs';
import { GORE_FX, goreOf, isWet, type BloodKind } from '../data/gore';
import { moveDef } from '../systems/actions';
import type { Game } from '../systems/components';
import { GORE_SETTING, type Blood } from './blood';
import type { Gone } from './creatureFx';
import { FX_STYLE } from '../data/creatureFx';
import { planCut, reachDown, startPiece, stepPiece, type CutPlan, type Piece } from './goreCut';
import { BLOOD_ORDER } from './shaders/spriteFx';
import { woundPoint } from './wound';

/** A body long and low, which is cut sideways at the neck when seen from its side. */
const LONG = new Set(['quadruped', 'serpent', 'winged', 'toad', 'crustacean', 'cephalopod', 'swarm']);

export interface Dying {
  plan?: CutPlan;
  piece?: Piece;
  blood: BloodKind;
  /** The index the shader is told (BLOOD_ORDER, from 1; 0 none). */
  bloodIndex: number;
  last: number;
  pooled: boolean;
}

export interface DrawnBody {
  key: string;
  silhouette?: string;
  /** Feet. */
  x: number; y: number; z: number;
  /** The billboard's bottom, metres (its feet less its ground offset). */
  base: number;
  across: { x: number; z: number };
  facing: number; // yaw
  mirror: boolean;
  side: boolean; // seen from its side (the left or right view)
  /** The frame: its size and where it is painted, in its pixels: [left, top, right, bottom]. */
  frame: { width: number; height: number; bounds: readonly number[] };
  size: { w: number; h: number };
  painted: number; // metres broad, for its pool
}

export interface Gore {
  /** A creature in its death, `dissolve` (0..1) through it: its cut (made the first time it is asked) and piece, stepped to `time`. */
  dying(id: Entity, dissolve: number, body: DrawnBody, time: number): Dying | undefined;
  /** How far a cut body has gone, in what style: it lies whole until the piece has come to rest, then goes as its blood says. */
  adjust(gone: Gone, d: Dying, dissolve: number): void;
  forget(live: ReadonlySet<Entity>): void;
}

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function createGore(g: Game, blood: Blood): Gore {
  const c = g.ecs.c;
  const kills = new Map<Entity, { blow: { x: number; z: number }; y: number; heavy: boolean; cuts: boolean }>();
  const states = new Map<Entity, Dying>();

  g.events.on('Hit', (e) => {
    if (e.outcome !== 'kill' || e.lingering) return;
    const w = c.transform.has(e.attacker) ? woundPoint(g, e.target, e.attacker, 0.25) : undefined;
    const a = c.actor.get(e.attacker);
    const def = a && moveDef(a);
    const cuts = e.attacker === g.player.id && !!def?.hit && !def.hit.thrust && !def.shot; // a blade's cut, the investigator's
    kills.set(e.target, { blow: w ? { x: w.dx, z: w.dz } : { x: 0, z: 1 }, y: w?.at.y ?? 0, heavy: !!a?.move?.startsWith('heavy') || (def?.hit?.poise ?? 0) >= 30, cuts });
  });

  function begin(id: Entity, body: DrawnBody, time: number): Dying {
    const [kind, bloodKind] = goreOf(body.key);
    const d: Dying = { blood: bloodKind, bloodIndex: bloodKind === 'none' ? 0 : BLOOD_ORDER.indexOf(bloodKind as never) + 1, last: time, pooled: false };
    const kill = kills.get(id);
    if (kind === 'none' || !kill?.cuts) return d;
    const { width, height, bounds } = body.frame;
    const [l, r] = [bounds[0] / width, bounds[2] / width];
    const span = { bottom: 1 - bounds[3] / height, top: 1 - bounds[1] / height, left: body.mirror ? 1 - r : l, right: body.mirror ? 1 - l : r };
    const plan = planCut({
      kind, blow: kill.blow, across: body.across, facing: { x: Math.sin(body.facing), z: Math.cos(body.facing) }, mirror: body.mirror,
      wound: (kill.y - body.base) / body.size.h, span, size: body.size, long: body.side && LONG.has(body.silhouette ?? ''), heavy: kill.heavy, rand: Math.random,
    });
    d.plan = plan;
    const sx = body.mirror ? 1 - plan.middle[0] : plan.middle[0];
    const sy = 1 - plan.middle[1];
    const at = { x: body.x + body.across.x * (sx - 0.5) * body.size.w, y: body.base + sy * body.size.h, z: body.z + body.across.z * (sx - 0.5) * body.size.w };
    d.piece = startPiece(plan, at, [0.42 * plan.extent[1] * body.size.h, 0.42 * plan.extent[0] * body.size.w]);
    const px = body.mirror ? 1 - plan.point[0] : plan.point[0];
    const cut = { x: body.x + body.across.x * (px - 0.5) * body.size.w, y: body.base + (1 - plan.point[1]) * body.size.h, z: body.z + body.across.z * (px - 0.5) * body.size.w };
    blood.gush(cut, kill.blow, bloodKind, body.size.h / 2, time);
    blood.spray(cut, kill.blow, bloodKind, 10, 3.2, time);
    return d;
  }

  return {
    dying(id, dissolve, body, time) {
      if (!GORE_SETTING.on) return undefined;
      let d = states.get(id);
      if (!d) states.set(id, (d = begin(id, body, time)));
      const dt = Math.min(0.05, Math.max(0, time - d.last));
      d.last = time;
      if (!d.pooled && isWet(d.blood) && dissolve > GORE_FX.hold) { // the pool under it as it falls
        d.pooled = true;
        const k = Math.min(1, Math.max(0, body.painted / 1.2));
        blood.pool(body.x, body.z, d.blood, Math.max(GORE_FX.poolSize[0], GORE_FX.poolSize[0] + (GORE_FX.poolSize[1] - GORE_FX.poolSize[0]) * k) * Math.max(1, body.painted / 1.4), time);
      }
      const p = d.piece;
      if (p && dissolve > GORE_FX.hold && dt > 0) {
        const before = p.rests;
        const struck = stepPiece(p, dt, g.world.ground(p.x, p.z));
        if (struck && before === 0) { // it lands: a splash, and a pool of its own
          blood.spray({ x: p.x, y: p.y - reachDown(p) + 0.1, z: p.z }, { x: p.vx || 0.01, z: p.vz }, d.blood, 6, 1.6, time);
          blood.pool(p.x, p.z, d.blood, Math.max(0.35, 1.6 * p.half[1]), time, GORE_FX.poolGrow * 0.7);
        }
      }
      return d;
    },
    adjust(gone, d, dissolve) {
      if (!d.plan) return;
      gone.amount = smooth(GORE_FX.dissolveFrom, 0.97, dissolve);
      gone.style = FX_STYLE[isWet(d.blood) ? 'melt' : 'crumble'];
    },
    forget(live) {
      for (const id of kills.keys()) if (!live.has(id)) kills.delete(id);
      for (const id of states.keys()) if (!live.has(id)) states.delete(id);
    },
  };
}
