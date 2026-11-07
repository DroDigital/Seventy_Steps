/**
 * The world editor's working set (round 110, development builds only): the whole list of edits as
 * it stands, each change a new list, with undo and redo, and the file it is exported as. Pure: no
 * Three.js, no page.
 */

import { addedFoeId, editKey, EDIT_FORMAT, EDIT_VERSION, propKey } from '../world/edits/editFile';
import { patchProp, propSpec, specProp, type PropOrigin } from '../world/edits/editApply';
import type { FoeSpec, PropPatch, PropSpec, SitePatch, SiteRef, SpawnPatch, WorldEdit, WorldEditFile } from '../world/edits/editTypes';

const UNDO_DEPTH = 200;

/** `list` with `e` in place of the edit of the same key (or added at the end). */
function put(list: readonly WorldEdit[], e: WorldEdit): WorldEdit[] {
  const k = editKey(e);
  const i = list.findIndex((x) => editKey(x) === k);
  return i < 0 ? [...list, e] : list.map((x, j) => (j === i ? e : x));
}

/** `list` without the edit of key `k`. */
export const revertKey = (list: readonly WorldEdit[], k: string): WorldEdit[] => list.filter((x) => editKey(x) !== k);

const findAdd = (list: readonly WorldEdit[], id: string): WorldEdit | undefined => list.find((x) => 'add' in x && x.add === id);

/** A prop changed: a planner's prop's edit gains `patch` (its look merged); an added one is written anew. */
export function setProp(list: readonly WorldEdit[], origin: PropOrigin, patch: PropPatch): WorldEdit[] {
  if ('add' in origin) {
    const e = findAdd(list, origin.add);
    if (!e || !('prop' in e) || !('region' in e)) return [...list];
    const p = specProp(e.prop);
    return p ? put(list, { add: origin.add, region: e.region, prop: propSpec(patchProp(p, patch)) }) : [...list];
  }
  const old = list.find((x) => editKey(x) === propKey(origin.ref));
  const was = old && 'set' in old && 'prop' in old ? (old.set as PropPatch) : {};
  const set: PropPatch = { ...was, ...patch };
  if (was.look || patch.look) set.look = { ...was.look, ...patch.look };
  return put(list, { prop: origin.ref, set });
}

export function removeProp(list: readonly WorldEdit[], origin: PropOrigin): WorldEdit[] {
  return 'add' in origin ? revertKey(list, `add|${origin.add}`) : put(list, { prop: origin.ref, remove: true });
}

export const addProp = (list: readonly WorldEdit[], id: string, region: string, prop: PropSpec): WorldEdit[] => put(list, { add: id, region, prop });

/** The add id a foe's post's spawn id names, if an edit added it. */
const foeAdd = (spawnId: string): string | null => (spawnId.startsWith(addedFoeId('')) ? spawnId.slice(addedFoeId('').length) : null);

export function setSpawn(list: readonly WorldEdit[], spawnId: string, patch: SpawnPatch): WorldEdit[] {
  const add = foeAdd(spawnId);
  if (add) {
    const e = findAdd(list, add);
    if (!e || !('foe' in e)) return [...list];
    const f = e.foe;
    return put(list, { add, foe: { ...f, entity: patch.entity ?? f.entity, x: patch.x ?? f.x, z: patch.z ?? f.z, yaw: patch.yaw ?? f.yaw } });
  }
  const old = list.find((x) => editKey(x) === `spawn|${spawnId}`);
  const was = old && 'set' in old ? (old.set as SpawnPatch) : {};
  return put(list, { spawn: spawnId, set: { ...was, ...patch } });
}

export function removeSpawn(list: readonly WorldEdit[], spawnId: string): WorldEdit[] {
  const add = foeAdd(spawnId);
  return add ? revertKey(list, `add|${add}`) : put(list, { spawn: spawnId, remove: true });
}

export const addFoe = (list: readonly WorldEdit[], id: string, foe: FoeSpec): WorldEdit[] => put(list, { add: id, foe });

export function setSite(list: readonly WorldEdit[], site: SiteRef, patch: Partial<SitePatch>, at: SitePatch['at']): WorldEdit[] {
  const old = list.find((x) => editKey(x) === `site|${site.site}|${site.region}|${site.id}`);
  const was = old && 'site' in old ? old.set : { at };
  return put(list, { site, set: { ...was, ...patch } });
}

/** The export: the whole working set, and the committed keys it was made over. */
export function exportFile(list: readonly WorldEdit[], committed: readonly WorldEdit[], note: string, made = new Date().toISOString()): WorldEditFile {
  return { format: EDIT_FORMAT, version: EDIT_VERSION, made, ...(note.trim() && { note: note.trim() }), base: committed.map(editKey), edits: [...list] };
}

export interface Session {
  readonly list: readonly WorldEdit[];
  /** Puts `next` in place of the list, keeping the old one to undo to. */
  change(next: readonly WorldEdit[]): void;
  undo(): boolean;
  redo(): boolean;
  /** A fresh id for an added thing. */
  newId(): string;
}

export function createSession(start: readonly WorldEdit[], onChange: (list: readonly WorldEdit[]) => void, rand: () => number = Math.random): Session {
  let list: readonly WorldEdit[] = start;
  const back: (readonly WorldEdit[])[] = [];
  const ahead: (readonly WorldEdit[])[] = [];
  const set = (next: readonly WorldEdit[]): void => {
    list = next;
    onChange(list);
  };
  return {
    get list() {
      return list;
    },
    change(next) {
      back.push(list);
      if (back.length > UNDO_DEPTH) back.shift();
      ahead.length = 0;
      set(next);
    },
    undo() {
      const prev = back.pop();
      if (!prev) return false;
      ahead.push(list);
      set(prev);
      return true;
    },
    redo() {
      const next = ahead.pop();
      if (!next) return false;
      back.push(list);
      set(next);
      return true;
    },
    newId() {
      for (;;) {
        const id = Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0');
        if (!findAdd(list, id)) return id;
      }
    },
  };
}
