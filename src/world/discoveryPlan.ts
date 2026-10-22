/**
 * Where a discovery's things stand (round 63; data/discoveries.ts says what they are): the pages set down in the court before a house's
 * gate, the marks of its vigils and the altars of its offerings. All of it is placed by the frame of the court (arenaWay.ts `courtPoint`:
 * metres out from the gate, metres to the left), from the house alone, so the systems that play it need no region loaded to know where
 * a vigil is kept. The pages go in the world's tomes (placements.ts), the marks and altars among the court's props (regionPlan.ts).
 * Pure: no Three.js.
 */

import { createRng, hash2 } from '../core/rng';
import type { XZ } from '../core/geom';
import { DISCOVERIES } from '../data/discoveriesAll';
import type { Offer, Step, Vigil } from '../data/discoveries';
import { WORLD } from '../data/tuning';
import type { HousePlan } from './arenaHouse';
import { courtPoint } from './arenaWay';
import { setPiece } from './arenaSet';
import type { ArenaPlace } from './placements';
import type { Prop } from './props';
import { surface } from './terrain';

export interface Place extends XZ {
  yaw: number;
}

/** Where a discovery's things were set in the court, resolved once at layout (they are nudged clear of whatever stands there: a sign's shrine, a stone): its pages, and the place of each act (null for a page, or a rite). */
export interface Court {
  leaves: Place[];
  acts: (Place | null)[];
}

/** The discovery of an arena's first horror, when its house is there to be come to. */
export const discoveryOf = (a: Pick<ArenaPlace, 'bosses' | 'house'>) => (a.house ? DISCOVERIES[a.bosses[0]!] : undefined);

/** The nearest free place to (`d`, `side`) in the court: the spot itself, or another a few paces further in or out, on either side of the way. `free(x, z)` says whether a place is clear. */
function settle(h: HousePlan, d: number, side: number, free: (x: number, z: number) => boolean): Place {
  const tries: [number, number][] = [[d, side]];
  for (let k = 1; k <= 8; k++) for (const [dd, ss] of [[d + 2.5 * k, side], [d + 2.5 * k, -side], [d - 2.5 * k, side], [d - 2.5 * k, -side]] as const) if (dd >= 5) tries.push([dd, ss]);
  for (const [dd, ss] of tries) {
    const p = courtPoint(h, dd, ss);
    if (free(p.x, p.z)) return p;
  }
  return courtPoint(h, d, side);
}

/** The court of a house's discovery: where its pages lie and its acts are done. `free` says whether a place has room (nothing standing on it, nothing of the court's own near it). */
export function planCourt(a: ArenaPlace, free: (x: number, z: number) => boolean): Court {
  const disc = discoveryOf(a);
  const [leaves, acts]: [Place[], (Place | null)[]] = [[], []];
  if (!disc) return { leaves, acts };
  const used: Place[] = [];
  const clear = (x: number, z: number): boolean => free(x, z) && used.every((u) => Math.hypot(u.x - x, u.z - z) > 4);
  const put = (d: number, side: number): Place => {
    const p = settle(a.house!, d, side, clear);
    used.push(p);
    return p;
  };
  for (const l of disc.leaves) leaves.push(put(l.at.d, l.at.side));
  for (const s of disc.steps) acts.push(s.kind === 'vigil' || s.kind === 'offer' ? put(s.at.d, s.at.side) : null);
  return { leaves, acts };
}

/** Where the pages lie, as tomes: the document's name and its place. */
export function leafPlaces(a: ArenaPlace): { doc: string; x: number; z: number }[] {
  const d = discoveryOf(a);
  return d && a.court ? d.leaves.map((l, i) => ({ doc: l.doc, ...a.court!.leaves[i]! })) : [];
}

/** Where an act of a discovery is done: its vigil's mark or its altar (a page, or the rite, has its own place). */
export function stepPlace(a: ArenaPlace, step: Step): Place | null {
  const d = discoveryOf(a);
  const i = d ? d.steps.indexOf(step) : -1;
  return i >= 0 ? (a.court?.acts[i] ?? null) : null;
}

/** The marks and altars of the discovery's vigils and offerings, stood in the court. */
export function discoveryProps(a: ArenaPlace): Prop[] {
  const disc = discoveryOf(a);
  if (!disc || !a.court) return [];
  const rng = createRng((hash2(Math.round(a.x), Math.round(a.z), WORLD.seed + 64) * 4294967296) >>> 0);
  const out: Prop[] = [];
  disc.steps.forEach((s, i) => {
    const at = a.court!.acts[i];
    if (!at || (s.kind !== 'vigil' && s.kind !== 'offer')) return;
    const p = setPiece((s as Vigil | Offer).piece, at.x, at.z, surface(at.x, at.z), at.yaw, rng);
    if (p) out.push(p);
  });
  return out;
}
