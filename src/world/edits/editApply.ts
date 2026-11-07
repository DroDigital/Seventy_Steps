/**
 * The edits applied (round 110): where a planner lays props, posts foes or stands a site, it passes
 * them through here. A prop keeps a note of what it was laid as (`originOf`), so the world editor
 * can name it again however far it has been moved. Pure: no Three.js.
 */

import type { Dir } from '../../data/dungeons';
import { MODEL_INFO } from '../../data/models/index';
import { SET_KITS } from '../../data/setKits';
import type { At } from '../../data/sites';
import type { SpawnPoint } from '../placements';
import type { Prop, SetLook } from '../props';
import { surface } from '../terrain';
import { activeEdits, siteKey } from './editStore';
import { addedFoeId, cm, propKey } from './editFile';
import type { LookPatch, PropPatch, PropRef, PropSpec, SiteKind } from './editTypes';

/** What a prop in the world was laid as: a planner's prop (by its ref), or one an edit added. */
export type PropOrigin = { ref: PropRef } | { add: string; region: string };

const ORIGIN = new WeakMap<Prop, PropOrigin>();

/** The ref of a prop as its planner laid it, in `group`. */
export const refOf = (group: string, p: Prop): PropRef => ({ group, kind: p.kind, ...(p.set && { piece: p.set.id }), at: [cm(p.x), cm(p.z)] });

/** What `p` was laid as: the note an edit left on it, else its own place in `group`. */
export const originOf = (group: string, p: Prop): PropOrigin => ORIGIN.get(p) ?? { ref: refOf(group, p) };

function lookOn(set: SetLook, look: LookPatch): SetLook {
  const out: SetLook = { ...set };
  if (look.scale !== undefined) out.scale = look.scale;
  if (look.tint !== undefined) out.tint = look.tint;
  if (look.walk !== undefined) out.walk = look.walk;
  if (look.lit === null) delete out.lit;
  else if (look.lit !== undefined) out.lit = look.lit;
  return out;
}

/** `p` changed by `s`; moved with no height given, it keeps its height over the ground. */
export function patchProp(p: Prop, s: PropPatch): Prop {
  const [x, z] = [s.x ?? p.x, s.z ?? p.z];
  const y = s.y ?? (x !== p.x || z !== p.z ? p.y + surface(x, z) - surface(p.x, p.z) : p.y);
  const out: Prop = { ...p, x, y, z, yaw: s.yaw ?? p.yaw, w: s.w ?? p.w, d: s.d ?? p.d, h: s.h ?? p.h, seed: s.seed ?? p.seed };
  if (s.style) out.style = s.style;
  if (p.set && s.look) out.set = lookOn(p.set, s.look);
  return out;
}

/** A set piece's own look: round or a box, walked over or not (as arenaSet.ts lays one). */
export function pieceLook(id: string): SetLook | null {
  const [info, kit] = [MODEL_INFO[id], SET_KITS[id]];
  if (!info && !kit) return null;
  return { id, scale: 1, round: info?.round ?? kit?.round ?? false, walk: kit?.walk ?? false };
}

/** A set piece's size at scale 1: half extents and height. */
export function pieceSize(id: string): readonly [number, number, number] | null {
  const [info, kit] = [MODEL_INFO[id], SET_KITS[id]];
  if (info) return [(info.x1 - info.x0) / 2, (info.z1 - info.z0) / 2, info.y1 - info.y0];
  return kit ? [kit.w, kit.d, kit.h] : null;
}

/** The prop an edit adds (null for a piece not known). */
export function specProp(spec: PropSpec): Prop | null {
  const p: Prop = { kind: spec.kind, x: spec.x, y: spec.y, z: spec.z, w: spec.w, d: spec.d, h: spec.h, yaw: spec.yaw, seed: spec.seed };
  if (spec.style) p.style = spec.style;
  if (spec.kind === 'set') {
    const look = spec.piece ? pieceLook(spec.piece) : null;
    if (!look) return null;
    p.set = spec.look ? lookOn(look, spec.look) : look;
  }
  return p;
}

/** A prop written whole, to be added again (the editor's duplicate, its add). */
export function propSpec(p: Prop): PropSpec {
  const spec: PropSpec = { kind: p.kind, x: cm(p.x), y: cm(p.y), z: cm(p.z), w: cm(p.w), d: cm(p.d), h: cm(p.h), yaw: Math.round(p.yaw * 1e4) / 1e4, seed: p.seed };
  if (p.style) spec.style = p.style;
  if (p.set) {
    spec.piece = p.set.id;
    const look: LookPatch = {};
    if (p.set.scale !== undefined && p.set.scale !== 1) look.scale = p.set.scale;
    if (p.set.tint) look.tint = p.set.tint;
    if (p.set.lit) look.lit = p.set.lit;
    if (Object.keys(look).length) spec.look = look;
  }
  return spec;
}

/**
 * `base`, the props a planner laid in `group`, with the edits in force: those removed left out, those
 * changed replaced, and (given the region) those added to it put in. Returns `base` itself when no edit
 * touches it.
 */
export function applyProps(group: string, base: readonly Prop[], region?: string): Prop[] {
  const ix = activeEdits();
  const added = region ? (ix.added.get(region) ?? []) : [];
  if (!ix.groups.has(group) && !added.length) return base as Prop[];
  const out: Prop[] = [];
  for (const p of base) {
    const ref = refOf(group, p);
    const e = ix.groups.has(group) ? ix.props.get(propKey(ref)) : undefined;
    if (!e) {
      out.push(p);
      continue;
    }
    if (!e.set) continue; // removed
    const q = patchProp(p, e.set);
    ORIGIN.set(q, { ref });
    out.push(q);
  }
  for (const a of added) {
    const q = specProp(a.spec);
    if (!q) continue;
    ORIGIN.set(q, { add: a.id, region: region! });
    out.push(q);
  }
  return out;
}

/** A foe's post with the edits in force: null if removed. */
export function applySpawn(s: SpawnPoint): SpawnPoint | null {
  const e = activeEdits().spawns.get(s.id);
  if (e === undefined) return s;
  if (e === null) return null;
  return { ...s, entity: e.entity ?? s.entity, at: { x: e.x ?? s.at.x, z: e.z ?? s.at.z, yaw: e.yaw ?? s.at.yaw } };
}

/** The foes' posts edits added to `region`. */
export const addedFoes = (region: string): SpawnPoint[] =>
  (activeEdits().foes.get(region) ?? []).map(({ id, spec }) => ({ id: addedFoeId(id), entity: spec.entity, region, at: { x: spec.x, z: spec.z, yaw: spec.yaw }, unique: false }));

/** Where a site of data/sites.ts stands, in its region's metres, with the edits in force. */
export const siteAt = (kind: SiteKind, region: string, id: string, at: At): At => activeEdits().sites.get(siteKey(kind, region, id))?.at ?? at;

/** Which way a sign or a gate faces, with the edits in force. */
export const siteFace = (kind: SiteKind, region: string, id: string, face: Dir): Dir => activeEdits().sites.get(siteKey(kind, region, id))?.face ?? face;

const BASES = new WeakMap<Prop[], readonly Prop[]>();

/** Lays the edits in force over a list of props in place (an arena's or a dungeon's dressing), keeping what it was laid as: called again, it lays them anew. */
export function editInPlace(group: string, list: Prop[]): void {
  const base = BASES.get(list) ?? [...list];
  BASES.set(list, base);
  list.splice(0, list.length, ...applyProps(group, base));
}
