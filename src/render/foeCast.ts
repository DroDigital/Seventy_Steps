/**
 * What a caster does, drawn quietly (round 89, render only; data/foeTuning.ts `FOE_FX`): a few motes drawn in over its wind-up (`GATHER`
 * frames before the frame it looses what it winds toward, `windup.ts`), a small mark at the muzzle as a bolt leaves, a faint smear every few
 * frames along its flight, the mark and a few specks where it lands, a mark at each end of a beam, a faint sigil and a few rising motes where
 * something is summoned, two swirls for a teleport, an eye and a few motes for a gaze and a few motes thrown up by a roar's front. No scar, no
 * flash, no light: the horrors' machinery (`attackFx.ts`) is not used here.
 */

import type { Entity } from '../core/ecs';
import type { V3 } from '../core/geom';
import { FOE_FX } from '../data/fxTuning';
import type { MoveDef } from '../data/moves';
import type { Actor } from '../systems/components';
import { partsOf } from './blowKit';
import type { FoeCtx, Track } from './foeCtx';
import { GATHER, releaseFrame } from './windup';

const tau = Math.PI * 2;
const unit = (v: { x: number; z: number }): { x: number; z: number } => {
  const l = Math.hypot(v.x, v.z) || 1;
  return { x: v.x / l, z: v.z / l };
};

export interface Casts {
  /** A bolt leaves its caster. */
  loosed(e: { owner: Entity; at: V3; vel: V3; fire: boolean }): void;
  /** A bolt's end. */
  landed(e: { owner: Entity; at: V3; vel: V3; on: 'body' | 'ground' | 'wall' | 'spent'; radius: number; fire: boolean }): void;
  /** A beam from `from` to `to`. */
  shot(e: { shooter: Entity; from: V3; to: V3 }): void;
  summoned(e: { entity: Entity; by: Entity }): void;
  teleported(e: { entity: Entity; from: V3; to: V3 }): void;
  gazed(e: { by: Entity }): void;
  /** While a caster winds up, builds a gaze or roars: what is due this frame of its move. */
  winding(id: Entity, a: Actor, def: MoveDef, st: Track): void;
  /** Each frame: a faint smear behind every bolt in flight that is due one. */
  trails(alpha: number): void;
}

export function createCasts(c: FoeCtx): Casts {
  const { g, kit } = c;
  const ecs = g.ecs.c;
  const lastTrail = new Map<Entity, number>(); // the step each bolt last left a smear in
  let muzzled = { owner: -1, frame: -1 }; // a volley of bolts leaves under one mark

  return {
    loosed({ owner, at, vel, fire }) {
      const s = c.style(owner);
      if (!s || fire || !c.near(at) || (muzzled.owner === owner && muzzled.frame === g.frame)) return;
      muzzled = { owner, frame: g.frame };
      if (c.ask(owner, 'mark', 1)) kit.mark(s.blow, s.blow.mark, { at, dir: unit(vel), size: s.scale * FOE_FX.bolt.muzzle, parts: 1, who: s.who, floor: g.world.ground(at.x, at.z) });
    },

    landed({ owner, at, vel, on, radius, fire }) {
      const s = c.style(owner);
      if (!s || fire || on === 'spent' || !c.near(at)) return;
      const L = FOE_FX.bolt.land;
      const dir = unit(vel);
      const parts = c.ask(owner, 'mark', Math.min(L.marks, partsOf(s.blow.mark)));
      if (parts) kit.mark(s.blow, s.blow.mark, { at, dir, size: s.scale * L.size * (1 + radius), parts, who: s.who, floor: g.world.ground(at.x, at.z) });
      const n = c.ask(owner, 'speck', L.specks);
      if (n) kit.specks(s.blow, at, n, { x: -dir.x, z: -dir.z });
    },

    shot({ shooter, from, to }) {
      const s = c.style(shooter);
      if (!s || !c.near(from)) return;
      const B = FOE_FX.beam;
      const dir = unit({ x: to.x - from.x, z: to.z - from.z });
      const got = c.ask(shooter, 'mark', 2 * B.marks);
      const size = s.scale * B.size;
      if (got >= 1) kit.mark(s.blow, s.blow.mark, { at: from, dir, size, parts: B.marks, who: s.who, floor: g.world.ground(from.x, from.z) });
      if (got >= 2) kit.mark(s.blow, s.blow.mark, { at: to, dir, size, parts: B.marks, who: s.who, floor: g.world.ground(to.x, to.z) });
      const n = c.ask(shooter, 'speck', B.specks);
      if (n) kit.specks(s.blow, to, n, { x: -dir.x, z: -dir.z });
    },

    summoned({ entity, by }) {
      const s = c.style(by);
      const p = ecs.transform.get(entity)?.pos;
      if (!s || !p || !c.near(p) || !c.ask(by, 'mark', 1)) return;
      const U = FOE_FX.summon;
      const r = U.sigil + (ecs.body.get(entity)?.radius ?? 0.5) * U.perRadius;
      const floor = g.world.ground(p.x, p.z);
      c.ground.sigil({ x: p.x, y: floor, z: p.z }, r, s.look.mind, s.who, U.life);
      const n = c.ask(by, 'mote', U.motes);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * tau + kit.pen.rng() * 0.6;
        const d = r * (0.55 + 0.35 * kit.pen.rng());
        kit.riser(s.blow, { x: p.x + Math.cos(a) * d, y: floor + 0.1, z: p.z + Math.sin(a) * d }, U.rise[0] + (U.rise[1] - U.rise[0]) * kit.pen.rng(), 0.9 + 0.5 * kit.pen.rng(), FOE_FX.gather.size);
      }
    },

    teleported({ entity, from, to }) {
      const s = c.style(entity);
      if (!s || !c.near(to)) return;
      const T = FOE_FX.teleport;
      const got = c.ask(entity, 'mark', 2);
      const lift = (ecs.body.get(entity)?.aimHeight ?? 1.2) * 0.5;
      const dir = { x: 0, z: 1 };
      if (got >= 1) kit.mark(s.blow, 'swirl', { at: { x: from.x, y: from.y + lift, z: from.z }, dir, size: s.scale * T.size, parts: 1 });
      if (got >= 2) kit.mark(s.blow, 'swirl', { at: { x: to.x, y: to.y + lift, z: to.z }, dir, size: s.scale * T.size, parts: 1 });
      const n = c.ask(entity, 'mote', T.motes);
      for (let i = 0; i < n; i++) kit.riser(s.blow, { x: to.x + (kit.pen.rng() - 0.5) * s.radius * 2, y: to.y + 0.2, z: to.z + (kit.pen.rng() - 0.5) * s.radius * 2 }, 0.5 + kit.pen.rng(), 0.7, FOE_FX.gather.size);
    },

    gazed({ by }) {
      const s = c.style(by);
      const eye = c.bodyAt(by, 0.95);
      const to = c.bodyAt(g.player.id, 0.8);
      if (!s || !eye || !to || !c.near(eye)) return;
      const G = FOE_FX.gaze;
      const dir = unit({ x: to.x - eye.x, z: to.z - eye.z });
      if (c.ask(by, 'mark', 1)) kit.mark(s.blow, 'eye', { at: eye, dir, size: s.scale * G.eye, parts: 1 });
      const n = c.ask(by, 'mote', G.motes);
      for (let i = 0; i < n; i++) {
        const k = (i + 1) / (n + 1);
        const at = { x: eye.x + (to.x - eye.x) * k, y: eye.y + (to.y - eye.y) * k, z: eye.z + (to.z - eye.z) * k };
        kit.mote(s.blow, at, { x: at.x + dir.x * 0.8, y: at.y, z: at.z + dir.z * 0.8 }, 0.5, FOE_FX.gather.size);
      }
    },

    winding(id, a, def, st) {
      const s = c.style(id);
      const body = s && c.bodyAt(id, 0.8);
      if (!s || !body) return;
      const f = a.frame;
      const rel = releaseFrame(def);
      if (rel !== undefined && f < rel && f >= rel - GATHER) { // a few motes drawn in, spread over the wind-up
        const G = FOE_FX.gather;
        const idx = Math.min(G.motes - 1, Math.floor(((f - (rel - GATHER) + 1) / GATHER) * G.motes));
        if (idx > st.mote) {
          st.mote = idx;
          if (c.ask(id, 'mote', 1)) {
            const r = Math.min(G.range[1], Math.max(G.range[0], s.radius * 1.2));
            const ang = kit.pen.rng() * tau;
            const high = (kit.pen.rng() - 0.3) * r * 0.5;
            const life = G.life[0] + (G.life[1] - G.life[0]) * kit.pen.rng();
            kit.mote(s.blow, { x: body.x + Math.cos(ang) * r, y: body.y + high, z: body.z + Math.sin(ang) * r }, body, life, G.size);
          }
        }
      }
      const ef = def.effect;
      if (ef?.kind === 'gaze' && f >= ef.window[0] && f < ef.window[1] && g.reality.gaze > 0) { // a gaze while it builds: a mote now and then along the look
        const idx = Math.floor((f - ef.window[0]) / FOE_FX.gaze.every);
        const head = c.bodyAt(g.player.id, 1);
        const eye = c.bodyAt(id, 0.95);
        if (idx > st.gaze && head && eye) {
          st.gaze = idx;
          if (c.ask(id, 'mote', 1)) {
            const k = 0.3 + 0.6 * kit.pen.rng();
            const at = { x: eye.x + (head.x - eye.x) * k, y: eye.y + (head.y - eye.y) * k, z: eye.z + (head.z - eye.z) * k };
            kit.mote(s.blow, at, { x: at.x + (head.x - eye.x) * 0.15, y: at.y + (head.y - eye.y) * 0.15, z: at.z + (head.z - eye.z) * 0.15 }, 0.45, 0.05 + 0.06 * g.reality.gaze);
          }
        }
      }
      const sa = def.sanity;
      if (sa && !sa.sight && f >= sa.window[0] && f < sa.window[1]) { // a roar's front, thrown up in a few motes as it passes
        const P = FOE_FX.pulse;
        const t = (f - sa.window[0]) / (sa.window[1] - sa.window[0]);
        const idx = Math.min(P.motes - 1, Math.floor(t * P.motes));
        if (idx > st.pulse) {
          st.pulse = idx;
          if (c.ask(id, 'mote', 1)) {
            const ang = kit.pen.rng() * tau;
            const r = s.radius + t * sa.range;
            const x = body.x + Math.cos(ang) * r;
            const z = body.z + Math.sin(ang) * r;
            kit.riser(s.blow, { x, y: g.world.ground(x, z) + 0.15, z }, P.rise[0] + (P.rise[1] - P.rise[0]) * kit.pen.rng(), 0.5 + 0.2 * kit.pen.rng(), P.size);
          }
        }
      }
    },

    trails(alpha) {
      const B = FOE_FX.bolt;
      if (lastTrail.size > 64) for (const e of lastTrail.keys()) if (!ecs.bolt.has(e)) lastTrail.delete(e);
      for (const [e, b] of ecs.bolt) {
        if (b.pool?.fire) continue;
        const last = lastTrail.get(e);
        if (last !== undefined && g.frame - last < B.trailEvery) continue;
        const s = c.style(b.owner);
        if (!s) continue;
        lastTrail.set(e, g.frame); // (a trail asked for and refused is not asked again before its turn)
        const p = ecs.transform.get(e)!;
        const at = { x: p.prev.x + (p.pos.x - p.prev.x) * alpha, y: p.prev.y + (p.pos.y - p.prev.y) * alpha, z: p.prev.z + (p.pos.z - p.prev.z) * alpha };
        if (!c.near(at) || !c.ask(b.owner, 'trail', 1)) continue;
        kit.trace(s.blow, at, { x: -b.vel.x * B.trail.back, y: -b.vel.y * B.trail.back, z: -b.vel.z * B.trail.back }, B.trail.size * (0.7 + b.radius), B.trail.life, B.trail.alpha);
      }
    },
  };
}
