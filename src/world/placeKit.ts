/**
 * What a boss's place is laid with (round 71; world/places/*.ts say what each place is): the court's frame (`a` along the way out of the
 * gate, `c` to the left of it, metres from the fight's centre) and the pieces that are stood in it, each a baked model (data/models, from the
 * supplied packs) as a prop of the kind `set` with its own colliders (the model's `solids`: a doorway stays a doorway). A piece is turned to
 * face the centre unless told otherwise; a run of a model is cut to fit its line exactly, each piece lapping the next so a body finds no crack.
 * Deterministic from where the arena stands. Pure: no Three.js.
 */

import type { XZ } from '../core/geom';
import { createRng, hash2, type Rng } from '../core/rng';
import { MODEL_INFO } from '../data/models/index';
import { WORLD } from '../data/tuning';
import type { EnclosureSite } from './enclosure';
import type { Emit } from './placeEmit';
import type { Dye, Prop, SetLook } from './props';
import type { LightKind } from '../data/tuning';

/** Which way a piece's front (+z) looks. */
export type Face = 'in' | 'out' | 'front' | 'back' | 'left' | 'right';

/** How a piece is set. */
export interface Put {
  face?: Face; // default 'in': toward the fight's centre
  turn?: number; // degrees added to the facing
  yaw?: number; // radians, absolute (instead of `face`)
  s?: number; // uniform scale
  stretch?: readonly [number, number, number]; // times the scale, along the model's own x, y, z
  height?: number; // metres: the piece is made this tall (its y stretch)
  length?: number; // metres: its x extent is made this long (its x stretch)
  y?: number; // metres off the court's ground (sunk if negative)
  tint?: readonly [number, number, number]; // the colour its stone leans toward
  keep?: number; // how much of the model's own colour it keeps (0..1)
  dye?: Dye;
  lit?: LightKind; // a flame at each of the model's anchors
  flame?: number; // its size
  walk?: boolean; // walked over: no collider
  round?: boolean;
  jitter?: number; // metres it is moved at random, and a few degrees turned
}

/** A run of a model along a line. */
export interface Run extends Put {
  lap?: number; // metres each piece overlaps the next (0.15)
  from?: number; // 0..1 of the line where the run begins, and where it ends
  to?: number;
}

/** A source of what a place breathes at (a, c) in the court's frame, or along a line to `to` (world/placeEmit.ts). */
export type EmitAt = Omit<Emit, 'kind' | 'x' | 'z' | 'to'> & { at: readonly [number, number]; to?: readonly [number, number] };

export interface Court {
  readonly s: EnclosureSite;
  readonly f: XZ; // the way out of the gate
  readonly l: XZ; // to the left of it
  readonly R: number; // the ring of the fight
  readonly props: Prop[];
  readonly emits: Emit[];
  rng: Rng;
  /** The world's place at `a` along the front and `c` to the left. */
  put(a: number, c: number): XZ;
  /** A model standing at (a, c). */
  add(id: string, a: number, c: number, o?: Put): Prop;
  /** A model repeated along the line from (a0, c0) to (a1, c1), cut to fit it. */
  run(id: string, from: readonly [number, number], to: readonly [number, number], o?: Run): Prop[];
  /** `n` of a model about (a, c) at `radius`, between `arc` degrees (a full ring when absent), turned in toward the middle (or out). */
  ring(id: string, at: readonly [number, number], radius: number, n: number, o?: Put & { arc?: readonly [number, number]; start?: number }): Prop[];
  /** A source of mist, fume, wisps or sparks, anchored where the court puts it. */
  emit(e: EmitAt): void;
  /** The facing, in radians, of a piece standing at the world's `p`. */
  yawAt(p: XZ, face: Face): number;
}

const RAD = Math.PI / 180;

/** The court of an arena: its frame and its pieces' bookkeeping. */
export function makeCourt(s: EnclosureSite): Court {
  const f = s.front;
  const l = { x: -f.z, z: f.x };
  const rng = createRng((hash2(Math.round(s.x), Math.round(s.z), WORLD.seed + 71) * 4294967296) >>> 0);
  const props: Prop[] = [];
  const emits: Emit[] = [];
  let seed = 7000;
  const put = (a: number, c: number): XZ => ({ x: s.x + f.x * a + l.x * c, z: s.z + f.z * a + l.z * c });
  const yawAt = (p: XZ, face: Face): number => {
    switch (face) {
      case 'out': return Math.atan2(p.x - s.x, p.z - s.z);
      case 'front': return Math.atan2(f.x, f.z);
      case 'back': return Math.atan2(-f.x, -f.z);
      case 'left': return Math.atan2(l.x, l.z);
      case 'right': return Math.atan2(-l.x, -l.z);
      default: return Math.atan2(s.x - p.x, s.z - p.z);
    }
  };

  const add = (id: string, a: number, c: number, o: Put = {}): Prop => {
    const info = MODEL_INFO[id];
    if (!info) throw new Error(`place: no model '${id}'`);
    const k = o.s ?? 1;
    const st: [number, number, number] = [...(o.stretch ?? [1, 1, 1])];
    if (o.length) st[0] *= o.length / ((info.x1 - info.x0) * k * st[0] || 1);
    if (o.height) st[1] *= o.height / ((info.y1 - info.y0) * k * st[1] || 1);
    const [sx, sy, sz] = [k * st[0], k * st[1], k * st[2]];
    const at = put(a, c);
    const j = o.jitter ?? 0;
    const [dx, dz] = j ? [(rng() - 0.5) * 2 * j, (rng() - 0.5) * 2 * j] : [0, 0];
    const yaw = (o.yaw ?? yawAt(at, o.face ?? 'in')) + (o.turn ?? 0) * RAD + (j ? (rng() - 0.5) * 0.3 : 0);
    const look: SetLook = {
      id, scale: k, round: o.round ?? info.round, walk: o.walk,
      ...(st[0] !== 1 || st[1] !== 1 || st[2] !== 1 ? { stretch: st } : {}),
      ...(o.tint && { tint: o.tint }), ...(o.keep !== undefined && { keep: o.keep }), ...(o.dye && { dye: o.dye }),
      ...(o.lit && { lit: o.lit }), ...(o.flame && { flame: o.flame }),
    };
    const prop: Prop = { kind: 'set', x: at.x + dx, y: s.y + (o.y ?? 0), z: at.z + dz, w: ((info.x1 - info.x0) / 2) * sx, d: ((info.z1 - info.z0) / 2) * sz, h: (info.y1 - info.y0) * sy, yaw, seed: seed++, set: look };
    props.push(prop);
    return prop;
  };

  const run = (id: string, from: readonly [number, number], to: readonly [number, number], o: Run = {}): Prop[] => {
    const info = MODEL_INFO[id];
    if (!info) throw new Error(`place: no model '${id}'`);
    const [A, B] = [put(from[0], from[1]), put(to[0], to[1])];
    const [t0, t1] = [o.from ?? 0, o.to ?? 1];
    const [P, Q] = [{ x: A.x + (B.x - A.x) * t0, z: A.z + (B.z - A.z) * t0 }, { x: A.x + (B.x - A.x) * t1, z: A.z + (B.z - A.z) * t1 }];
    const len = Math.hypot(Q.x - P.x, Q.z - P.z);
    const k = o.s ?? 1;
    const natural = (info.x1 - info.x0) * k * (o.stretch?.[0] ?? 1);
    const n = Math.max(1, Math.round(len / natural));
    const step = len / n;
    const [dx, dz] = [(Q.x - P.x) / (len || 1), (Q.z - P.z) / (len || 1)];
    const normal = { x: -dz, z: dx };
    const mid = { x: (P.x + Q.x) / 2, z: (P.z + Q.z) / 2 };
    const toward = (s.x - mid.x) * normal.x + (s.z - mid.z) * normal.z >= 0 ? normal : { x: -normal.x, z: -normal.z }; // the side that looks at the centre
    const sign = (face: Face | undefined): number => (face === 'out' ? -1 : 1);
    const out: Prop[] = [];
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const at = { x: P.x + (Q.x - P.x) * t, z: P.z + (Q.z - P.z) * t };
      const [a, c] = [(at.x - s.x) * f.x + (at.z - s.z) * f.z, (at.x - s.x) * l.x + (at.z - s.z) * l.z];
      const yaw = o.yaw ?? Math.atan2(toward.x * sign(o.face), toward.z * sign(o.face));
      const piece = add(id, a, c, { ...o, yaw, length: step + (o.lap ?? 0.15), height: o.height });
      out.push(piece);
    }
    return out;
  };

  const ring = (id: string, at: readonly [number, number], radius: number, n: number, o: Put & { arc?: readonly [number, number]; start?: number } = {}): Prop[] => {
    const out: Prop[] = [];
    const [a0, a1] = o.arc ?? [0, 360];
    const full = a1 - a0 >= 360;
    for (let i = 0; i < n; i++) {
      const deg = (o.start ?? 0) + (full ? a0 + (i * 360) / n : a0 + ((a1 - a0) * (n === 1 ? 0.5 : i / (n - 1))));
      const th = deg * RAD;
      const [a, c] = [at[0] + Math.cos(th) * radius, at[1] + Math.sin(th) * radius];
      const centre = put(at[0], at[1]);
      const p = put(a, c);
      const yaw = o.yaw ?? (o.face === 'out' ? Math.atan2(p.x - centre.x, p.z - centre.z) : o.face && o.face !== 'in' ? yawAt(p, o.face) : Math.atan2(centre.x - p.x, centre.z - p.z));
      out.push(add(id, a, c, { ...o, yaw }));
    }
    return out;
  };

  const emit = (e: EmitAt): void => {
    const { at, to, ...rest } = e;
    const [p, q] = [put(at[0], at[1]), to && put(to[0], to[1])];
    emits.push({ kind: 'emit', ...rest, x: p.x, z: p.z, ...(q && { to: q }) });
  };

  return { s, f, l, R: s.radius, props, emits, rng, put, add, run, ring, emit, yawAt };
}
