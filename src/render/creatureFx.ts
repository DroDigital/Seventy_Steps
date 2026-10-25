/**
 * What the sprite shader is told of a creature besides its frame (round 78; render only, read-only on
 * the simulation): how far its body has gone or is forming and in what style (a death by the matter of
 * the body, an arrival, an ambusher rising out of the ground, a creature formed again as its other
 * self), where the last blow fell on its picture, and how much of its health its picture wears.
 */

import type * as THREE from 'three';
import type { Entity } from '../core/ecs';
import { CREATURE_FX, FX_STYLE, deathStyle, type FxStyle } from '../data/creatureFx';
import type { EntityDef } from '../data/schema';
import { SIM } from '../data/tuning';
import type { Game } from '../systems/components';
import type { Look } from './creatureLook';
import { woundPoint } from './wound';

const LANDS = new Set(['hit', 'stagger', 'riposte', 'kill', 'guardBreak']);
const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface Gone {
  /** 0 whole .. 1 gone. */
  amount: number;
  /** FX_STYLE's number. */
  style: number;
}

export interface CreatureFx {
  /** How far gone this creature's picture is, and how: its death, its arrival, its rising or its forming again; `look` is null while it is hidden. */
  gone(id: Entity, def: EntityDef, model: string, look: Look | null, time: number): Gone;
  /** 0..1 of its health lost (a boss's too), shown as the dark wet patches its picture wears. */
  wear(id: Entity): number;
  /** Where the last blow fell on a picture `width` by `height` metres standing at (x, y, z), `across` the camera's right: [across, up, flash left, metres it reaches], or null when none is fresh. */
  wound(id: Entity, x: number, y: number, z: number, width: number, height: number, across: { x: number; z: number }, time: number): readonly [number, number, number, number] | null;
  /** Tells the shader, of billboard `index` of `b`, how far gone `dress.id`'s picture is, how worn, and where the last blow fell (`baseY` its feet, `across` the camera's right); a billboard with no `dress` is whole. */
  dress(b: Batch, index: number, dress: { id: Entity; gone: Gone } | undefined, x: number, baseY: number, z: number, width: number, height: number, across: { x: number; z: number }, time: number): void;
  forget(live: ReadonlySet<Entity>): void;
}

interface Batch {
  fx: THREE.InstancedBufferAttribute;
  wound: THREE.InstancedBufferAttribute;
}

export function createCreatureFx(g: Game): CreatureFx {
  const wounds = new Map<Entity, { x: number; y: number; z: number; at: number }>();
  const hidden = new Set<Entity>(); // seen hidden last: when it shows again it rises
  const forms = new Map<Entity, string>(); // the model each was last drawn as
  const forming = new Map<Entity, { since: number; seconds: number; style: FxStyle }>();
  const out: Gone = { amount: 0, style: 0 };
  const woundOut: [number, number, number, number] = [0, 0, 0, 0];

  g.events.on('Hit', (e) => {
    if (e.lingering || e.damage <= 0 || !LANDS.has(e.outcome)) return;
    const w = woundPoint(g, e.target, e.attacker, 0.25);
    if (w) wounds.set(e.target, { ...w.at, at: g.frame / SIM.hz });
  });

  return {
    gone(id, def, model, look, time) {
      out.amount = 0;
      out.style = 0;
      const was = forms.get(id);
      forms.set(id, model);
      if (!look) {
        hidden.add(id);
        return out;
      }
      if (hidden.delete(id)) forming.set(id, { since: time, seconds: CREATURE_FX.emerge, style: 'rise' });
      else if (was !== undefined && was !== model) forming.set(id, { since: time, seconds: CREATURE_FX.swap, style: 'shatter' });
      if (look.dissolve !== undefined && look.dissolve > 0) { // its death: the body goes, in the style of its matter
        out.amount = smooth(CREATURE_FX.deathHold, 0.97, look.dissolve);
        out.style = FX_STYLE[deathStyle(def)];
        return out;
      }
      if (look.appear !== undefined && look.appear < 1) { // a horror roused comes together out of the ground
        out.amount = 1 - look.appear;
        out.style = FX_STYLE.rise;
        return out;
      }
      const f = forming.get(id);
      if (f) {
        const k = (time - f.since) / f.seconds;
        if (k >= 1) forming.delete(id);
        else [out.amount, out.style] = [1 - smooth(0, 1, k), FX_STYLE[f.style]];
      }
      return out;
    },
    wear(id) {
      const h = g.ecs.c.health.get(id);
      if (!h || !(h.max > 0)) return 0;
      const lost = 1 - Math.max(0, h.hp) / h.max;
      return Math.min(1, Math.max(0, (lost - CREATURE_FX.stainFrom) / (1 - CREATURE_FX.stainFrom)));
    },
    wound(id, x, y, z, width, height, across, time) {
      const w = wounds.get(id);
      if (!w) return null;
      const left = 1 - (time - w.at) / CREATURE_FX.woundSeconds;
      if (left <= 0) return null;
      woundOut[0] = 0.5 + ((w.x - x) * across.x + (w.z - z) * across.z) / width;
      woundOut[1] = (w.y - y) / height;
      woundOut[2] = left * left;
      woundOut[3] = CREATURE_FX.woundMetres;
      return woundOut;
    },
    dress(b, index, dress, x, baseY, z, width, height, across, time) {
      if (!dress) {
        b.fx.setXYZW(index, 0, 0, 0, 0);
        b.wound.setXYZW(index, 0, 0, 0, 0);
        return;
      }
      b.fx.setXYZW(index, dress.gone.amount, dress.gone.style, this.wear(dress.id), (dress.id * 0.7548776662) % 1);
      const w = this.wound(dress.id, x, baseY, z, width, height, across, time);
      if (w) b.wound.setXYZW(index, w[0], w[1], w[2], w[3]);
      else b.wound.setXYZW(index, 0, 0, 0, 0);
    },
    forget(live) {
      for (const m of [wounds, forms, forming]) for (const id of m.keys()) if (!live.has(id)) m.delete(id);
      for (const id of hidden) if (!live.has(id)) hidden.delete(id);
    },
  };
}
