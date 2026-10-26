/**
 * A creature's blow at close quarters, drawn quietly (round 88, render only; data/foeTuning.ts `FOE_FX`, the vocabulary `blowKit.ts`):
 *   a slam or a ring lays a thin ripple on the ground and its creature's mark where it falls;
 *   a sweep lays that mark along its tip as it goes round, a few strokes (a mark that is not a stroke, a sigil or an eye, is stamped once);
 *   a bite, a grab, a thrust stamps it at its tip; a lunge or a charge leaves a faint smear behind it;
 *   a slow, heavy blow glints before it falls (the mark in miniature, once); a blow that lands leaves the mark and the accent at the wound
 *   and throws back a few specks of the creature's matter.
 * No crown, fountain, cloud, scar, lit arc, camera-facing flash or light: the horrors' machinery (`meleeFx.ts`) is not used here.
 */

import { FOE_FX } from '../data/fxTuning';
import type { V3 } from '../core/geom';
import type { Entity } from '../core/ecs';
import type { MoveDef } from '../data/moves';
import { partsOf } from './blowKit';
import type { FoeCtx, Track } from './foeCtx';
import { woundPoint } from './wound';
import type { Mark } from '../data/foeBlows';

const DEG = Math.PI / 180;
const STROKES: ReadonlySet<Mark> = new Set<Mark>(['rake', 'crescent', 'lash', 'dash']); // laid piece by piece along a sweep

const span = (h: NonNullable<MoveDef['hit']>): number => Math.abs(h.arc[0] - h.arc[1]);

export interface Strikes {
  /** The blow's hit window has opened at `at`, facing `yaw`. */
  swung(id: Entity, def: MoveDef, at: V3, yaw: number): void;
  /** The blow of `attacker` has landed on `target`. */
  wound(attacker: Entity, target: Entity, damage: number): void;
  /** The glint before a slow, heavy blow: `p` is where the creature stands on the ground. */
  tell(id: Entity, def: MoveDef, p: V3, yaw: number): void;
  /** While the blow is active: the next stroke along a sweep, if it is due. */
  sweep(id: Entity, def: MoveDef, p: V3, yaw: number, frame: number, st: Track): void;
  /** While a lunge or a charge runs: the next smear of its wake, if it is due. */
  wake(id: Entity, def: MoveDef, p: V3, yaw: number, frame: number, st: Track): void;
}

export function createStrikes(c: FoeCtx): Strikes {
  const { g, kit } = c;
  const S = FOE_FX.strike;
  const groundAt = (p: { x: number; z: number }): number => g.world.ground(p.x, p.z);

  return {
    swung(id, def, at, yaw) {
      const s = c.style(id);
      const h = def.hit;
      if (!s || !h) return;
      const ring = h.reach < 0.05;
      if (!ring && span(h) >= S.stampBelow) return; // (a sweep is laid along its tip as it goes: `sweep`)
      const dir = { x: Math.sin(yaw), z: Math.cos(yaw) };
      const slam = ring || span(h) < 1;
      const heart = ring ? at : { x: at.x + dir.x * h.reach, z: at.z + dir.z * h.reach };
      const floor = groundAt(heart);
      const ripple = { at: { x: heart.x, y: floor, z: heart.z }, dir, size: (h.radius + 0.4) / S.slam.to, who: s.who, floor }; // (a slam's ring runs out to the blow's own radius)
      if (slam && s.blow.mark !== 'ripple' && c.ask(id, 'mark', 1)) kit.mark(s.blow, 'ripple', ripple);
      const parts = c.ask(id, 'mark', Math.min(S.marks, partsOf(s.blow.mark)));
      if (parts) {
        const at3 = { x: heart.x, y: slam ? floor + 0.3 : at.y + h.height, z: heart.z };
        kit.mark(s.blow, s.blow.mark, s.blow.mark === 'ripple' && slam ? { ...ripple, parts } : { at: at3, dir, size: s.scale * S.sizeK, parts, who: s.who, floor });
      }
      const n = c.ask(id, 'speck', slam ? S.specks : S.thrustSpecks);
      if (n) kit.specks(s.blow, { x: heart.x, y: floor + 0.15, z: heart.z }, n, slam ? undefined : dir);
    },

    wound(attacker, target, damage) {
      const s = c.style(attacker);
      const wp = s && woundPoint(g, target, attacker, 0.25);
      if (!s || !wp) return;
      const W = FOE_FX.wound;
      const want = c.ask(attacker, 'mark', W.marks);
      const dir = { x: wp.dx, z: wp.dz };
      const floor = groundAt(wp.at);
      if (want) {
        const accent = s.blow.accent;
        const main = accent && want > 1 ? want - 1 : want;
        const size = s.scale * W.size * (0.8 + 0.4 * Math.min(1, damage / W.heavy));
        kit.mark(s.blow, s.blow.mark, { at: wp.at, dir, size, parts: main, who: s.who, floor });
        if (accent && want > main) kit.mark(s.blow, accent, { at: wp.at, dir, size: size * 0.7, parts: want - main, who: s.who, floor });
      }
      const n = c.ask(attacker, 'speck', Math.min(W.specks, 1 + Math.floor(damage / W.perDamage)));
      if (n) kit.specks(s.blow, wp.at, n, { x: -dir.x, z: -dir.z });
    },

    tell(id, def, p, yaw) {
      const s = c.style(id);
      const h = def.hit;
      if (!s || !h) return;
      const T = FOE_FX.tell;
      const lead = Math.min(h.reach, s.radius + 0.4) * 0.6;
      const dir = { x: Math.sin(yaw), z: Math.cos(yaw) };
      const at = { x: p.x + dir.x * lead, y: p.y + Math.max(0.6, h.height * 1.15), z: p.z + dir.z * lead };
      const want = c.ask(id, 'tell', T.marks);
      if (!want) return;
      const accent = s.blow.accent;
      const main = accent && want > 1 ? want - 1 : want;
      kit.mark(s.blow, s.blow.mark, { at, dir, size: s.scale * T.size, alpha: T.alpha, parts: main, who: s.who, floor: p.y });
      if (accent && want > main) kit.mark(s.blow, accent, { at, dir, size: s.scale * T.size * 0.7, alpha: T.alpha, parts: want - main, who: s.who, floor: p.y });
    },

    sweep(id, def, p, yaw, frame, st) {
      const h = def.hit;
      if (!h || h.reach < 0.05 || span(h) < S.stampBelow || frame < h.window[0] || frame >= h.window[1]) return;
      const pieces = Math.max(1, Math.min(S.pieces, h.window[1] - h.window[0]));
      const idx = Math.min(pieces - 1, Math.floor(((frame - h.window[0]) / (h.window[1] - h.window[0])) * pieces));
      if (idx <= st.piece) return;
      st.piece = idx;
      const s = c.style(id);
      if (!s) return;
      const a = yaw - (h.arc[0] + (h.arc[1] - h.arc[0]) * ((idx + 0.5) / pieces)) * DEG; // where its tip is, a share of the way round
      const tip = h.reach + h.radius * 0.6;
      const at = { x: p.x + Math.sin(a) * tip, y: p.y + h.height, z: p.z + Math.cos(a) * tip };
      const turn = a + ((Math.sign(h.arc[0] - h.arc[1]) || 1) > 0 ? -Math.PI / 2 : Math.PI / 2); // the way it travels
      const dir = { x: Math.sin(turn), z: Math.cos(turn) };
      if (STROKES.has(s.blow.mark)) {
        const long = Math.min(S.piece[1] * s.scale, Math.max(S.piece[0] * s.scale, ((tip * Math.abs(h.arc[1] - h.arc[0]) * DEG) / pieces) * 0.75));
        if (c.ask(id, 'mark', 1)) kit.mark(s.blow, s.blow.mark, { at, dir, size: long, parts: 1, who: s.who, floor: p.y });
      } else if (idx === Math.floor(pieces / 2)) {
        const parts = c.ask(id, 'mark', Math.min(S.marks, partsOf(s.blow.mark)));
        if (parts) kit.mark(s.blow, s.blow.mark, { at, dir, size: s.scale * S.sizeK, parts, who: s.who, floor: p.y });
      }
      if (idx === pieces - 1) {
        const n = c.ask(id, 'speck', S.specks);
        if (n) kit.specks(s.blow, { x: at.x, y: p.y + 0.15, z: at.z }, n, dir);
      }
    },

    wake(id, def, p, yaw, frame, st) {
      const mo = def.motion;
      if (!mo || mo.dir !== 'facing' || frame < mo.window[0] || frame >= mo.window[1]) return;
      const W = FOE_FX.wake;
      const idx = Math.min(W.pieces - 1, Math.floor(((frame - mo.window[0]) / (mo.window[1] - mo.window[0])) * W.pieces));
      if (idx <= st.wake) return;
      st.wake = idx;
      const s = c.style(id);
      if (!s || !c.ask(id, 'trail', 1)) return;
      const dir = { x: Math.sin(yaw), z: Math.cos(yaw) };
      const back = s.radius + 0.4 + 0.3 * idx;
      kit.trace(s.blow, { x: p.x - dir.x * back, y: p.y + 0.35, z: p.z - dir.z * back }, { x: -dir.x * W.speed, y: 0, z: -dir.z * W.speed }, s.scale * W.size, W.life, W.alpha);
      if (idx === W.pieces - 1) {
        const n = c.ask(id, 'speck', 1);
        if (n) kit.specks(s.blow, { x: p.x - dir.x * back, y: p.y + 0.15, z: p.z - dir.z * back }, n, { x: -dir.x, z: -dir.z });
      }
    },
  };
}
