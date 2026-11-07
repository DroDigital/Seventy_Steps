/**
 * The edits in force (round 110): the committed ones of data/worldEdits.ts, or, in a development
 * build, the world editor's working set laid over them (src/editor). Indexed for the planners that
 * apply them (editApply.ts). Pure.
 */

import { WORLD_EDITS } from '../../data/worldEdits';
import { editKey, propKey } from './editFile';
import type { FoeSpec, PropPatch, PropRef, PropSpec, SitePatch, SpawnPatch, WorldEdit } from './editTypes';

export interface EditIndex {
  readonly list: readonly WorldEdit[];
  props: Map<string, { ref: PropRef; set: PropPatch | null }>; // by propKey; set null: removed
  groups: Set<string>; // the groups any prop edit names
  added: Map<string, { id: string; spec: PropSpec }[]>; // by region
  spawns: Map<string, SpawnPatch | null>; // by spawn id; null: removed
  foes: Map<string, { id: string; spec: FoeSpec }[]>; // by region
  sites: Map<string, SitePatch>; // by `kind|region|id`
}

export const siteKey = (kind: string, region: string, id: string): string => `${kind}|${region}|${id}`;

export function indexEdits(list: readonly WorldEdit[]): EditIndex {
  const ix: EditIndex = { list, props: new Map(), groups: new Set(), added: new Map(), spawns: new Map(), foes: new Map(), sites: new Map() };
  const push = <T>(m: Map<string, T[]>, k: string, v: T): void => void (m.get(k)?.push(v) ?? m.set(k, [v]));
  const seen = new Map<string, WorldEdit>();
  for (const e of list) seen.set(editKey(e), e); // a later edit of the same thing wins
  for (const e of seen.values()) {
    if ('add' in e) {
      if ('foe' in e) push(ix.foes, e.foe.region, { id: e.add, spec: e.foe });
      else push(ix.added, e.region, { id: e.add, spec: e.prop });
    } else if ('site' in e) ix.sites.set(siteKey(e.site.site, e.site.region, e.site.id), e.set);
    else if ('spawn' in e) ix.spawns.set(e.spawn, 'remove' in e ? null : e.set);
    else {
      ix.props.set(propKey(e.prop), { ref: e.prop, set: 'remove' in e ? null : e.set });
      ix.groups.add(e.prop.group);
    }
  }
  return ix;
}

let active = indexEdits(WORLD_EDITS.edits);

/** The edits in force. */
export const activeEdits = (): EditIndex => active;

/** Puts `list` in force (the world editor, in a development build): what is planned from now on follows it. */
export function setActiveEdits(list: readonly WorldEdit[]): void {
  active = indexEdits(list);
}
